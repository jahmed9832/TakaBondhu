#!/bin/sh
set -e

echo "=================================================="
echo "🛡️ Starting TakaBondhu Production Container"
echo "=================================================="

# 1. Start FastAPI ML Microservice on 127.0.0.1:8001
echo "1. Starting FastAPI ML Microservice on 127.0.0.1:8001..."
python -m uvicorn service:app --host 127.0.0.1 --port 8001 --app-dir ml &
ML_PID=$!

cleanup() {
  echo "Shutting down services..."
  kill -TERM "$ML_PID" 2>/dev/null || true
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

# 3. Start Node.js Express Server on configured PORT
echo "3. Starting Node.js Express Server on port ${PORT:-5000}..."
node backend/server.js &
NODE_PID=$!

wait "$NODE_PID"
cleanup
