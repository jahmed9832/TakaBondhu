# TakaBondhu — Judge Evaluation Map

> **Competition:** AI Hackathon 2026 (DIU CPC × upay)  
> **Evaluation Rubric:** 7 Official Criteria (100% Total Weight)  
> **Standard:** Complete traceability between scoring criteria, code files, executable commands, and UI screens.

---

## Quick Reference Summary

| Criterion | Weight | Key Metric / Deliverable | Primary File Reference | Verification Command |
|:---|:---:|:---|:---|:---|
| **1. Problem Relevance** | **20%** | Real MFS social engineering, ATO, and mule fraud prevention | [IDEA_ONE_PAGER.md](IDEA_ONE_PAGER.md) | `npm run demo:check` |
| **2. AI/ML Depth** | **20%** | Multi-signal ML (Char n-grams, GBDT, IsoForest, Graph, Peer Z) | [ml/eval.py](../ml/eval.py), [ml/reports/results.md](../ml/reports/results.md) | `npm run bench` |
| **3. Business Impact** | **20%** | ৳352.4 Crore ($29.4M) annual loss prevented; ৳20.8 Lakh net/100k txns; 48.6k analyst hrs saved | [BUSINESS_CASE.md](BUSINESS_CASE.md), [impact/simulator.py](../impact/simulator.py) | `python impact/simulator.py` |
| **4. Prototype Quality** | **15%** | End-to-end working app with 6 deterministic demo scenarios | [frontend/src/App.jsx](../frontend/src/App.jsx), [backend/server.js](../backend/server.js) | `npm run dev` |
| **5. Innovation** | **10%** | Pre-send soft friction, ego-subgraph visualization, Taka Plan | [PreSendChecker.jsx](../frontend/src/components/PreSendChecker.jsx) | UI Pre-Send Screen |
| **6. Scalability & Integration** | **10%** | Sub-millisecond CPU latency, Upay core adapter, OpenAPI 3.1 | [upayAdapter.js](../backend/integration/upayAdapter.js), [openapi.json](openapi.json) | `npm test` |
| **7. Responsible AI & Security** | **5%** | PII redaction, 0.46% FPR, prompt-injection defense, audit log | [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md), [auditLog.js](../backend/auditLog.js) | `npm run doctor` |

---

## Detailed Criterion Mapping

### 1. Problem Relevance (Weight: 20%)
*Guideline Expectation: "Solves a real and meaningful customer/business problem. Clear problem statement and baseline."*

- **The Problem Solved:** Addresses the three fastest-growing financial crime vectors in Bangladeshi MFS: (1) Social engineering scam transfers following deceptive calls/SMS, (2) Account Takeovers (ATO), and (3) Rapid cash-out money mule rings.
- **Evidence Files:**
  - Logic Chain & Problem Statement: [docs/IDEA_ONE_PAGER.md](IDEA_ONE_PAGER.md)
  - Synthetic Ecosystem Architecture: [docs/DATA_ASSUMPTIONS.md](DATA_ASSUMPTIONS.md)
  - Transaction Generator: [ml/transactions/generate_transactions.py](../ml/transactions/generate_transactions.py)
- **UI Demonstration:**
  - Open UI $\rightarrow$ Click **"Pre-Send Check"** $\rightarrow$ Simulate transfer to new recipient $\rightarrow$ Observe friendly soft-friction intervention.
  - Open UI $\rightarrow$ Click Demo Bar **"1. Fake Agent"** $\rightarrow$ Observe prompt detection of advance-fee scam.
- **Verification Command:**
  ```bash
  npm run demo:check
  ```

---

### 2. AI/ML Depth (Weight: 20%)
*Guideline Expectation: "AI is material to the solution and technically credible. Beyond a simple rule or chatbot wrapper."*

- **Multi-Signal Architecture (5 Material ML Modules):**
  1. **Message Model:** TF-IDF sub-word `char_wb` n-grams (2–5) + Calibrated Logistic Regression ([ml/train.py](../ml/train.py)).
  2. **Transaction Classifier:** HistGradientBoosting with Sigmoid Calibration ([ml/transactions/train_transaction_model.py](../ml/transactions/train_transaction_model.py)).
  3. **Behavioral Anomaly:** Segmented Isolation Forest detecting customer drift ([ml/transactions/anomaly_detector.py](../ml/transactions/anomaly_detector.py)).
  4. **Graph Mule Detection:** NetworkX directed multigraph tracking fan-in/fan-out flow velocities ([ml/transactions/graph_analyzer.py](../ml/transactions/graph_analyzer.py)).
  5. **Agent Peer Benchmarking:** Parametric Z-score structuring detection ([ml/transactions/agent_benchmarker.py](../ml/transactions/agent_benchmarker.py)).
  6. **Multi-Signal Fusion Layer:** Deterministic scoring logic producing 3-part case cards ([ml/fusion.py](../ml/fusion.py)).
- **Key Frozen Metrics (from [ml/reports/results.json](../ml/reports/results.json)):**
  - **Transaction PR-AUC:** $0.9971$ | **ROC-AUC:** $0.9999$
  - **Fraud Recall:** $99.28\%$ | **Benign FPR:** $0.06\%$
  - **Ablation Lift:** Fusion ($0.9998$ PR-AUC) out-performs Rules Only ($0.9610$) and Anomaly Only ($0.7420$).
- **Evidence Files:**
  - Full Technical Evaluation Report: [ml/reports/results.md](../ml/reports/results.md)
  - Raw JSON Benchmark Metrics: [ml/reports/results.json](../ml/reports/results.json)
  - Ablation Study Visualization: [docs/figures/ablation_chart.svg](figures/ablation_chart.svg)
  - Precision-Recall Curve: [docs/figures/pr_curve.svg](figures/pr_curve.svg)
- **Verification Command:**
  ```bash
  npm run bench
  ```

---

### 3. Business & Customer Impact (Weight: 20%)
*Guideline Expectation: "Clear, measurable value and plausible economics. Impact measured, not just model accuracy."*

- **Measurable Financial Economics (Per 100,000 Transactions):**
  - **Base Net Benefit:** **৳2,083,410 ($17,362 USD)** net economic value per 100,000 transactions (after deducting allocated program and infrastructure costs).
  - **Labor Savings:** **239.6 analyst hours saved per 100k txns** (75% faster triage via automated 3-question case cards).
  - **Sensitivity Matrix:** Conservative: ৳668,729 ($5,573 USD) • Base: ৳2,083,410 ($17,362 USD) • Optimistic: ৳4,314,153 ($35,951 USD).
  - *(All figures illustrative, assumption-driven, derived strictly from `impact/impact_results.json`).*
- **Evidence Files:**
  - Economic Case Study & Rollout Plan: [docs/BUSINESS_CASE.md](BUSINESS_CASE.md)
  - Executable Simulator Code: [impact/simulator.py](../impact/simulator.py)
  - Assumption Metadata: [impact/assumptions.json](../impact/assumptions.json)
- **UI Demonstration:**
  - Navigate to **"Impact Simulator"** in navbar $\rightarrow$ Adjust transaction volume, scam rate, or loss sliders $\rightarrow$ Observe dynamic financial calculations updated in real time.
- **Verification Command:**
  ```bash
  python impact/simulator.py
  ```

---

### 4. Prototype Quality (Weight: 15%)
*Guideline Expectation: "Working end-to-end experience, not only slides. High polish and responsiveness."*

- **Production Polish:**
  - Built with React + Vite + Tailwind CSS + Vanilla micro-animations.
  - Dual Views: Customer Companion ("Bondhu") & Fraud Operations Console.
  - Accessible: Language toggle (বাংলা / English) and Large Text accessibility toggle (`A / A+`).
  - **100% Deterministic Offline Demo Mode:** 6 scripted scenarios that run without internet or Gemini keys.
- **Evidence Files:**
  - Main Frontend Application: [frontend/src/App.jsx](../frontend/src/App.jsx)
  - Pre-Send Friction Modal: [frontend/src/components/PreSendChecker.jsx](../frontend/src/components/PreSendChecker.jsx)
  - Mule Graph SVG Component: [frontend/src/components/MuleNetworkGraph.jsx](../frontend/src/components/MuleNetworkGraph.jsx)
  - Fraud Ops Review Console: [frontend/src/components/ReviewQueue.jsx](../frontend/src/components/ReviewQueue.jsx)
- **Verification Command:**
  ```bash
  npm --prefix frontend run build
  ```

---

### 5. Innovation & Differentiation (Weight: 10%)
*Guideline Expectation: "Distinctive insight or differentiated product idea."*

- **Key Innovations:**
  1. **Pre-Send Soft Friction:** Unlike traditional retrospective fraud detection (which alerts victims *after* funds are stolen), TakaBondhu introduces an educational pause *before* transaction dispatch.
  2. **Three-Question Case Cards:** Directly answers the official hackathon prompt: *"What happened? Why is it risky? What should upay do next?"*
  3. **Visual Mule Ego-Network:** Renders the transaction topology so analysts can instantly spot fan-in/fan-out rings.
  4. **Taka Plan (Track 03):** Non-manipulative financial health companion that calculates savings feasibility and transparent trade-offs without pushing spending.
- **Evidence Files:**
  - Case Card Generator: [backend/scoring.js](../backend/scoring.js)
  - Savings Coach: [frontend/src/components/SavingsGuide.jsx](../frontend/src/components/SavingsGuide.jsx)

---

### 6. Scalability & Upay Integration (Weight: 10%)
*Guideline Expectation: "Believable path toward real systems, future data, and enterprise architecture."*

- **Enterprise Readiness:**
  - **Latency SLA:** Core pipeline executes in **$3.8\text{ ms}$ (p50)** on a standard laptop CPU; message model runs in **$0.65\text{ ms}$** (well under the 200 ms budget).
  - **Upay Core Adapter:** Implemented in [backend/integration/upayAdapter.js](../backend/integration/upayAdapter.js) with mock core banking ledger, balance checks, and idempotency key caching.
  - **OpenAPI 3.1 Specification:** Full API contract documented in [docs/openapi.json](openapi.json).
  - **Tamper-Evident Audit Trail:** Cryptographic SHA-256 hash chaining on all risk decisions ([backend/auditLog.js](../backend/auditLog.js)).
- **Evidence Files:**
  - Validation & Scale Plan: [docs/VALIDATION_AND_SCALE.md](VALIDATION_AND_SCALE.md)
  - Integration Adapter: [backend/integration/upayAdapter.js](../backend/integration/upayAdapter.js)
  - API Contract Test: [backend/tests/api_contract.test.js](../backend/tests/api_contract.test.js)

---

### 7. Responsible AI & Security (Weight: 5%)
*Guideline Expectation: "Privacy, explainability, fairness, and safety considered. Human oversight on high-impact actions."*

- **Safety & Ethics Safeguards:**
  - **Zero Autonomous Money Freeze:** Enforced in code; system outputs are restricted to `ALLOW`, `SOFT_FRICTION`, and `HOLD_FOR_REVIEW`.
  - **PII Scrubbing:** Redacts Bangladeshi phone numbers, NIDs, and OTPs before LLM ingestion ([backend/security.js](../backend/security.js)).
  - **Prompt Injection Defense:** Multi-layer defense with `<untrusted_user_message>` isolation, mathematical score invariance, and divergence alerts ([backend/tests/prompt_injection.test.js](../backend/tests/prompt_injection.test.js)).
  - **Fairness Guarantee:** Max linguistic FPR gap of **$2.22\%$** (down from $27.98\%$) with $99.8\%+$ recall across Bengali, Banglish, and English.
- **Evidence Files:**
  - Full Governance Architecture: [docs/RESPONSIBLE_AI.md](RESPONSIBLE_AI.md)
  - Anti-Leakage & Security Tests: [backend/tests/security.test.js](../backend/tests/security.test.js)
- **Verification Command:**
  ```bash
  npm test
  ```
