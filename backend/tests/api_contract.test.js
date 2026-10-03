import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHybridScore, SCORING_CONFIG, generateCaseCard } from '../scoring.js';
import { validateVerbatimEvidence, redactPII, SimpleLRUCache, hashText } from '../security.js';

test('API Contract - schema compliance for analyze response', () => {
  const mockRules = {
    rulesScore: 75,
    baseScore: 75,
    rawSignals: [{ type: 'Account Threat', points: 25, evidence: 'account will be blocked' }]
  };
  const mockML = {
    status: 'active',
    probability: 0.85,
    scam_type: 'kyc_block',
    reason_codes: [{ ngram: 'acc', value: 0.42 }],
    model_version: 'v1.0.0-char-wb-lr'
  };

  const hybrid = computeHybridScore({
    rulesResult: mockRules,
    mlResult: mockML,
    llmAdjustment: 3,
    llmIsScam: true
  });

  // Verify all required fields from Step 4 specification
  assert.equal(typeof hybrid.finalScore, 'number');
  assert.equal(typeof hybrid.riskLevel, 'string');
  assert.equal(typeof hybrid.needsHumanReview, 'boolean');

  // Verify ML block
  assert.ok(hybrid.ml, 'Response must have ml block');
  assert.equal(hybrid.ml.status, 'active');
  assert.equal(hybrid.ml.probability, 0.85);
  assert.equal(hybrid.ml.scam_type, 'kyc_block');
  assert.ok(Array.isArray(hybrid.ml.reason_codes));
  assert.equal(hybrid.ml.model_version, 'v1.0.0-char-wb-lr');

  // Verify Scoring block
  assert.ok(hybrid.scoring, 'Response must have scoring block');
  assert.equal(hybrid.scoring.rules_score, 75);
  assert.equal(hybrid.scoring.ml_score, 85);
  assert.equal(hybrid.scoring.threshold, 50);
  assert.equal(hybrid.scoring.llm_adjustment, 3);

  // Verify Case Card block
  assert.ok(hybrid.case_card, 'Response must have case_card');
  assert.ok(hybrid.case_card.what_happened);
  assert.ok(hybrid.case_card.why_risky);
  assert.ok(hybrid.case_card.upay_action);
});

test('API Contract - LLM output validator drops non-verbatim evidence', () => {
  const userInput = 'Please transfer 500 taka to my friend right now.';
  const llmCandidateEvidences = [
    '500 taka',            // verbatim match (keep)
    'right now',           // verbatim match (keep)
    'urgent police threat', // invented / hallucinated (DROP!)
    'NID verification fee'  // invented / hallucinated (DROP!)
  ];

  const validated = llmCandidateEvidences.filter(ev => validateVerbatimEvidence(ev, userInput));
  assert.deepEqual(validated, ['500 taka', 'right now']);
});

test('API Contract - LRU Cache stores and retrieves analysis by text hash', () => {
  const cache = new SimpleLRUCache(10, 1000);
  const text = 'Unique suspicious message for caching test';
  const h = hashText(text);

  cache.set(h, { riskScore: 88, riskLevel: 'CRITICAL' });
  const cached = cache.get(h);
  assert.ok(cached);
  assert.equal(cached.riskScore, 88);
  assert.equal(cached.riskLevel, 'CRITICAL');
});

test('Upay Core Adapter - Pre-send screening with soft friction & no autonomous block', async () => {
  const { UpayTransactionAdapter } = await import('../integration/upayAdapter.js');
  const adapter = new UpayTransactionAdapter();

  const screening = await adapter.screenPreSend({
    transaction: {
      amount: 15000,
      sender: '01811000001',
      receiver: '01811000002',
      type: 'send_money',
      is_new_recipient: 1
    },
    message: 'জরুরি! আপনার অ্যাকাউন্ট ব্লক হয়েছে, পিন ও ওটিপি পাঠান'
  });

  assert.ok(screening.trace_id);
  assert.equal(typeof screening.risk_score, 'number');
  assert.ok(['ALLOW', 'SOFT_FRICTION', 'HOLD_FOR_REVIEW'].includes(screening.decision_recommendation));
  assert.notEqual(screening.decision_recommendation, 'AUTO_BLOCK');
  assert.ok(screening.case_card);
  assert.ok(screening.case_card.what_happened);
  assert.ok(screening.case_card.why_risky);
  assert.ok(screening.case_card.what_upay_should_do || screening.case_card.upay_action);

  // Idempotency check
  const auth1 = adapter.validateCoreAuth({ 'x-idempotency-key': 'idem-test-key-001' });
  assert.equal(auth1.valid, true);
  const auth2 = adapter.validateCoreAuth({ 'x-idempotency-key': 'idem-test-key-001' });
  assert.equal(auth2.valid, false);
  assert.ok(auth2.error.includes('IDEMPOTENCY_REPLAY'));
});

test('Audit Log - Tamper-evident hash chaining and verification', async () => {
  const { recordAuditDecision, verifyAuditLogIntegrity } = await import('../auditLog.js');

  const entry = recordAuditDecision({
    decision_type: 'screen_transaction',
    trace_id: 'test-trace-123',
    risk_score: 82,
    recommendation: 'HOLD_FOR_REVIEW',
    metadata: { test: true }
  });

  assert.ok(entry.entry_hash);
  assert.ok(entry.prev_hash);

  const verification = verifyAuditLogIntegrity();
  assert.equal(verification.valid, true);
  assert.ok(verification.records_checked > 0);
});
