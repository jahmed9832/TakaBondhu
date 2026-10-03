# 🎙️ LiveKit Realtime Voice AI Setup Guide (Phase 4)

This guide walks you through configuring and running the **LiveKit Realtime Voice AI** for TakaBondhu.

---

## 1. Create a LiveKit Cloud Project

1. Visit [LiveKit Cloud](https://cloud.livekit.io/) and create an account or sign in with GitHub / Google.
2. Click **Create Project** and name it (e.g. `takabondhu-live`).
3. Select your preferred cloud region (e.g., Singapore or US).
4. Once created, navigate to **Project Settings** -> **Keys**.

---

## 2. Retrieve Your LiveKit Credentials

Under **Project Settings -> Keys**, you will find:
- **WebSocket URL**: e.g., `wss://takabondhu-live-xxxxxx.livekit.cloud`
- **API Key**: e.g., `APIxxxxxxxxxxxx`
- **API Secret**: e.g., `secretxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

> **Note on Windows Security / LiveKit CLI (`lk.exe`):**
> You do **NOT** need the LiveKit CLI binary (`lk.exe`) or `lk cloud auth`.
> Our voice agent runs 100% on Node.js using the `@livekit/agents` package and authenticates directly using the three environment variables above.

---

## 3. Configure Backend Environment Variables

Open `backend/.env` (do **not** commit this file to Git):

```env
# Existing credentials
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000

# Supabase pgvector RAG (already configured)
SUPABASE_URL=https://ptznbkjjnekuqfwunufp.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# ==========================================
# Phase 4: LiveKit Cloud Configuration
# ==========================================
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Google Gemini API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here

# Gemini Realtime Live Voice Model:
GEMINI_VOICE_MODEL=gemini-3.1-flash-live-preview
```

*(Note: Never share these credentials publicly or in chat).*

---

## 4. How the Multi-Tier Voice Architecture Works

```
Browser Microphone
       │
       ▼ (WebRTC Audio)
LiveKit Cloud Room
       │
       ▼
LiveKit Voice Agent Worker (Node.js)
       │
       ├── Google Gemini Realtime Model (Native Audio In/Out, Bangla Language)
       │
       └── scamTool: "analyze_scam_situation"
               ├── Tier 1: Deterministic Rule Engine (Verbatim Evidence Extraction)
               └── RAG Layer: Supabase pgvector Similarity Search (TakaBondhu Knowledge Base)
       │
       ▼ (Synthesized Spoken Bangla)
Browser Speaker
```

1. **Browser Microphone**: Captures user voice in Bangla (or English).
2. **LiveKit Cloud Room**: Low-latency global WebRTC audio pipeline.
3. **Voice Agent Worker**: Node.js worker running `@livekit/agents` + `@livekit/agents-plugin-google`.
4. **Scam Shield Intelligence**: Whenever a financial situation or suspicious call is described, the agent invokes `analyze_scam_situation` which calls:
   - **Deterministic Rule Engine**: Verifies urgency pressure, account threats, payment requests, OTP harvesting.
   - **Supabase pgvector RAG**: Retrieves matching safety guidelines from the 9 financial threat categories.
5. **Realtime Spoken Response**: Gemini speaks concise, empathetic, defensive financial guidance in Bangla directly through the browser speaker.

---

## 5. How to Start the Services

### Step 1: Start Backend & Frontend
From the root directory:
```bash
npm run dev
```
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`

### Step 2: Start the LiveKit Voice Agent Worker
In a new terminal window:
```bash
npm run voice-agent
```
or from the `backend/` directory:
```bash
cd backend
npm run voice-agent
```

You will see:
```text
LiveKit Agents CLI
Connecting voice agent worker...
```

---

## 6. How to Test the Voice Assistant

1. Open `http://localhost:5173` in Chrome or Edge.
2. In the top navigation bar or the Analyzer section, click **🎙️ Live Voice**.
3. Click the **Start Live Voice** button.
4. When prompted by the browser, click **Allow** for microphone access.
5. Once connected, you will hear the assistant's initial Bangla greeting:
   > *"আসসালামু আলাইকুম! আমি TakaBondhu-র Voice AI Assistant। কোনো আর্থিক মেসেজ বা সন্দেহজনক ফোন কল নিয়ে সন্দেহ হলে আমাকে বলুন, আমি নিরাপদ পরবর্তী পদক্ষেপ নিতে সাহায্য করব।"*
6. Speak your situation in Bangla, for example:
   - *"একজন আমাকে ফোন করে বলছে আমার বিকাশ অ্যাকাউন্ট বন্ধ হয়ে যাবে, এখনই ৫০০০ টাকা পাঠাতে হবে।"*
   - *"আমাকে একজন ফোন করে ওটিপি চাইছে ভেরিফিকেশনের জন্য।"*
7. Watch the audio orb oscillate while the AI listens, evaluates the threat signals against the Rule Engine and RAG knowledge base, and speaks back reassuring, actionable safety advice in Bangla.

---

## 7. Graceful Fallback Behavior

- **If LiveKit is unconfigured**: The UI clearly displays a friendly banner explaining that credentials are missing in `backend/.env`. The text analyzer remains 100% operational.
- **If RAG is temporarily unavailable**: The voice agent continues functioning using the Deterministic Rule Engine and Gemini intelligence, noting in logs and status that RAG was bypassed.
- **If microphone permission is denied**: The UI displays a warning guiding the user to enable permissions in browser settings without crashing.
