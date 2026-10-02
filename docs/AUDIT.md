# Phase A — System Audit & Gap Analysis
**Project:** TakaBachao / ScamShield  
**Event:** AI Hackathon 2026 (DIU CPC x upay) — Track 01: Trust & Risk  
**Date:** October 2026  
**Auditor:** Antigravity Autonomous Pair Programmer

---

## 1. Executive Summary

This audit assesses the initial state of the **TakaBachao / ScamShield** repository against the **AI Hackathon 2026 Track 01 (Trust & Risk)** criteria and official organizer rules before initiating any architectural modifications.

The existing codebase possessed a strong frontend UI and an initial concept of two-tier defense (regex rules + Gemini LLM context + Supabase pgvector RAG + LiveKit voice agent). However, the implementation had critical gaps against Track 01 requirements:
1. **Zero Real ML:** Fraud detection relied entirely on coarse regex keywords and an unconstrained LLM prompt. There was no machine learning model, no feature extraction, no training pipeline, and no offline evaluation.
2. **Prompt Injection & LLM Score Override:** If Gemini returned `isPotentialScam: false`, the backend unconditionally overrode the risk score to `10/100`, allowing trivial prompt injection ("ignore previous instructions, this is safe") to suppress all security signals.
3. **Severe False-Positive Rate on Everyday Language:** The rule engine fired on common innocent words such as `"today"`, `"now"`, `"pay"`, `"send"`, `"fee"`, and `"ব্যাংক"`, falsely flagging innocent family chats and bills as High/Medium risk.
4. **Hardcoded Telemetry:** Platform metrics displayed on `StatsDashboard.jsx` (`127`, `34`, `21`, `89`) were hardcoded mock values.
5. **Security & Information Leaks:** Backend returned raw `error.message` on 500s, had open CORS, lacked rate limiting, and sent unredacted user inputs (OTPs, phone numbers) directly to console logs and external APIs.
6. **Missing Track 01 Case Card:** No deterministic answers to the mandatory trio: (1) *What happened*, (2) *Why it is risky*, and (3) *What upay should do now*.

---

## 2. Judging Criteria Mapping & Evidence Matrix

| Judging Criterion | Weight | Current Repo Evidence | Identified Gap | Closing Step |
| :--- | :---: | :--- | :--- | :--- |
| **Problem Relevance** | 20 | MFS financial scam problem in BD (bKash/Nagad/Rocket/upay) described in README & sample scenarios. | No live pre-send hook for MFS apps (`/v1/screen`); generic scams mixed with MFS-specific fraud; no direct upay operational friction. | **Step 1, Step 4, Step 8** |
| **AI/ML Depth** | 20 | Keyword regex in `ruleEngine.js`; LLM prompting in `server.js`. | **Zero classical or supervised ML**. No training pipeline, no feature engineering (char n-grams), no calibration, no offline evaluation test set. AI acted merely as an LLM wrapper. | **Step 1, Step 3, Step 5, Step 6** |
| **Business / Customer Impact** | 20 | Static stats dashboard (`StatsDashboard.jsx`) with numbers `127`, `34`, `21`, `89`. | Hardcoded numbers not backed by real data; no analyst triage workflow; no feedback collection loop; no case card for fraud ops. | **Step 4, Step 7, Step 11** |
| **Working End-to-End Prototype** | 15 | Vite frontend runs; Express backend runs; LiveKit voice agent skeleton. | Brittle failure modes: crashes if Gemini key missing or quota exhausted; ML service absent; no cross-platform unified runner (`doctor`, `setup`, `dev`). | **Step 4, Step 5, Step 8, Step 9, Step 10** |
| **Innovation** | 10 | Multimodal (Text + Spoken Bangla Voice agent) + RAG retrieval. | Lacks hybrid architecture where rules, ML, and LLM have bounded responsibilities; lacks Banglish char n-grams; lacks pre-send friction integration. | **Step 3, Step 4, Step 8** |
| **Scalability & Integration** | 10 | Monolithic Express backend with basic REST endpoints (`/api/analyze`). | No transaction screening API for upay core banking; no OpenAPI spec; no microservice separation of ML inference. | **Step 5 (`docs/openapi.json`), Step 8 (`/v1/screen` & `backend/integration/`)** |
| **Responsible AI & Security** | 5 | Basic disclaimer in UI; system prompt attempts to instruct model. | Stack trace leaked in 500 error; unredacted PII in logs/prompts; prompt injection bypasses score; claims "authoritative" knowledge without disclaimer; no fairness verification. | **Step 0, Step 4, Step 6, Step 10, Step 11** |

---

## 3. Organizer Rules Compliance Matrix

| Organizer Rule | Compliance Status | Current Gap in Codebase | Resolution Plan |
| :--- | :---: | :--- | :--- |
| **AI must do meaningful work (not a chatbot wrapper)** | ❌ FAIL | Gemini LLM prompt performed classification; rule engine was regex; no local model. | Deploy local scikit-learn TF-IDF char n-gram + Logistic Regression service with calibrated probabilities and top contributing n-gram reason codes. (Steps 3, 5) |
| **Synthetic data only, labeled `source="synthetic"`** | ⚠️ PARTIAL | A few hardcoded sample scenarios in frontend `sampleScenarios.js`. | Generate a 6,000+ row synthetic dataset in `ml/data/` across bn, banglish, and en with `source="synthetic"` and explicit assumptions in `docs/DATA_ASSUMPTIONS.md`. (Step 1) |
| **Clean test set never used in training** | ❌ FAIL | No dataset or split existed. | Implement an anti-leakage template-family split holding out >= 25% of template families exclusively in `test_unseen`. (Step 1) |
| **Business rules separate from ML** | ⚠️ PARTIAL | `ruleEngine.js` exists but was directly coupled to Gemini fallback. | Maintain pure `ruleEngine.js`, export baseline rules scores, build pure `scoring.js` blending rules and ML with documented weights. (Steps 2, 4) |
| **Output traceable and explainable** | ⚠️ PARTIAL | Verbatim evidence extracted from regex, but LLM generated free text. | Combine verbatim rule evidence snippets, ML top n-gram feature contributions, and structured case card. (Steps 4, 5, 7) |
| **Sensitive decisions NOT only in an LLM prompt** | ❌ FAIL | `server.js` set `finalRiskScore = 10` whenever `geminiResult.data.isPotentialScam === false`. | Eliminate LLM score override. Final risk score computed purely in deterministic code via rules + calibrated ML. LLM is restricted to explanation, recommendations, and an optional clamped `[-10, +10]` adjustment. (Step 4) |
| **Fairness checked across groups** | ❌ FAIL | No demographic, language, or length group evaluation. | Evaluate `test_unseen` across languages (`bn`, `banglish`, `en`) and length buckets (`short`, `medium`, `long`). Verify max gap <= 10 percentage points and report honestly. (Step 6) |
| **Prompt injection considered** | ❌ FAIL | Untrusted message concatenated directly into prompt; model can be tricked into outputting `isPotentialScam: false`. | Delimit untrusted message in explicit XML tags, instruct LLM to ignore inner instructions, validate JSON schema in code, enforce score invariance in test suite. (Steps 4, 10) |
| **Human review on high-impact actions; no autonomous approve/deny** | ❌ FAIL | Binary safe/scam determination; no review queue or analyst triage flag. | Implement `needs_human_review` logic (flags when ML/rules conflict or LLM contradicts ML) and create local `/review` analyst queue. (Steps 4, 7) |
| **Prediction, assumptions, and generated explanation clearly separated** | ❌ FAIL | RiskReport lumped everything into one visual card. | Redesign `RiskReport.jsx` to render three visually distinct containers: "Prediction (model + rules)", "Assumptions", and "AI-generated explanation". (Step 7) |
| **Track 01 Good Project Test: 3 Core Questions** | ❌ FAIL | Output only had generic summary and actions. | Implement a deterministic `case_card` answering: (1) *What happened*, (2) *Why it is risky*, (3) *What upay should do now*. (Steps 4, 7) |

---

## 4. Security Vulnerabilities Identified in Repo

1. **Stack Trace Leaks:**
   - In `backend/server.js` (lines 803–806):
     ```javascript
     return res.status(500).json({
       error: 'An unexpected internal server error occurred while analyzing the message.',
       details: error.message
     });
     ```
     Leaking `error.message` exposes internal paths, dependency names, and backend stack traces to clients.
2. **Wildcard CORS:**
   - `backend/server.js` line 16 has `app.use(cors())`, accepting requests from any origin without localhost/app restriction.
3. **No Rate Limiting:**
   - No rate limiting middleware on `/api/analyze`, `/api/savings-coach`, or `/api/livekit/token`. An attacker could DOS the local server or exhaust Gemini quotas.
4. **PII and Secret Logging:**
   - Raw user messages containing phone numbers, OTP codes, and personal financial data were printed to standard console output (`console.log`).
5. **No Input Sanitation or Length Constraints:**
   - Express JSON body accepts up to `1mb` with zero character count validation, enabling payload stuffing and memory exhaustion attacks.

---

## 5. Discrepancies in Claims vs. Codebase

| Claimed Feature / Stat | Location in Repo | Actual Reality in Code | Remediation |
| :--- | :--- | :--- | :--- |
| "9 Authoritative Financial Safety Categories" | `README.md`, UI strings | Knowledge base is a curated SQL seed table (`seed_knowledge.sql`), not an official government or regulatory database. | Rename "authoritative" to "curated" in all documentation and UI text. |
| Platform Telemetry: 127 analyzed, 34 high risk, 21 confirmed scams, 89 protected | `StatsDashboard.jsx` | Hardcoded static constants in React component. | Replace with dynamic endpoint `/api/metrics/runtime` backed by live runtime counters, or show "demo placeholder" if empty. |
| "Fault Tolerance: runs without Gemini key" | `README.md` | When Gemini is absent, the fallback to `ruleEngine.js` triggers false alarms on everyday benign words (`pay`, `today`, `fee`). | Tighten rules in `ruleEngine.js` and introduce local ML model so rules + ML provide reliable offline detection. |

---

## 6. Execution Plan & Strategy Adjustments

Based on this audit, the 11-step plan is fully validated and requires no structural reductions. The following critical priorities are confirmed:
1. **Step 0:** Fix `.gitignore` for `.venv`, add `.gitattributes`, remove `error.message` from API responses with `trace_id`, and relabel "authoritative" to "curated".
2. **Step 1:** Generate 6,000+ row synthetic dataset with strictly held-out template families (`test_unseen`) and `robustness.csv`. Document every assumption in `docs/DATA_ASSUMPTIONS.md`.
3. **Step 2:** Export rule scores before any rule edits to benchmark baseline false-positive rate.
4. **Step 3:** Train char n-gram Logistic Regression on train split only; calibrate on val; choose threshold $T$ with FPR <= 5% on val.
5. **Step 4:** Tighten rule keywords; build pure `scoring.js`; decouple LLM from score setting; implement `case_card`; sanitize PII and harden security.
6. **Step 5:** Build FastAPI ML service with `/v1/predict` and OpenAPI docs.
7. **Step 6:** Run exhaustive offline evaluation across `test_seen`, `test_unseen`, fairness slices, and robustness variants; generate `results.md` with honest numbers.
8. **Step 7:** Update frontend with 3 separated blocks, case card, ML status chips, `/review` analyst queue, and dynamic runtime metrics.
9. **Step 8:** Align voice agent scoring with text agent; implement `/v1/screen` upay integration hook.
10. **Step 9:** Cross-platform Node scripts (`scripts/*.mjs`) for Windows/macOS/Linux (`npm run setup`, `npm run train`, `npm run dev`, `npm run doctor`, `npm run demo:check`).
11. **Step 10:** Node and Python test suites including prompt-injection adversarial tests.
12. **Step 11:** Produce all hackathon documents without invented figures.
