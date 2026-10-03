"""
ml/transactions/anomaly_detector.py
IsolationForest Behavioral Anomaly Detector for TakaBondhu.
Learns a customer's normal transaction pattern and identifies significant deviations.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SEED = 42
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "..", "data", "transactions")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

ANOMALY_FEATURES = [
    "amount",
    "hour",
    "is_night",
    "device_age_days",
    "is_new_device",
    "is_new_recipient"
]


def extract_anomaly_features(df):
    feats = pd.DataFrame(index=df.index)
    feats["amount"] = df["amount"].astype(float)
    feats["hour"] = df["hour"].astype(int)
    feats["is_night"] = df["hour"].apply(lambda h: 1.0 if (0 <= h <= 5) else 0.0)
    feats["device_age_days"] = df["device_age_days"].astype(float)
    feats["is_new_device"] = df["device_age_days"].apply(lambda d: 1.0 if d <= 0 else 0.0)
    feats["is_new_recipient"] = df["is_new_recipient"].astype(float)
    return feats[ANOMALY_FEATURES]


class CustomerAnomalyDetector:
    def __init__(self, model=None):
        self.model = model
        self.feature_names = ANOMALY_FEATURES

    def fit(self, normal_df):
        print(f"Fitting IsolationForest on {len(normal_df)} normal transactions...")
        X = extract_anomaly_features(normal_df)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.03,
            random_state=SEED,
            n_jobs=1
        )
        self.model.fit(X)
        return self

    def score(self, tx_dict):
        """
        Score a single transaction dictionary.
        Returns:
            anomaly_score (0-100 float)
            is_anomaly (bool)
            reasons (list of strings)
        """
        df = pd.DataFrame([tx_dict])
        X = extract_anomaly_features(df)
        
        # decision_function: lower means more anomalous (negative for outliers)
        raw_score = self.model.decision_function(X)[0]
        # Map raw decision function [-0.35, 0.20] to [0, 100] scale
        # where higher = more anomalous
        norm_score = float(np.clip(100.0 * (0.15 - raw_score) / 0.40, 0.0, 100.0))
        is_anomaly = norm_score >= 50.0

        reasons = []
        if float(tx_dict.get("device_age_days", 100)) <= 0:
            reasons.append("New unverified device (age 0 days)")
        hour = int(tx_dict.get("hour", 12))
        if 0 <= hour <= 5:
            reasons.append(f"Unusual late-night transaction hour ({hour:02d}:00)")
        if int(tx_dict.get("is_new_recipient", 0)) == 1:
            reasons.append("First-time recipient transfer")
        if float(tx_dict.get("amount", 0)) >= 15000:
            reasons.append(f"High-value transfer amount (Tk {float(tx_dict.get('amount', 0)):,.2f})")

        return {
            "anomaly_score": round(norm_score, 1),
            "is_anomaly": is_anomaly,
            "reasons": reasons
        }


def train_and_save():
    train_path = os.path.join(DATA_DIR, "train.csv")
    train_df = pd.read_csv(train_path)
    # Fit only on benign records
    benign_train = train_df[train_df["is_fraud"] == 0]

    detector = CustomerAnomalyDetector()
    detector.fit(benign_train)

    out_path = os.path.join(MODELS_DIR, "anomaly_model.joblib")
    joblib.dump({"model": detector.model, "features": ANOMALY_FEATURES}, out_path, compress=3)
    print(f"✓ Saved IsolationForest anomaly detector to {out_path}")


if __name__ == "__main__":
    train_and_save()
