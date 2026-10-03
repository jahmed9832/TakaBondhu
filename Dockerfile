# ==============================================================================
# Multi-stage Dockerfile for TakaBondhu (টাকাবন্ধু)
# Builds Vite frontend, installs Python ML + Node backend dependencies,
# and runs both services inside a unified container with human oversight invariants.
# ==============================================================================

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Runtime Environment (Python 3.11 + Node.js 20)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies, curl for health checks, and Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python ML dependencies
COPY ml/requirements.txt ./ml/requirements.txt
RUN pip install --no-cache-dir -r ml/requirements.txt

# Install Node Backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy application source code, models, and scripts
COPY ml/ ./ml/
COPY backend/ ./backend/
COPY impact/ ./impact/
COPY scripts/ ./scripts/
COPY package*.json ./

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /build/dist ./frontend/dist

# Default Environment Variables (DEMO_OFFLINE=true, PORT from env, ML service internal)
ENV NODE_ENV=production \
    DEMO_OFFLINE=true \
    PORT=5000 \
    ML_SERVICE_URL=http://127.0.0.1:8001 \
    PYTHONUNBUFFERED=1

EXPOSE 5000

# Ensure entrypoint is executable
RUN chmod +x ./scripts/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
