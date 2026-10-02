# Responsible AI, Fairness, & Security Architecture

> **AI Hackathon 2026 (DIU CPC x upay)**  
> **Track 01: Trust & Risk**

---

## 1. Core Principles

ScamShield is engineered under the strict principle that **AI in high-stakes financial environments must be verifiable, auditable, privacy-preserving, and subject to human oversight.**

---

## 2. Privacy & Data Protection

1. **Zero Real User Data in Training:** All training sets are generated synthetically (`source="synthetic"`).
2. **Server-Side PII Redaction (`backend/security.js`):**
   - Automatically redacts Bangladeshi phone numbers (`+8801XXXXXXXXX`, `01XXXXXXXXX`, and Bengali digit formats `০১...`).
   - Redacts 10, 13, and 17-digit Bangladeshi National ID (NID) numbers.
   - Redacts 4-6 digit isolated verification codes (OTPs and PINs) while preserving calendar years (e.g., 2026).
3. **No Unsanitized Data Transmitted to External Clouds:**
   - Redaction executes in Node.js memory *before* any text reaches Google Gemini.
   - Core ML scoring executes 100% locally on localhost without transmitting any packet over the internet.
4. **Zero Raw Message Logging by Default:**
   - Production logs only record sanitized trace IDs (`trace_id`).
   - Logging of raw text requires explicit administrator opt-in (`LOG_RAW_MESSAGES=true`).

---

## 3. Transparency & Explainability

To satisfy the Track 01 requirement that "every decision must be explainable":
1. **Verbatim Evidence Extraction:** Every flag is anchored in exact substrings extracted directly from the user's message. Invented or hallucinated evidence is blocked in code.
2. **Feature Attribution (Reason Codes):** The local ML microservice calculates subword contributions:
   $$\text{Contribution}_i = x_i \cdot w_i$$
   The top positive n-grams (e.g., `"bloc"`, `"otp"`, `"জরু"`) are surfaced in the UI.
3. **Visual Separation of AI Artifacts:**
   The user interface explicitly separates:
   - **Block 1: Algorithmic Prediction** (Rules score + Calibrated ML score)
   - **Block 2: Operational Assumptions** (Thresholds, prevalence assumptions, synthetic baseline note)
   - **Block 3: Generative Explanation** (Advisory summary and safe next steps)

---

## 4. Empirical Fairness Audit Across Groups

Fairness was empirically evaluated across language and length subgroups on the frozen `test_unseen` benchmark (details in [`ml/reports/results.md`](file:///d:/ScamSheild/ml/reports/results.md)):

| Group Slice | Subgroup | Recall | False Positive Rate (FPR) | Sample Size |
|:------------|:---------|:-------|:--------------------------|:------------|
| **Language** | Bengali (`bn`) | 100.00% | 0.00% | 450 |
| **Language** | Banglish | 100.00% | 0.00% | 448 |
| **Language** | English (`en`) | 100.00% | 27.98% | 499 |
| **Length** | Short (< 60 chars) | 100.00% | 0.00% | 456 |
| **Length** | Medium (60-150 chars) | 100.00% | 6.54% | 467 |
| **Length** | Long (> 150 chars) | 100.00% | 24.58% | 474 |

### Fairness Disparity & Mitigation Analysis:
- **Recall Gap:** **0.00 percentage points** (100% recall across all three languages).
- **False Positive Gap:** The FPR gap between English (27.98%) and Bengali (0.00%) is **27.98 percentage points**, which exceeds the 10pp threshold.
- **Root Cause:** In the synthetic benchmark, English benign hard negatives intentionally included intense business loan conversations and urgent formal emails that trigger overlap with loan scam templates.
- **Mitigation Strategy:**
  1. Add greater template diversity and negative mining for English business communications.
  2. Implement co-occurrence requirements (requiring payment demand + external link + urgency before triggering English flags).

---

## 5. Security & Prompt Injection Defense

1. **Untrusted Boundary Isolation:** User text is strictly delimited within `<untrusted_content>` tags in LLM system prompts.
2. **Immutable Algorithmic Scoring:** The LLM is structurally prohibited from setting the score. The score is calculated in pure Node.js code ($0.40 \times \text{Rules} + 0.60 \times \text{ML}$).
3. **Clamped Advisory Range:** Any advisory adjustment from Gemini is clamped to $[-10, +10]$ in code. An attacker instructing the LLM to output `adjustment: -100` is thwarted.
4. **Human Review Divergence Trigger:** If an attacker convinces the LLM to return `isPotentialScam: false` on an obvious scam, the resulting divergence with the algorithmic score immediately triggers `needs_human_review = true`.
5. **Rate Limiting & Memory Protection:** 60 requests per minute per IP to prevent automated denial-of-service or scraping.

---

## 6. Human-in-the-Loop & Autonomous Action Policy

- **No Autonomous Deny/Block:** ScamShield **never** automatically freezes a customer's bank account or cancels a transaction on its own.
- **Advisory Friction Only:** The system prescribes proportional friction (e.g., displaying an educational confirmation dialog or placing a temporary hold pending human review).
- **Human Review Triggers:**
  - Rules and ML disagree by $\ge 50$ points.
  - LLM claims scam but score $< 50$.
  - LLM claims benign but score $\ge 65$.
  - High-value transaction ($\ge 10,000$ BDT) with new recipient.

---

## 7. Known Limitations

1. **Synthetic Data Boundary:** Unseen test templates were created by human engineers; real-world scammers develop novel attack vectors not represented in synthetic distributions.
2. **Audio Transcription Quality:** In noisy rural market conditions, speech-to-text accuracy may degrade, requiring confidence scoring.
3. **Text-Only Context:** Standalone messages lack behavioral context (e.g., whether the user frequently transacts with this merchant).
