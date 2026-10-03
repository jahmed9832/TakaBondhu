# TakaBondhu (টাকাবন্ধু) — 3-Minute Video Pitch & Demo Script

> **Product:** TakaBondhu — "Upay's friend that keeps your money safe." (টাকাবন্ধু)  
> **Duration:** Exactly 3 Minutes (180 Seconds)  
> **Format:** Screen Recording + Voiceover (Dual-language: Bengali & English)  
> **Target Audience:** Hackathon Judges & Upay Product Leadership  

---

## Video Timeline & Demo Click Path

```
0:00 ──── 0:30 ──── 1:15 ──── 1:45 ──── 2:25 ──── 2:50 ──── 3:00
 [Problem]  [Bondhu]  [Pre-Send]  [Taka Plan]  [Fraud Ops]  [Impact]   [Close]
```

---

### Segment 1: The Problem & Vision [0:00 – 0:30] (30s)
**Screen:** Home view (`http://localhost:5173`) showing Hero banner with animated badge: *"Upay's friend that keeps your money safe."*

- **Visual Action:** Cursor rests on the headline *"Stay one step ahead of scams."* Hover over the Live Telemetry banner showing 0.65 ms latency.
- **English Narration:**
  > "Every month in Bangladesh, thousands of mobile financial service users fall prey to social engineering scams, account takeovers, and organized money-mule rings—costing millions of Taka in consumer losses. Meet **TakaBondhu** (টাকাবন্ধু), an AI financial safety companion built natively for upay."
- **Bangla Narration (বাঙালি ধারাভাষ্য):**
  > "বাংলাদেশে প্রতি মাসে হাজারো সাধারণ গ্রাহক ফেক এজেন্ট, ওটিপি ফাঁদ এবং প্রতারণামূলক প্রলোভনে পড়ে কোটি কোটি টাকা হারাচ্ছেন। উপায় গ্রাহকদের আর্থিক সুরক্ষায় আমরা তৈরি করেছি **টাকাবন্ধু**—আপনার টাকার বিশ্বস্ত বন্ধু।"
- **On-Screen Numbers to Read:**
  - *"Zero real PII • 100% Synthetic Data • Sub-4ms CPU pipeline."*

---

### Segment 2: Customer Bondhu Screener & Demo Scenario 1 [0:30 – 1:15] (45s)
**Screen:** Scroll down to Message Analyzer or click Demo Bar **"1. Fake Agent"**.

- **Visual Action:**
  1. Click top Demo Bar button: **"1. Fake Agent"**.
  2. The input immediately populates with:  
     `"আসসালামু আলাইকুম, আমি উপায় প্রধান কার্যালয় থেকে বলছি... ২,৫০০ টাকা সিকিউরিটি ফি ক্যাশ-আউট করুন।"`
  3. The Risk Report card instantly expands below, displaying:
     - **Block A: Prediction** (Dynamic Risk Score and Level returned by API; see output of `npm run demo:check`).
     - **Block B: System Assumptions** (Prevalence: 5%, Threshold: T=50, Human-in-the-loop guarantee).
     - **Block C: AI Explanation** (*"উপায় কর্মকর্তার ভুয়া পরিচয় ব্যবহার করে অগ্রিম ফি চাওয়ার প্রতারণামূলক প্যাটার্ন সনাক্ত হয়েছে।"*).
- **English Narration:**
  > "When a customer receives a suspicious SMS, TakaBondhu's local sub-word model evaluates the message in under 1 millisecond. Notice how the screen strictly separates algorithmic prediction, system assumptions, and plain-language explanation. No hallucinations, and zero PII stored."
- **Bangla Narration:**
  > "গ্রাহক একটি মেসেজ পেস্ট করার সাথে সাথেই আমাদের সাব-ওয়ার্ড মডেল ১ মিলিসেকেন্ডের মধ্যে বিপদ সনাক্ত করে। এখানে রয়েছে তিনটি স্পষ্ট ভাগ: অ্যালগরিদম প্রেডিকশন, সিস্টেমের শর্তাবলী এবং সহজ বাংলায় করণীয় নির্দেশিকা।"

---

### Segment 3: Pre-Send Transfer Check & Soft Friction [1:15 – 1:45] (30s)
**Screen:** Click **"Pre-Send Check"** in the top navigation or click Demo Bar **"3. Account Takeover"**.

- **Visual Action:**
  1. Click **"Pre-Send Check"**.
  2. Click **"Run Pre-Send Safety Screen"**.
  3. A high-risk alert triggers (`Risk Score: 92/100`).
  4. The **Soft Friction Modal** appears with a **10-second countdown pause**:
     - Headline: *"Hold On! TakaBondhu Detected an Unusual Transfer Pattern"*.
     - Bullet cues: New Device (0 days), Unusual Hour (03:15 AM), Foreign District (Sylhet).
     - Notice the invariant: TakaBondhu **never** blocks money autonomously. The customer is empowered with informed choice after the pause.
- **English Narration:**
  > "Instead of blocking money after it's gone, TakaBondhu screens transactions *before* dispatch. For high-risk transfers, we trigger a gentle 10-second soft friction pause. We never freeze accounts autonomously—empowering the user with informed choice."
- **Bangla Narration:**
  > "টাকা চলে যাওয়ার পর আফসোস না করে, লেনদেন পাঠানোর আগেই টাকাবন্ধু যাচাই করে। অস্বাভাবিক লেনদেনে আমরা ১০ সেকেন্ডের একটি সচেতনতামূলক বিরতি দিই। আমরা কখনোই স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট বন্ধ করি না।"

---

### Segment 4: Taka Plan — Savings Coach (Track 03) [1:45 – 2:05] (20s)
**Screen:** Click **"Taka Plan"** in the top navigation.

- **Visual Action:**
  1. Click quick prompt: *"আমি ৬ মাসে ৳৫০,০০০ জমাতে চাই"*.
  2. The assistant responds with a transparent cash-flow evaluation showing Surplus: ৳12,000, Feasibility Assessment, and 2 practical trade-off options.
  3. Point to the Responsible AI note: *"Non-manipulative educational estimate. No product upsells."*
- **English Narration:**
  > "Under Track 03, Taka Plan acts as a financial health coach. It turns savings goals into realistic monthly targets, transparently showing cash-flow trade-offs without manipulative spending nudges."
- **Bangla Narration:**
  > "ট্র্যাক ০৩-এর আওতায় টাকা প্ল্যান গ্রাহকের লক্ষ্য অনুযায়ী সঞ্চয়ের বাস্তবসম্মত পরিকল্পনা তৈরি করে এবং কোনো কৃত্রিম প্রলোভন ছাড়া খরচের সমন্বয় দেখায়।"

---

### Segment 5: Fraud Operations Console & Mule Graph [2:05 – 2:40] (35s)
**Screen:** Click **"Fraud Ops Console"** in the top navigation or Demo Bar **"4. Mule Ring"**.

- **Visual Action:**
  1. Click **"Fraud Ops Console"**.
  2. View the risk queue sorted by risk score and review capacity.
  3. Click on Case `#CASE-2026-9901` (Wallet `cust_mule_04_unseen`).
  4. Expand the **3-Question Case Card**:
     - *What happened:* 4 victims deposited ৳2,505,408 across 246 repetitive transfers into a personal wallet.
     - *Why it is risky:* Classic fan-in pooling pattern with extreme concentration and velocity.
     - *What upay should do now:* Place temporary hold on cash-out channels and escalate to compliance.
  5. Scroll to the **Mule Network Ego-Graph**: hover over the purple mule node and red victim nodes.
  6. Click **"Confirm Fraud"** button $\rightarrow$ Observe live telemetry update and append to the tamper-evident audit log.
- **English Narration:**
  > "For Upay's fraud analysts, TakaBondhu answers the three crucial questions: What happened? Why is it risky? And what should Upay do next? The interactive transaction graph exposes the entire mule ring in seconds, saving analysts over 40 hours every month."
- **Bangla Narration:**
  > "উপায় অ্যানালিস্টদের জন্য টাকাবন্ধু তিনটি মৌলিক প্রশ্নের উত্তর দেয়: কী ঘটেছে, কেন এটি ঝুঁকিপূর্ণ এবং উপায়ের পরবর্তী পদক্ষেপ কী হওয়া উচিত। সাথে রয়েছে মানি-মিউল নেটওয়ার্কের স্পষ্ট ভিজ্যুয়ালাইজেশন।"

---

### Segment 6: Business Impact & Executive Closing [2:40 – 3:00] (20s)
**Screen:** Click **"Impact Simulator"** in navigation.

- **Visual Action:**
  1. Scroll through the Impact Simulator showing:
     - **Net Benefit per 100k Transactions:** `৳20.8 Lakh ($17.4k USD)` (illustrative, assumption-driven after program costs).
     - **Analyst Hours Saved:** `239.6 hours per 100k txns` (75% faster triage).
     - **Test Set Recall:** `98.32%` at `0.41%` False Positive Rate.
  2. Slide the parameters to show dynamic live recalculation.
- **English Narration:**
  > "TakaBondhu delivers quantifiable economics: ৳20.8 Lakh net economic benefit per 100,000 transactions, over 75% analyst investigation time saved, and a believable path to production. TakaBondhu: Upay's friend that keeps your money safe."
- **Bangla Narration:**
  > "প্রতি ১ লক্ষ লেনদেনে প্রায় ২১ লক্ষ টাকার সার্বিক নেট আর্থিক সুরক্ষা এবং ৭৫% দ্রুততম ইনভেস্টিগেশন সুবিধা নিয়ে টাকাবন্ধু উপায়ের জন্য একটি টেকসই ও বিশ্বাসযোগ্য সমাধান। ধন্যবাদ!"

---

## Key Numbers Cheat Sheet (Read Directly From Screen)
- **Message Latency:** $0.65\text{ ms}$ (p50)
- **Transaction PR-AUC:** $0.9804$ (temporal holdout, Days 61–90, N=58,345)
- **Held-Out Test Recall:** $98.32\%$
- **Benign False Positive Rate:** $0.41\%$
- **Language Max FPR Disparity:** $1.68\%$ (Bengali: $1.68\%$, Banglish/English: $0.00\%$)
- **Unit Economic Return:** ৳20.8 Lakh ($17,362 USD) net benefit per 100k transactions
- **Triage Efficiency:** 18 mins $\rightarrow$ 4.5 mins per case card (75% faster)
