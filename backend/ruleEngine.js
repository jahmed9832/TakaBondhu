/**
 * TakaBondhu - Scam Shield Deterministic Rule Engine
 * Extracts objective signals, verbatim evidence snippets, and baseline points.
 * Supports English and Bengali patterns.
 */

/**
 * Helper to extract an exact, verbatim snippet from the original message (English & Bengali)
 */
export function extractSnippet(originalMessage, regexList = [], phraseList = []) {
  if (!originalMessage || typeof originalMessage !== 'string') return null;

  for (const rx of regexList) {
    const match = originalMessage.match(rx);
    if (match && match[0]) {
      return match[0].trim();
    }
  }

  const sorted = [...phraseList].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const idx = originalMessage.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx !== -1) {
      return originalMessage.substring(idx, idx + phrase.length);
    }
  }

  return null;
}

/**
 * TIER 1: DETERMINISTIC RULE ENGINE
 * Evaluates candidate scam patterns and returns detected signals with verbatim evidence snippets.
 */
export function runDeterministicRuleEngine(message) {
  if (!message || typeof message !== 'string') {
    return {
      rawSignals: [],
      scoreBreakdown: [],
      baseScore: 10
    };
  }

  const rawSignals = [];

  // Check 1: Urgency Pressure
  const urgencyPhrases = [
    'within 2 hours', 'within 1 hour', 'within 24 hours', 'expires today', 
    'last chance', 'act fast', 'urgently', 'immediately', 'urgent', 
    'today', 'hurry', 'right now', 'now',
    // Bengali urgency phrases
    '২ ঘণ্টার মধ্যে', 'ঘণ্টার মধ্যে', 'এখনই', 'জরুরি', 'তাড়াতাড়ি'
  ];
  const urgencyEvidence = extractSnippet(
    message, 
    [
      /(?:within\s+\d+\s+(?:hours?|minutes?|days?))/i, 
      /(?:\d+\s*ঘণ্টার\s*মধ্যে)/i,
      /(?:urgently|immediately|today|right now|এখনই|জরুরি)/i
    ], 
    urgencyPhrases
  );

  if (urgencyEvidence) {
    rawSignals.push({
      type: 'Urgency Pressure',
      severity: 'HIGH',
      evidence: urgencyEvidence,
      points: 20,
      explanation: 'The sender creates artificial time pressure to force an immediate financial decision before you have time to verify.'
    });
  }

  // Check 2: Account or Legal Threats
  const threatPhrases = [
    'permanently blocked', 'permanently closed', 'account will be blocked', 
    'flagged for suspicious activity', 'legal action', 'police', 'arrest', 
    'blocked', 'suspended', 'deactivated', 'terminated', 'court', 'penalty', 'frozen',
    // Bengali threats
    'বন্ধ হয়ে যাবে', 'স্থগিত', 'ব্লক', 'আইনি ব্যবস্থা', 'জরিমানা'
  ];
  const threatEvidence = extractSnippet(
    message,
    [
      /(?:permanently\s+)?(?:blocked|suspended|deactivated|terminated|frozen)/i, 
      /(?:legal action|police|arrest)/i,
      /(?:বন্ধ\s*হয়ে\s*যাবে|ব্লক)/i
    ],
    threatPhrases
  );

  if (threatEvidence) {
    rawSignals.push({
      type: 'Account Threat',
      severity: 'CRITICAL',
      evidence: threatEvidence,
      points: 25,
      explanation: 'Threatens imminent account suspension, block, or legal consequence to trigger panic and force compliance.'
    });
  }

  // Check 3: Payment / Money Transfer Request
  const paymentPhrases = [
    'send money', 'wire transfer', 'bKash', 'Nagad', 'gift card', 
    'processing fee', 'clearance fee', 'customs fee', 'deposit', 
    'send', 'transfer', 'pay', 'fee', '৳', '$', 'usd', 'taka',
    // Bengali payments
    'টাকা পাঠিয়ে', 'টাকা পাঠান', 'টাকা দিন', 'ফি', 'টাকা'
  ];
  const paymentEvidence = extractSnippet(
    message,
    [
      /(?:send|transfer|pay|fee(?: of)?|deposit)\s*(?:৳|\$|usd|taka)?\s*\d+(?:,\d+)*(?:\.\d+)?/i,
      /(?:৳|\$|usd|taka)\s*\d+(?:,\d+)*/i,
      /(?:fee of|fee)\s*(?:৳|\$|usd|taka)?\s*\d+/i,
      /(?:[০-৯0-9]+\s*টাকা(?:\s*পাঠিয়ে)?)/i,
      /(?:টাকা\s*পাঠিয়ে)/i
    ],
    paymentPhrases
  );

  if (paymentEvidence) {
    rawSignals.push({
      type: 'Payment Request',
      severity: 'HIGH',
      evidence: paymentEvidence,
      points: 25,
      explanation: 'Demands an immediate money transfer, verification fee, or payment via peer-to-peer or untraceable channels.'
    });
  }

  // Check 4: Suspicious Links
  const linkEvidence = extractSnippet(
    message,
    [
      /https?:\/\/[^\s]+/i,
      /[a-z0-9-]+\.(?:xyz|top|site|club|online|tk|ml|ga|cf|gq|cc)[^\s]*/i
    ],
    ['bit.ly', 'tinyurl.com']
  );

  if (linkEvidence) {
    rawSignals.push({
      type: 'Suspicious Link',
      severity: 'HIGH',
      evidence: linkEvidence,
      points: 15,
      explanation: 'Contains external links that may redirect to phishing portals designed to steal banking credentials.'
    });
  }

  // Check 5: OTP / Credential Harvesting
  const otpHarvestEvidence = extractSnippet(
    message,
    [
      /(?:6-digit\s+)?(?:verification code|otp|pin|password|security code|secret code)/i,
      /(?:card\s+pin|login details)/i,
      /(?:ওটিপি|পিন|পাসওয়ার্ড)/i
    ],
    ['verification code', 'secret code', 'login details', 'anydesk', 'teamviewer', 'otp', 'pin', 'password', 'cvv', 'ওটিপি', 'পিন']
  );

  if (otpHarvestEvidence) {
    rawSignals.push({
      type: 'OTP Harvesting',
      severity: 'CRITICAL',
      evidence: otpHarvestEvidence,
      points: 30,
      explanation: 'References one-time passwords, PINs, or credentials. Legitimate institutions will NEVER ask for your OTP or PIN.'
    });
  }

  // Check 6: Fake Rewards / Lottery / Prize
  const prizeEvidence = extractSnippet(
    message,
    [
      /(?:grand prize(?: of)?\s*(?:\$|৳|usd)?\s*\d+(?:,\d+)*)/i,
      /(?:won\s*(?:৳|\$|usd)?\s*\d+(?:,\d+)*)/i,
      /(?:won(?: the)?\s+[^\n.,]+)/i,
      /(?:পুরস্কার|লটারি)/i
    ],
    ['grand prize', 'sweepstakes', 'congratulations', 'won', 'lottery', 'prize', 'jackpot', 'selected', 'lucky winner', 'পুরস্কার', 'লটারি']
  );

  if (prizeEvidence) {
    rawSignals.push({
      type: 'Unsolicited Prize / Reward',
      severity: 'HIGH',
      evidence: prizeEvidence,
      points: 20,
      explanation: 'Claims unexpected monetary reward or prize requiring upfront processing fees or account verification.'
    });
  }

  // Check 7: Authority Impersonation
  const impersonationEvidence = extractSnippet(
    message,
    [
      /(?:calling from\s+)?(?:customer support|bank manager|security alert|helpdesk support|courier)/i,
      /(?:your\s+bank\s+account|central bank|customs office)/i,
      /(?:কাস্টমার কেয়ার|ব্যাংক|ভেরিফাই)/i
    ],
    [
      'calling from customer support', 'customer support', 'official helpdesk support', 
      'security department', 'central bank', 'bank manager', 'customs office', 
      'your bank account', 'courier', 'কাস্টমার কেয়ার', 'ভেরিফাই'
    ]
  );

  if (impersonationEvidence) {
    rawSignals.push({
      type: 'Authority Impersonation',
      severity: 'MEDIUM',
      evidence: impersonationEvidence,
      points: 13,
      explanation: 'Purports to represent an official financial or government entity without cryptographic signature or verifiable sender ID.'
    });
  }

  // Check 8: Emotional Manipulation / Distress
  const emotionalEvidence = extractSnippet(
    message,
    [
      /(?:stranded at [^\n.,]+)/i,
      /(?:emergency room|injured leg|accident)/i,
      /(?:বিপদ|দুর্ঘটনা|হাসপাতাল)/i
    ],
    ['stranded at the clinic', 'emergency room', 'injured leg', 'accident', 'lost my phone and wallet', 'emergency', 'বিপদ']
  );

  if (emotionalEvidence) {
    rawSignals.push({
      type: 'Emotional Manipulation',
      severity: 'HIGH',
      evidence: emotionalEvidence,
      points: 20,
      explanation: 'Leverages medical emergencies, accidents, or personal distress to manipulate empathy and prevent rational verification.'
    });
  }

  const scoreBreakdown = rawSignals.map(s => ({
    name: s.type,
    points: s.points
  }));

  const baseScore = scoreBreakdown.reduce((sum, item) => sum + item.points, 0);

  return {
    rawSignals,
    scoreBreakdown,
    baseScore: Math.min(Math.max(baseScore, 10), 98)
  };
}
