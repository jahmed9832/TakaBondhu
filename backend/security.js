import crypto from 'crypto';

/**
 * Creates deterministic SHA-256 hash of normalized text for LRU cache lookup.
 */
export function hashText(text) {
  return crypto.createHash('sha256').update((text || '').trim().toLowerCase()).digest('hex');
}

/**
 * Security and privacy utilities:
 * - PII Redaction (phone numbers, OTPs, PINs, NID numbers)
 * - Input validation & length limits
 * - In-memory rate limiting per client IP
 * - Verbatim evidence validation (reject hallucinated evidence)
 */

/**
 * Redacts sensitive Personally Identifiable Information (PII)
 * before sending text to external LLMs or writing to server logs.
 */
export function redactPII(text) {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Redact Bangladeshi NID numbers (10, 13, or 17 digits)
  sanitized = sanitized.replace(/\b\d{17}\b/g, '[REDACTED_NID_17]');
  sanitized = sanitized.replace(/\b\d{13}\b/g, '[REDACTED_NID_13]');
  sanitized = sanitized.replace(/\b\d{10}\b/g, '[REDACTED_NID_10]');

  // 2. Redact Phone numbers (+8801XXXXXXXXX, 01XXXXXXXXX, 01XXX-XXXXXX)
  sanitized = sanitized.replace(/(?:\+880\s*|880\s*)?01[3-9]\d{2}[-\s]?\d{6}\b/g, '[REDACTED_PHONE]');
  // Bengali numerals phone format
  sanitized = sanitized.replace(/(?:\+৮৮০\s*|৮৮০\s*)?০১[৩-৯][০-৯]{2}[-\s]?[০-৯]{6}\b/g, '[REDACTED_PHONE_BN]');

  // 3. Redact isolated 4-digit to 6-digit OTP/PIN sequences
  // Avoid replacing year numbers like 2026 or small money amounts by checking context
  sanitized = sanitized.replace(/\b(?<!Tk|৳|\$)\d{4,6}\b/g, (match) => {
    const num = parseInt(match, 10);
    // Don't redact common year values (2020-2035)
    if (num >= 2020 && num <= 2035) return match;
    return '[REDACTED_CODE]';
  });

  return sanitized;
}

/**
 * Validates that an evidence snippet is an EXACT verbatim substring of the original input.
 * Rejects hallucinated or invented text.
 */
export function validateVerbatimEvidence(evidence, originalText) {
  if (!evidence || typeof evidence !== 'string') return false;
  if (!originalText || typeof originalText !== 'string') return false;
  return originalText.toLowerCase().includes(evidence.toLowerCase().trim());
}

/**
 * In-memory sliding-window rate limiter per IP.
 */
export function createRateLimiter({ windowMs = 60000, maxRequests = 60 } = {}) {
  const clients = new Map();

  // Cleanup old entries every 2 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of clients.entries()) {
      if (now - entry.startTime > windowMs) {
        clients.delete(ip);
      }
    }
  }, 120000);

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = clients.get(ip);
    if (!record || (now - record.startTime > windowMs)) {
      record = { count: 1, startTime: now };
      clients.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait before submitting additional analyses.',
        retryAfterSeconds: Math.ceil((record.startTime + windowMs - now) / 1000)
      });
    }

    next();
  };
}

/**
 * LRU Cache implementation with TTL for analysis requests.
 */
export class SimpleLRUCache {
  constructor(maxSize = 200, ttlMs = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first entry)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }
}
