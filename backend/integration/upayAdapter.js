/**
 * Mock transaction feed and pre-send risk screening adapter for upay integration.
 * Demonstrates how an upay mobile app or core banking system hooks into ScamShield.
 */

import { runDeterministicRuleEngine } from '../ruleEngine.js';
import { predictScam } from '../mlClient.js';
import { computeHybridScore } from '../scoring.js';

export class UpayTransactionAdapter {
  constructor(options = {}) {
    this.partnerId = options.partnerId || 'upay-bd-sandbox';
    this.environment = options.environment || 'local';
  }

  /**
   * Screen a proposed transaction or SMS/chat text prior to dispatch.
   * @param {Object} payload
   * @param {string} payload.message_text - The text or transfer memo
   * @param {boolean} [payload.recipient_is_new=false] - Whether recipient is a first-time contact
   * @param {number} [payload.amount=0] - Transaction amount in BDT
   * @returns {Promise<{
   *   allowed: boolean,
   *   friction: 'none' | 'ask_user_confirm' | 'hold_for_human_review',
   *   risk_score: number,
   *   risk_level: string,
   *   case_card: Object,
   *   screening_id: string
   * }>}
   */
  async screenTransaction({ message_text = '', recipient_is_new = false, amount = 0 }) {
    const screeningId = 'scr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    
    // 1. Run deterministic rules
    const rules = runDeterministicRuleEngine(message_text);

    // 2. Call local ML service
    let ml = { status: 'unavailable' };
    try {
      ml = await predictScam(message_text);
    } catch {
      // Graceful fallback
    }

    // 3. Compute score
    const hybrid = computeHybridScore({
      rulesResult: rules,
      mlResult: ml,
      llmAdjustment: recipient_is_new ? 5 : 0 // Small contextual nudge for new unknown payees
    });

    // 4. Determine friction policy
    let friction = 'none';
    let allowed = true;

    if (hybrid.finalScore >= 80 || (hybrid.finalScore >= 60 && amount > 10000)) {
      friction = 'hold_for_human_review';
      allowed = false;
    } else if (hybrid.finalScore >= 50 || (hybrid.finalScore >= 35 && recipient_is_new)) {
      friction = 'ask_user_confirm';
      allowed = true;
    }

    return {
      screening_id: screeningId,
      partner_id: this.partnerId,
      allowed,
      friction,
      risk_score: hybrid.finalScore,
      risk_level: hybrid.riskLevel,
      needs_human_review: hybrid.needsHumanReview,
      scoring: hybrid.scoring,
      ml: hybrid.ml,
      case_card: hybrid.case_card,
      timestamp: new Date().toISOString()
    };
  }
}
