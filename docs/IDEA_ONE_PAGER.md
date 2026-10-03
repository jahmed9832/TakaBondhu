# TakaBondhu (টাকাবন্ধু) — Idea One-Pager

> **Competition:** AI Hackathon 2026 (DIU CPC × upay)  
> **Track:** Track 01: Trust & Risk Intelligence *(Primary)* • Track 03: Customer Innovation & Financial Independence *(Supporting)*  
> **Tagline:** *"Upay's friend that keeps your money safe."* (টাকাবন্ধু — আপনার টাকার বিশ্বস্ত বন্ধু)  

---

## Official Problem Statement

> **"For vulnerable mobile financial service (MFS) users, agents, and fraud operations analysts in Bangladesh, social engineering scams, account takeovers, and money-mule networks cause substantial consumer losses, erosions of user trust, and manual investigation bottlenecks. We will build TakaBondhu, a multi-signal AI risk intelligence companion that uses synthetic transaction graph topologies, sub-word character n-grams, and behavioral anomaly vectors to deliver pre-send soft friction warnings and explainable 3-part analyst case cards, with success measured by 98.32% fraud recall at 0.41% false positive rate and ৳20.8 Lakh ($17.4k USD) in projected net economic benefit per 100,000 transactions."**

---

## The 9-Step Innovation Logic Chain

### 1. User
- **Primary Persona:** Everyday Bangladeshi MFS customers (students, rural retail users, salaried employees, elderly citizens, small merchants) receiving deceptive SMS/calls or facing account takeover (ATO).
- **Secondary Persona:** Upay Fraud Operations & Compliance Analysts overwhelmed by high false-positive alert volumes and manual evidence gathering.
- **Ecosystem Node:** MFS Agents targeted by criminal smurfing/structuring syndicates.

### 2. Problem
- **The Core Threat:** Digital financial crime in Bangladesh has evolved past crude spam into coordinated social engineering (fake agent calls, lottery scams, OTP harvesting) and automated account takeovers followed by rapid money-mule cash-out rings.
- **Current Failure Mode:** Rule engines alone miss subtle morphological evasions and non-linear multi-signal cues; free-form chatbots hallucinate and are easily jailbroken; manual review queues suffer severe alert fatigue ($> 85\%$ false alarm rates in traditional systems).
- **Consequence:** Victims lose hard-earned savings; innocent users experience abrupt transaction blocks; MFS operators suffer reputational damage.

### 3. Why Now?
- **Data & Algorithmic Convergence:** High-performance, lightweight sub-word classification (`char_wb` n-grams) and tree-based gradient boosting enable real-time sub-millisecond scoring on edge/CPU hardware without costly GPU infrastructure.
- **The Upay Opportunity:** Upay's multi-tier MFS ecosystem can achieve a defensible trust advantage by deploying "soft friction" delays that protect customers *before* money leaves the wallet.

### 4. Solution: TakaBondhu
An end-to-end, privacy-by-design financial safety platform delivering:
1. **Bondhu Customer Companion:**
   - Pre-Send Transfer Screener with gentle 10-second soft-friction countdowns (never auto-blocking money).
   - In-app Suspicious Message & Realtime Voice Screener with plain-Bangla explanations.
   - **Taka Plan (Track 03):** Non-manipulative conversational savings coach providing realistic surplus assessments and transparent trade-offs.
2. **Fraud Ops Analyst Console:**
   - Multi-Signal Risk Queue prioritizing alerts by true risk and team review capacity.
   - Structured 3-Part Case Cards answering: *"What happened? Why is it risky? What should upay do next?"*
   - Interactive SVG Mule Network Ego-Graph visualizer.
   - One-click feedback loop with tamper-evident SHA-256 audit logging.

### 5. AI/ML Role (Purposeful, Not a Wrapper)
TakaBondhu decomposes risk intelligence into specialized, explainable modules:
- **Message Risk Classifier:** TF-IDF `char_wb` n-grams + calibrated Logistic Regression ($0.65\text{ ms}$, $\text{AUC}=0.9996$).
- **Transaction Risk Classifier:** HistGradientBoosting with Sigmoid Calibration ($1.2\text{ ms}$, $\text{AUC}=0.9804$).
- **Behavioral Anomaly Detector:** Segmented Isolation Forest scoring customer profile deviations.
- **Mule Network Discovery:** NetworkX directed graph mining fan-in/fan-out flow velocities.
- **Agent Peer Benchmarking:** $Z$-score outlier detection flagging structuring under the ৳25,000 threshold.
- **Multi-Signal Fusion Layer:** Deterministic scoring math blending signals into calibrated risk tiers ($0.15\text{ Rules} + 0.55\text{ Txn} + 0.20\text{ Msg} + 0.05\text{ Anomaly} + 0.05\text{ Graph}$, $\text{AUC}=0.9982$).
- **Grounded LLM Assistant:** Structured evidence summarizer with clamped $[-10, +10]$ advisory range and zero decision authority.

### 6. Impact
- **Security & Trust Impact:** $98.32\%$ fraud recall caught at a strict $0.41\%$ False Positive Rate on unseen temporal splits (Days 61–90).
- **Financial Return:** **৳20.8 Lakh ($17.4k USD) net economic benefit per 100,000 transactions** (base expected scenario net of program cost; illustrative, assumption-driven).
- **Operational Efficiency:** **239.6 analyst hours saved per 100k transactions** through automated 3-question case cards and evidence compilation.
- **Zero Consumer Harm:** $100\%$ compliance with the Zero-Autonomous-Freeze invariant.

### 7. Data Strategy (100% Privacy by Design)
- **Zero Real Customer Data:** Developed entirely using synthetic MFS simulations (`source="synthetic"`).
- **Ecosystem Realism:** 200,000 synthetic transactions spanning 90 days across 5 distinct customer personas and 5 injected fraud patterns.
- **Anti-Leakage Safeguard:** Clean temporal split (Train: Days 1–60 [80%], Val: Days 1–60 [20%], Test: Days 61–90 [N=58,345]) with quarantined entity holdouts (500 customers [N=25,785]) and unseen template families.

### 8. Validation
- **Offline Machine Learning:** Validated across PR-AUC, ROC-AUC, Bayes-adjusted precision at realistic $1\%$ and $5\%$ prevalence, and sensitivity analyses.
- **Empirical Fairness Audit:** Verified across Bengali ($1.68\%$ FPR), Banglish ($0.00\%$ FPR), and English ($0.00\%$ FPR) with max FPR gap 1.68% and max recall gap 2.22%.
- **Deterministic Offline Demo:** 6 scripted scenarios verifying 100% offline functionality without external internet or API keys.

### 9. Path to Scale & Production
- **Shadow Mode Rollout:** 30-day passive evaluation alongside core transaction switch measuring real-world scoring distributions.
- **Soft Friction Integration:** Gradual rollout of educational warnings on high-confidence social engineering transfers.
- **API Readiness:** Production-ready Express API with mock `UpayTransactionAdapter`, idempotency key caching, and SHA-256 tamper-evident audit logging.
