"""
ml/tests/test_transactions.py
Unit tests verifying data integrity, schema compliance, and anti-leakage guarantees
for the TakaBondhu synthetic transaction dataset.
"""

import os
import json
import pytest
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "transactions")


@pytest.fixture(scope="module")
def load_datasets():
    splits = {}
    for name in ["train", "val", "test_time", "test_unseen_entity", "transactions"]:
        path = os.path.join(DATA_DIR, f"{name}.csv")
        assert os.path.exists(path), f"Required file missing: {path}"
        splits[name] = pd.read_csv(path)
    return splits


def test_transaction_splits_exist(load_datasets):
    splits = load_datasets
    assert len(splits["train"]) > 1000
    assert len(splits["val"]) > 500
    assert len(splits["test_time"]) > 1000
    assert len(splits["test_unseen_entity"]) > 500


def test_transaction_schema(load_datasets):
    required_cols = {
        "tx_id", "ts", "sender", "receiver", "type", "amount",
        "device_id", "device_age_days", "geo_district", "channel",
        "is_new_recipient", "recipient_age_days", "hour", "source",
        "is_fraud", "fraud_pattern", "split"
    }
    df = load_datasets["transactions"]
    assert required_cols.issubset(df.columns)


def test_source_is_synthetic(load_datasets):
    df = load_datasets["transactions"]
    # Hard Rule 3: Every dataset row labeled source="synthetic"
    assert (df["source"] == "synthetic").all()


def test_all_fraud_patterns_represented(load_datasets):
    df = load_datasets["transactions"]
    frauds = df[df["is_fraud"] == 1]
    expected_patterns = {
        "social_engineering",
        "account_takeover",
        "mule_network",
        "agent_anomaly",
        "wrong_transfer_refund"
    }
    observed_patterns = set(frauds["fraud_pattern"].unique())
    assert expected_patterns.issubset(observed_patterns)


def test_anti_leakage_time_split(load_datasets):
    train_df = load_datasets["train"]
    test_time_df = load_datasets["test_time"]

    train_max_ts = pd.to_datetime(train_df["ts"]).max()
    test_time_min_ts = pd.to_datetime(test_time_df["ts"]).min()

    # Time split: train should strictly precede or equal cutoff
    # test_time starts on day 60+
    assert test_time_min_ts >= pd.to_datetime("2026-05-30T00:00:00Z")


def test_anti_leakage_unseen_entity(load_datasets):
    train_df = load_datasets["train"]
    unseen_df = load_datasets["test_unseen_entity"]

    mule_rings_path = os.path.join(DATA_DIR, "mule_rings.json")
    with open(mule_rings_path, "r", encoding="utf-8") as f:
        mule_rings = json.load(f)

    # Ring 4 and 5 are quarantined holdouts
    held_out_entities = set()
    for ring_name, info in mule_rings.items():
        if info.get("holdout"):
            held_out_entities.add(info["hub"])
            for v in info["victims"]:
                held_out_entities.add(v)

    train_senders = set(train_df["sender"].unique())
    train_receivers = set(train_df["receiver"].unique())
    train_all_entities = train_senders.union(train_receivers)

    # STRICT ASSERTION: zero overlap between held-out entities and training set
    overlap = train_all_entities.intersection(held_out_entities)
    assert len(overlap) == 0, f"DATA LEAKAGE DETECTED! Overlapping entities in train: {overlap}"


def test_fraud_representation_across_channels_and_amounts(load_datasets):
    """
    Credibility invariant: Verifies that synthetic fraud is not artificially restricted
    to certain channels or amounts. Every split (train, val, test_time, test_unseen_entity)
    must contain fraud examples across all channels (app, ussd, agent_pos) and all
    amount tiers (<2000, 2000-10000, >10000 BDT).
    """
    splits = load_datasets
    required_channels = ["app", "ussd", "agent_pos"]
    evaluated_splits = ["train", "val", "test_time", "test_unseen_entity"]

    for split_name in evaluated_splits:
        df = splits[split_name]
        frauds = df[df["is_fraud"] == 1]
        assert len(frauds) > 0, f"No fraud found in split {split_name}"

        # Assert every channel has fraud
        for ch in required_channels:
            ch_frauds = frauds[frauds["channel"] == ch]
            assert len(ch_frauds) > 0, f"Split {split_name} has 0 fraud instances for channel={ch}!"

        # Assert every amount tier has fraud
        sub_2k = frauds[frauds["amount"] < 2000.0]
        mid_tier = frauds[(frauds["amount"] >= 2000.0) & (frauds["amount"] < 10000.0)]
        high_tier = frauds[frauds["amount"] >= 10000.0]

        assert len(sub_2k) > 0, f"Split {split_name} has 0 fraud instances for amount < 2000 BDT!"
        assert len(mid_tier) > 0, f"Split {split_name} has 0 fraud instances for 2000 <= amount < 10000 BDT!"
        assert len(high_tier) > 0, f"Split {split_name} has 0 fraud instances for amount >= 10000 BDT!"

