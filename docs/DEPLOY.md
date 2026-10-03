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
| `DEMO_OFFLINE` | `true` | **Recommended.** Enables 100% offline deterministic fallback with local ML microservice. No external API keys needed! |
| `NODE_ENV` | `production` | Optimizes Express and React asset delivery. |
| `PORT` | `10000` | Render standard application port (passed dynamically). |

*(Optional: If you wish to enable online Google Gemini Live or LiveKit audio, you may add `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. However, `DEMO_OFFLINE=true` guarantees the hackathon demo operates reliably without external quota failures).*

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

## 🌐 Alternative Option C: Decoupled Frontend (Vercel / Netlify)

If you prefer to host the Vite frontend on Vercel/Netlify while hosting the backend on Render/Railway:
1. Deploy the backend Docker container on Render/Railway as described above.
2. In your Vercel or Netlify project settings for the frontend, add the environment variable:
   ```bash
   VITE_API_BASE=https://takabondhu.onrender.com
   ```
3. The frontend will automatically route all `/api/*` and `/v1/*` requests to your remote backend.

---

## 📋 Post-Deployment Checklist

After your live URL is active:
1. Open the URL in an incognito window.
2. Click through the 6 official hackathon demo scenarios in the top bar:
   - Scenario 1 (Fake Agent): Flags **CRITICAL (90/100)**.
   - Scenario 2 (OTP Harvest): Flags **CRITICAL (94/100)**.
   - Scenario 3 (ATO Transfer): Triggers **SOFT_FRICTION** reflection pause.
   - Scenario 4 (Mule Network Ring): Shows ego-subgraph visualization.
   - Scenario 5 (Agent Structuring): Shows peer z-score distribution.
   - Scenario 6 (Benign Advisory): Confirms **LOW (10/100)**.
3. Copy the live URL and update `LIVE_URL` in `README.md`.
