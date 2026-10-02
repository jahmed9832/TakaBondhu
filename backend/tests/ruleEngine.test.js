import test from 'node:test';
import assert from 'node:assert/strict';
import { runDeterministicRuleEngine, extractSnippet } from '../ruleEngine.js';

test('RuleEngine - detects high-risk urgency and credential harvesting in English', () => {
  const text = 'URGENT: Your bank account will be blocked within 2 hours. Send OTP immediately to verify: http://fake-login.com';
  const result = runDeterministicRuleEngine(text);
  assert.ok(result.rulesScore >= 70, `Expected score >= 70, got ${result.rulesScore}`);
  assert.ok(result.rawSignals.length >= 2, 'Expected multiple signals');
  assert.ok(result.rawSignals.some(s => s.type === 'Account Threat' || s.type === 'OTP Harvesting'));
});

test('RuleEngine - detects Bangla scam patterns', () => {
  const text = 'জরুরি নোটিশ: আপনার একাউন্ট স্থগিত করা হয়েছে। অবিলম্বে পিন পাঠান এবং ৫০০ টাকা ফি দিন।';
  const result = runDeterministicRuleEngine(text);
  assert.ok(result.rulesScore >= 60, `Expected score >= 60, got ${result.rulesScore}`);
  assert.ok(result.rawSignals.some(s => s.type === 'Account Threat' || s.type === 'OTP Harvesting' || s.type === 'Urgency Pressure'));
});

test('RuleEngine - detects Banglish scam patterns', () => {
  const text = 'Apnar bkash account block hoye jabe 2 ghontar moddhe. Ekhoni 500 taka pathan verify korte.';
  const result = runDeterministicRuleEngine(text);
  assert.ok(result.rulesScore >= 50, `Expected score >= 50, got ${result.rulesScore}`);
});

test('RuleEngine - tightened rules do NOT flag benign everyday words', () => {
  const benignTexts = [
    'I will pay the bill today, no worries.',
    'The bank is closed now, let us meet tomorrow.',
    'Can you send me the class notes today?',
    'Deposit 500 taka to my savings account when free.',
    'Always remember: never share your OTP with strangers.'
  ];

  for (const text of benignTexts) {
    const result = runDeterministicRuleEngine(text);
    assert.ok(result.rulesScore < 40, `Benign text flagged too high (${result.rulesScore}): "${text}"`);
  }
});

test('RuleEngine - verbatim evidence extraction returns exact substring', () => {
  const text = 'Your parcel is held. Pay fee at http://suspicious-pay.site immediately';
  const result = runDeterministicRuleEngine(text);
  for (const sig of result.rawSignals) {
    if (sig.verbatimSnippet) {
      assert.ok(
        text.toLowerCase().includes(sig.verbatimSnippet.toLowerCase()),
        `Snippet "${sig.verbatimSnippet}" must be an exact substring of "${text}"`
      );
    }
  }
});
