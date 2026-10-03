"""
ml/transactions/generate_transactions.py
Fully synthetic, realistic MFS transaction ecosystem generator for TakaBondhu.
Event: AI Hackathon 2026 (DIU CPC x upay) - Track 01: Trust & Risk Intelligence

Generates:
- Customers across 5 realistic personas (student, rural_retail, salaried, elderly, small_merchant)
- Agents and Merchants with peer baselines
- Realistic diurnal & seasonal temporal distributions (Eid surge, month-end, salary cycles)
- 5 ground-truth injected fraud patterns:
    1. social_engineering (linked to scam messages)
    2. account_takeover (ATO: new device, new location, unusual hour, rapid velocity)
    3. mule_network (multi-hop fan-in -> fan-out / cash-out rings)
    4. agent_anomaly (cash-out volume & structuring vs peers)
    5. wrong_transfer_refund (urgent fake refund scam)
- Anti-leakage splitting:
    - Time-based holdout (test_time: days 61-90)
    - Entity/topology holdout (test_unseen_entity: quarantined mule rings & victim cohorts)
"""

import os
import sys
import json
import math
import random
import hashlib
import argparse
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

DISTRICTS_BD = [
    "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal",
    "Rangpur", "Mymensingh", "Comilla", "Bogra", "Jessore", "Dinajpur",
    "Kushtia", "Pabna", "Tangail", "Faridpur", "Jamalpur", "Noakhali",
    "Feni", "Cox's Bazar", "Gazipur", "Narayanganj", "Brahmanbaria"
]

TX_TYPES = [
    "send_money", "cash_out", "cash_in", "mobile_recharge",
    "bill_pay", "merchant_payment", "add_money"
]

CHANNELS = ["app", "ussd", "agent_pos"]

PERSONAS = {
    "student": {
        "weight": 0.25,
        "base_balance": (500, 3500),
        "mean_amount": 450,
        "amount_std": 300,
        "active_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        "pref_types": ["mobile_recharge", "send_money", "merchant_payment"],
        "channel_pref": {"app": 0.85, "ussd": 0.15, "agent_pos": 0.0}
    },
    "rural_retail": {
        "weight": 0.30,
        "base_balance": (1500, 12000),
        "mean_amount": 1800,
        "amount_std": 1200,
        "active_hours": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        "pref_types": ["cash_in", "cash_out", "send_money", "mobile_recharge"],
        "channel_pref": {"app": 0.30, "ussd": 0.50, "agent_pos": 0.20}
    },
    "salaried": {
        "weight": 0.25,
        "base_balance": (10000, 60000),
        "mean_amount": 4200,
        "amount_std": 3500,
        "active_hours": [8, 9, 12, 13, 17, 18, 19, 20, 21, 22],
        "pref_types": ["add_money", "send_money", "bill_pay", "merchant_payment", "cash_out"],
        "channel_pref": {"app": 0.90, "ussd": 0.10, "agent_pos": 0.0}
    },
    "elderly": {
        "weight": 0.10,
        "base_balance": (1000, 15000),
        "mean_amount": 2500,
        "amount_std": 1800,
        "active_hours": [9, 10, 11, 12, 14, 15, 16, 17],
        "pref_types": ["cash_out", "mobile_recharge", "send_money"],
        "channel_pref": {"app": 0.15, "ussd": 0.60, "agent_pos": 0.25}
    },
    "small_merchant": {
        "weight": 0.10,
        "base_balance": (15000, 100000),
        "mean_amount": 1200,
        "amount_std": 1500,
        "active_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        "pref_types": ["merchant_payment", "cash_out", "send_money", "add_money"],
        "channel_pref": {"app": 0.70, "ussd": 0.30, "agent_pos": 0.0}
    }
}


def load_scam_message_ids(dataset_path):
    """Load valid scam message IDs from message dataset if available."""
    if os.path.exists(dataset_path):
        try:
            df = pd.read_csv(dataset_path)
            scam_df = df[df["label"] == 1]
            if not scam_df.empty:
                return scam_df["id"].tolist()
        except Exception:
            pass
    # Fallback synthetic message IDs
    return [f"scam_msg_{i:04d}" for i in range(500)]


def generate_entities(n_customers=2500, n_agents=300, n_merchants=400):
    customers = []
    persona_names = list(PERSONAS.keys())
    persona_weights = [PERSONAS[p]["weight"] for p in persona_names]

    for i in range(n_customers):
        cid = f"cust_{i+1:05d}"
        persona = np.random.choice(persona_names, p=persona_weights)
        p_cfg = PERSONAS[persona]
        home_district = random.choice(DISTRICTS_BD)
        dev_id = f"dev_{cid}"
        dev_age = random.randint(30, 750)
        baseline_balance = round(random.uniform(*p_cfg["base_balance"]), 2)
        customers.append({
            "customer_id": cid,
            "persona": persona,
            "home_district": home_district,
            "primary_device_id": dev_id,
            "device_age_days": dev_age,
            "baseline_balance": baseline_balance,
            "mean_amount": p_cfg["mean_amount"],
            "amount_std": p_cfg["amount_std"],
            "source": "synthetic"
        })

    agents = []
    for i in range(n_agents):
        aid = f"agent_{i+1:04d}"
        district = random.choice(DISTRICTS_BD)
        is_corrupt_candidate = (i < 12) # first 12 agents reserve for anomaly / rogue testing
        agents.append({
            "agent_id": aid,
            "district": district,
            "is_corrupt_candidate": is_corrupt_candidate,
            "daily_cashout_mean": 45000 if not is_corrupt_candidate else 180000,
            "daily_cashout_std": 12000,
            "source": "synthetic"
        })

    merchants = []
    cats = ["grocery", "pharmacy", "clothing", "restaurant", "electronics", "utility"]
    for i in range(n_merchants):
        mid = f"merch_{i+1:04d}"
        merchants.append({
            "merchant_id": mid,
            "category": random.choice(cats),
            "district": random.choice(DISTRICTS_BD),
            "source": "synthetic"
        })

    return customers, agents, merchants


def generate_synthetic_transactions(
    n_tx=200000,
    n_customers=2500,
    n_agents=300,
    n_merchants=400,
    days=90,
    start_date="2026-04-01",
    scam_msg_ids=None
):
    print(f"Generating synthetic MFS ecosystem: {n_tx} txs, {n_customers} customers, {days} days...")
    customers, agents, merchants = generate_entities(n_customers, n_agents, n_merchants)
    cust_map = {c["customer_id"]: c for c in customers}
    agent_map = {a["agent_id"]: a for a in agents}
    cust_ids = [c["customer_id"] for c in customers]
    agent_ids = [a["agent_id"] for a in agents]
    merch_ids = [m["merchant_id"] for m in merchants]

    # Pre-define Mule Rings (5 rings)
    # Ring 1-3: in train/val timeline candidate
    # Ring 4-5: strictly in test_unseen_entity
    mule_rings = {
        "mule_ring_1": {"hub": "cust_mule_01", "victims": ["cust_00010", "cust_00011", "cust_00012", "cust_00013"], "holdout": False},
        "mule_ring_2": {"hub": "cust_mule_02", "victims": ["cust_00020", "cust_00021", "cust_00022", "cust_00023"], "holdout": False},
        "mule_ring_3": {"hub": "cust_mule_03", "victims": ["cust_00030", "cust_00031", "cust_00032", "cust_00033"], "holdout": False},
        "mule_ring_4": {"hub": "cust_mule_04_unseen", "victims": ["cust_00040", "cust_00041", "cust_00042", "cust_00043"], "holdout": True},
        "mule_ring_5": {"hub": "cust_mule_05_unseen", "victims": ["cust_00050", "cust_00051", "cust_00052", "cust_00053"], "holdout": True}
    }
    unseen_mule_entities = set(["cust_mule_04_unseen", "cust_mule_05_unseen", "cust_00040", "cust_00041", "cust_00042", "cust_00043", "cust_00050", "cust_00051", "cust_00052", "cust_00053"])

    # Separate cohort for unseen entity holdout
    unseen_customer_cohort = set(cust_ids[-250:]).union(unseen_mule_entities)

    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    transactions = []

    # Target counts: ~97.5% Benign, ~2.5% Injected Fraud (realistic MFS fraud incidence)
    n_fraud_target = int(n_tx * 0.025)
    n_benign_target = n_tx - n_fraud_target

    print(f"Generating ~{n_benign_target} benign transactions with realistic seasonality...")
    # Generate benign transactions
    for _ in range(n_benign_target):
        day_offset = random.randint(0, days - 1)
        tx_dt = start_dt + timedelta(days=day_offset)
        day_of_month = tx_dt.day

        # Select customer
        sender_id = random.choice(cust_ids)
        c_info = cust_map[sender_id]
        persona = c_info["persona"]
        p_cfg = PERSONAS[persona]

        # Diurnal distribution
        hour = np.random.choice(p_cfg["active_hours"])
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        tx_dt = tx_dt.replace(hour=hour, minute=minute, second=second)

        # Seasonality multipliers
        amount_mult = 1.0
        # Salary cycle (1st to 5th of month)
        if 1 <= day_of_month <= 5 and persona == "salaried":
            amount_mult *= 1.4
        # Month-end (25th to 30th)
        elif 25 <= day_of_month <= 30:
            amount_mult *= 1.15
        # Eid shopping (e.g. days 45 to 52)
        if 45 <= day_offset <= 52:
            amount_mult *= 1.8

        # Channel
        ch_items = list(p_cfg["channel_pref"].items())
        channel = np.random.choice([c[0] for c in ch_items], p=[c[1] for c in ch_items])

        # Tx Type
        tx_type = random.choice(p_cfg["pref_types"])

        # Receiver & Amount
        if tx_type == "cash_out":
            receiver_id = random.choice(agent_ids)
            amount = max(100.0, round(np.random.normal(c_info["mean_amount"], c_info["amount_std"]) * amount_mult, 2))
        elif tx_type == "cash_in":
            receiver_id = sender_id
            sender_id = random.choice(agent_ids)
            amount = max(200.0, round(np.random.normal(c_info["mean_amount"] * 1.5, c_info["amount_std"]), 2))
        elif tx_type == "merchant_payment":
            receiver_id = random.choice(merch_ids)
            amount = max(50.0, round(np.random.normal(c_info["mean_amount"] * 0.7, c_info["amount_std"] * 0.5) * amount_mult, 2))
        elif tx_type == "mobile_recharge":
            receiver_id = f"telco_{random.randint(1, 4)}"
            amount = float(random.choice([20, 50, 100, 200, 300, 500]))
        elif tx_type == "bill_pay":
            receiver_id = f"biller_{random.randint(1, 10)}"
            amount = round(random.uniform(500, 3500) * amount_mult, 2)
        elif tx_type == "add_money":
            receiver_id = sender_id
            sender_id = f"bank_{random.randint(1, 6)}"
            amount = round(random.uniform(2000, 15000) * amount_mult, 2)
        else: # send_money
            receiver_id = random.choice(cust_ids)
            while receiver_id == sender_id:
                receiver_id = random.choice(cust_ids)
            amount = max(100.0, round(np.random.normal(c_info["mean_amount"], c_info["amount_std"]) * amount_mult, 2))

        amount = min(amount, 25000.0) # Upay per-transaction limit
        is_new_recip = 1 if (tx_type == "send_money" and random.random() < 0.12) else 0
        recip_age = random.randint(1, 600) if is_new_recip == 0 else random.randint(1, 15)

        tx_id = f"tx_{hashlib.md5(f'{tx_dt.isoformat()}_{sender_id}_{receiver_id}_{amount}_{random.random()}'.encode()).hexdigest()[:12]}"

        # Assign Split
        if sender_id in unseen_customer_cohort or receiver_id in unseen_customer_cohort:
            split = "test_unseen_entity"
        elif day_offset >= 60:
            split = "test_time"
        else:
            split = "train" if random.random() < 0.80 else "val"

        transactions.append({
            "tx_id": tx_id,
            "ts": tx_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sender": sender_id,
            "receiver": receiver_id,
            "type": tx_type,
            "amount": float(amount),
            "device_id": c_info["primary_device_id"] if not sender_id.startswith("agent_") else f"dev_{sender_id}",
            "device_age_days": c_info["device_age_days"] if not sender_id.startswith("agent_") else 300,
            "geo_district": c_info["home_district"] if not sender_id.startswith("agent_") else agent_map.get(sender_id, {}).get("district", "Dhaka"),
            "channel": channel,
            "is_new_recipient": is_new_recip,
            "recipient_age_days": recip_age,
            "hour": hour,
            "source": "synthetic",
            "is_fraud": 0,
            "fraud_pattern": "none",
            "linked_message_id": "",
            "split": split
        })

    print(f"Injecting ~{n_fraud_target} fraud transactions across 5 attack topologies...")
    # Fraud pattern distribution:
    # (a) social_engineering: 30%
    # (b) account_takeover: 25%
    # (c) mule_network: 25%
    # (d) agent_anomaly: 10%
    # (e) wrong_transfer_refund: 10%
    fraud_types = ["social_engineering", "account_takeover", "mule_network", "agent_anomaly", "wrong_transfer_refund"]
    f_weights = [0.30, 0.25, 0.25, 0.10, 0.10]
    assigned_fraud_types = np.random.choice(fraud_types, size=n_fraud_target, p=f_weights)

    msg_idx = 0
    mule_ring_keys = list(mule_rings.keys())

    for f_type in assigned_fraud_types:
        day_offset = random.randint(0, days - 1)
        tx_dt = start_dt + timedelta(days=day_offset)

        if f_type == "social_engineering":
            # Victim transfers to attacker after scam message
            sender_id = random.choice(cust_ids)
            receiver_id = f"scammer_wallet_{random.randint(100, 999)}"
            c_info = cust_map[sender_id]
            # Realistic amounts: ~25% sub-2000 (e.g. lottery/job fee scam), rest standard
            if random.random() < 0.25:
                amount = round(random.uniform(400, 1950), 2)
            else:
                amount = round(random.uniform(2000, 24500), 2)
            hour = random.randint(9, 21)
            tx_dt = tx_dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            linked_msg = scam_msg_ids[msg_idx % len(scam_msg_ids)] if scam_msg_ids else f"scam_msg_{msg_idx:04d}"
            msg_idx += 1
            # Channel: app (70%) or ussd (30%)
            channel = np.random.choice(["app", "ussd"], p=[0.70, 0.30])

            if sender_id in unseen_customer_cohort:
                split = "test_unseen_entity"
            elif day_offset >= 60:
                split = "test_time"
            else:
                split = "train" if random.random() < 0.80 else "val"

            tx_id = f"tx_{hashlib.md5(f'{tx_dt.isoformat()}_{sender_id}_{receiver_id}_{amount}_se'.encode()).hexdigest()[:12]}"
            transactions.append({
                "tx_id": tx_id,
                "ts": tx_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sender": sender_id,
                "receiver": receiver_id,
                "type": "send_money",
                "amount": float(amount),
                "device_id": c_info["primary_device_id"],
                "device_age_days": c_info["device_age_days"],
                "geo_district": c_info["home_district"],
                "channel": channel,
                "is_new_recipient": 1,
                "recipient_age_days": random.randint(0, 3),
                "hour": hour,
                "source": "synthetic",
                "is_fraud": 1,
                "fraud_pattern": "social_engineering",
                "linked_message_id": linked_msg,
                "split": split
            })

        elif f_type == "account_takeover":
            # New device + unexpected location + dead of night (2 AM - 4 AM) + large rapid transfer or drain
            sender_id = random.choice(cust_ids)
            receiver_id = f"ato_drain_{random.randint(100, 999)}"
            c_info = cust_map[sender_id]
            hour = random.randint(2, 4)
            tx_dt = tx_dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            foreign_district = random.choice([d for d in DISTRICTS_BD if d != c_info["home_district"]])
            # Realistic amounts: ~20% sub-2000 probe drains, rest 2000-24900
            if random.random() < 0.20:
                amount = round(random.uniform(500, 1900), 2)
            else:
                amount = round(random.uniform(2000, 24900), 2)
            # Channel: app (75%) or ussd (25%) (SIM-swap / USSD session hijack)
            channel = np.random.choice(["app", "ussd"], p=[0.75, 0.25])

            if sender_id in unseen_customer_cohort:
                split = "test_unseen_entity"
            elif day_offset >= 60:
                split = "test_time"
            else:
                split = "train" if random.random() < 0.80 else "val"

            tx_id = f"tx_{hashlib.md5(f'{tx_dt.isoformat()}_{sender_id}_{receiver_id}_{amount}_ato'.encode()).hexdigest()[:12]}"
            transactions.append({
                "tx_id": tx_id,
                "ts": tx_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sender": sender_id,
                "receiver": receiver_id,
                "type": "send_money",
                "amount": float(amount),
                "device_id": f"dev_rogue_{random.randint(1000, 9999)}",
                "device_age_days": 0, # brand new device
                "geo_district": foreign_district, # foreign district
                "channel": channel,
                "is_new_recipient": 1,
                "recipient_age_days": 0,
                "hour": hour,
                "source": "synthetic",
                "is_fraud": 1,
                "fraud_pattern": "account_takeover",
                "linked_message_id": "",
                "split": split
            })

        elif f_type == "mule_network":
            # Fan-in to mule hub -> followed by quick fan-out / cash-out
            ring_name = random.choice(mule_ring_keys)
            ring_info = mule_rings[ring_name]
            hub_id = ring_info["hub"]
            victim_id = random.choice(ring_info["victims"])
            hour = random.randint(10, 22)
            tx_dt = tx_dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            # Realistic amounts: ~20% sub-2000 test hops, rest 2000-22000
            if random.random() < 0.20:
                amount = round(random.uniform(600, 1950), 2)
            else:
                amount = round(random.uniform(2000, 22000), 2)
            # Channel: app (60%), ussd (30%), agent_pos (10%)
            channel = np.random.choice(["app", "ussd", "agent_pos"], p=[0.60, 0.30, 0.10])
            tx_type = "cash_out" if channel == "agent_pos" else "send_money"

            # Holdout rule: Ring 4 and 5 MUST strictly be test_unseen_entity
            if ring_info["holdout"]:
                split = "test_unseen_entity"
            elif day_offset >= 60:
                split = "test_time"
            else:
                split = "train" if random.random() < 0.80 else "val"

            tx_id = f"tx_{hashlib.md5(f'{tx_dt.isoformat()}_{victim_id}_{hub_id}_{amount}_mule'.encode()).hexdigest()[:12]}"
            transactions.append({
                "tx_id": tx_id,
                "ts": tx_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sender": victim_id,
                "receiver": hub_id,
                "type": tx_type,
                "amount": float(amount),
                "device_id": f"dev_{victim_id}",
                "device_age_days": random.randint(50, 400),
                "geo_district": "Dhaka",
                "channel": channel,
                "is_new_recipient": 1,
                "recipient_age_days": random.randint(1, 5),
                "hour": hour,
                "source": "synthetic",
                "is_fraud": 1,
                "fraud_pattern": "mule_network",
                "linked_message_id": "",
                "split": split
            })

        elif f_type == "agent_anomaly":
            # Structured cash-out just below ৳25,000 threshold or high night-time velocity
            rogue_agent = random.choice(agents[:10]) # rogue candidate agents
            aid = rogue_agent["agent_id"]
            sender_id = random.choice(cust_ids)
            hour = random.choice([23, 0, 1, 2, 3, 14, 15]) # odd hours or structuring
            tx_dt = tx_dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            # Realistic amounts: ~15% micro-structuring (<2000), rest near 25k limit
            if random.random() < 0.15:
                amount = float(random.choice([1200.0, 1500.0, 1800.0, 1950.0]))
            else:
                amount = float(random.choice([24500.0, 24800.0, 24950.0, 24900.0]))
            # Channel: agent_pos (75%) or ussd agent menu (25%)
            channel = np.random.choice(["agent_pos", "ussd"], p=[0.75, 0.25])

            if sender_id in unseen_customer_cohort:
                split = "test_unseen_entity"
            elif day_offset >= 60:
                split = "test_time"
            else:
                split = "train" if random.random() < 0.80 else "val"

            tx_id = f"tx_{hashlib.md5(f'{tx_dt.isoformat()}_{sender_id}_{aid}_{amount}_agent'.encode()).hexdigest()[:12]}"
            transactions.append({
                "tx_id": tx_id,
                "ts": tx_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sender": sender_id,
                "receiver": aid,
                "type": "cash_out",
                "amount": float(amount),
                "device_id": f"dev_{sender_id}",
                "device_age_days": random.randint(10, 200),
                "geo_district": rogue_agent["district"],
                "channel": channel,
                "is_new_recipient": 0,
                "recipient_age_days": random.randint(30, 300),
                "hour": hour,
                "source": "synthetic",
                "is_fraud": 1,
                "fraud_pattern": "agent_anomaly",
                "linked_message_id": "",
                "split": split
            })

        else: # wrong_transfer_refund
            sender_id = random.choice(cust_ids)
            receiver_id = f"refund_trickster_{random.randint(100, 999)}"
            c_info = cust_map[sender_id]
            hour = random.randint(10, 19)
            tx_dt = tx_dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            # Realistic amounts: ~50% sub-2000 (typical ৳400 - ৳1,950 wrong transfer scam in BD), rest 2000-12000
            if random.random() < 0.50:
                amount = round(random.uniform(400, 1950), 2)
            else:
                amount = round(random.uniform(2000, 12000), 2)
            # Channel: app (55%) or ussd (45%)
            channel = np.random.choice(["app", "ussd"], p=[0.55, 0.45])
            linked_msg = scam_msg_ids[msg_idx % len(scam_msg_ids)] if scam_msg_ids else f"scam_msg_{msg_idx:04d}"
            msg_idx += 1

            if sender_id in unseen_customer_cohort:
                split = "test_unseen_entity"
            elif day_offset >= 60:
                split = "test_time"
            else:
                split = "train" if random.random() < 0.80 else "val"

            tx_id = f"tx_{hashlib.md5(f'{tx_dt.isoformat()}_{sender_id}_{receiver_id}_{amount}_wtr'.encode()).hexdigest()[:12]}"
            transactions.append({
                "tx_id": tx_id,
                "ts": tx_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sender": sender_id,
                "receiver": receiver_id,
                "type": "send_money",
                "amount": float(amount),
                "device_id": c_info["primary_device_id"],
                "device_age_days": c_info["device_age_days"],
                "geo_district": c_info["home_district"],
                "channel": channel,
                "is_new_recipient": 1,
                "recipient_age_days": 1,
                "hour": hour,
                "source": "synthetic",
                "is_fraud": 1,
                "fraud_pattern": "wrong_transfer_refund",
                "linked_message_id": linked_msg,
                "split": split
            })

    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    # Sort strictly by timestamp
    df = df.sort_values(by="ts").reset_index(drop=True)
    return df, customers, agents, merchants, mule_rings


def save_transaction_ecosystem(df, customers, agents, merchants, mule_rings, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    # Save full ecosystem
    full_path = os.path.join(output_dir, "transactions.csv")
    df.to_csv(full_path, index=False)
    print(f"✓ Saved full transactions dataset: {full_path} ({len(df)} rows)")

    # Save individual splits
    splits = ["train", "val", "test_time", "test_unseen_entity"]
    split_counts = {}
    for s in splits:
        sdf = df[df["split"] == s]
        s_path = os.path.join(output_dir, f"{s}.csv")
        sdf.to_csv(s_path, index=False)
        split_counts[s] = len(sdf)
        print(f"  - Split '{s}': {len(sdf)} rows (fraud rate: {(sdf['is_fraud'].mean()*100):.2f}%)")

    # Save entity tables
    pd.DataFrame(customers).to_csv(os.path.join(output_dir, "customers.csv"), index=False)
    pd.DataFrame(agents).to_csv(os.path.join(output_dir, "agents.csv"), index=False)
    pd.DataFrame(merchants).to_csv(os.path.join(output_dir, "merchants.csv"), index=False)

    with open(os.path.join(output_dir, "mule_rings.json"), "w", encoding="utf-8") as f:
        json.dump(mule_rings, f, indent=2)

    # Save dataset metadata and integrity hash
    hasher = hashlib.sha256()
    with open(full_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    dataset_hash = hasher.hexdigest()

    metadata = {
        "dataset_name": "TakaBondhu Synthetic MFS Transaction Ecosystem",
        "version": "1.0.0",
        "generated_at": datetime.now().isoformat(),
        "random_seed": SEED,
        "source": "synthetic",
        "sha256_hash": dataset_hash,
        "total_transactions": len(df),
        "total_customers": len(customers),
        "total_agents": len(agents),
        "total_merchants": len(merchants),
        "overall_fraud_rate": float(df["is_fraud"].mean()),
        "splits": split_counts,
        "fraud_patterns": df[df["is_fraud"] == 1]["fraud_pattern"].value_counts().to_dict(),
        "assumptions_reference": "docs/DATA_ASSUMPTIONS.md"
    }

    meta_path = os.path.join(output_dir, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata: {meta_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic MFS transaction ecosystem for TakaBondhu")
    parser.add_argument("--n-tx", type=int, default=200000, help="Total transactions to generate")
    parser.add_argument("--customers", type=int, default=2500, help="Total customers")
    parser.add_argument("--agents", type=int, default=300, help="Total agents")
    parser.add_argument("--merchants", type=int, default=400, help="Total merchants")
    parser.add_argument("--days", type=int, default=90, help="Days of history")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--output-dir", type=str, default="", help="Output directory")

    args = parser.parse_args()

    global SEED
    SEED = args.seed
    random.seed(SEED)
    np.random.seed(SEED)

    out_dir = args.output_dir or os.path.join(os.path.dirname(__file__), "..", "data", "transactions")

    msg_dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "dataset.csv")
    scam_msg_ids = load_scam_message_ids(msg_dataset_path)

    df, customers, agents, merchants, mule_rings = generate_synthetic_transactions(
        n_tx=args.n_tx,
        n_customers=args.customers,
        n_agents=args.agents,
        n_merchants=args.merchants,
        days=args.days,
        scam_msg_ids=scam_msg_ids
    )

    save_transaction_ecosystem(df, customers, agents, merchants, mule_rings, out_dir)
    print("🎉 Synthetic transaction dataset generation complete!")


if __name__ == "__main__":
    main()
