# 🚀 TakaBondhu Live Deployment Guide

This guide provides the exact, copy-paste steps to deploy TakaBondhu to a publicly accessible live URL as required by the hackathon submission guidelines.

---

## 🎯 Primary Recommendation: Render.com (Docker Free Tier)

Render provides a 100% free web service tier that natively supports Docker containers and reads [`render.yaml`](../render.yaml) automatically.

### Step 1: Create or Log in to Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com).
2. Log in using your GitHub account (`jahmed9832`).

### Step 2: Create New Web Service
1. Click **"New +"** in the top right, then select **"Web Service"**.
2. Under "Connect a repository", select or search for:
   ```text
   jahmed9832/TakaBondhu
   ```
   *(If not visible, click "Configure account" to grant Render access to the repository).*
3. Click **"Connect"**.

### Step 3: Configure Service Parameters
Configure the settings as follows:
- **Name:** `takabondhu` (or `takabondhu-upay`)
- **Region:** `Oregon (US West)` or `Singapore`
- **Branch:** `main`
- **Root Directory:** *(leave blank / default root)*
- **Runtime:** `Docker`
- **Instance Type:** `Free` (0.5 CPU, 512 MB RAM)

### Step 4: Environment Variables
Scroll to the **Environment Variables** section and configure:

| Key | Value | Description |
|:---|:---|:---|
| `DEMO_OFFLINE` | `true` | **Recommended.** Enables deterministic hybrid scoring with local ML microservice, preventing external API quota failures. |
| `GEMINI_API_KEY` | *(your key)* | **Optional.** Enables Google Gemini contextual reasoning and conversational voice synthesis. |
| `VOICE_USE_GEMINI` | `true` | **Default: true.** When `GEMINI_API_KEY` is provided, voice chat uses Gemini for natural spoken replies even with `DEMO_OFFLINE=true`! Scoring/decisions remain 100% deterministic. |
| `NODE_ENV` | `production` | Optimizes Express and React asset delivery. |
| `PORT` | `10000` | Render standard application port (passed dynamically). |

*(Note: Setting `GEMINI_API_KEY` and `VOICE_USE_GEMINI=true` on Render provides natural voice chat while preserving deterministic safety decisions. If Gemini times out or is offline, the rebuilt deterministic offline fallback seamlessly answers using rule engine + ML + local safety knowledge).*

### Step 5: Health Check Path
- Under **Advanced**, find **Health Check Path** and set it to:
  ```text
  /health
  ```

### Step 6: Deploy & Verify
1. Click **"Create Web Service"**.
2. Render will trigger the build using the multi-stage [`Dockerfile`](../Dockerfile):
   - Builds Vite frontend assets into `frontend/dist/`.
   - Installs Python 3.11 ML dependencies (`scikit-learn`, `lightgbm`, `fastapi`, etc.).
   - Starts FastAPI ML service on internal port `8001`.
   - Starts Express server on `$PORT` serving both APIs and the frontend UI.
3. Once the build completes and logs display `✓ ML Microservice is active`, Render will output your live URL:
   ```text
   https://takabondhu.onrender.com
   ```
4. Test the health endpoint in your browser or curl:
   ```bash
   curl https://takabondhu.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "TakaBondhu Backend API",
     "ruleEngine": "active",
     "mlService": "active",
     "demoOffline": true
   }
   ```

---

## 🥈 Alternative Option A: Railway.app

If Render free slots are congested or slow:
1. Go to [https://railway.com](https://railway.com) and log in with GitHub.
2. Click **"New Project"** -> **"Deploy from GitHub repo"** -> select `jahmed9832/TakaBondhu`.
3. Railway automatically detects `Dockerfile`.
4. In **Variables**, add:
   - `DEMO_OFFLINE=true`
   - `NODE_ENV=production`
5. In **Settings** -> **Networking**, click **"Generate Domain"**.
6. Railway will assign an instant live URL like `https://takabondhu-production.up.railway.app`.

---

## 🥉 Alternative Option B: Hugging Face Spaces (Docker Space)

Hugging Face provides free 2 vCPU / 16GB RAM Docker spaces:
1. Go to [https://huggingface.co/spaces](https://huggingface.co/spaces) -> **"Create new Space"**.
2. Name: `takabondhu`
3. Space SDK: **Docker** (Blank)
4. License: Apache 2.0 or MIT
5. Push the repo to Hugging Face or connect via GitHub Actions.
6. The container will automatically serve the UI and ML backend on port 7860.

---

## 🐳 Local Container Testing with Docker Compose

To test the entire production container stack locally on your computer with a single command:

```bash
# Build and start container
docker compose up --build

# In detached mode (background):
docker compose up -d --build
```

- **App & Frontend:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)
- **Container Name:** `takabondhu-core`
- **To stop:** `docker compose down`

---

## 🌐 Deploy Frontend to Vercel (Step-by-Step)

You can easily deploy the frontend to Vercel and connect it to your deployed Render or Railway backend.

### Step 1: Push Project to GitHub
Ensure your repository is pushed to GitHub:
```bash
git add .
git commit -m "feat: complete production ready build"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** -> **"Project"**.
3. Select your repository `jahmed9832/TakaBondhu` and click **"Import"**.

### Step 3: Configure Project Settings in Vercel
- **Framework Preset:** `Vite`
- **Root Directory:** Click "Edit" and select `frontend` (or leave as root; the included `vercel.json` handles both!).
- **Build Command:** `npm run build` (automatic)
- **Output Directory:** `dist` (automatic)

### Step 4: Add Environment Variables in Vercel
In the **Environment Variables** panel, add:
| Key | Value | Purpose |
|:---|:---|:---|
| `VITE_API_BASE` | `https://takabondhu.onrender.com` | URL of your deployed backend on Render (or Railway). Replace with your actual backend URL. |

*(Note: During initial frontend launch, if your backend is not yet deployed, the frontend will automatically use its built-in offline demo engine and fallback gracefully!)*

### Step 5: Click Deploy
Click **"Deploy"**. Vercel will build and deploy the React 19 + Vite frontend in ~30 seconds, providing you with a live URL like:
`https://takabondhu.vercel.app`

---

## ☁️ Backend Deployment on Google Cloud Run (Alternative)

If you prefer Google Cloud Run:
```bash
# Build and submit container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/takabondhu

# Deploy to Cloud Run
gcloud run deploy takabondhu \
  --image gcr.io/YOUR_PROJECT_ID/takabondhu \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 5000 \
  --set-env-vars="DEMO_OFFLINE=true,NODE_ENV=production"
```

---

---

## 🎙️ Voice Architecture: Browser Voice & Optional Realtime Worker

TakaBondhu provides a dual-tier voice architecture engineered specifically for resilient live deployments:

### Tier 1: Autonomous Browser Voice (Default & Universal)
- **Zero Heavy Server RAM Footprint:** Runs seamlessly within Render's 512 MB free container without worker bloat.
- **Conversational Spoken AI:** Uses `POST /api/voice/chat` + native audio streaming (`GET /api/voice/tts`).
- **Gemini Voice on Render:** When `GEMINI_API_KEY` is set and `VOICE_USE_GEMINI=true`, voice chat uses Gemini to generate natural, conversational spoken responses even if `DEMO_OFFLINE=true`. Scoring remains 100% deterministic.
- **Rebuilt Offline Fallback:** If Gemini is unavailable, voice chat runs the full real pipeline (rules + ML) and retrieves curated safety tips from `knowledgeBase.js`, guaranteeing accurate, non-repetitive answers without robotic score jargon.
- **Speech Recognition & Fallback:** Web Speech API (`bn-BD` / `en-US`) with on-screen transcription and confirmation for short/low-confidence utterances, plus an integrated typing fallback for unsupported browsers.

### Tier 2: Realtime LiveKit AI Worker (Optional / Laptop-Only)
> **Note:** The LiveKit realtime worker (`npm run voice-agent`) is **strictly optional and laptop-only**. It is designed for live video demonstration from a development machine. It does **NOT** run inside Render's 512 MB container, keeping the live cloud deployment fast, lightweight, and rock-solid.

#### How to run the optional LiveKit Voice Worker on your laptop for video demo:
1. Ensure your `backend/.env` has:
   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   GEMINI_API_KEY=your_google_ai_key
   ```
2. Configure the exact same `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in your Render Web Service Environment Variables.
3. On your laptop, open a terminal and run:
   ```bash
   npm run voice-agent
   ```
4. The worker connects to your LiveKit cloud project and registers with identity `takabondhu-voice`.
5. Open your live website: `GET /api/voice/status` will report `{ realtime: true }`, unlocking the optional LiveKit Realtime voice path!
6. If the worker is offline, the site automatically uses **Browser Voice** with a transparent, friendly notice.

#### Hosting the worker on a dedicated server (>= 1GB RAM):
- The worker includes a built-in lightweight HTTP health check endpoint on port `8089`:
  ```bash
  curl http://localhost:8089/health
  # Response: {"status":"ok","worker":"takabondhu-voice","uptime":123.4}
  ```

---

## 📋 Post-Deployment Checklist

After your live URL is active:
1. Open the URL in an incognito window.
2. Click through the 6 official hackathon demo scenarios in the top bar:
   - Scenario 1 (Fake Agent): Flags **CRITICAL (90/100)**.
   - Scenario 2 (OTP Harvest): Flags **CRITICAL (94/100)**.
   - Scenario 3 (ATO Transfer): Triggers **HOLD_FOR_REVIEW**.
   - Scenario 4 (Mule Network Ring): Shows ego-subgraph visualization.
   - Scenario 5 (Agent Structuring): Shows peer z-score distribution.
   - Scenario 6 (Benign Advisory): Confirms **LOW (10/100)**.
3. Verify Voice: Test the default Browser Voice mic or typing input.
4. Copy the live URL and update `LIVE_URL` in `README.md`.

