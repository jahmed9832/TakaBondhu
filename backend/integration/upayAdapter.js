/**
 * backend/integration/upayAdapter.js
 * Upay Core Integration Adapter for TakaBondhu.
 * 
 * Provides:
 * 1. Mock Upay Core Banking Engine (wallets, balance checks, transaction execution)
 * 2. Pre-Send Screening Hook with soft friction & review triage
 * 3. Idempotency Key validation against double-spend/replay attacks
 * 4. Production Security Architecture & TODOs: mTLS mutual authentication, JWT token verification, HSM key signing
 */

import crypto from 'crypto';
import { runDeterministicRuleEngine } from '../ruleEngine.js';
import { predictScam, screenPreSendML } from '../mlClient.js';
import { computeHybridScore } from '../scoring.js';
import { recordAuditDecision } from '../auditLog.js';

export class UpayTransactionAdapter {
  constructor(options = {}) {
    this.partnerId = options.partnerId || 'upay-bd-sandbox';
    this.environment = options.environment || 'sandbox';
    
    // In-memory idempotency store (production: Redis with 24h TTL)
    this.seenIdempotencyKeys = new Map();

    // Mock Upay Core Customer Ledgers
    this.accounts = new Map([
      ['01811000001', { balance: 45000.0, name: 'Rahim Ahmed', tier: 'verified_kyc', device_id: 'dev_rahim_01' }],
      ['01811000002', { balance: 12500.0, name: 'Karim Ullah', tier: 'verified_kyc', device_id: 'dev_karim_01' }],
      ['01811000003', { balance: 2200.0, name: 'Fatema Begum', tier: 'basic_kyc', device_id: 'dev_fatema_01' }],
      ['agent_0001', { balance: 500000.0, name: 'Mirpur Upay Point', type: 'agent', district: 'Dhaka' }],
      ['agent_0002', { balance: 420000.0, name: 'Agrabad Cash Point', type: 'agent', district: 'Chittagong' }],
      ['merch_0001', { balance: 180000.0, name: 'Aarong Retail', type: 'merchant' }]
    ]);
  }

  /**
   * Production Security Verification Hook.
   * TODO: In production deployment with Upay Core:
   * 1. Validate incoming request mTLS client certificate signed by Upay Root CA.
   * 2. Verify JWT Bearer token signed by Upay Auth Server (RS256 with rotating JWKS).
   * 3. Validate HMAC-SHA256 request payload signature using Upay Core shared secret.
   */
  validateCoreAuth(headers = {}) {
    // In local sandbox: allow test tokens; require header in production
    const authHeader = headers['authorization'] || headers['Authorization'];
    const idempotencyKey = headers['x-idempotency-key'] || headers['X-Idempotency-Key'];

    if (idempotencyKey) {
      if (this.seenIdempotencyKeys.has(idempotencyKey)) {
        return {
          valid: false,
          error: 'IDEMPOTENCY_REPLAY: Duplicate X-Idempotency-Key detected. Request already processed.'
        };
      }
      this.seenIdempotencyKeys.set(idempotencyKey, Date.now());
    }

    return { valid: true, partnerId: this.partnerId };
  }

  /**
   * Pre-Send Transaction Screening Hook.
   * Invoked by Upay App before the PIN confirmation dialog is rendered.
   * 
   * @param {Object} payload
   * @param {Object} payload.transaction - Details of the proposed transaction
   * @param {string} [payload.message] - Optional accompanying text or SMS memo
   * @param {Object} [payload.session_context] - Device, IP, channel context
   * @returns {Promise<Object>} Screening verdict, soft friction instructions, and 3-part case card
   */
  async screenPreSend({ transaction, message = '', session_context = {} }) {
    const traceId = 'trace-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
    const startTime = Date.now();

    // 1. Try Python ML Microservice for full multi-signal fusion
    let screenResult = await screenPreSendML({
      transaction,
      message,
      session_context
    });

    // 2. If Python ML service is offline, fallback to deterministic local rules + local hybrid scoring
    if (!screenResult) {
      const rules = runDeterministicRuleEngine(message || '');
      let mlMsg = { status: 'unavailable' };
      try {
        mlMsg = await predictScam(message || '');
      } catch {
        // Fallback
      }

      const hybrid = computeHybridScore({
        rulesResult: rules,
        mlResult: mlMsg
      });

      const isHighAmt = (transaction.amount || 0) >= 15000;
      const isNewRecip = Boolean(transaction.is_new_recipient);
      let decision = 'ALLOW';
      if (hybrid.finalScore >= 70 || (hybrid.finalScore >= 50 && isHighAmt)) {
        decision = 'HOLD_FOR_REVIEW';
      } else if (hybrid.finalScore >= 40 || isNewRecip) {
        decision = 'SOFT_FRICTION';
      }

      screenResult = {
        risk_score: hybrid.finalScore,
        risk_level: hybrid.riskLevel,
        decision_recommendation: decision,
        requires_human_review: decision === 'HOLD_FOR_REVIEW',
        rule_trace: rules.rawSignals || [],
        ml_attributions: mlMsg.reason_codes || [],
        case_card: hybrid.case_card,
        model_versions: { gateway: 'v1.0.0-gateway-fallback' }
      };
    }

    const latencyMs = Date.now() - startTime;

    // 3. Record decision in tamper-evident append-only audit log
    recordAuditDecision({
      decision_type: 'screen_transaction',
      trace_id: traceId,
      risk_score: screenResult.risk_score,
      recommendation: screenResult.decision_recommendation,
      metadata: {
        amount: transaction.amount,
        sender_masked: String(transaction.sender || '').substring(0, 4) + '***',
        receiver_masked: String(transaction.receiver || '').substring(0, 4) + '***',
        type: transaction.type,
        latency_ms: latencyMs
      }
    });

    return {
      trace_id: traceId,
      latency_ms: latencyMs,
      ...screenResult
    };
  }

  /**
   * Executes a transaction in the mock Upay Core ledger.
   * Respects TakaBondhu screening recommendation.
   */
  async executeCoreTransfer({ sender, receiver, amount, type = 'send_money', screening_verdict }) {
    if (screening_verdict?.decision_recommendation === 'HOLD_FOR_REVIEW') {
      return {
        status: 'HELD_FOR_REVIEW',
        tx_id: null,
        message: 'Transaction held in triage queue pending Upay Fraud Operations review. Funds have not been debited.',
        requires_human_action: true
      };
    }

    const senderAcc = this.accounts.get(sender);
    if (!senderAcc) {
      return { status: 'FAILED', message: `Sender wallet '${sender}' not found in Upay Core.` };
    }

    if (senderAcc.balance < amount) {
      return { status: 'FAILED', message: 'Insufficient balance in Upay wallet.' };
    }

    // Debit sender
    senderAcc.balance -= amount;

    // Credit receiver if exists
    const receiverAcc = this.accounts.get(receiver);
    if (receiverAcc) {
      receiverAcc.balance += amount;
    }

    const txId = 'UPAY-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    return {
      status: 'COMPLETED',
      tx_id: txId,
      amount,
      sender,
      receiver,
      sender_balance_remaining: senderAcc.balance,
      timestamp: new Date().toISOString()
    };
  }
}
