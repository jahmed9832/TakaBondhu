import csv
import pytest
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

def load_csv(filename):
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def test_dataset_splits_exist():
    required_files = ["train.csv", "val.csv", "test_seen.csv", "test_unseen.csv", "robustness.csv"]
    for f in required_files:
        p = DATA_DIR / f
        assert p.exists(), f"Missing split file: {f}"

def test_dataset_schema():
    rows = load_csv("train.csv")
    assert len(rows) > 0, "train.csv should not be empty"
    expected_cols = {"id", "text", "label", "scam_type", "language", "length_bucket", "template_id", "split", "source"}
    actual_cols = set(rows[0].keys())
    assert expected_cols.issubset(actual_cols), f"Columns missing: {expected_cols - actual_cols}"
    assert all(r["source"] == "synthetic" for r in rows), "All rows must be labeled source='synthetic'"

def test_anti_leakage_template_holdout():
    """MANDATORY ANTI-LEAKAGE CHECK:
    Zero template_id overlap between train/val and test_unseen.
    """
    train_rows = load_csv("train.csv")
    val_rows = load_csv("val.csv")
    unseen_rows = load_csv("test_unseen.csv")

    train_templates = {r["template_id"] for r in train_rows}
    val_templates = {r["template_id"] for r in val_rows}
    unseen_templates = {r["template_id"] for r in unseen_rows}

    overlap_train = train_templates.intersection(unseen_templates)
    overlap_val = val_templates.intersection(unseen_templates)

    assert len(overlap_train) == 0, f"LEAKAGE: {len(overlap_train)} template_ids shared between train and test_unseen: {overlap_train}"
    assert len(overlap_val) == 0, f"LEAKAGE: {len(overlap_val)} template_ids shared between val and test_unseen: {overlap_val}"

def test_no_exact_duplicate_texts_across_splits():
    """Ensure no verbatim text from train appears in test_unseen."""
    train_rows = load_csv("train.csv")
    unseen_rows = load_csv("test_unseen.csv")

    train_texts = {r["text"].strip().lower() for r in train_rows}
    unseen_texts = {r["text"].strip().lower() for r in unseen_rows}

    duplicates = train_texts.intersection(unseen_texts)
    assert len(duplicates) == 0, f"Text leakage detected: {len(duplicates)} duplicate texts between train and test_unseen"
