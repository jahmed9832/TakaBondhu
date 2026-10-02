/**
 * Client for the local Python ML Microservice (FastAPI at 127.0.0.1:8001).
 * Features:
 * - 1500 ms timeout per attempt
 * - One fast retry on transient network errors
 * - Graceful fallback: returns { status: "unavailable" } without throwing
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
const TIMEOUT_MS = 1500;
const RETRY_DELAY_MS = 100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Sends a message to the ML service to get calibrated probability, scam_type, and reason codes.
 * @param {string} text - Message text to classify
 * @returns {Promise<{
 *   status: 'active' | 'unavailable',
 *   probability?: number,
 *   label_at_threshold?: number,
 *   scam_type?: string,
 *   reason_codes?: Array<{ ngram: string, contribution: number }>,
 *   model_version?: string,
 *   threshold?: number,
 *   error?: string
 * }>}
 */
export async function predictScam(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      status: 'unavailable',
      reason: 'Empty message'
    };
  }

  const endpoint = `${ML_SERVICE_URL}/v1/predict`;
  const body = JSON.stringify({ text: text.trim() });

  // Attempt 1 + 1 Fast Retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }, TIMEOUT_MS);

      if (res.ok) {
        const data = await res.json();
        return {
          status: 'active',
          probability: typeof data.probability === 'number' ? data.probability : 0.5,
          label_at_threshold: data.label_at_threshold ?? 0,
          scam_type: data.scam_type || 'unknown',
          reason_codes: Array.isArray(data.reason_codes) ? data.reason_codes : [],
          model_version: data.model_version || 'v1.0.0-char-wb-lr',
          threshold: data.threshold ?? 0.50
        };
      } else {
        console.warn(`[ML Client] Attempt ${attempt} returned HTTP ${res.status}`);
      }
    } catch (err) {
      if (attempt === 1) {
        await sleep(RETRY_DELAY_MS);
      } else {
        console.warn(`[ML Client] ML service unreachable at ${endpoint}:`, err.message);
      }
    }
  }

  // Graceful fallback when ML service is offline or timing out
  return {
    status: 'unavailable',
    reason: 'ML service offline or unreachable at 127.0.0.1:8001'
  };
}

/**
 * Health check for ML service
 */
export async function checkMLHealth() {
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/health`, {}, 1000);
    if (res.ok) {
      const data = await res.json();
      return {
        configured: true,
        status: data.loaded ? 'active' : 'unavailable',
        modelVersion: data.model_version || 'unknown',
        threshold: data.threshold ?? 0.50
      };
    }
  } catch {
    // Service offline
  }
  return {
    configured: false,
    status: 'unavailable',
    modelVersion: 'none',
    threshold: 0.50
  };
}
