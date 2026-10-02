# Validation & Scale Strategy: Path from POC to Upay Core Integration

> **AI Hackathon 2026 (DIU CPC x upay)**  
> **Track 01: Trust & Risk**

---

## 1. Executive Summary

ScamShield is designed from day one as an embeddable, low-latency microservice architecture rather than a detached chatbot. This document outlines how upay can safely validate, govern, and scale this technology from a synthetic local prototype to an enterprise transaction screening engine.

---

## 2. Phase 1: Shadow-Mode Validation on Governed Upay Data

Before any automated intervention touches an end user, the system must undergo **Shadow Mode Deployment**:

```
[Upay App / Core Switch] 
          │
          ├──▶ [Core Payment Processing] ──▶ (Transaction Completes Normally)
          │
          └──▶ [Asynchronous Mirror Stream]
                       │
                       ▼
             [POST /v1/screen] (Shadow Mode)
                       │
                       ▼
             [Log Risk Score & Case Card]
                       │
                       ▼
             [Offline Comparison with Reported Fraud Cases]
```

### Key Objectives in Shadow Mode:
1. **Zero Customer Impact:** The transaction flow completes without latency or friction; ScamShield runs asynchronously in the background.
2. **Empirical Precision at Review Capacity:**
   - In production, fraud operations teams have fixed human review capacity (e.g., 500 cases per analyst per shift).
   - In shadow mode, we measure **Precision @ Top-K Capacity**: What percentage of the top $K$ highest-scoring transactions correspond to actual reported complaints or confirmed fraudulent mule accounts?
3. **Prevalence Adjustment:**
   - In our synthetic test set, scams represent ~50% of the sample. In real-world MFS networks, true fraudulent attempts represent $\le 1\%$ to $5\%$ of total messages.
   - Shadow mode allows calibrating the threshold $T$ so that false alarm rates remain operationally sustainable ($\le 0.5\%$ of clean volume).

---

## 3. What Changes When Moving from Synthetic Data to Real Data?

| Dimension | Synthetic Prototype (Current) | Production on Real Governed Upay Data |
|:----------|:------------------------------|:---------------------------------------|
| **Data Source** | Generated templates with slot-filled noise | Real transaction memos, customer-support chats, SMS complaints |
| **Data Privacy** | Labeled `source="synthetic"` | Anonymized & pseudonymized under Bangladesh Data Protection Act & BB regulations |
| **Noise Profile** | Programmatic typos, emoji, spacing errors | Genuine colloquial slang, evolving regional dialects (Sylheti, Chittagonian, etc.) |
| **Multimodal Signals** | Text only | Text + Transaction Metadata (account age, velocity, new device login, geographic hop) |
| **Labeling Feedback** | Static ground truth | Active analyst feedback loops from resolved dispute tickets |

---

## 4. Operational Analyst Feedback Loop (HITL)

As demonstrated in the local `/review` UI:
1. **Flagged Queue:** Any transaction or interaction with `riskScore >= 50` or `needs_human_review = true` is placed in the Analyst Review Queue.
2. **Decision Logging:** The analyst reviews the deterministic case card, inspects the verbatim evidence, and records:
   - **Confirm Scam:** Account flagged across agent network; transaction reversed if pending.
   - **False Alarm:** Benign pattern noted; feedback recorded.
   - **Escalate:** Routed to senior AML / legal fraud compliance.
3. **Retraining Governance (No Auto-Retraining):**
   - Decisions are dumped via the export script to a governed CSV (`reviewed_cases_export.csv`).
   - Retraining is strictly manual, auditable, and requires a shadow validation run before model promotion to prevent adversarial data poisoning.

---

## 5. Drift Monitoring & Ongoing Calibration

In digital financial fraud, attackers adapt within weeks (concept drift and covariate shift). Production governance requires:
1. **Population Stability Index (PSI):** Monitor weekly shift in incoming text length and character n-gram distribution.
2. **Score Distribution Tracking:** Alert if the percentage of messages flagged as HIGH/CRITICAL jumps beyond $3\sigma$ of historical baseline.
3. **Analyst Agreement Rate:** Track inter-rater reliability between ML flags and final analyst verdicts.

---

## 6. The Integration Blueprint: `POST /v1/screen`

The integration hook in `backend/server.js` and `backend/integration/upayAdapter.js` provides the exact contract for upay engineering:

```http
POST /v1/screen HTTP/1.1
Host: scamshield.upay.internal
Content-Type: application/json

{
  "message_text": "জরুরি নোটিশ: আপনার একাউন্ট স্থগিত করা হয়েছে। অবিলম্বে পিন পাঠান।",
  "recipient_is_new": true,
  "amount": 15000
}
```

### JSON Response:
```json
{
  "screening_id": "scr-m3k8a-9f42",
  "allowed": false,
  "friction": "hold_for_human_review",
  "risk_score": 86,
  "risk_level": "CRITICAL",
  "needs_human_review": true,
  "case_card": {
    "what_happened": "Urgent account suspension or NID block threat demanding immediate compliance.",
    "why_risky": "Triggered 2 deterministic security rule(s): Account Threat, Credential Harvesting. ML model predicts 92.4% fraud probability.",
    "upay_action": "RECOMMENDATION (Human Approval Required): Promptly display high-friction red warning banner to user; temporarily hold outgoing transfers to target number pending human fraud-ops review; flag target phone number across agent network."
  }
}
```

This clean JSON contract decouples risk scoring from the upay transactional core, allowing instant rollout across upay mobile apps, agent USSD gateways, and customer support portals.
