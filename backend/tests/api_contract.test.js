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
