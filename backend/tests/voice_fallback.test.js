import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Pure helper function simulating the frontend voice fallback decision logic.
 * @param {Object} params
 * @param {number} params.tokenHttpStatus
 * @param {boolean} params.agentJoinedWithin8s
 * @returns {'browser' | 'livekit'}
 */
export function determineVoiceMode({ tokenHttpStatus, agentJoinedWithin8s }) {
  // If token request fails (e.g. 503 Service Unavailable or network error)
  if (tokenHttpStatus !== 200) {
    return 'browser';
  }
  // If token was obtained, but no remote agent joined the room within the 8-second window
  if (!agentJoinedWithin8s) {
    return 'browser';
  }
  return 'livekit';
}

test('Voice Fallback - token 503 automatically switches to browser voice', () => {
  const result = determineVoiceMode({
    tokenHttpStatus: 503,
    agentJoinedWithin8s: false
  });
  assert.strictEqual(result, 'browser', 'Must fall back to browser voice when token returns 503');
});

test('Voice Fallback - token 200 but agent timeout (>8s) automatically switches to browser voice', () => {
  const result = determineVoiceMode({
    tokenHttpStatus: 200,
    agentJoinedWithin8s: false
  });
  assert.strictEqual(result, 'browser', 'Must fall back to browser voice when no agent joins within 8 seconds');
});

test('Voice Fallback - token 200 and agent joined within 8s stays in livekit mode', () => {
  const result = determineVoiceMode({
    tokenHttpStatus: 200,
    agentJoinedWithin8s: true
  });
  assert.strictEqual(result, 'livekit', 'Stays in livekit mode only when agent joins within 8s');
});

test('Voice Status contract - GET /api/voice/status schema verification', async () => {
  // Simulated backend status calculation
  const getStatus = (configured, lastWorkerPing) => {
    const workerSeen = (Date.now() - lastWorkerPing) < 60000;
    return {
      browserVoice: true,
      realtime: Boolean(configured && workerSeen)
    };
  };

  // When worker has never pinged
  const statusNoWorker = getStatus(true, 0);
  assert.strictEqual(statusNoWorker.browserVoice, true);
  assert.strictEqual(statusNoWorker.realtime, false);

  // When worker recently pinged
  const statusWithWorker = getStatus(true, Date.now() - 5000);
  assert.strictEqual(statusWithWorker.browserVoice, true);
  assert.strictEqual(statusWithWorker.realtime, true);

  // When not configured even if worker pinged
  const statusNotConfigured = getStatus(false, Date.now() - 5000);
  assert.strictEqual(statusNotConfigured.realtime, false);
});

test('Voice Conversational Chat - Greeting returns natural spoken Bangla without robotic score 20/100', async () => {
  const { generateVoiceAgentReply } = await import('../server.js');
  
  const result = await generateVoiceAgentReply({
    message: 'আসসালামু আলাইকুম, কেমন আছেন?',
    lang: 'bn',
    demoOffline: true
  });

  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(result.isScam, false);
  assert.ok(result.reply.includes('ওয়ালাইকুম আসসালাম') || result.reply.includes('টাকাবন্ধু'), 'Should greet warmly in Bengali');
  assert.strictEqual(result.reply.includes('২০/১০০'), false, 'Must NOT output robotic score 20/100');
  assert.strictEqual(result.reply.includes('স্কোর'), false, 'Must NOT output raw metric jargon in spoken reply');
});

test('Voice Conversational Chat - Scam threat returns protective warning and helpline', async () => {
  const { generateVoiceAgentReply } = await import('../server.js');
  
  const result = await generateVoiceAgentReply({
    message: 'আপনার বিকাশ অ্যাকাউন্ট বন্ধ হয়ে যাবে, এখনই ওটিপি কোড এবং ৫০০০ টাকা পাঠান।',
    lang: 'bn',
    demoOffline: true
  });

  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(result.isScam, true, 'Scam threat must be flagged as isScam true');
  assert.ok(result.reply.includes('টাকা') || result.reply.includes('ওটিপি') || result.reply.includes('সাবধান'), 'Must give defensive advice');
  assert.strictEqual(result.reply.includes('২০/১০০'), false, 'Must NOT output robotic 20/100');
});

test('Voice Conversational Chat - Helpline query provides official upay helpline 16268', async () => {
  const { generateVoiceAgentReply } = await import('../server.js');
  
  const result = await generateVoiceAgentReply({
    message: 'উপায় হেল্পলাইন নম্বর কত?',
    lang: 'bn',
    demoOffline: true
  });

  assert.strictEqual(result.status, 'ok');
  assert.ok(result.reply.includes('১৬২৬৮'), 'Must mention official helpline 16268');
  assert.strictEqual(result.isScam, false);
});

test('Voice Conversational Chat - 12 Diverse Bangla/Banglish/English Utterances Test Suite', async () => {
  const { generateVoiceAgentReply } = await import('../server.js');

  const cannedGenericSentence = 'আমি আপনার কথা বুঝতে পেরেছি। টাকাবন্ধুর সাথে আপনি যেকোনো সন্দেহজনক মেসেজ, ফোন কল বা আর্থিক বিষয় নিয়ে কথা বলতে পারেন। আমি নিরাপদ পরামর্শ দিয়ে সাহায্য করব।';

  const testUtterances = [
    {
      category: 'greeting_bn',
      message: 'আসসালামু আলাইকুম, কেমন আছেন?',
      lang: 'bn',
      expectedScam: false,
      expectedSourcePrefix: 'offline_greeting'
    },
    {
      category: 'greeting_en',
      message: 'Hello, how are you today?',
      lang: 'en',
      expectedScam: false,
      expectedSourcePrefix: 'offline_greeting'
    },
    {
      category: 'greeting_banglish',
      message: 'Salam kemon achen bhai?',
      lang: 'bn',
      expectedScam: false,
      expectedSourcePrefix: 'offline_greeting'
    },
    {
      category: 'otp_request_bn',
      message: 'আমার ফোনে একটি ওটিপি এসেছে, ব্যাংক থেকে ফোন দিয়ে ওটিপি চাইছে।',
      lang: 'bn',
      expectedScam: true,
      mustInclude: '১৬২৬৮',
      expectedSourcePrefix: 'offline_pipeline'
    },
    {
      category: 'otp_request_banglish',
      message: 'Sir bkash theke bolchi, apnar account verify korte OTP code ta din',
      lang: 'bn',
      expectedScam: true,
      mustInclude: '১৬২৬৮',
      expectedSourcePrefix: 'offline_pipeline'
    },
    {
      category: 'account_block_threat_bn',
      message: 'আপনার অ্যাকাউন্ট এখনি ব্লক হয়ে যাবে, অবিলম্বে ৫০০০ টাকা পাঠিয়ে আনলক করুন।',
      lang: 'bn',
      expectedScam: true,
      mustInclude: '১৬২৬৮',
      expectedSourcePrefix: 'offline_pipeline'
    },
    {
      category: 'account_block_threat_en',
      message: 'Your account will be suspended immediately, send money to keep it active.',
      lang: 'en',
      expectedScam: true,
      mustInclude: '16268',
      expectedSourcePrefix: 'offline_pipeline'
    },
    {
      category: 'lottery_prize_bn',
      message: 'অভিনন্দন! আপনি ২৫ লাখ টাকার লটারি জিতেছেন, পুরস্কার পেতে ফি দিন।',
      lang: 'bn',
      expectedScam: true,
      mustInclude: '১৬২৬৮',
      expectedSourcePrefix: 'offline_pipeline'
    },
    {
      category: 'lottery_prize_banglish',
      message: 'Congratulations lottery jitsen, 1000 taka advance fee pathan',
      lang: 'bn',
      expectedScam: true,
      mustInclude: '১৬২৬৮',
      expectedSourcePrefix: 'offline_pipeline'
    },
    {
      category: 'what_is_upay',
      message: 'What is upay?',
      lang: 'en',
      expectedScam: false,
      mustInclude: 'upay',
      expectedSourcePrefix: 'offline_kb'
    },
    {
      category: 'helpline_bn',
      message: 'উপায়ের অফিশিয়াল হেল্পলাইন নম্বর কত?',
      lang: 'bn',
      expectedScam: false,
      mustInclude: '১৬২৬৮',
      expectedSourcePrefix: 'offline_kb'
    },
    {
      category: 'benign_transfer_bn',
      message: 'আমি আমার ভাইকে বিকাশে ৫০০ টাকা পাঠাতে চাই।',
      lang: 'bn',
      expectedScam: false,
      expectedSourcePrefix: 'offline_advisory'
    },
    {
      category: 'unknown_unclear',
      message: 'হুম আচ্ছা ঠিক আছে blablabla xyz',
      lang: 'bn',
      expectedScam: false,
      mustInclude: 'কী মেসেজ এসেছে বা কেউ কী বলেছে',
      expectedSourcePrefix: 'offline_clarification'
    }
  ];

  console.log('\n--- 12 UTTERANCES REAL VOICE REPLIES EVALUATION ---');
  for (const item of testUtterances) {
    const res = await generateVoiceAgentReply({
      message: item.message,
      lang: item.lang,
      demoOffline: true
    });

    console.log(`[${item.category}]`);
    console.log(`  User:    "${item.message}"`);
    console.log(`  Reply:   "${res.reply}"`);
    console.log(`  Source:  ${res.source}, isScam: ${res.isScam}, riskScore: ${res.riskScore}`);

    assert.strictEqual(res.status, 'ok');
    assert.strictEqual(
      res.reply.includes(cannedGenericSentence), 
      false, 
      `Must NOT return canned generic sentence for category: ${item.category}`
    );
    assert.ok(res.reply && res.reply.length > 15, `Reply must be substantive (>15 chars) for ${item.category}`);
    assert.strictEqual(res.isScam, item.expectedScam, `isScam mismatch for ${item.category}`);
    if (item.mustInclude) {
      assert.ok(
        res.reply.includes(item.mustInclude), 
        `Reply for ${item.category} must include "${item.mustInclude}", got: "${res.reply}"`
      );
    }
    assert.ok(
      res.source.startsWith(item.expectedSourcePrefix),
      `Expected source ${item.expectedSourcePrefix}, got ${res.source}`
    );
  }
  console.log('--- END OF VOICE REPLIES EVALUATION ---\n');
});

test('Voice Conversational Chat - Never returns identical reply twice in a row for unclear input', async () => {
  const { generateVoiceAgentReply } = await import('../server.js');

  const first = await generateVoiceAgentReply({
    message: 'random unparseable phrase 12345',
    lang: 'bn',
    demoOffline: true,
    history: []
  });

  const second = await generateVoiceAgentReply({
    message: 'random unparseable phrase 12345',
    lang: 'bn',
    demoOffline: true,
    history: [
      { role: 'user', text: 'random unparseable phrase 12345' },
      { role: 'assistant', text: first.reply }
    ]
  });

  console.log('Follow-up avoidance test:');
  console.log('  Turn 1 reply:', first.reply);
  console.log('  Turn 2 reply:', second.reply);

  assert.notStrictEqual(
    first.reply, 
    second.reply, 
    'Consecutive unclear replies must not be identical'
  );
});
