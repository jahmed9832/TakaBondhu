# 🛡️ TAKABACHAO — "Protect. Save. Plan."

> **Your AI companion for safer financial decisions.**  
> *Two-Feature Fintech Intelligence: Scam Shield (Multi-Tier Fraud Prevention) & Savings Guide (Conversational Financial Planning)*

![TakaBachao Banner](https://img.shields.io/badge/Product-TAKABACHAO-06b6d4?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Rule%20Engine%20%7C%20pgvector%20RAG%20%7C%20Gemini%20AI%20%7C%20LiveKit-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/API%20Key-Server--Side%20Only-emerald?style=for-the-badge)

---

## 🌟 1. Product Overview

**TakaBachao** is an AI-powered financial decision-support and fraud defense platform built to safeguard everyday individuals and families before they transfer money, share credentials, or make critical financial decisions.

### Product Hierarchy & Features

```
TAKABACHAO (Product)
├── 1. SCAM SHIELD (Feature)
│   ├── Deterministic Rule Engine (Verbatim Evidence Extraction)
│   ├── Supabase pgvector RAG (9 Authoritative Financial Safety Categories)
│   ├── Contextual Semantic Understanding (Google Gemini AI)
│   └── LiveKit Realtime Voice AI (Spoken Bangla Assistant)
│
└── 2. SAVINGS GUIDE (Feature)
    ├── Deterministic Financial Arithmetic (Affordability & Surplus Engine)
    ├── Multi-Turn Conversational Memory (Server-Side Session State)
    └── Conversational Financial Coach (Google Gemini AI)
```

---

## 🏛️ 2. Scam Shield Architecture

```
USER MESSAGE / VOICE AUDIO
    ↓
TIER 1: DETERMINISTIC RULE ENGINE
    ↓ (Objective Signals + Verbatim Evidence + Base Score)
RAG LAYER: SUPABASE PGVECTOR KNOWLEDGE BASE
    ↓ (Retrieved Top Safety Guidelines from 9 Categories)
TIER 2: GOOGLE GEMINI AI
    ↓ (Contextual Semantic Validation & Actionable Safe Guidance)
LIVE VOICE / BROWSER SPEAKER
```

### Why a Multi-Tier Architecture?
1. **Evidence Grounding:** Tier 1 extracts **exact verbatim excerpts** from the user's message (e.g., `"within 2 hours"`, `"Send ৳500"`). Gemini AI is strictly forbidden from hallucinating or inventing evidence.
2. **Contextual Semantic Understanding:** Gemini evaluates the conversational intent so it does not blindly trigger on keywords:
   - **Safe Advice Example:** *"Never share your OTP with anyone. Customer support will never ask for it."*  
     Contains "OTP" and "customer support", but Gemini recognizes this as **defensive advice**, rejects the harvesting signal, and assigns `LOW RISK`.
   - **Actual Attack Example:** *"Tell me the OTP you just received so I can verify your account."*  
     Gemini recognizes this as an **active credential harvesting attempt**, validates the signal, and assigns `HIGH/CRITICAL RISK`.
3. **Authoritative RAG Retrieval:** Supabase pgvector retrieves trusted safety documents across 9 pre-computed categories (bKash/Nagad account security, lottery fee scams, impersonation threats, etc.).
4. **Realtime Spoken Bangla Voice:** Powered by LiveKit Cloud WebRTC and Gemini Live, allowing users to speak naturally in Bangla and hear instant voice guidance.
5. **Fault Tolerance:** If `GEMINI_API_KEY` is not provided or API quota is exceeded, TakaBachao gracefully falls back to the deterministic engine without crashing.

---

## 💰 3. Savings Guide Architecture

The **Savings Guide** provides interactive, educational financial planning:
1. **Structured State Tracking:** Server-side session store tracks `income`, `expenses`, `commitments`, and `monthlySavingsGoal`.
2. **Deterministic Arithmetic:** Exact surplus (`income - expenses - commitments`) and goal feasibility are calculated with 100% mathematical certainty.
3. **Multi-Turn Context:** Gemini receives the complete conversation history and authoritative state, preventing repetitive questions and handling clarifications (e.g., *"same"*, Bengali numbers like *"২০ হাজার"*).

---

## ⚡ 4. Quick Start

### Prerequisites
- Node.js (v18 or newer recommended)

### One-Command Setup & Launch
Open your terminal in the project root folder:

```bash
# 1. Install all dependencies (Root, Backend, and Frontend)
npm run install:all

# 2. Launch both Backend & Frontend simultaneously
npm run dev
```

The terminal will launch:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Start the LiveKit Voice Agent (Optional)
```bash
npm run voice-agent
```

---

## 🔑 5. Environment Variables Configuration

In [`backend/.env`](file:///d:/Professional/hackathon/ScamSheild/backend/.env):

```env
# Gemini API Key (Required for Contextual AI & Savings Guide)
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000

# LiveKit Voice AI (Optional for Live Voice Assistant)
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Supabase pgvector RAG (Pre-configured)
SUPABASE_URL=https://ptznbkjjnekuqfwunufp.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

> **Zero Client-Side Exposure:** All API keys and secrets remain strictly on the backend. No secret credentials are ever sent to the browser or bundle.

---

## 🧪 6. Verification Tests

### Test 1: Scam Shield Fake Suspension Attack
- **Message:** `"URGENT NOTICE: Your bank account has been flagged for suspicious activity and will be permanently BLOCKED within 2 hours. Send ৳500 immediately to verify your identity: https://secure-bank-verify.xyz/login"`
- **Result:** `98/100 CRITICAL RISK`
- **Signals Detected:** Urgency Pressure, Account Threat, Payment Request, Suspicious Link, Authority Impersonation.

### Test 2: Safe OTP Hygiene Advice
- **Message:** `"Never share your OTP with anyone. Customer support will never ask for it."`
- **Result:** `LOW RISK` (10/100). Gemini clears the false-alarm harvesting signal.

### Test 3: Savings Guide Multi-Turn Conversation
- **Turn 1:** *"আমি প্রতি মাসে ৫০০০ টাকা save করতে চাই"* → Target registered: ৳5,000. Next asks for monthly income.
- **Turn 2:** *"20000"* → Income registered: ৳20,000. Next asks for monthly expenses.
- **Turn 3:** *"12000"* → Expenses registered: ৳12,000. Next asks for commitments.
- **Turn 4:** *"নেই"* → Commitments: ৳0. Shows feasible breakdown (Surplus: ৳8,000 > Planned: ৳5,000).
