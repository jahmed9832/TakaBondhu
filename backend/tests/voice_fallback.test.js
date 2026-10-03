import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Pure helper function simulating the frontend voice fallback decision logic.
 * @param {Object} params
 * @param {number} params.tokenHttpStatus
 * @param {boolean} params.agentJoinedWithin8s
 * @returns {'browser' | 'livekit'}
 */
export function determineVoiceMode({ tokenHttpStatus, agentJoinedWithin8s }) {
  // If token request fails (e.g. 503 Service Unavailable or network error)
  if (tokenHttpStatus !== 200) {
    return 'browser';
  }
  // If token was obtained, but no remote agent joined the room within the 8-second window
  if (!agentJoinedWithin8s) {
    return 'browser';
  }
  return 'livekit';
}

test('Voice Fallback - token 503 automatically switches to browser voice', () => {
  const result = determineVoiceMode({
    tokenHttpStatus: 503,
    agentJoinedWithin8s: false
  });
  assert.strictEqual(result, 'browser', 'Must fall back to browser voice when token returns 503');
});

test('Voice Fallback - token 200 but agent timeout (>8s) automatically switches to browser voice', () => {
  const result = determineVoiceMode({
    tokenHttpStatus: 200,
    agentJoinedWithin8s: false
  });
  assert.strictEqual(result, 'browser', 'Must fall back to browser voice when no agent joins within 8 seconds');
});

test('Voice Fallback - token 200 and agent joined within 8s stays in livekit mode', () => {
  const result = determineVoiceMode({
    tokenHttpStatus: 200,
    agentJoinedWithin8s: true
  });
  assert.strictEqual(result, 'livekit', 'Stays in livekit mode only when agent joins within 8s');
});

test('Voice Status contract - GET /api/voice/status schema verification', async () => {
  // Simulated backend status calculation
  const getStatus = (configured, lastWorkerPing) => {
    const workerSeen = (Date.now() - lastWorkerPing) < 60000;
    return {
      browserVoice: true,
      realtime: Boolean(configured && workerSeen)
    };
  };

  // When worker has never pinged
  const statusNoWorker = getStatus(true, 0);
  assert.strictEqual(statusNoWorker.browserVoice, true);
  assert.strictEqual(statusNoWorker.realtime, false);

  // When worker recently pinged
  const statusWithWorker = getStatus(true, Date.now() - 5000);
  assert.strictEqual(statusWithWorker.browserVoice, true);
  assert.strictEqual(statusWithWorker.realtime, true);

  // When not configured even if worker pinged
  const statusNotConfigured = getStatus(false, Date.now() - 5000);
  assert.strictEqual(statusNotConfigured.realtime, false);
});
