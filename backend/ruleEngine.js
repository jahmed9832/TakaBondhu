/**
 * TakaBondhu - Scam Shield Deterministic Rule Engine
 * Extracts objective signals, verbatim evidence snippets, and baseline points.
 * Tightened to eliminate false positives on benign hard negatives (everyday chat,
 * banking notifications, cybersecurity advice) while retaining robust scam detection.
 * Supports English, Banglish, and Bengali script.
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
  const lowerMsg = message.toLowerCase();

  // Helper check: Is this defensive cybersecurity advice?
  // (e.g. "Never share your OTP or PIN with anyone", "Bank will never ask for your PIN")
  const isDefensiveAdvice = /(?:never\s+share|do\s+not\s+share|will\s+never\s+ask|never\s+disclose|never\s+provide|protect\s+your|stay\s+safe|কখনো\s*(?:শেয়ার|দেবেন|বলবেন)\s*না|কাউকে\s*(?:বলবেন|দেবেন|শেয়ার)\s*না|নিরাপত্তা\s*(?:সতর্কতা|টিপস)|সচেতন\s*হোন|share\s*korben\s*na|kokhono\s*deben\s*na|kokhono\s*pin\s*chay\s*na)/i.test(message);

  // Helper check: Is this an official bank/MFS transaction confirmation receipt?
  const isTransactionReceipt = /(?:trxid\s*[:\s]?[0-9a-z]+|cash\s*(?:in|out)\s*(?:tk|৳)?\s*[\d,]+|you\s+have\s+received\s+(?:tk|৳)?\s*[\d,]+|recharge\s+(?:tk|৳)?\s*[\d,]+|balance\s+(?:tk|৳)?\s*[\d,]+|টাকা\s*গ্রহণ\s*করেছেন|ক্যাশ\s*(?:ইন|আউট)\s*সফল)/i.test(message);

  // Check 1: Urgency Pressure
  // Tightened: Require deadline, timer, or coercive urgency context (no lone "today" or "now")
  const urgencyEvidence = extractSnippet(
    message,
    [
      /(?:within\s+\d+\s+(?:hours?|minutes?|days?)|expires\s+today|act\s+fast|urgently\s+need|send\s+right\s+now|cancel\s+right\s+now|dial\s+now|call\s+(?:us\s+)?now|before\s+\d+\s*(?:am|pm)|২\s*ঘণ্টার\s*মধ্যে|\d+\s*ঘণ্টার\s*মধ্যে|আজকের\s*মধ্যে|জরুরি\s*ভিত্তিতে|অতি\s*দ্রুত|এখনই\s*(?:পরিশোধ|পাঠান|বলুন|ফেরত|verify|confirm|call)|ekhoni\s*(?:call|verify|pathan|ferot|send))/i,
      /(?:last\s+chance|immediate\s+suspension|temporary\s+hold)/i
    ],
    [
      'within 2 hours', 'within 1 hour', 'within 24 hours', 'expires today',
      'act fast', 'urgently need', 'send right now', 'cancel right now',
      '২ ঘণ্টার মধ্যে', 'ঘণ্টার মধ্যে', 'জরুরি ভিত্তিতে', 'অতি দ্রুত', 'shondhar age'
    ]
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
  // Tightened: Require account/wallet/police context (not mere traffic "road block" or general "police")
  const threatEvidence = extractSnippet(
    message,
    [
      /(?:(?:account|wallet|profile|sim|card|হিসাব|একাউন্ট|ওয়ালেট)\s*(?:is|will be|has been)?\s*(?:permanently\s+)?(?:blocked|suspended|deactivated|terminated|frozen|লক|স্থগিত|ব্লক))/i,
      /(?:permanently\s+(?:blocked|suspended|closed|terminated)|account\s+closure|temporary\s+freeze|স্থায়ীভাবে\s+বন্ধ|আইনি\s+ব্যবস্থা|police\s+complaint|permanently\s+block|bondho\s+hoye\s+jabe)/i,
      /(?:flagged\s+for\s+suspicious\s+activity|unauthorized\s+transaction\s+of)/i
    ],
    [
      'account will be permanently blocked', 'account will be blocked', 'permanently blocked',
      'account is flagged', 'wallet is temporarily restricted', 'account suspended',
      'permanently closed', 'স্থায়ীভাবে বন্ধ', 'একাউন্ট স্থগিত', 'আইনি ব্যবস্থা', 'temporary block'
    ]
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

  // Check 3: Payment / Fee Demand (Coercive Advance Fees or Wrong Transfer Refund)
  // Tightened: Ignore legitimate receipts or friendly informal chats unless fee/refund coercion is detected
  let paymentEvidence = null;
  if (!isTransactionReceipt) {
    paymentEvidence = extractSnippet(
      message,
      [
        /(?:(?:processing|clearance|customs|advance|joining|onboarding|registration|insurance|stamp\s+duty|license|training|booking|file)\s+(?:fee|charge|deposit)|security\s+deposit|test\s+deposit)/i,
        /(?:প্রসেসিং\s*ফি|রেজিস্ট্রেশন\s*ফি|জামানত|ছাড়পত্র\s*ফি|ডকুমেন্ট\s*ফি|ট্যাক্স\s*বাবদ|অগ্রিম\s*ইন্স্যুরেন্স|সার্ভিস\s*চার্জ)/i,
        /(?:processing\s*fee|registration\s*fee|joining\s*fee|security\s*deposit|advance\s*insurance|stamp\s*charge)\s*(?:tk\s*|৳\s*)?\d+/i,
        /(?:refund\s+(?:it\s+)?to|mistake\s+transfer|send\s+it\s+back\s+to|return\s+it\s+to|ফেরত\s+পাঠান|ব্যাক\s+করুন|ferot\s+pathan|return\s+korun)\s*(?:[0-9+০-৯\s-]+)?/i,
        /(?:wire\s+transfer|gift\s+card)/i
      ],
      [
        'processing fee', 'clearance fee', 'customs fee', 'advance insurance fee',
        'joining fee', 'security deposit', 'stamp duty charge', 'registration charge',
        'প্রসেসিং ফি', 'রেজিস্ট্রেশন ফি', 'ছাড়পত্র ফি', 'জামানত বাবদ', 'ফেরত পাঠান'
      ]
    );
  }

  if (paymentEvidence) {
    rawSignals.push({
      type: 'Payment Request',
      severity: 'HIGH',
      evidence: paymentEvidence,
      points: 25,
      explanation: 'Demands an immediate money transfer, verification fee, or advance clearance payment via untraceable channels.'
    });
  }

  // Check 4: Suspicious Phishing Links
  const linkEvidence = extractSnippet(
    message,
    [
      /https?:\/\/[a-z0-9-]+\.(?:xyz|top|site|club|online|tk|ml|ga|cf|gq|cc|live)[^\s]*/i,
      /https?:\/\/(?:bit\.ly|tinyurl\.com|cutt\.ly|t\.co)[^\s]*/i,
      /(?:http:\/\/[^\s]+)/i
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
  // Tightened: Suppressed if defensive cybersecurity advice! Only active harvest requests flagged.
  let otpHarvestEvidence = null;
  if (!isDefensiveAdvice) {
    otpHarvestEvidence = extractSnippet(
      message,
      [
        /(?:(?:tell|send|share|reply\s+with|provide|disclose|read\s+back|state)\s*(?:your\s*)?(?:4-digit|6-digit)?\s*(?:otp|pin|verification\s+code|secret\s+pin|password|security\s+code))/i,
        /(?:(?:বলুন|দিন|পাঠান|নিশ্চিত\s*করুন)\s*(?:গোপন\s*)?(?:পিন|ওটিপি|পাসওয়ার্ড|সিকিউরিটি\s*তথ্য))/i,
        /(?:code\s*ta\s*ekhoni\s*bolun|pin\s*bolun|otp\s*ar\s*pin\s*bolun|security\s*code\s*share\s*korun)/i,
        /(?:enter\s+your\s+pin\s+and\s+claim|provide\s+your\s+4-digit\s*(?:secret\s*)?pin)/i,
        /(?:install\s+(?:anydesk|teamviewer|rustdesk|quicksupport)|anydesk\s+app\s+install|teamviewer\s+install)/i
      ],
      [
        'verification code', 'secret pin', 'provide your pin', 'tell the code',
        'read back the', 'install anydesk', 'install teamviewer', 'quicksupport',
        'গোপন পিন', 'ওটিপি কোডটি', 'anydesk ডাউনলোড'
      ]
    );
  }

  if (otpHarvestEvidence) {
    rawSignals.push({
      type: 'OTP Harvesting',
      severity: 'CRITICAL',
      evidence: otpHarvestEvidence,
      points: 30,
      explanation: 'Demands disclosure of one-time passwords, PINs, or installation of remote access tools (AnyDesk/TeamViewer).'
    });
  }

  // Check 6: Fake Rewards / Lottery / Prize
  // Tightened: Require winner/lottery context, not merely "congratulations" alone
  const prizeEvidence = extractSnippet(
    message,
    [
      /(?:(?:won|winner\s+of)\s+(?:grand\s+prize|jackpot|cashback|cash\s+reward|lottery|mega\s+prize|raffle))/i,
      /(?:grand\s+prize\s+(?:of|winner)|lucky\s+winner|sweepstakes\s+grand\s+prize)/i,
      /(?:লটারি\s*(?:জিতেছে|বিজয়ী|প্রাইজ)|পুরস্কার\s*বরাদ্দ|ক্যাশ\s*বোনাস|লাকি\s*ড্র|মেগা\s*অফার)/i,
      /(?:lotari\s*prize|raffle\s*draw\s*te|big\s*prize\s*winner|bumper\s*prize|cash\s*bonus)/i
    ],
    [
      'grand prize', 'sweepstakes', 'lottery prize', 'lucky winner',
      'লটারি জিতেছে', 'পুরস্কার বরাদ্দ', 'লাকি ড্র', 'bumper prize'
    ]
  );

  if (prizeEvidence) {
    rawSignals.push({
      type: 'Unsolicited Prize / Reward',
      severity: 'HIGH',
      evidence: prizeEvidence,
      points: 20,
      explanation: 'Claims unexpected monetary reward or lottery jackpot requiring upfront processing fees or credential entry.'
    });
  }

  // Check 7: Authority Impersonation
  // Tightened: Require impersonation phrasing (e.g. "calling from support", "helpline officer", not "going to the bank")
  let impersonationEvidence = null;
  if (!isDefensiveAdvice && !isTransactionReceipt) {
    impersonationEvidence = extractSnippet(
      message,
      [
        /(?:calling\s+from\s+(?:customer\s+support|helpdesk|security\s+center|head\s+office|officer))/i,
        /(?:official\s+(?:helpdesk|support|officer|notice\s+from\s+(?:bkash|nagad|rocket|upay)))/i,
        /(?:কাস্টমার\s*কেয়ার\s*থেকে\s*বলছি|প্রধান\s*কার্যালয়\s*থেকে|সিকিউরিটি\s*বিভাগ|হেল্পলাইন\s*থেকে)/i,
        /(?:customer\s*care\s*theke\s*bolchi|agent\s*support\s*theke|helpline\s*officer|security\s*department)/i
      ],
      [
        'calling from customer support', 'official helpdesk support',
        'কাস্টমার কেয়ার থেকে বলছি', 'প্রধান কার্যালয় থেকে', 'customer care theke bolchi'
      ]
    );
  }

  if (impersonationEvidence) {
    rawSignals.push({
      type: 'Authority Impersonation',
      severity: 'MEDIUM',
      evidence: impersonationEvidence,
      points: 13,
      explanation: 'Purports to represent an official financial or customer support authority to compel trust.'
    });
  }

  // Check 8: Emotional Manipulation / Distress
  const emotionalEvidence = extractSnippet(
    message,
    [
      /(?:stranded\s+at\s+(?:the\s+)?clinic|emergency\s+room|injured\s+leg|hospital\s+deposit|sick\s+mother\s+needs|lost\s+my\s+phone\s+and\s+wallet)/i,
      /(?:খুব\s*বিপদে\s*আছি|মায়ের\s*(?:চিকিৎসা|অসুখ)|হাসপাতালে|মেডিকেল\s*ইমার্জেন্সি)/i,
      /(?:khub\s*bipode\s*achi|mayer\s*osukh|hospital\s*deposit)/i
    ],
    [
      'stranded at the clinic', 'emergency room', 'injured leg', 'sick mother needs',
      'খুব বিপদে আছি', 'মায়ের চিকিৎসার', 'মেডিকেল ইমার্জেন্সি', 'khub bipode achi'
    ]
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

  const rawSum = scoreBreakdown.reduce((sum, item) => sum + item.points, 0);

  // If no signals triggered, baseScore is 10. Otherwise, scaled up to max 98.
  const baseScore = rawSignals.length === 0 ? 10 : Math.min(Math.max(rawSum + 10, 20), 98);

  return {
    rawSignals,
    scoreBreakdown,
    baseScore
  };
}
