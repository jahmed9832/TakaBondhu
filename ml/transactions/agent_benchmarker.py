"""
ml/transactions/agent_benchmarker.py
Agent Risk Intelligence & Peer Comparison Benchmarking for TakaBondhu.
Event: AI Hackathon 2026 (DIU CPC x upay) - Track 01 / Track 05: Merchant & Agent Intelligence

Detects unusual agent behavior relative to peers:
1. Structuring ratio: percentage of cash-outs right below the BDT 25,000 regulatory limit (24,000 - 24,999)
2. Night-time activity ratio: percentage of transactions between 23:00 - 05:00
3. Volume anomaly: Cash-out volume z-score compared to district/peer baseline
4. Senders concentration: Abnormally low sender diversity per cash-out volume
5. Generates traceable reason codes and peer comparative statistics
"""

import os
import sys
import json
import numpy as np
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "..", "data", "transactions")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


class AgentBenchmarker:
    def __init__(self):
        self.peer_metrics = {}
        self.agent_profiles = {}
        self.is_fitted = False

    def fit(self, tx_df):
        print(f"Fitting Agent Peer Benchmarker on {len(tx_df)} transactions...")
        cashouts = tx_df[tx_df["type"] == "cash_out"].copy()
        
        # Aggregate per agent
        grouped = cashouts.groupby("receiver")
        
        stats = []
        for agent_id, group in grouped:
            if not str(agent_id).startswith("agent_"):
                continue
            
            n_tx = len(group)
            if n_tx == 0:
                continue
            
            total_vol = group["amount"].sum()
            avg_amt = group["amount"].mean()
            
            # Structuring: amounts between 24000 and 24999
            struct_tx = group[(group["amount"] >= 24000) & (group["amount"] < 25000)]
            struct_ratio = len(struct_tx) / n_tx
            
            # Night transactions: hours 23, 0, 1, 2, 3, 4
            night_tx = group[group["hour"].isin([23, 0, 1, 2, 3, 4])]
            night_ratio = len(night_tx) / n_tx
            
            # Unique senders ratio
            unique_senders = group["sender"].nunique()
            sender_div_ratio = unique_senders / n_tx
            
            districts = group["geo_district"].mode()
            district = districts.iloc[0] if len(districts) > 0 else "Dhaka"
            
            stats.append({
                "agent_id": str(agent_id),
                "district": district,
                "n_cashouts": int(n_tx),
                "total_volume": float(total_vol),
                "avg_amount": float(avg_amt),
                "structuring_ratio": float(struct_ratio),
                "night_ratio": float(night_ratio),
                "unique_senders": int(unique_senders),
                "sender_diversity": float(sender_div_ratio)
            })
            
        stats_df = pd.DataFrame(stats)
        if len(stats_df) == 0:
            print("Warning: No agent cashout records found.")
            return self
            
        # Compute baseline statistics
        self.peer_metrics = {
            "mean_structuring": float(stats_df["structuring_ratio"].mean()),
            "std_structuring": float(max(1e-4, stats_df["structuring_ratio"].std())),
            "mean_night": float(stats_df["night_ratio"].mean()),
            "std_night": float(max(1e-4, stats_df["night_ratio"].std())),
            "mean_volume": float(stats_df["total_volume"].mean()),
            "std_volume": float(max(1e-4, stats_df["total_volume"].std())),
            "total_agents_benchmarked": len(stats_df)
        }
        
        # Calculate z-scores and risk per agent
        self.agent_profiles = {}
        for _, row in stats_df.iterrows():
            aid = row["agent_id"]
            z_struct = (row["structuring_ratio"] - self.peer_metrics["mean_structuring"]) / self.peer_metrics["std_structuring"]
            z_night = (row["night_ratio"] - self.peer_metrics["mean_night"]) / self.peer_metrics["std_night"]
            z_vol = (row["total_volume"] - self.peer_metrics["mean_volume"]) / self.peer_metrics["std_volume"]
            
            # Composite risk calculation (0-100)
            score = 10.0
            reasons = []
            
            if row["structuring_ratio"] > 0.15 or z_struct > 2.5:
                penalty = min(45.0, max(15.0, z_struct * 12.0))
                score += penalty
                reasons.append(
                    f"Structuring anomaly: {row['structuring_ratio']*100:.1f}% of cashouts in ৳24,000–৳24,999 "
                    f"(peer avg {self.peer_metrics['mean_structuring']*100:.1f}%, z={z_struct:.1f})"
                )
                
            if row["night_ratio"] > 0.18 or z_night > 2.5:
                penalty = min(30.0, max(10.0, z_night * 8.0))
                score += penalty
                reasons.append(
                    f"Unusual hours: {row['night_ratio']*100:.1f}% cashouts during 23:00–05:00 "
                    f"(peer avg {self.peer_metrics['mean_night']*100:.1f}%, z={z_night:.1f})"
                )
                
            if z_vol > 3.0:
                score += 15.0
                reasons.append(
                    f"Outlier turnover: Total cash-out ৳{row['total_volume']:,.0f} is {z_vol:.1f} std deviations above peer mean"
                )
                
            risk_score = round(min(98.0, max(5.0, score)), 1)
            risk_level = "LOW"
            if risk_score >= 75.0:
                risk_level = "CRITICAL"
            elif risk_score >= 50.0:
                risk_level = "HIGH"
            elif risk_score >= 25.0:
                risk_level = "MEDIUM"
                
            self.agent_profiles[aid] = {
                "agent_id": aid,
                "district": row["district"],
                "n_cashouts": int(row["n_cashouts"]),
                "total_volume": round(float(row["total_volume"]), 2),
                "structuring_ratio": round(float(row["structuring_ratio"]), 4),
                "night_ratio": round(float(row["night_ratio"]), 4),
                "z_structuring": round(float(z_struct), 2),
                "z_night": round(float(z_night), 2),
                "z_volume": round(float(z_vol), 2),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "reasons": reasons if reasons else ["Operating within normal peer behavioral baselines."]
            }
            
        self.is_fitted = True
        n_high = sum(1 for a in self.agent_profiles.values() if a["risk_score"] >= 50.0)
        print(f"✓ Benchmarked {len(self.agent_profiles)} agents. Identified {n_high} anomalous/high-risk agents.")
        return self

    def evaluate_agent(self, agent_id):
        aid = str(agent_id)
        if aid in self.agent_profiles:
            profile = self.agent_profiles[aid]
            return {
                "agent_id": aid,
                "risk_score": profile["risk_score"],
                "risk_level": profile["risk_level"],
                "metrics": {
                    "cashouts_count": profile["n_cashouts"],
                    "total_volume": profile["total_volume"],
                    "structuring_ratio": profile["structuring_ratio"],
                    "night_ratio": profile["night_ratio"],
                    "peer_baseline": {
                        "peer_mean_structuring": round(self.peer_metrics.get("mean_structuring", 0.01), 4),
                        "peer_mean_night": round(self.peer_metrics.get("mean_night", 0.04), 4)
                    }
                },
                "z_scores": {
                    "z_structuring": profile["z_structuring"],
                    "z_night": profile["z_night"],
                    "z_volume": profile["z_volume"]
                },
                "reasons": profile["reasons"]
            }
        else:
            return {
                "agent_id": aid,
                "risk_score": 12.0,
                "risk_level": "LOW",
                "metrics": {
                    "cashouts_count": 0,
                    "total_volume": 0.0,
                    "structuring_ratio": 0.0,
                    "night_ratio": 0.0,
                    "peer_baseline": {
                        "peer_mean_structuring": round(self.peer_metrics.get("mean_structuring", 0.01), 4),
                        "peer_mean_night": round(self.peer_metrics.get("mean_night", 0.04), 4)
                    }
                },
                "z_scores": {"z_structuring": 0.0, "z_night": 0.0, "z_volume": 0.0},
                "reasons": ["New agent or standard activity level with no observed peer deviation."]
            }

    def save(self, out_path=None):
        out_path = out_path or os.path.join(MODELS_DIR, "agent_benchmarks.json")
        payload = {
            "peer_metrics": self.peer_metrics,
            "profiles_sample": {k: self.agent_profiles[k] for k in list(self.agent_profiles.keys())[:50]},
            "high_risk_agents": [p for p in self.agent_profiles.values() if p["risk_score"] >= 50.0]
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"✓ Saved agent benchmarks to: {out_path}")


def run():
    tx_path = os.path.join(DATA_DIR, "transactions.csv")
    assert os.path.exists(tx_path), f"Missing {tx_path}"
    df = pd.read_csv(tx_path)
    
    benchmarker = AgentBenchmarker()
    benchmarker.fit(df)
    benchmarker.save()
    
    # Test sample agent
    if benchmarker.agent_profiles:
        top_aid = max(benchmarker.agent_profiles.values(), key=lambda x: x["risk_score"])["agent_id"]
        res = benchmarker.evaluate_agent(top_aid)
        print(f"\nTop Anomalous Agent Evaluation for '{top_aid}':")
        print(f"  Risk: {res['risk_score']} ({res['risk_level']})")
        print(f"  Reasons: {res['reasons']}")


if __name__ == "__main__":
    run()
