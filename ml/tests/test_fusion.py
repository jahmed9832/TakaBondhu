import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
ML_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

import pytest
from ml.fusion import FusionEngine
from ml.transactions.agent_benchmarker import AgentBenchmarker


def test_fusion_engine_loads_all_artifacts():
    engine = FusionEngine()
    assert engine.is_loaded is True
    assert engine.msg_model is not None
    assert engine.txn_model is not None
    assert engine.anomaly_detector is not None


def test_fusion_engine_score_bounds_and_no_autonomous_block():
    engine = FusionEngine()
    
    # 1. Normal benign transaction
    benign_tx = {
        "amount": 500.0,
        "type": "send_money",
        "hour": 14,
        "device_age_days": 180,
        "is_new_recipient": 0,
        "recipient_age_days": 120,
        "channel": "app",
        "receiver": "cust_0001"
    }
    res_benign = engine.fuse(benign_tx, "")
    assert 0.0 <= res_benign["risk_score"] <= 100.0
    assert res_benign["decision_recommendation"] == "ALLOW"
    assert res_benign["requires_human_review"] is False
    assert "what_happened" in res_benign["case_card"]
    assert "why_risky" in res_benign["case_card"]
    assert "what_upay_should_do" in res_benign["case_card"]

    # 2. Critical ATO + Structuring attack
    fraud_tx = {
        "amount": 24900.0,
        "type": "cash_out",
        "hour": 2,
        "device_age_days": 0,
        "is_new_recipient": 1,
        "recipient_age_days": 0,
        "channel": "agent_pos",
        "receiver": "agent_0001"
    }
    scam_msg = "জরুরি! আপনার অ্যাকাউন্ট ব্লক হয়েছে, পিন ও ওটিপি পাঠান"
    res_fraud = engine.fuse(fraud_tx, scam_msg)
    assert res_fraud["risk_score"] >= 60.0
    # Hard Rule check: Recommendation must NEVER be autonomous block/freeze
    assert res_fraud["decision_recommendation"] in ["SOFT_FRICTION", "HOLD_FOR_REVIEW"]
    assert res_fraud["decision_recommendation"] != "AUTO_BLOCK"
    assert res_fraud["decision_recommendation"] != "FREEZE_MONEY"


def test_agent_benchmarker_z_score():
    benchmarker = AgentBenchmarker()
    # Mock profiles
    benchmarker.peer_metrics = {"mean_structuring": 0.01, "std_structuring": 0.02}
    benchmarker.agent_profiles = {
        "agent_test_99": {
            "agent_id": "agent_test_99",
            "district": "Dhaka",
            "n_cashouts": 100,
            "total_volume": 2000000.0,
            "structuring_ratio": 0.35,
            "night_ratio": 0.25,
            "z_structuring": 5.2,
            "z_night": 4.8,
            "z_volume": 3.5,
            "risk_score": 95.0,
            "risk_level": "CRITICAL",
            "reasons": ["Structuring anomaly: 35% cashouts in ৳24,000–৳24,999"]
        }
    }
    
    eval_res = benchmarker.evaluate_agent("agent_test_99")
    assert eval_res["risk_score"] == 95.0
    assert eval_res["risk_level"] == "CRITICAL"
    assert eval_res["z_scores"]["z_structuring"] == 5.2
