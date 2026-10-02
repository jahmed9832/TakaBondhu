# Idea One-Pager: TakaBachao / ScamShield

> **AI Hackathon 2026 (DIU CPC x upay)**  
> **Track 01: Trust & Risk**  
> **Product:** TakaBondhu / ScamShield  
> **Core Focus:** Multi-tier fraud detection and pre-send risk screening for Bangladeshi Mobile Financial Services (bKash / Nagad / Rocket / upay).

---

## 1. Formal Problem Statement

> **"For everyday Mobile Financial Services (MFS) users and fraud operations analysts in Bangladesh, social engineering scams (fake agent impersonation, urgent account-suspension threats, wrong-transfer refunds, and OTP harvesting) cause direct monetary losses, account lockouts, and erosion of digital financial trust. We built ScamShield / TakaBondhu, a hybrid decision-support system that uses tightened deterministic rules, sub-2ms character n-gram machine learning, and bounded contextual explanation to classify message threats and prescribe friction policies, with success measured by precision on unseen attack variants, benign false positive rate ($\le 5\%$), and analyst review queue efficiency."**

---

## 2. The Organizer's Logic Chain

### 1. Target User
- **Primary:** Everyday Bangladeshi mobile wallet users (especially first-generation digital banking adopters, students, rural retail customers, and elderly users).
- **Secondary:** Upay Fraud Operations (Fraud-Ops) analysts handling suspicious transaction queues and merchant risk reviews.

### 2. The Problem
Social engineering fraudsters exploit urgency, emotional manipulation, and authority impersonation to convince users to transfer money or disclose 6-digit OTPs and wallet PINs. Because attackers constantly mutate wording, mix scripts (Bangla, Banglish, English), and use phonetic abbreviations, rigid keyword blocklists fail, while pure generative LLM wrappers are slow (>2s), costly, non-deterministic, and vulnerable to prompt injection.

### 3. Why Now?
Bangladesh's digital financial transaction volume exceeds billions of BDT monthly. With rapid smartphone adoption and MFS interoperability, scam volume has surged. Regulators and providers (upay, Bangladesh Bank) need real-time, explainable, and privacy-preserving pre-transaction verification that operates within strict sub-200ms latency SLAs.

### 4. The Solution
A hybrid defense system combining:
1. **Tightened Deterministic Rules:** Verbatim evidence extraction for known high-coercion patterns.
2. **Calibrated Local ML Service:** TF-IDF character n-grams (2-5) + Logistic Regression running on CPU in under 2ms.
3. **Pure Code Hybrid Blending:** Final risk score ($0.40 \times \text{Rules} + 0.60 \times \text{ML}$) evaluated against operating threshold $T = 50$.
4. **Bounded LLM Advisory:** Google Gemini provides educational narrative and safe next steps, but is strictly prohibited from setting or clearing scores (adjustment hard-clamped to $[-10, +10]$ in code).
5. **Pre-Send Screening API (`POST /v1/screen`):** Enables upay core banking to screen transactions prior to ledger execution.

### 5. Role of AI (Meaningful Work, Not a Wrapper)
- **Feature Extraction:** ML operates on character subwords (`char_wb`), capturing dialectal Banglish spelling shifts (`ekhoni`, `ekhoni-i`, `akn`), typos, and morphological variants without huge vocabulary bloat.
- **Explainability:** Feature attribution mathematically identifies the top contributing n-grams (reason codes).
- **Track 01 Case Card:** Deterministically answers:
  1. *What happened?* (Tactic identification)
  2. *Why is it risky?* (Objective signals + verbatim evidence)
  3. *What should upay do now?* (Operational recommendation requiring human sign-off)

### 6. Impact Metric & Assumptions
- **Empirical Offline Benchmark on Unseen Templates:** 
  - Precision: **94.02%**
  - Recall: **100.00%**
  - Benign False Positive Rate (FPR): **10.41%**
  - Precision at Assumed 5% Real-World Prevalence: **33.57%** *(Statistically derived baseline assumption)*
- **Operational Latency:** Sub-20ms end-to-end local screening (`docs/PERFORMANCE.md`).
- **Analyst Productivity:** Reduces triage time by presenting verbatim evidence and pre-generated case cards.

### 7. Synthetic Data Methodology & Ethics
- 7,061 synthetically generated messages labeled `source="synthetic"`.
- Zero real user PII used in training.
- Anti-leakage partition holding out 72 complete template families exclusively in `test_unseen`.
- Separate evasion robustness benchmark (`robustness.csv`).

### 8. Validation & Scaling Strategy
- **Phase 1 (Current Prototype):** Standalone local decision engine with analyst review queue.
- **Phase 2 (Shadow Mode Validation):** Integrated via `POST /v1/screen` running silently parallel to live upay transaction streams to measure real-world precision without impacting customer flows.
- **Phase 3 (Governed Deployment):** Low-friction prompts ("Confirm transfer") for moderate risks; human-in-the-loop analyst queues for high-risk flags.
