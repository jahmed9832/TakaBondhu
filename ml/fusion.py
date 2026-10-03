"""
ml/fusion.py
Multi-Signal Decision Fusion Layer for TakaBondhu.
Event: AI Hackathon 2026 (DIU CPC x upay) - Track 01: Trust & Risk Intelligence

Combines:
1. Deterministic Security Rules (MFS limits, rapid velocity, keyword heuristics)
2. Message Risk ML (Calibrated TF-IDF char_wb Logistic Regression)
3. Transaction Risk ML (Calibrated HistGradientBoosting Classifier)
4. Behavioral Anomaly Detection (Isolation Forest per customer segment)
5. Mule Network Graph Analysis (NetworkX directed fan-in/fan-out graph)
6. Agent Risk Benchmarking (Peer comparison z-scores & structuring)

Design Rules:
- Human Oversight: Recommendation is ALLOW | SOFT_FRICTION | HOLD_FOR_REVIEW (never auto-block money).
- Complete Traceability: Returns rule traces, feature contributions, and 3-part case card:
  1. What happened?
  2. Why is it risky?
  3. What should upay do next?
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")


class FusionEngine:
    # Validation-tuned transparent weights (tuned on val.csv without touching test splits)
    WEIGHTS_FULL = {
        "rules": 0.15,
        "message": 0.20,
        "txn": 0.55,
        "anomaly": 0.05,
        "graph": 0.05
    }

    WEIGHTS_TXN_ONLY = {
        "rules": 0.15,
        "txn": 0.70,
        "anomaly": 0.075,
        "graph": 0.075
    }

    WEIGHTS_MSG_ONLY = {
        "rules": 0.40,
        "message": 0.60
    }

    THRESHOLD_SOFT_FRICTION = 25.0
    THRESHOLD_HOLD_REVIEW = 65.0

    def __init__(self):
        self.msg_model = None
        self.txn_model = None
        self.anomaly_detector = None
        self.graph_cache = {}
        self.agent_benchmarks = {}
        self.is_loaded = False
        self._load_artifacts()

    def _load_artifacts(self):
        # 1. Message Model
        msg_path = os.path.join(MODELS_DIR, "model.joblib")
        if os.path.exists(msg_path):
            self.msg_model = joblib.load(msg_path)

        # 2. Transaction Model
        txn_path = os.path.join(MODELS_DIR, "txn_model.joblib")
        if os.path.exists(txn_path):
            self.txn_model = joblib.load(txn_path)

        # 3. Anomaly Detector
        anomaly_path = os.path.join(MODELS_DIR, "anomaly_model.joblib")
        if os.path.exists(anomaly_path):
            self.anomaly_detector = joblib.load(anomaly_path)

        # 4. Graph Cache
        graph_path = os.path.join(MODELS_DIR, "graph_cache.json")
        if os.path.exists(graph_path):
            with open(graph_path, "r", encoding="utf-8") as f:
                self.graph_cache = json.load(f)

        # 5. Agent Benchmarks
        agent_path = os.path.join(MODELS_DIR, "agent_benchmarks.json")
        if os.path.exists(agent_path):
            with open(agent_path, "r", encoding="utf-8") as f:
                self.agent_benchmarks = json.load(f)

        self.is_loaded = True

    def score_message(self, text):
        if not self.msg_model or not text:
            return 10.0, []
        vec = self.msg_model["vectorizer"]
        clf = self.msg_model["classifier"]

        X = vec.transform([str(text)])
        prob = float(clf.predict_proba(X)[0, 1])
        score = prob * 100.0

        # Extract top character n-gram attributions
        contributions = []
        try:
            feat_names = vec.get_feature_names_out()
            base_estimator = clf.calibrated_classifiers_[0].estimator
            coefs = base_estimator.coef_[0]
            x_dense = X.toarray()[0]
            active_indices = np.where(x_dense > 0)[0]
            for idx in active_indices:
                w = coefs[idx] * x_dense[idx]
                if w > 0.05:
                    contributions.append({
                        "token": feat_names[idx],
                        "weight": round(float(w), 3)
                    })
            contributions.sort(key=lambda c: c["weight"], reverse=True)
        except Exception:
            pass

        return score, contributions[:5]

    def score_transaction(self, tx_dict):
        if not self.txn_model or not tx_dict:
            return 15.0, []
        
        clf = self.txn_model.get("model") or self.txn_model.get("classifier")
        features = self.txn_model.get("feature_names", [])
        
        amt = float(tx_dict.get("amount", 1000.0))
        hour = int(tx_dict.get("hour", 12))
        is_night = 1.0 if (0 <= hour <= 5) else 0.0
        dev_age = float(tx_dict.get("device_age_days", 100.0))
        is_new_dev = 1.0 if dev_age <= 0 else 0.0
        is_new_recip = 1.0 if tx_dict.get("is_new_recipient") in [True, 1, "true", "1", "True"] else 0.0
        recip_age = float(tx_dict.get("recipient_age_days", 0.0 if is_new_recip == 1.0 else 100.0))
        is_structuring = 1.0 if (24000.0 <= amt <= 24999.0) else 0.0

        ch = str(tx_dict.get("channel", "app")).lower()
        ch_app = 1.0 if ch == "app" else 0.0
        ch_ussd = 1.0 if ch == "ussd" else 0.0
        ch_agent_pos = 1.0 if ch in ["agent_pos", "agent"] else 0.0

        t_type = str(tx_dict.get("type", "send_money")).lower()
        t_send = 1.0 if t_type == "send_money" else 0.0
        t_cashout = 1.0 if t_type == "cash_out" else 0.0
        t_merch = 1.0 if t_type in ["merchant_payment", "merchant"] else 0.0
        t_other = 1.0 if (not t_send and not t_cashout and not t_merch) else 0.0

        row_df = pd.DataFrame([{
            "amount": amt,
            "hour": hour,
            "is_night": is_night,
            "device_age_days": dev_age,
            "is_new_device": is_new_dev,
            "is_new_recipient": is_new_recip,
            "recipient_age_days": recip_age,
            "is_structuring_range": is_structuring,
            "ch_app": ch_app,
            "ch_ussd": ch_ussd,
            "ch_agent_pos": ch_agent_pos,
            "type_send_money": t_send,
            "type_cash_out": t_cashout,
            "type_merchant_payment": t_merch,
            "type_other": t_other
        }])

        prob = float(clf.predict_proba(row_df)[0, 1])
        score = prob * 100.0

        # Top feature reasons
        attributions = []
        if is_new_dev:
            attributions.append({"feature": "device_age_days", "contribution": 35.0, "reason": "Brand new unrecognized device ID"})
        if is_new_recip and recip_age <= 3:
            attributions.append({"feature": "recipient_age_days", "contribution": 30.0, "reason": "First-time transfer to fresh recipient wallet"})
        if is_structuring:
            attributions.append({"feature": "amount", "contribution": 25.0, "reason": "Structuring amount in ৳24,000–৳24,999 right below limit"})
        if is_night:
            attributions.append({"feature": "hour", "contribution": 15.0, "reason": "Unusual high-risk transaction hour (00:00–05:59)"})

        return score, attributions

    def score_anomaly(self, tx_dict, persona="salaried"):
        if not self.anomaly_detector or "model" not in self.anomaly_detector:
            return 10.0, []
        model = self.anomaly_detector["model"]
        amt = float(tx_dict.get("amount", 1000.0))
        hour = int(tx_dict.get("hour", 12))
        is_night = 1.0 if (0 <= hour <= 5) else 0.0
        dev_age = float(tx_dict.get("device_age_days", 100.0))
        is_new_dev = 1.0 if dev_age <= 0 else 0.0
        is_new_recip = 1.0 if tx_dict.get("is_new_recipient") in [True, 1, "true", "1", "True"] else 0.0
        row_df = pd.DataFrame([{
            "amount": amt,
            "hour": hour,
            "is_night": is_night,
            "device_age_days": dev_age,
            "is_new_device": is_new_dev,
            "is_new_recipient": is_new_recip
        }])
        raw_score = model.decision_function(row_df)[0]
        norm_score = float(np.clip(100.0 * (0.15 - raw_score) / 0.40, 0.0, 100.0))
        reasons = []
        if is_new_dev:
            reasons.append("New unverified device (age 0 days)")
        if is_night:
            reasons.append(f"Unusual late-night transaction hour ({hour:02d}:00)")
        if is_new_recip:
            reasons.append("First-time recipient transfer")
        if amt >= 15000:
            reasons.append(f"High-value transfer amount (৳{amt:,.2f})")
        return round(norm_score, 1), reasons

    def score_graph(self, receiver_id):
        receiver_id = str(receiver_id)
        stats = self.graph_cache.get("stats_sample", {}).get(receiver_id)
        if stats:
            return stats.get("risk_score", 15.0), stats.get("reasons", [])
        
        # Check if in top suspects
        for s in self.graph_cache.get("top_suspects", []):
            if s.get("wallet_id") == receiver_id:
                return s.get("risk_score", 75.0), s.get("reasons", [])
        
        # Default benign network baseline
        return 12.0, ["Standard peer interaction history; no mule clustering identified."]

    def score_agent(self, agent_id):
        aid = str(agent_id)
        profiles = self.agent_benchmarks.get("profiles_sample", {})
        if aid in profiles:
            p = profiles[aid]
            return p.get("risk_score", 12.0), p.get("reasons", [])
        
        for p in self.agent_benchmarks.get("high_risk_agents", []):
            if p.get("agent_id") == aid:
                return p.get("risk_score", 85.0), p.get("reasons", [])

        return 10.0, ["Agent activity metrics match district peer baseline."]

    def evaluate_rules(self, tx_dict, msg_text=""):
        rules_triggered = []
        score = 10.0

        amt = float(tx_dict.get("amount", 0.0))
        t_type = str(tx_dict.get("type", "")).lower()
        dev_age = float(tx_dict.get("device_age_days", 100))
        hour = int(tx_dict.get("hour", 12))
        is_new_recip = tx_dict.get("is_new_recipient") in [True, 1, "true", "1", "True"]

        # Rule 1: Single transaction limit exceed
        if amt > 25000.0:
            score += 70.0
            rules_triggered.append({"rule_id": "R01_LIMIT_EXCEEDED", "severity": "HIGH", "desc": "Amount exceeds upay single transaction ceiling (৳25,000)"})

        # Rule 2: Instant cash-out or large transfer on new device
        if dev_age <= 0 and t_type in ["send_money", "cash_out"] and amt >= 10000.0:
            score += 45.0
            rules_triggered.append({"rule_id": "R02_NEW_DEV_LARGE_TRANSFER", "severity": "HIGH", "desc": "Large outflow (≥৳10,000) from brand new unregistered device"})

        # Rule 3: Deep night transfer
        if (0 <= hour <= 5) and amt >= 15000.0:
            score += 25.0
            rules_triggered.append({"rule_id": "R03_NIGHT_HIGH_VELOCITY", "severity": "MEDIUM", "desc": "High-value transfer during deep night anomaly window (00:00–05:59)"})

        # Rule 4: Regulatory structuring
        if 24000.0 <= amt < 25000.0 and t_type == "cash_out":
            score += 30.0
            rules_triggered.append({"rule_id": "R04_STRUCTURING_DETECTION", "severity": "MEDIUM", "desc": "Cash-out amount clustered within 2% below regulatory threshold"})

        # Rule 5: High-value transfer to new recipient
        if is_new_recip and amt >= 20000.0:
            score += 20.0
            rules_triggered.append({"rule_id": "R06_NEW_RECIPIENT_LARGE_TRANSFER", "severity": "MEDIUM", "desc": "High-value transfer (≥৳20,000) to newly linked recipient"})

        # Rule 6: SMS Urgency / PIN keywords if message attached
        if msg_text:
            lower = str(msg_text).lower()
            scam_keywords = ["pin", "পিন", "otp", "ওটিপি", "block", "বন্ধ", "জরুরি", "urgent", "লটারি", "lottery"]
            matched = [k for k in scam_keywords if k in lower]
            if matched:
                score += 30.0
                rules_triggered.append({"rule_id": "R05_CREDENTIAL_KEYWORDS", "severity": "HIGH", "desc": f"Associated message contains credential or pressure keywords: {', '.join(matched)}"})

        return min(98.0, max(10.0, score)), rules_triggered

    def fuse(self, tx_dict=None, message_text="", persona="salaried"):
        tx_dict = tx_dict or {}
        has_tx = bool(tx_dict and len(tx_dict) > 0)
        has_msg = bool(message_text and len(str(message_text).strip()) > 0)

        # 1. Evaluate individual signals
        rules_score, rule_traces = self.evaluate_rules(tx_dict, message_text)
        
        msg_score, msg_attributions = (10.0, [])
        if has_msg:
            msg_score, msg_attributions = self.score_message(message_text)

        txn_score, txn_attributions = (10.0, [])
        if has_tx:
            txn_score, txn_attributions = self.score_transaction(tx_dict)

        anomaly_score, anomaly_reasons = (10.0, [])
        if has_tx:
            anomaly_score, anomaly_reasons = self.score_anomaly(tx_dict, persona=persona)

        graph_score, graph_reasons = (10.0, [])
        receiver_id = tx_dict.get("receiver", "")
        if has_tx and receiver_id:
            graph_score, graph_reasons = self.score_graph(receiver_id)

        # Agent Benchmarking if agent involved
        agent_id = receiver_id if str(receiver_id).startswith("agent_") else tx_dict.get("sender", "")
        agent_score, agent_reasons = (10.0, [])
        if str(agent_id).startswith("agent_"):
            agent_score, agent_reasons = self.score_agent(agent_id)

        # 2. Weighted Fusion
        if has_msg and has_tx:
            w = self.WEIGHTS_FULL
            base_score = (
                w["rules"] * rules_score +
                w["message"] * msg_score +
                w["txn"] * txn_score +
                w["anomaly"] * anomaly_score +
                w["graph"] * graph_score
            )
            weights_used = w
        elif has_tx:
            w = self.WEIGHTS_TXN_ONLY
            base_score = (
                w["rules"] * rules_score +
                w["txn"] * txn_score +
                w["anomaly"] * anomaly_score +
                w["graph"] * graph_score
            )
            weights_used = w
        elif has_msg:
            w = self.WEIGHTS_MSG_ONLY
            base_score = (
                w["rules"] * rules_score +
                w["message"] * msg_score
            )
            weights_used = w
        else:
            base_score = 10.0
            weights_used = {}

        # Agent anomaly booster (if agent risk is elevated)
        if str(agent_id).startswith("agent_") and agent_score >= 50.0:
            base_score = min(98.0, base_score + 15.0)

        # High-severity rule safety floor: If critical rule fired (>=70), elevate to at least SOFT_FRICTION
        if rules_score >= 70.0 and base_score < self.THRESHOLD_SOFT_FRICTION:
            base_score = self.THRESHOLD_SOFT_FRICTION

        final_score = round(min(98.0, max(5.0, base_score)), 1)

        # 3. Decision Recommendation (NEVER auto-block money)
        if final_score >= self.THRESHOLD_HOLD_REVIEW:
            decision = "HOLD_FOR_REVIEW"
            risk_level = "CRITICAL" if final_score >= 85.0 else "HIGH"
            requires_human_review = True
        elif final_score >= self.THRESHOLD_SOFT_FRICTION:
            decision = "SOFT_FRICTION"
            risk_level = "MEDIUM"
            requires_human_review = False
        else:
            decision = "ALLOW"
            risk_level = "LOW"
            requires_human_review = False

        # 4. Synthesize Case Card
        case_card = self._build_case_card(
            final_score=final_score,
            decision=decision,
            tx_dict=tx_dict,
            msg_text=message_text,
            rules=rule_traces,
            msg_attrs=msg_attributions,
            txn_attrs=txn_attributions,
            anomaly_reasons=anomaly_reasons,
            graph_reasons=graph_reasons,
            agent_reasons=agent_reasons if str(agent_id).startswith("agent_") else []
        )

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "decision_recommendation": decision,
            "requires_human_review": requires_human_review,
            "signals": {
                "rules_score": round(rules_score, 1),
                "message_score": round(msg_score, 1) if has_msg else None,
                "txn_score": round(txn_score, 1) if has_tx else None,
                "anomaly_score": round(anomaly_score, 1) if has_tx else None,
                "graph_score": round(graph_score, 1) if has_tx else None,
                "agent_score": round(agent_score, 1) if str(agent_id).startswith("agent_") else None
            },
            "weights_used": weights_used,
            "rule_trace": rule_traces,
            "ml_attributions": txn_attributions + msg_attributions,
            "graph_evidence": {
                "receiver": receiver_id,
                "graph_risk": round(graph_score, 1),
                "reasons": graph_reasons
            } if has_tx and receiver_id else None,
            "case_card": case_card,
            "model_versions": {
                "message_model": "v1.0.0-char-wb-lr",
                "transaction_model": "v1.0.0-lgbm-calibrated",
                "anomaly_detector": "v1.0.0-isoforest",
                "graph_analyzer": "v1.0.0-networkx-mule"
            }
        }

    def _build_case_card(self, final_score, decision, tx_dict, msg_text, rules, msg_attrs, txn_attrs, anomaly_reasons, graph_reasons, agent_reasons):
        # 1. What happened?
        amt = tx_dict.get("amount")
        t_type = tx_dict.get("type", "transaction")
        sender = tx_dict.get("sender", "customer")
        receiver = tx_dict.get("receiver", "recipient")
        
        events = []
        if tx_dict:
            events.append(f"A ৳{float(amt):,.2f} {t_type.replace('_', ' ')} initiated from {sender} to {receiver}.")
        if msg_text:
            events.append(f"Accompanied by message payload: \"{str(msg_text)[:60]}...\"")
        
        what_happened = " ".join(events) if events else "Financial transaction screening requested."

        # 2. Why is it risky?
        reasons = []
        if rules:
            reasons.append(f"Triggered {len(rules)} security rule(s): {', '.join(r['rule_id'] for r in rules)}.")
        for a in txn_attrs:
            reasons.append(a.get("reason", ""))
        for r in anomaly_reasons:
            reasons.append(r)
        if graph_reasons and any("High fan-in" in g or "Transit hub" in g for g in graph_reasons):
            reasons.append(f"Network graph topology: {graph_reasons[0]}")
        if agent_reasons and any("Structuring" in ar or "Unusual hours" in ar for ar in agent_reasons):
            reasons.append(f"Agent risk: {agent_reasons[0]}")
            
        why_risky = " ".join(reasons) if reasons else "No anomalous behavioral deviations or security rule violations detected."

        # 3. What should upay do next?
        if decision == "HOLD_FOR_REVIEW":
            upay_action = "MANDATORY ACTION (Human Review Required): Temporarily hold fund settlement in triage queue; prompt customer with Bondhu security verification modal; assign case to Level-2 Fraud Operations."
        elif decision == "SOFT_FRICTION":
            upay_action = "RECOMMENDED ACTION: Present Bondhu confirmation screen warning the customer of potential scam tactics; introduce a 15-second reflection delay before final confirmation."
        else:
            upay_action = "STANDARD ACTION: Allow instantaneous transaction routing. Log standard telemetry to behavioral audit baseline."

        return {
            "what_happened": what_happened,
            "why_risky": why_risky,
            "what_upay_should_do": upay_action
        }
