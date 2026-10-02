import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHybridScore, getRiskLevel, generateCaseCard, SCORING_CONFIG } from '../scoring.js';

test('Scoring - computes exact weighted blend when ML is available', () => {
  const rulesResult = { rulesScore: 80, rawSignals: [{ type: 'TEST', weight: 20 }] };
  const mlResult = { status: 'ok', probability: 0.90, scam_type: 'fake_agent', reason_codes: [] };
  
  // Rules = 80, ML = 90
  // Blend = 0.40 * 80 + 0.60 * 90 = 32 + 54 = 86
  const hybrid = computeHybridScore({ rulesResult, mlResult, llmAdjustment: 0 });
  
  assert.equal(hybrid.finalScore, 86);
  assert.equal(hybrid.riskLevel, 'CRITICAL');
  assert.equal(hybrid.ml.status, 'active');
  assert.equal(hybrid.scoring.rules_score, 80);
  assert.equal(hybrid.scoring.ml_score, 90);
});

test('Scoring - falls back gracefully to rules-only when ML is unavailable', () => {
  const rulesResult = { rulesScore: 65, rawSignals: [] };
  const mlResult = { status: 'unavailable' };

  const hybrid = computeHybridScore({ rulesResult, mlResult, llmAdjustment: 0 });

  assert.equal(hybrid.finalScore, 65);
  assert.equal(hybrid.riskLevel, 'HIGH');
  assert.equal(hybrid.ml.status, 'unavailable');
  assert.equal(hybrid.scoring.rules_weight, 1.0);
  assert.equal(hybrid.scoring.ml_weight, 0.0);
});

test('Scoring - clamps LLM adjustment strictly between -10 and +10', () => {
  const rulesResult = { rulesScore: 50, rawSignals: [] };
  const mlResult = { status: 'ok', probability: 0.50 }; // base = 50

  // Massive positive adjustment attempt (+100) -> clamped to +10 (final 60)
  const highClamp = computeHybridScore({ rulesResult, mlResult, llmAdjustment: 100 });
  assert.equal(highClamp.finalScore, 60);
  assert.equal(highClamp.scoring.llm_adjustment, 10);

  // Massive negative adjustment attempt (-100) -> clamped to -10 (final 40)
  const lowClamp = computeHybridScore({ rulesResult, mlResult, llmAdjustment: -100 });
  assert.equal(lowClamp.finalScore, 40);
  assert.equal(lowClamp.scoring.llm_adjustment, -10);
});

test('Scoring - triggers needs_human_review on divergence and discrepancies', () => {
  // Case 1: Large divergence between Rules and ML (>= 50 pts)
  const divRules = { rulesScore: 10, rawSignals: [] };
  const divML = { status: 'ok', probability: 0.80 }; // diff = |10 - 80| = 70 >= 50
  const divHybrid = computeHybridScore({ rulesResult: divRules, mlResult: divML });
  assert.equal(divHybrid.needsHumanReview, true);

  // Case 2: LLM claims scam, but score < T (50)
  const lowScoreRules = { rulesScore: 30, rawSignals: [] };
  const lowScoreML = { status: 'ok', probability: 0.30 };
  const llmScamHybrid = computeHybridScore({
    rulesResult: lowScoreRules,
    mlResult: lowScoreML,
    llmIsScam: true
  });
  assert.equal(llmScamHybrid.needsHumanReview, true);

  // Case 3: LLM claims benign, but score >= T + 15 (65)
  const highScoreRules = { rulesScore: 75, rawSignals: [] };
  const highScoreML = { status: 'ok', probability: 0.75 };
  const llmBenignHybrid = computeHybridScore({
    rulesResult: highScoreRules,
    mlResult: highScoreML,
    llmIsScam: false
  });
  assert.equal(llmBenignHybrid.needsHumanReview, true);
});

test('Scoring - generates Track 01 case card with the three required answers', () => {
  const rules = { rulesScore: 70, rawSignals: [{ type: 'URGENCY_PRESSURE', verbatimSnippet: 'within 2 hours' }] };
  const card = generateCaseCard({
    finalScore: 75,
    riskLevel: 'HIGH',
    scamType: 'fake_account_block',
    rulesResult: rules,
    needsReview: true
  });

  assert.ok(card.what_happened, 'Case card must answer what happened');
  assert.ok(card.why_risky, 'Case card must answer why risky');
  assert.ok(card.upay_action, 'Case card must answer what upay should do');
  assert.equal(card.human_review_required, true);
});
