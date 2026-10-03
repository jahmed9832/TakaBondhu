# TakaBondhu — Technical Report Outline & Evidence Dossier

> **Competition:** AI Hackathon 2026 (DIU CPC × upay)  
> **Purpose:** Comprehensive skeleton and evidence mapping for the formal hackathon submission report.  
> **Rule:** Every assertion, figure, and table links to an executable code source and output artifact.

---

## 1. Executive Summary & Problem Framing
- **1.1 The Challenge in Modern Bangladeshi MFS:**
  - Growth of digital wallets in Bangladesh (upay ecosystem context).
  - Emergence of three critical risk vectors: (a) Social engineering scam communications, (b) Account takeover (ATO), and (c) Rapid money mule networks.
- **1.2 Core Thesis & Solution Proposition:**
  - Why retrospective fraud detection fails: funds are cashed out before victim realizes.
  - TakaBondhu proposition: Multi-signal pre-send intelligence + soft friction delay + explainable triage case cards.
- **1.3 Hackathon Requirement Alignment:**
  - Demonstration of compliance with all 13 official program requirements.

---

## 2. Product Architecture & User Experience
- **2.1 Dual-Persona System Design:**
  - **Persona 1: Customer ("Bondhu Companion"):** Pre-send soft friction, message screener, localized Bangla voice interaction, and Track 03 Taka Plan savings coach.
  - **Persona 2: Fraud Operations Analyst:** Risk prioritization queue, 3-question case cards, interactive SVG mule network topology, and retraining feedback buffer.
- **2.2 High-Level Architecture Diagram (Paste Mermaid):**
  - Input Layer $\rightarrow$ Feature Engineering $\rightarrow$ Multi-Signal ML Engine $\rightarrow$ Decision Fusion $\rightarrow$ Human-in-the-Loop Action.
- **2.3 User Interface Proof Points:**
  - Screenshot 1: Customer Pre-Send Soft Friction Modal.
  - Screenshot 2: Three-Part Risk Intelligence Screen (Prediction vs Assumptions vs AI Explanation).
  - Screenshot 3: Fraud Analyst Console with Mule Network Ego-Graph.

---

## 3. Data Strategy & Synthetic Ecosystem
- **3.1 Privacy by Design (Zero Production PII):**
  - Justification for synthetic simulation per Section 11 of hackathon guidelines.
  - Labeling standard: `source="synthetic"` on every record.
- **3.2 Transaction Ecosystem Simulation (`ml/transactions/generate_transactions.py`):**
  - 200,000 synthetic transactions over 90 calendar days.
  - 5 Customer Personas: Student, Rural Retail, Salaried Employee, Elderly Citizen, Small Merchant.
  - 5 Injected Fraud Patterns: Social Engineering Phishing, Account Takeover, Mule Ring, Agent Structuring, Wrong-Transfer Refund.
- **3.3 Anti-Leakage Partitioning:**
  - Temporal cutoff: Days 1–60 (Train 80% [N=92,617], Val 20% [N=23,253]), Days 61–90 (Test Time Held-Out [N=58,345]).
  - Quarantined entity isolation: 500 customers (`test_unseen_entity`, N=25,785) never observed during training.
- **3.4 Dataset Summary Table to Paste:**
  - *Source File:* [docs/DATA_ASSUMPTIONS.md](DATA_ASSUMPTIONS.md)

---

## 4. Machine Learning & Risk Intelligence Engine
- **4.1 Architecture of the 5 Core Signals:**
  1. *Sub-word Message Classifier:* Character n-grams (`char_wb`, 2–5) with Calibrated Logistic Regression.
  2. *Transaction Risk Classifier:* Calibrated Histogram Gradient Boosting (`HistGradientBoostingClassifier`).
  3. *Behavioral Anomaly Detector:* Customer-segmented Isolation Forest.
  4. *Network Mule Analyzer:* Directed graph fan-in/fan-out flow velocity mining.
  5. *Agent Peer Benchmarking:* Parametric Z-score structuring outlier detection.
- **4.2 Multi-Signal Fusion Layer (`ml/fusion.py`):**
  - Pure deterministic code combining signals into unified risk tiers $[0, 100]$.
  - Zero autonomous money block invariant.
- **4.3 Grounded GenAI Layer (Gemini):**
  - Explanatory role only; bounded $[-10, +10]$ advisory range; offline deterministic fallback.

---

## 5. Empirical Evaluation & Experimental Results
*(All tables and figures in this section originate strictly from [ml/reports/results.json](../ml/reports/results.json))*

- **5.1 Comprehensive Benchmark Performance Table:**
  | Model / Signal | PR-AUC | ROC-AUC | Recall | Precision | FPR | Latency (p50) |
  |:---|:---:|:---:|:---:|:---:|:---:|:---:|
  | **Message Model (Unseen Test)** | 0.9996 | 0.9997 | 99.89% | 99.55% | 0.46% | 0.65 ms |
  | **Transaction Classifier (Held-Out)** | 0.9971 | 0.9999 | 99.28% | 97.53% | 0.06% | 1.20 ms |
  | **Multi-Signal Fusion Layer** | **0.9998** | **0.9999** | **99.80%** | **99.23%** | **0.05%** | **3.80 ms** |

- **5.2 Visual Figures to Paste:**
  - **Figure 1:** Precision-Recall Curve $\rightarrow$ *Source:* [docs/figures/pr_curve.svg](figures/pr_curve.svg)
  - **Figure 2:** Confusion Matrix on 20,000 Held-Out Transactions $\rightarrow$ *Source:* [docs/figures/confusion_matrix.svg](figures/confusion_matrix.svg)
  - **Figure 3:** Ablation Study across 6 Signal Configurations $\rightarrow$ *Source:* [docs/figures/ablation_chart.svg](figures/ablation_chart.svg)
  - **Figure 4:** Mule Network Topology Visualization $\rightarrow$ *Source:* [docs/figures/mule_network_graph.svg](figures/mule_network_graph.svg)
  - **Figure 5:** End-to-End Latency vs 200ms Budget $\rightarrow$ *Source:* [docs/figures/latency_breakdown.svg](figures/latency_breakdown.svg)

- **5.3 External Non-Template Benchmark:**
  - Evaluation on 160 manually written paraphrases ([ml/data/handwritten_eval.csv](../ml/data/handwritten_eval.csv)): **98.75% Recall**.

---

## 6. Fairness & Demographic Parity Audit
*(Source: [docs/figures/fairness_chart.svg](figures/fairness_chart.svg) and [docs/RESPONSIBLE_AI.md](RESPONSIBLE_AI.md))*

- **6.1 Linguistic Fairness (Bengali vs Banglish vs English):**
  - Bengali: Recall 99.78%, FPR 0.22%
  - Banglish: Recall 100.00%, FPR 0.00%
  - English: Recall 100.00%, FPR 2.22%
  - Max Disparity: **2.22 percentage points** (easily meets $\le 5\%$ tolerance).
- **6.2 Customer Persona Fairness:**
  - Evaluated across Student, Rural Retail, Salaried, Elderly, Small Merchant.
  - Max recall disparity: $0.50$ percentage points.
- **6.3 Message Length Bucketing:**
  - Short (<60 chars), Medium (60–150 chars), Long (>150 chars).

---

## 7. Business Impact & Economics
*(Source: [impact/impact_results.json](../impact/impact_results.json) and [docs/BUSINESS_CASE.md](BUSINESS_CASE.md))*

- **7.1 Unit Economics (Per 100,000 Transactions):**
  - All figures illustrative, assumption-driven, computed net of allocated program infrastructure and analyst costs.
  - **Base (Expected):** **৳2,083,410 ($17,362 USD)** net economic benefit per 100k transactions.
  - **Conservative (Worst):** **৳668,729 ($5,573 USD)** net benefit per 100k transactions.
  - **Optimistic (Best):** **৳4,314,153 ($35,951 USD)** net benefit per 100k transactions.
- **7.2 Three-Way Sensitivity Matrix (Normalized per 100k Transactions):**
  | Scenario | Loss Prevented | Labor Saved | Allocated Cost | Net Benefit (BDT) | Net Benefit (USD) |
  |:---|:---:|:---:|:---:|:---:|:---:|
  | **Conservative (Worst)** | ৳616,703 | ৳82,195 | ৳10,278 | **৳668,729** | $5,573 USD |
  | **Base (Expected)** | ৳1,957,788 | ৳155,727 | ৳10,278 | **৳2,083,410** | $17,362 USD |
  | **Optimistic (Best)** | ৳4,111,355 | ৳232,839 | ৳10,278 | **৳4,314,153** | $35,951 USD |

---

## 8. Responsible AI, Security, & Governance
- **8.1 Threat Model Table:**
  - Prompt Injection, Character Homoglyph Evasion, Smurfing Structuring, Feedback Poisoning, Model Inversion.
- **8.2 Human Oversight & Invariant Verification:**
  - Invariant: Zero autonomous money freezing.
  - Graduated action ladder: ALLOW $\rightarrow$ SOFT_FRICTION $\rightarrow$ HOLD_FOR_REVIEW.
- **8.3 Tamper-Evident Audit Logging:**
  - SHA-256 hash chaining on all risk decisions.

---

## 9. Post-Hackathon Scalability & Upay Integration Plan
- **9.1 Phased Implementation Pathway:**
  - Phase 1: Shadow Mode (30-day passive monitoring on live traffic).
  - Phase 2: Soft Friction Pilot (advisory banners on high-risk transfers).
  - Phase 3: Full Core Banking Integration with Upay Transaction Switch.
- **9.2 Technical Adapter Readiness:**
  - Upay core banking adapter with idempotency key caching ([backend/integration/upayAdapter.js](../backend/integration/upayAdapter.js)).
  - Production security checklist: mTLS, JWT bearer verification, hardware security modules (HSM).

---

## Claims vs. Evidence Checklist

| Report Claim | Code / File Source | Execution Command to Verify |
|:---|:---|:---|
| **Zero fabricated metrics** | [ml/reports/results.json](../ml/reports/results.json) | `npm run bench` |
| **Transaction PR-AUC = 0.9971** | [ml/reports/results.json](../ml/reports/results.json) | `python ml/eval.py` |
| **Benign FPR = 0.06% on transactions** | [ml/reports/results.json](../ml/reports/results.json) | `python ml/eval.py` |
| **Language FPR gap reduced to 2.22%** | [ml/reports/results.json](../ml/reports/results.json) | `python ml/eval.py` |
| **Zero autonomous money freeze invariant** | [backend/tests/prompt_injection.test.js](../backend/tests/prompt_injection.test.js) | `npm test` |
| **100% Synthetic Data, Zero real PII** | [docs/DATA_ASSUMPTIONS.md](DATA_ASSUMPTIONS.md) | `pytest ml/tests/test_transactions.py` |
| **Tamper-evident audit log** | [backend/auditLog.js](../backend/auditLog.js) | `node backend/tests/api_contract.test.js` |
| **48,600 analyst hours saved annually** | [impact/impact_results.json](../impact/impact_results.json) | `python impact/simulator.py` |
| **Sub-4ms end-to-end CPU pipeline** | [ml/reports/results.json](../ml/reports/results.json) | `python ml/eval.py` |
