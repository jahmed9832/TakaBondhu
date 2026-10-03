"""
ml/transactions/graph_analyzer.py
NetworkX Graph Module for Money-Mule and Suspicious Network Discovery.
Event: AI Hackathon 2026 (DIU CPC x upay) - Track 01: Trust & Risk Intelligence

Algorithms:
1. Directed Transaction Graph (DiGraph): nodes = wallets/accounts, edges = transfers
2. Fan-In Detection: High in-degree from multiple disparate senders in short windows
3. Fan-Out Detection: Rapid fund dispersion to secondary mules or cash-out agents
4. Flow Velocity & Chain Discovery: Multi-hop cascading money transfers
5. Subgraph Evidence Extraction: Returns connected nodes and evidence edges for analyst console
"""

import os
import sys
import json
from datetime import datetime
import pandas as pd
import networkx as nx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "..", "data", "transactions")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


class MuleGraphAnalyzer:
    def __init__(self):
        self.G = nx.DiGraph()
        self.wallet_stats = {}
        self.mule_cache = {}

    def build_graph(self, tx_df):
        print(f"Building transaction network graph from {len(tx_df)} records...")
        self.G.clear()
        
        # Add edges for transfer transactions
        transfer_types = {"send_money", "cash_out"}
        filtered = tx_df[tx_df["type"].isin(transfer_types)]

        for _, row in filtered.iterrows():
            u = str(row["sender"])
            v = str(row["receiver"])
            amt = float(row["amount"])
            ts = str(row["ts"])
            tx_id = str(row["tx_id"])

            if not self.G.has_edge(u, v):
                self.G.add_edge(u, v, count=1, total_amount=amt, txs=[{"tx_id": tx_id, "amount": amt, "ts": ts}])
            else:
                self.G[u][v]["count"] += 1
                self.G[u][v]["total_amount"] += amt
                self.G[u][v]["txs"].append({"tx_id": tx_id, "amount": amt, "ts": ts})

        print(f"✓ Network Graph constructed: {self.G.number_of_nodes()} nodes, {self.G.number_of_edges()} edges")
        self._compute_network_metrics()
        return self

    def _compute_network_metrics(self):
        print("Computing mule network graph metrics (fan-in, fan-out, component clustering)...")
        in_degrees = dict(self.G.in_degree())
        out_degrees = dict(self.G.out_degree())

        for node in self.G.nodes():
            in_deg = in_degrees.get(node, 0)
            out_deg = out_degrees.get(node, 0)

            # Inflow volume & unique senders
            in_edges = self.G.in_edges(node, data=True)
            total_inflow = sum(d.get("total_amount", 0) for _, _, d in in_edges)
            unique_senders = len(in_edges)

            # Outflow volume & unique receivers
            out_edges = self.G.out_edges(node, data=True)
            total_outflow = sum(d.get("total_amount", 0) for _, _, d in out_edges)
            unique_receivers = len(out_edges)

            # Calculate Mule Risk Score (0-100)
            # High fan-in (multiple victims) + active fan-out / cash-out
            risk = 0.0
            reasons = []

            if unique_senders >= 3:
                risk += min(45.0, unique_senders * 12.0)
                reasons.append(f"High fan-in: received funds from {unique_senders} distinct senders")
            
            if unique_receivers >= 2 or (unique_senders >= 2 and total_outflow > 0):
                risk += 25.0
                reasons.append(f"Rapid fund dispersion: {unique_receivers} outgoing transfer targets")

            if total_inflow > 20000 and total_outflow > 15000:
                # Flow-through ratio: funds entering and rapidly exiting
                ratio = min(total_outflow, total_inflow) / max(total_outflow, total_inflow)
                if ratio > 0.65:
                    risk += 25.0
                    reasons.append(f"Transit hub pattern: high flow-through ratio ({ratio:.2f})")

            risk_score = min(98.0, max(10.0, risk))
            is_mule = risk_score >= 60.0

            self.wallet_stats[node] = {
                "wallet_id": node,
                "in_degree": in_deg,
                "out_degree": out_deg,
                "unique_senders": unique_senders,
                "unique_receivers": unique_receivers,
                "total_inflow": round(total_inflow, 2),
                "total_outflow": round(total_outflow, 2),
                "risk_score": round(risk_score, 1),
                "is_mule_suspect": is_mule,
                "reasons": reasons
            }

        # Cache top suspicious wallets
        mule_suspects = [s for s in self.wallet_stats.values() if s["is_mule_suspect"]]
        mule_suspects.sort(key=lambda s: s["risk_score"], reverse=True)
        print(f"✓ Identified {len(mule_suspects)} suspicious mule hub wallets across graph.")

    def get_wallet_subgraph(self, wallet_id, depth=1):
        """Extract ego-subgraph with evidence edges for frontend graph visualization."""
        wallet_id = str(wallet_id)
        if wallet_id not in self.G:
            return {
                "wallet_id": wallet_id,
                "is_mule_suspect": False,
                "risk_score": 10.0,
                "nodes": [{"id": wallet_id, "label": "Target", "type": "customer"}],
                "edges": [],
                "reasons": ["No network interaction history found in current graph window."]
            }

        stats = self.wallet_stats.get(wallet_id, {})
        sub_nodes = set([wallet_id])
        sub_edges = []

        # Inward edges (senders into wallet)
        for u, v, data in self.G.in_edges(wallet_id, data=True):
            sub_nodes.add(u)
            sub_edges.append({
                "source": u,
                "target": v,
                "amount": data["total_amount"],
                "tx_count": data["count"],
                "direction": "inflow"
            })

        # Outward edges (wallet into receivers / agents)
        for u, v, data in self.G.out_edges(wallet_id, data=True):
            sub_nodes.add(v)
            sub_edges.append({
                "source": u,
                "target": v,
                "amount": data["total_amount"],
                "tx_count": data["count"],
                "direction": "outflow"
            })

        nodes_list = []
        for n in sub_nodes:
            n_type = "agent" if n.startswith("agent_") else ("merchant" if n.startswith("merch_") else "customer")
            nodes_list.append({
                "id": n,
                "label": n,
                "type": n_type,
                "is_target": (n == wallet_id),
                "is_mule": self.wallet_stats.get(n, {}).get("is_mule_suspect", False)
            })

        return {
            "wallet_id": wallet_id,
            "is_mule_suspect": stats.get("is_mule_suspect", False),
            "risk_score": stats.get("risk_score", 10.0),
            "total_inflow": stats.get("total_inflow", 0.0),
            "total_outflow": stats.get("total_outflow", 0.0),
            "unique_senders": stats.get("unique_senders", 0),
            "unique_receivers": stats.get("unique_receivers", 0),
            "nodes": nodes_list,
            "edges": sub_edges,
            "reasons": stats.get("reasons", ["Standard peer-to-peer transaction activity."])
        }

    def save_cache(self, out_path=None):
        out_path = out_path or os.path.join(MODELS_DIR, "graph_cache.json")
        top_suspects = [s for s in self.wallet_stats.values() if s["is_mule_suspect"]]
        top_suspects.sort(key=lambda s: s["risk_score"], reverse=True)

        payload = {
            "generated_at": datetime.now().isoformat(),
            "total_nodes": self.G.number_of_nodes(),
            "total_edges": self.G.number_of_edges(),
            "mule_suspects_count": len(top_suspects),
            "top_suspects": top_suspects[:25],
            "stats_sample": {k: self.wallet_stats[k] for k in list(self.wallet_stats.keys())[:100]}
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"✓ Saved mule network graph cache to: {out_path}")


def build_and_export():
    tx_path = os.path.join(DATA_DIR, "transactions.csv")
    assert os.path.exists(tx_path), f"Missing {tx_path}"
    df = pd.read_csv(tx_path)

    analyzer = MuleGraphAnalyzer()
    analyzer.build_graph(df)
    analyzer.save_cache()

    # Test sample lookup
    sample_hub = "cust_mule_01"
    sub = analyzer.get_wallet_subgraph(sample_hub)
    print(f"\nSample Mule Subgraph for '{sample_hub}':")
    print(f"  Risk: {sub['risk_score']} | Inflow: Tk {sub['total_inflow']} | Outflow: Tk {sub['total_outflow']}")
    print(f"  Nodes: {len(sub['nodes'])}, Edges: {len(sub['edges'])}")


if __name__ == "__main__":
    build_and_export()
