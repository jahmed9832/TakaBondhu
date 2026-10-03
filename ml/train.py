"""
Training pipeline for TakaBondhu (AI Hackathon 2026, Track 01).
Trains TF-IDF char_wb n-grams (2-5) + Logistic Regression (class_weight='balanced').
Calibrates probabilities on val only using PredefinedSplit.
Selects operating threshold T on val only (maximize recall subject to FPR <= 5%).
Trains a second head for scam_type classification.
Saves model artifact (<25MB) and metadata.json to ml/models/.
"""

import os
import sys
import json
import hashlib
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
import scipy.sparse as sp

import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import PredefinedSplit
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SEED = 42
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def compute_file_sha256(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def find_operating_threshold(df_val, val_probs, max_fpr=0.05):
    """
    Choose threshold T on validation set that maximizes recall subject to FPR <= max_fpr.
    Evaluates cross-language fairness on val to prevent single-language false-positive spikes.
    """
    val_labels = df_val["label"].values.astype(int)
    thresholds = np.linspace(0.05, 0.95, 181)

    candidates = []
    for t in thresholds:
        preds = (val_probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(val_labels, preds).ravel()
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1 = 2 * (prec * recall) / (prec + recall) if (prec + recall) > 0 else 0.0

        if fpr <= max_fpr:
            # Check fairness across languages in val
            lang_fprs = {}
            for lang in ["bn", "banglish", "en"]:
                mask = (df_val["language"] == lang).values
                if mask.sum() > 0:
                    sub_y = val_labels[mask]
                    sub_p = preds[mask]
                    cm = confusion_matrix(sub_y, sub_p, labels=[0, 1])
                    sub_tn, sub_fp, sub_fn, sub_tp = cm.ravel()
                    lang_fprs[lang] = sub_fp / (sub_fp + sub_tn) if (sub_fp + sub_tn) > 0 else 0.0
                else:
                    lang_fprs[lang] = 0.0
            max_lang_fpr = max(lang_fprs.values())

            candidates.append({
                "t": t,
                "fpr": fpr,
                "max_lang_fpr": max_lang_fpr,
                "recall": recall,
                "prec": prec,
                "f1": f1
            })

    if not candidates:
        return 0.50, 0.0, 1.0, 1.0, 1.0

    # Prefer thresholds that keep individual language FPR <= max_fpr on val
    fair_candidates = [c for c in candidates if c["max_lang_fpr"] <= max_fpr]
    pool = fair_candidates if fair_candidates else candidates

    # Rank by recall (descending), then F1 (descending), then closest to balanced 0.50
    pool.sort(key=lambda c: (c["recall"], c["f1"], -abs(c["t"] - 0.50)), reverse=True)
    best = pool[0]
    return best["t"], best["fpr"], best["recall"], best["prec"], best["f1"]

def main():
    print("=" * 60)
    print("🚀 Training TakaBondhu Hybrid ML Model")
    print("=" * 60)

    train_path = os.path.join(DATA_DIR, "train.csv")
    val_path = os.path.join(DATA_DIR, "val.csv")
    dataset_path = os.path.join(DATA_DIR, "dataset.csv")

    for p in [train_path, val_path, dataset_path]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing required dataset: {p}. Run ml/generate_dataset.py first.")

    dataset_hash = compute_file_sha256(dataset_path)
    print(f"Dataset SHA-256: {dataset_hash[:16]}...")

    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)

    print(f"Loaded train: {len(df_train)} rows | val: {len(df_val)} rows")

    # 1. Feature Extraction: TF-IDF char_wb n-grams (2-5)
    print("\n[Step 1] Fitting TfidfVectorizer (char_wb 2-5 n-grams) on TRAIN only...")
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        sublinear_tf=True,
        max_features=30000,
        min_df=2
    )

    X_train_raw = vectorizer.fit_transform(df_train["text"].astype(str))
    X_val_raw = vectorizer.transform(df_val["text"].astype(str))
    feature_count = X_train_raw.shape[1]
    print(f"✓ Feature vocabulary size: {feature_count:,} n-grams")

    y_train = df_train["label"].values.astype(int)
    y_val = df_val["label"].values.astype(int)

    # 2. Train Primary Binary Classifier on TRAIN only
    print("\n[Step 2] Training Base Logistic Regression on TRAIN only...")
    base_clf = LogisticRegression(
        C=1.5,
        class_weight="balanced",
        max_iter=1000,
        random_state=SEED,
        solver="lbfgs"
    )
    base_clf.fit(X_train_raw, y_train)

    # 3. Probability Calibration on VAL only using PredefinedSplit
    print("\n[Step 3] Calibrating Probabilities on VAL only...")
    # PredefinedSplit: -1 for train samples (used to train base estimator), 0 for val samples (used for calibration)
    test_fold = [-1] * len(df_train) + [0] * len(df_val)
    ps = PredefinedSplit(test_fold=test_fold)

    X_combined = sp.vstack([X_train_raw, X_val_raw])
    y_combined = np.concatenate([y_train, y_val])

    calibrated_clf = CalibratedClassifierCV(
        estimator=base_clf,
        method="sigmoid",
        cv=ps
    )
    calibrated_clf.fit(X_combined, y_combined)
    print("✓ Calibrated classifier ready.")

    # 4. Choose Operating Threshold T on VAL only
    print("\n[Step 4] Selecting Operating Threshold T on VAL (Max Recall with FPR <= 5%)...")
    val_probs = calibrated_clf.predict_proba(X_val_raw)[:, 1]
    best_t, best_fpr, best_recall, best_prec, best_f1 = find_operating_threshold(df_val, val_probs, max_fpr=0.05)

    print(f"  • Operating Threshold (T): {best_t:.4f}")
    print(f"  • Validation FPR:          {best_fpr * 100:.2f}% (Target: <= 5.0%)")
    print(f"  • Validation Recall:       {best_recall * 100:.2f}%")
    print(f"  • Validation Precision:    {best_prec * 100:.2f}%")
    print(f"  • Validation F1:           {best_f1 * 100:.2f}%")

    # 5. Small Second Head: Scam Type Classifier for Flagged Messages
    print("\n[Step 5] Training Secondary Multi-Class Head for Scam Type Identification...")
    # Train only on scam rows in training set
    scam_train_mask = (df_train["label"] == 1)
    df_scam_train = df_train[scam_train_mask]
    X_scam_train = vectorizer.transform(df_scam_train["text"].astype(str))
    y_scam_type = df_scam_train["scam_type"].values

    scam_types = sorted(list(set(y_scam_type)))
    print(f"  • Distinct scam classes ({len(scam_types)}): {scam_types}")

    scam_type_clf = LogisticRegression(
        C=1.0,
        class_weight="balanced",
        max_iter=500,
        random_state=SEED
    )
    scam_type_clf.fit(X_scam_train, y_scam_type)
    print("✓ Scam type head trained.")

    # 6. Save Model Artifacts
    model_artifact = {
        "vectorizer": vectorizer,
        "classifier": calibrated_clf,
        "scam_type_clf": scam_type_clf,
        "scam_types": scam_types,
        "threshold": float(best_t)
    }

    model_path = os.path.join(MODELS_DIR, "model.joblib")
    joblib.dump(model_artifact, model_path, compress=3)
    file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"\n✓ Saved model artifact to {model_path} ({file_size_mb:.2f} MB)")
    if file_size_mb > 25.0:
        print("  ⚠️ Warning: Model artifact exceeds 25 MB! Consider pruning max_features.")
    else:
        print(f"  ✓ Size is under 25 MB limit ({file_size_mb:.2f} MB < 25 MB).")

    metadata = {
        "model_version": "v1.0.0-char-wb-lr",
        "sklearn_version": sklearn.__version__,
        "python_version": sys.version.split()[0],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "threshold": float(round(best_t, 4)),
        "dataset_hash": dataset_hash,
        "feature_count": int(feature_count),
        "artifact_size_mb": round(file_size_mb, 2),
        "val_metrics": {
            "fpr": round(float(best_fpr), 4),
            "recall": round(float(best_recall), 4),
            "precision": round(float(best_prec), 4),
            "f1": round(float(best_f1), 4)
        }
    }

    meta_path = os.path.join(MODELS_DIR, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata to {meta_path}")

    # Inspect top positive and negative n-grams
    base_lr = calibrated_clf.calibrated_classifiers_[0].estimator
    coefs = base_lr.coef_[0]
    vocab = vectorizer.get_feature_names_out()
    top_pos_idx = np.argsort(coefs)[-20:][::-1]
    top_neg_idx = np.argsort(coefs)[:20]

    print("\n[Top 10 Indicative Scam N-Grams (Positive Coefficients)]:")
    for idx in top_pos_idx[:10]:
        print(f"  • {vocab[idx]!r}: {coefs[idx]:+.4f}")

    print("\n[Top 10 Indicative Benign N-Grams (Negative Coefficients)]:")
    for idx in top_neg_idx[:10]:
        print(f"  • {vocab[idx]!r}: {coefs[idx]:+.4f}")

    print("\n============================================================")
    print("✅ Training Pipeline Complete.")
    print("============================================================")

if __name__ == "__main__":
    main()
