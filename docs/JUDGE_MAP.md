# Judge Evaluation Map: Criteria to Concrete Evidence

> **AI Hackathon 2026 (DIU CPC x upay)**  
> **Track 01: Trust & Risk**

This document provides direct links, filenames, commands, and empirical reports verifying every evaluation criterion.

---

## 🏆 Scoring Criteria Evidence Matrix

| Criterion | Points | Concrete Code Evidence & File Location | Verification Command | Report Section |
|:---|:---:|:---|:---|:---|
| **1. Problem Relevance** | **20** | • [`frontend/src/data/sampleScenarios.js`](file:///d:/ScamSheild/frontend/src/data/sampleScenarios.js)<br>• [`docs/IDEA_ONE_PAGER.md`](file:///d:/ScamSheild/docs/IDEA_ONE_PAGER.md)<br>• Focuses on 8 real MFS threats (fake agent, KYC block, wrong transfer, OTP harvesting) | `npm run demo:check` | `docs/IDEA_ONE_PAGER.md` §1 & §2 |
| **2. AI/ML Depth** | **20** | • [`ml/train.py`](file:///d:/ScamSheild/ml/train.py): TF-IDF char n-grams (2-5) + Logistic Regression + Sigmoid Calibration<br>• [`ml/service.py`](file:///d:/ScamSheild/ml/service.py): Local FastAPI inference + feature attribution n-grams<br>• [`backend/scoring.js`](file:///d:/ScamSheild/backend/scoring.js): Mathematical blend ($w_{rules}=0.40, w_{ml}=0.60$)<br>• Anti-leakage split: 72 template families frozen in `test_unseen` | `npm test`<br>`npm run train` | `ml/reports/results.md`<br>`ml/reports/results.json` |
| **3. Business / Customer Impact** | **20** | • [`docs/VALIDATION_AND_SCALE.md`](file:///d:/ScamSheild/docs/VALIDATION_AND_SCALE.md): Shadow mode, Precision @ Review Capacity, and operational prevalence math<br>• [`backend/integration/upayAdapter.js`](file:///d:/ScamSheild/backend/integration/upayAdapter.js): Friction policy engine | `npm run bench` | `docs/VALIDATION_AND_SCALE.md` §2 & §6 |
| **4. Working End-to-End Prototype** | **15** | • Full working local stack on Windows laptop:<br>  - React + Vite UI (:5173)<br>  - Express Backend (:5000)<br>  - Python ML Microservice (:8001)<br>• Live telemetry & human review queue | `npm run dev`<br>`npm run doctor` | `README.md` Quick Start |
| **5. Innovation** | **10** | • **Track 01 Case Card**: Deterministically answers what happened, why risky, and what upay should do<br>• **Sub-2ms CPU inference**: Eliminates cloud LLM cost & latency<br>• **Banglish resilience**: Character n-grams handle chaotic phonetic spellings without dictionary failure | `node ml/bench_latency.py` | `docs/PERFORMANCE.md` |
| **6. Scalability & Integration** | **10** | • [`backend/integration/upayAdapter.js`](file:///d:/ScamSheild/backend/integration/upayAdapter.js)<br>• `POST /v1/screen` endpoint for MFS pre-send screening<br>• Sub-20ms measured end-to-end response time (< 200ms MFS SLA)<br>• Fully offline fallback mode (`DEMO_OFFLINE=true`) | `node scripts/bench.mjs` | `docs/PERFORMANCE.md` §2 |
| **7. Responsible AI & Security** | **5** | • [`backend/security.js`](file:///d:/ScamSheild/backend/security.js): PII redaction (phones, NIDs, OTPs)<br>• [`backend/tests/prompt_injection.test.js`](file:///d:/ScamSheild/backend/tests/prompt_injection.test.js): LLM cannot lower score<br>• [`frontend/src/components/ReviewQueue.jsx`](file:///d:/ScamSheild/frontend/src/components/ReviewQueue.jsx): Human-in-the-Loop review & retraining export | `node --test backend/tests/prompt_injection.test.js`<br>`node --test backend/tests/security.test.js` | `docs/RESPONSIBLE_AI.md` |

---

## 📋 Organizer Rules Compliance Checklist

- [x] **AI Does Meaningful Work (Not a wrapper):** Custom TF-IDF char n-gram ML model trained locally, performing feature extraction, calibrated probability estimation, and n-gram attribution.
- [x] **Synthetic Data Only:** 7,061 rows explicitly labeled `source="synthetic"`. Assumptions listed in [`docs/DATA_ASSUMPTIONS.md`](file:///d:/ScamSheild/docs/DATA_ASSUMPTIONS.md).
- [x] **Clean Test Set Never Used in Training:** Anti-leakage partition holds out 25% of template families exclusively in `test_unseen.csv`. Zero template overlap verified by unit test `test_anti_leakage_template_holdout`.
- [x] **Business Rules Separate from ML:** Rules in `ruleEngine.js` are scored independently from ML in `ml/service.py`. Pure code blend in `backend/scoring.js`.
- [x] **Output Traceable & Explainable:** Every flag contains verbatim substring evidence + ML top contributing n-grams.
- [x] **Sensitive Decisions NOT in LLM Prompt:** The LLM cannot override or set the score. Bounded adjustment clamped to $[-10, +10]$ in code.
- [x] **Fairness Checked Across Groups:** Evaluated across `bn`, `banglish`, `en` and length slices in `results.md` and `docs/RESPONSIBLE_AI.md`.
- [x] **Prompt Injection Considered:** Rigorous 4-test prompt injection suite in `backend/tests/prompt_injection.test.js`.
- [x] **Human Review on High-Impact Actions:** No auto-freeze/deny; flagged cases routed to `/review` UI.
- [x] **Prediction, Assumptions, and Explanation Separated:** Three visually separated blocks in `frontend/src/components/RiskReport.jsx`.
- [x] **Track 01 Good Project Test:** Every flagged case card provides: (1) what happened, (2) why risky, (3) what upay should do.
