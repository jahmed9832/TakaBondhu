/**
 * Pure, unit-testable scoring module for TakaBachao / ScamShield.
 * Combines:
 * 1. Deterministic Rule Engine score (0-100)
 * 2. Calibrated ML probability (0-1) scaled to 0-100
 * 3. Bounded LLM advisory adjustment (strictly clamped to [-10, +10])
 *
 * Implements Track 01 requirements:
 * - The LLM NEVER sets or overrides the score.
 * - Human review flags on disagreement or high divergence.
 * - Generates deterministic case_card answering (1) what happened, (2) why risky, (3) what upay should do.
 */

export const SCORING_CONFIG = {
  WEIGHT_RULES: 0.40,
  WEIGHT_ML: 0.60,
  THRESHOLD: 50, // Operating threshold T = 0.50 -> 50/100
  LLM_ADJUSTMENT_CLAMP: 10,
  DISAGREEMENT_DIVERGENCE_PTS: 50
};

/**
 * Returns human-readable display band for a 0-100 risk score
 */
export function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

/**
 * Deterministically constructs the Track 01 Case Card.
 * Answers:
 * 1. what_happened
 * 2. why_risky
 * 3. upay_action (labeled as recommendation requiring human approval)
 */
export function generateCaseCard({
  scamType = 'unknown',
  rulesResult = {},
  mlResult = {},
  finalScore = 10,
  riskLevel = 'LOW',
  needsHumanReview = false
}) {
  const signals = rulesResult.rawSignals || [];
  const topEvidences = signals
    .filter(s => s.evidence)
    .map(s => `"${s.evidence}" (${s.type})`);

  // 1. What happened
  const scamTypeDescriptions = {
    fake_agent: 'Potential customer care / agent impersonation attempting credential or PIN extraction.',
    wrong_transfer: 'Claimed accidental wrong transfer with urgent request to refund money to an attacker account.',
    kyc_block: 'Urgent account suspension or NID block threat demanding immediate compliance.',
    fake_prize: 'Unsolicited lottery, raffle, or cashback announcement demanding upfront fee payment.',
    job_scam: 'Deceptive work-from-home or online task opportunity requiring advance registration deposit.',
    loan_app: 'Unverified collateral-free loan offer demanding advance clearance or stamp fees.',
    otp_harvest: 'Direct credential harvesting demanding 6-digit SMS verification code or wallet PIN.',
    remote_access: 'Remote assistance scam requesting installation of AnyDesk, TeamViewer, or QuickSupport.',
    bank_notification: 'Standard mobile financial services transaction confirmation.',
    otp_safety: 'Defensive cybersecurity awareness advisory regarding password/PIN confidentiality.',
    personal_chat: 'Informal personal money conversation or bill splitting.',
    innocent_keywords: 'Everyday communication with non-malicious financial terms.'
  };

  const detectedTactic = scamTypeDescriptions[scamType] ||
    (signals.length > 0 ? `Message contains ${signals.length} suspicious pattern(s).` : 'Standard message with no prominent scam patterns.');

  const what_happened = detectedTactic;

  // 2. Why it is risky
  let why_risky;
  if (finalScore >= 50) {
    const reasons = [];
    if (signals.length > 0) {
      reasons.push(`Triggered ${signals.length} deterministic security rule(s): ${signals.map(s => s.type).join(', ')}.`);
    }
    if (topEvidences.length > 0) {
      reasons.push(`Verbatim suspicious snippets: ${topEvidences.slice(0, 3).join('; ')}.`);
    }
    if (mlResult.status === 'active' && mlResult.probability) {
      reasons.push(`ML model predicts ${(mlResult.probability * 100).toFixed(1)}% fraud probability.`);
      if (Array.isArray(mlResult.reason_codes) && mlResult.reason_codes.length > 0) {
        const topTokens = mlResult.reason_codes.slice(0, 3).map(r => `"${r.ngram}"`).join(', ');
        reasons.push(`Top contributing deceptive character n-grams: ${topTokens}.`);
      }
    }
    why_risky = reasons.join(' ');
  } else {
    why_risky = 'No coercive demands, urgency pressure, or credential harvesting patterns identified. Routine vigilance advised.';
  }

  // 3. What upay should do now (Actionable recommendations for MFS / fraud ops)
  let upay_action;
  if (finalScore >= 80) {
    upay_action = 'RECOMMENDATION (Human Approval Required): Promptly display high-friction red warning banner to user; temporarily hold outgoing transfers to target number pending human fraud-ops review; flag target phone number across agent network.';
  } else if (finalScore >= 50) {
    upay_action = 'RECOMMENDATION (Human Approval Required): Display in-app confirmation modal warning user never to share OTP or refund unverified deposits; queue transaction for asynchronous fraud monitoring.';
  } else if (needsHumanReview) {
    upay_action = 'RECOMMENDATION (Human Review Required): Disagreement detected between ML and contextual evaluation; route case to level-1 analyst triage queue.';
  } else {
    upay_action = 'RECOMMENDATION: Allow standard transaction flow without added friction. Maintain standard telemetry.';
  }

  return {
    what_happened,
    why_risky,
    upay_action,
    human_oversight_required: finalScore >= 50 || needsHumanReview
  };
}

/**
 * Pure calculation of the hybrid score.
 *
 * @param {Object} params
 * @param {Object} params.rulesResult - Result from runDeterministicRuleEngine()
 * @param {Object} params.mlResult - Result from predictScam()
 * @param {number} [params.llmAdjustment=0] - Advisory adjustment from LLM (clamped [-10, 10])
 * @param {boolean|null} [params.llmIsScam=null] - Boolean verdict from LLM for human-review check
 * @returns {Object} Full scoring breakdown and decisions
 */
export function computeHybridScore({
  rulesResult = {},
  mlResult = {},
  llmAdjustment = 0,
  llmIsScam = null
}) {
  const rulesScore = typeof rulesResult.baseScore === 'number'
    ? Math.max(10, Math.min(98, rulesResult.baseScore))
    : 10;

  const mlAvailable = mlResult && mlResult.status === 'active' && typeof mlResult.probability === 'number';
  const mlProb = mlAvailable ? mlResult.probability : null;
  const mlScore = mlAvailable ? Math.round(mlProb * 100) : null;

  let baseScore;
  let weights;

  if (mlAvailable) {
    weights = {
      rules: SCORING_CONFIG.WEIGHT_RULES,
      ml: SCORING_CONFIG.WEIGHT_ML
    };
    baseScore = Math.round(
      (weights.rules * rulesScore) + (weights.ml * mlScore)
    );
  } else {
    // Fallback: rules only when ML service is offline
    weights = {
      rules: 1.0,
      ml: 0.0
    };
    baseScore = rulesScore;
  }

  // LLM adjustment strictly clamped to [-10, +10]
  const rawAdjustment = typeof llmAdjustment === 'number' ? llmAdjustment : 0;
  const clampedAdjustment = Math.max(
    -SCORING_CONFIG.LLM_ADJUSTMENT_CLAMP,
    Math.min(SCORING_CONFIG.LLM_ADJUSTMENT_CLAMP, Math.round(rawAdjustment))
  );

  const finalScore = Math.max(10, Math.min(98, baseScore + clampedAdjustment));
  const riskLevel = getRiskLevel(finalScore);
  const isFlagged = finalScore >= SCORING_CONFIG.THRESHOLD;

  // Track 01 Human Review Triggers:
  // 1. LLM says scam but score < T
  // 2. LLM says benign but score >= T + 15
  // 3. Rules and ML differ by >= 50 points
  let reviewReason = null;
  let needsHumanReview = false;

  if (llmIsScam === true && finalScore < SCORING_CONFIG.THRESHOLD) {
    needsHumanReview = true;
    reviewReason = `LLM flagged threat but algorithmic score (${finalScore}) is below threshold (${SCORING_CONFIG.THRESHOLD}).`;
  } else if (llmIsScam === false && finalScore >= (SCORING_CONFIG.THRESHOLD + 15)) {
    needsHumanReview = true;
    reviewReason = `LLM considers benign but algorithmic score (${finalScore}) indicates significant risk.`;
  } else if (mlAvailable && Math.abs(rulesScore - mlScore) >= SCORING_CONFIG.DISAGREEMENT_DIVERGENCE_PTS) {
    needsHumanReview = true;
    reviewReason = `High divergence between Rule Engine (${rulesScore}) and ML Model (${mlScore}).`;
  }

  // Determine scam_type (from ML head if available, otherwise from top rule signal)
  let scamType = 'unknown';
  if (mlResult && mlResult.scam_type && mlResult.scam_type !== 'unknown') {
    scamType = mlResult.scam_type;
  } else if (Array.isArray(rulesResult.rawSignals) && rulesResult.rawSignals.length > 0) {
    const topSig = rulesResult.rawSignals[0].type;
    const typeMap = {
      'Urgency Pressure': 'kyc_block',
      'Account Threat': 'kyc_block',
      'Payment Request': 'wrong_transfer',
      'Suspicious Link': 'fake_prize',
      'OTP Harvesting': 'otp_harvest',
      'Unsolicited Prize / Reward': 'fake_prize',
      'Authority Impersonation': 'fake_agent',
      'Emotional Manipulation': 'wrong_transfer'
    };
    scamType = typeMap[topSig] || 'unknown';
  }

  const caseCard = generateCaseCard({
    scamType,
    rulesResult,
    mlResult,
    finalScore,
    riskLevel,
    needsHumanReview
  });

  return {
    finalScore,
    riskLevel,
    isFlagged,
    needsHumanReview,
    reviewReason,
    scoring: {
      rules_score: rulesScore,
      ml_score: mlScore,
      base_blend: baseScore,
      weights,
      threshold: SCORING_CONFIG.THRESHOLD,
      llm_adjustment: clampedAdjustment,
      raw_llm_adjustment: rawAdjustment
    },
    ml: {
      status: mlAvailable ? 'active' : 'unavailable',
      probability: mlProb,
      scam_type: scamType,
      reason_codes: mlResult?.reason_codes || [],
      model_version: mlResult?.model_version || (mlAvailable ? 'v1.0.0-char-wb-lr' : 'none')
    },
    case_card: caseCard
  };
}
