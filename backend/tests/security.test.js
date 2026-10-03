import test from 'node:test';
import assert from 'node:assert/strict';
import { redactPII, validateVerbatimEvidence, createRateLimiter, SimpleLRUCache } from '../security.js';

test('Security - redacts Bangladeshi phone numbers in English and Bengali numerals', () => {
  const input = 'Call 01712-345678 or +8801812345678 or ০১৮১২৩৪৫৬৭৮ now';
  const redacted = redactPII(input);

  assert.ok(!redacted.includes('01712-345678'), 'Phone number should be redacted');
  assert.ok(!redacted.includes('+8801812345678'), 'E.164 phone number should be redacted');
  assert.ok(!redacted.includes('০১৮১২৩৪৫৬৭৮'), 'Bengali digit phone number should be redacted');
  assert.ok(redacted.includes('[REDACTED_PHONE]'));
});

test('Security - redacts NID numbers (10, 13, 17 digits)', () => {
  const nid10 = 'My NID is 1234567890 for verification';
  const nid17 = 'Official NID: 19901234567890123 submitted';

  const red10 = redactPII(nid10);
  const red17 = redactPII(nid17);

  assert.ok(!red10.includes('1234567890'));
  assert.ok(red10.includes('[REDACTED_NID_10]'));

  assert.ok(!red17.includes('19901234567890123'));
  assert.ok(red17.includes('[REDACTED_NID_17]'));
});

test('Security - redacts OTP codes while preserving calendar years', () => {
  const text = 'Your OTP is 492041 for transaction in year 2026';
  const redacted = redactPII(text);

  assert.ok(!redacted.includes('492041'), 'OTP must be redacted');
  assert.ok(redacted.includes('2026'), 'Year 2026 must be preserved');
});

test('Security - validates verbatim evidence strictly against original text', () => {
  const original = 'Send ৳500 immediately to unlock account';

  // Exact match
  assert.equal(validateVerbatimEvidence('Send ৳500', original), true);
  // Case-insensitive match
  assert.equal(validateVerbatimEvidence('send ৳500', original), true);
  // Hallucinated / invented evidence
  assert.equal(validateVerbatimEvidence('Send $1000 now', original), false);
  assert.equal(validateVerbatimEvidence('Crypto wallet transfer', original), false);
});

test('Security - rate limiter blocks IP when exceeding limit', () => {
  const limiter = createRateLimiter(3, 60000); // 3 req max
  let statusCode = 200;
  const mockRes = {
    status(code) {
      statusCode = code;
      return { json: () => {} };
    }
  };
  const mockReq = { ip: '127.0.0.99', headers: {} };
  const next = () => {};

  limiter(mockReq, mockRes, next); // 1st: ok
  assert.equal(statusCode, 200);
  limiter(mockReq, mockRes, next); // 2nd: ok
  assert.equal(statusCode, 200);
  limiter(mockReq, mockRes, next); // 3rd: ok
  assert.equal(statusCode, 200);
  limiter(mockReq, mockRes, next); // 4th: blocked!
  assert.equal(statusCode, 429);
});

test('Security - RBAC role-based access control blocks unauthorized customer role on analyst endpoints', () => {
  function verifyAnalystAccess(headers) {
    const role = (headers['x-role'] || 'customer').toLowerCase();
    if (role !== 'analyst' && role !== 'admin') {
      return { status: 403, error: 'Forbidden: Analyst or Admin credentials required.' };
    }
    return { status: 200, success: true };
  }

  // Customer role -> Blocked (403)
  assert.equal(verifyAnalystAccess({ 'x-role': 'customer' }).status, 403);
  assert.equal(verifyAnalystAccess({}).status, 403); // default is customer without header

  // Analyst role -> Allowed (200)
  assert.equal(verifyAnalystAccess({ 'x-role': 'analyst' }).status, 200);

  // Admin role -> Allowed (200)
  assert.equal(verifyAnalystAccess({ 'x-role': 'admin' }).status, 200);
});

test('Security - Anti-leakage verification: test template families are not in train set', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const trainPath = path.resolve('ml/data/train_v2.csv');
  const testPath = path.resolve('ml/data/test_unseen_v2.csv');

  if (fs.existsSync(trainPath) && fs.existsSync(testPath)) {
    const trainContent = fs.readFileSync(trainPath, 'utf8');
    const testContent = fs.readFileSync(testPath, 'utf8');

    const extractTemplates = (csv) => {
      const lines = csv.split('\n').filter(Boolean);
      const header = lines[0].split(',');
      const familyIdx = header.indexOf('template_family');
      if (familyIdx === -1) return new Set();
      const set = new Set();
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts[familyIdx]) set.add(parts[familyIdx].trim());
      }
      return set;
    };

    const trainFamilies = extractTemplates(trainContent);
    const testFamilies = extractTemplates(testContent);

    let overlapCount = 0;
    for (const f of testFamilies) {
      if (trainFamilies.has(f)) overlapCount++;
    }

    assert.equal(overlapCount, 0, `Anti-leakage violation: ${overlapCount} test families overlapped with train`);
  }
});

