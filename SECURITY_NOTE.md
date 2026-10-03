# 🔒 Critical Security Notice: API Key Rotation Required

> **Urgent Action Required for Repository Maintainer**

A previous zip archive or workspace export containing `backend/.env` with active credentials was previously shared. 

In accordance with security best practices and cybersecurity guidelines, **all keys that were previously defined in `.env` must be revoked and rotated immediately**:

1. **Google Gemini API Key (`GEMINI_API_KEY` / `GOOGLE_API_KEY`):**
   - Visit [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
   - Revoke the existing key(s)
   - Generate a new key and update your local `backend/.env`

2. **Supabase Credentials (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`):**
   - Visit your [Supabase Dashboard](https://supabase.com/dashboard) -> Project Settings -> API
   - Rotate project API keys and service role secret

3. **LiveKit Cloud Credentials (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`):**
   - Visit [LiveKit Cloud Console](https://cloud.livekit.io) -> Project Settings -> Keys
   - Delete previously exposed API keys and generate new credentials

### Safeguards Implemented in Repository
- `backend/.env` is strictly gitignored in both root `.gitignore` and `backend/.gitignore`.
- Automated pre-commit & doctor scanner `scripts/check-secrets.mjs` scans all tracked files for exposed keys and secrets.
- Automated clean export script `scripts/export-clean.mjs` guarantees any future zip or export excludes `.env`, `node_modules`, `.venv`, and temporary build artifacts.
- The entire TakaBondhu platform runs deterministically in **100% offline Demo Mode** (`DEMO_OFFLINE=true`), allowing evaluations and demonstrations without active cloud API keys.
