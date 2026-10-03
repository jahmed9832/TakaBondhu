/**
 * backend/auditLog.js
 * Cryptographically hashed, tamper-evident, append-only audit log for TakaBondhu.
 * 
 * Rules:
 * - 100% PII-free: All sensitive values (phone, NID, raw tokens) are redacted before hashing & logging.
 * - Hash Chaining: Each record includes the sha256 hash of the previous record, ensuring tamper-evidence.
 * - Append-only persistence in backend/data/audit_log.jsonl.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { redactPII } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit_log.jsonl');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(AUDIT_LOG_FILE)) {
  try {
    fs.writeFileSync(AUDIT_LOG_FILE, '', 'utf-8');
  } catch (err) {
    console.error('Error creating empty audit_log.jsonl:', err.message);
  }
}

let lastLogHash = '0000000000000000000000000000000000000000000000000000000000000000';

// Initialize lastLogHash from existing file if present
if (fs.existsSync(AUDIT_LOG_FILE)) {
  try {
    const lines = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8').trim().split('\n');
    if (lines.length > 0 && lines[lines.length - 1].trim()) {
      const lastEntry = JSON.parse(lines[lines.length - 1]);
      if (lastEntry.entry_hash) {
        lastLogHash = lastEntry.entry_hash;
      }
    }
  } catch {
    // Start with genesis hash
  }
}

/**
 * Appends a decision event to the tamper-evident audit log.
 * @param {Object} event
 * @param {string} event.decision_type - 'screen_transaction' | 'analyze_message' | 'analyst_feedback'
 * @param {string} event.trace_id - Request trace ID
 * @param {number} event.risk_score - 0 to 100
 * @param {string} event.recommendation - ALLOW | SOFT_FRICTION | HOLD_FOR_REVIEW
 * @param {Object} [event.metadata] - Extra redacted details
 * @returns {Object} The finalized audit entry with hash
 */
export function recordAuditDecision({
  decision_type = 'screen_transaction',
  trace_id = 'trace-unknown',
  risk_score = 0,
  recommendation = 'ALLOW',
  metadata = {}
}) {
  const timestamp = new Date().toISOString();

  // Ensure metadata has no raw PII
  const sanitizedMeta = JSON.parse(JSON.stringify(metadata, (key, value) => {
    if (typeof value === 'string') {
      return redactPII(value).redactedText;
    }
    return value;
  }));

  const payload = {
    timestamp,
    trace_id,
    decision_type,
    risk_score: Math.round(risk_score),
    recommendation,
    metadata: sanitizedMeta,
    prev_hash: lastLogHash
  };

  const payloadString = JSON.stringify(payload);
  const entry_hash = crypto.createHash('sha256').update(payloadString).digest('hex');

  const finalRecord = {
    ...payload,
    entry_hash
  };

  try {
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(finalRecord) + '\n', 'utf-8');
    lastLogHash = entry_hash;
  } catch (err) {
    console.error('Failed to write to audit log:', err.message);
  }

  return finalRecord;
}

/**
 * Verifies the integrity of the audit log chain.
 * @returns {{ valid: boolean, records_checked: number, error?: string }}
 */
export function verifyAuditLogIntegrity() {
  if (!fs.existsSync(AUDIT_LOG_FILE)) {
    return { valid: true, records_checked: 0 };
  }

  const lines = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8').trim().split('\n').filter(Boolean);
  let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < lines.length; i++) {
    try {
      const record = JSON.parse(lines[i]);
      if (record.prev_hash !== expectedPrevHash) {
        return {
          valid: false,
          records_checked: i,
          error: `Hash mismatch at record #${i}: expected prev_hash ${expectedPrevHash}, found ${record.prev_hash}`
        };
      }

      const { entry_hash, ...rest } = record;
      const computedHash = crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
      if (computedHash !== entry_hash) {
        return {
          valid: false,
          records_checked: i,
          error: `Tamper detected at record #${i}: recorded hash does not match computed payload hash.`
        };
      }

      expectedPrevHash = entry_hash;
    } catch (err) {
      return { valid: false, records_checked: i, error: err.message };
    }
  }

  return { valid: true, records_checked: lines.length };
}
