#!/bin/sh
set -e

echo "=================================================="
echo "🛡️ Starting TakaBondhu Production Container"
echo "=================================================="

# Memory optimization for 512MB RAM free-tier environments
export NODE_OPTIONS="--max-old-space-size=128"
export PYTHONOPTIMIZE=1
export MALLOC_ARENA_MAX=2

# 1. Start FastAPI ML Microservice on 127.0.0.1:8001 (single worker, low memory)
echo "1. Starting FastAPI ML Microservice on 127.0.0.1:8001..."
python -m uvicorn service:app --host 127.0.0.1 --port 8001 --app-dir ml --workers 1 &
ML_PID=$!

cleanup() {
  echo "Shutting down services..."
  kill -TERM "$ML_PID" 2>/dev/null || true
  if [ -n "$VOICE_PID" ]; then
    kill -TERM "$VOICE_PID" 2>/dev/null || true
  fi
  exit 0
}

trap cleanup INT TERM

# 2. Wait for ML service to become healthy
echo "2. Waiting for ML Microservice to initialize..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8001/health > /dev/null 2>&1; then
    echo "✓ ML Microservice is active."
    break
  fi
  sleep 1
done

# 3. Start LiveKit Voice Agent Worker (only if enabled via START_CONTAINER_VOICE=true)
VOICE_PID=""
if [ "$START_CONTAINER_VOICE" = "true" ] && [ -n "$LIVEKIT_URL" ] && [ -n "$LIVEKIT_API_KEY" ] && [ -n "$LIVEKIT_API_SECRET" ]; then
  echo "3. Starting Realtime LiveKit Voice Agent Worker (constrained memory mode)..."
  node --max-old-space-size=96 backend/voice-agent/agent.js start &
  VOICE_PID=$!
else
  echo "3. Container voice worker standby. (For live voice sessions, run 'npm run voice-agent' on laptop to preserve 512MB RAM)."
fi

# 4. Start Node.js Express Server on configured PORT
echo "4. Starting Node.js Express Server on port ${PORT:-5000}..."
node --max-old-space-size=160 backend/server.js &
NODE_PID=$!

wait "$NODE_PID"
cleanup
