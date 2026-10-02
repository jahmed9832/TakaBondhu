# Model & System Evaluation Report
**Project:** TakaBachao / ScamShield  
**Event:** AI Hackathon 2026 (DIU CPC x upay), Track 01 Trust & Risk  
**Date:** October 2026  
**Model Architecture:** TF-IDF char_wb n-grams (2-5) + Logistic Regression (calibrated on val)  
**Model Version:** `v1.0.0-char-wb-lr` | **Threshold $T$:** 0.5000  

> [!WARNING]
> **Synthetic benchmark. Not a measure of real-world accuracy.**  
> `test_unseen` is the honest benchmark number. The model was never trained, calibrated, or threshold-tuned on unseen template families.

---

## 1. System Comparison: Seen vs. Unseen Generalization

| Evaluation Split | System Architecture | Precision | Recall | F1 Score | PR-AUC | FPR | Precision @ 5% Prev.* |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **test_seen** (861 rows) | Rules Only (T>=50) | 1.0000 | 0.1917 | 0.3217 | 0.8982 | 0.0000 | 1.0000 |
| | ML Only (T>=0.50) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 1.0000 |
| | **Hybrid (Rules + ML)** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **0.0000** | **1.0000** |
| | Gemini Only | *not run (API key not configured)* | - | - | - | - | - |
| **test_unseen** (1,722 rows) **[HONEST BENCHMARK]** | Rules Only (T>=50) | 1.0000 | 0.0440 | 0.0842 | 0.7910 | 0.0000 | 1.0000 |
| | ML Only (T>=0.50) | 0.8827 | 1.0000 | 0.9377 | 0.9970 | 0.2175 | 0.1949 |
| | **Hybrid (Rules + ML)** | **0.9402** | **1.0000** | **0.9692** | **0.9682** | **0.1041** | **0.3357** |
| | Gemini Only | *not run (API key not configured)* | - | - | - | - | - |

\*\*Precision at an assumed 5% scam prevalence is analytically derived using Bayes' rule: $P(Scam|Flag) = \frac{Recall \times 0.05}{Recall \times 0.05 + FPR \times 0.95}$ to reflect realistic operational conditions where the vast majority of mobile banking messages are legitimate.*

---

## 2. Fairness Analysis Across Groups (test_unseen)

### Language Slices
| Language | Precision | Recall | F1 Score | FPR | Support (Benign / Scam) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Bangla (bn)** | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 164 / 315 |
| **Banglish** | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 246 / 376 |
| **English (en)** | 0.8475 | 1.0000 | 0.9175 | 0.2798 | 243 / 378 |

### Fairness Gap Audit
- **Maximum Language Recall Gap:** `0.00%`
- **Maximum Language FPR Gap:** `27.98%`
- **Gap Threshold Check (<= 10 percentage points):** `FLAGGED (> 10pp)`
- **Analysis:** Language FPR gap (28.0pp) exceeds 10pp (English FPR 27.98% vs 0.00% for bn/banglish). Mitigation: incorporate larger English hard-negative corpus and fine-tune language-stratified decision boundaries.

---

## 3. Adversarial Robustness Evaluation (`robustness.csv`)

Evaluates evasion variants synthesized from held-out unseen templates:

| Attack / Perturbation Variant | Variant Count | Hybrid Model Recall | Performance Delta vs Clean |
| :--- | :---: | :---: | :---: |
| **Clean test_unseen Scams (Baseline)** | 1069 | **100.00%** | Baseline |
| **Spaced Dots (`b.K.a.s.h`, `O.T.P`)** | 517 | 99.42% | -0.58% |
| **Homoglyph Replacements (Cyrillic lookalikes)** | 521 | 98.27% | -1.73% |
| **Benign Filler Appended** | 525 | 100.00% | +0.00% |
| **Adversarial Prompt Injection (`ignore instructions`)** | 536 | 100.00% | +0.00% |
| **Overall Robustness Dataset** | **2099** | **99.43%** | **-0.57%** |

---

## 4. Deterministic Rule Engine Tightening (Step 4 Before vs. After)

| Operating Threshold | Baseline FPR (Before Tightening) | Tightened FPR (After Step 4) | Relative FPR Reduction |
| :--- | :---: | :---: | :---: |
| **At Threshold >= 40** | 21.06% (578 / 2,744) | **1.49% (41 / 2,744)** | **92.9% reduction** |
| **At Threshold >= 50** | 9.11% (250 / 2,744) | **0.00% (0 / 2,744)** | **100% false positive elimination** |

---

## 5. Model Interpretability: Top Character N-Grams

### Top 10 Fraud Indicators (Positive Coefficients)
- `! `: +1.5709
- `ur`: +1.2765
- ` 01`: +1.1263
- `01`: +1.1228
- `রু`: +1.0497
- `ac`: +1.0286
- `te`: +1.0244
- ` 0`: +1.0085
- ` কর`: +0.9837
- `কর`: +0.9742

### Top 10 Benign Indicators (Negative Coefficients)
- ` ba`: -1.5781
- `or `: -1.5304
- `0.`: -1.3897
- `, `: -1.3609
- ` me`: -1.3090
- `ba`: -1.2047
- `ala`: -1.2030
- `the `: -1.1035
- `sho`: -1.1026
- `েন্`: -1.0656

---

## 6. Error Analysis: Synthetic Edge Cases

### False Positive Cases (Benign messages falsely flagged)
1. **[en] personal_chat** (Score: 53.22/100): "Hi Nusrat, our shared rent contribution of 5,000 is due today. Please transfer it to my wallet."
2. **[en] otp_safety** (Score: 69.1/100): "Official advisory: Customerr support will never request your secret PIN or ask you to install AnyDesk."
3. **[en] personal_chat** (Score: 53.11/100): "Hi Nusrat, our shared rent contribution of 500 is due today. Please transfer it to my wallet."
4. **[en] personal_chat** (Score: 53.28/100): "Hi Nusrat, our shared rent contribution of 1,000 is due today. Please transfer it to my wallet."
5. **[en] personal_chat** (Score: 54.18/100): "Hi Rahim, our shared rent contribution of 50,000 is due today. Please transfer it to my wallet."

### False Negative Cases (Scams escaping detection)
No false negatives observed on test_unseen at threshold T=50.
