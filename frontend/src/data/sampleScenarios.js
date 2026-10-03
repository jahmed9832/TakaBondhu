export const SAMPLE_SCENARIOS = [
  {
    id: 'fake-agent-bn',
    title: 'Fake upay Agent (ভেরিফিকেশন ফি দাবি)',
    category: 'Impersonation',
    icon: 'Headphones',
    text: 'আসসালামু আলাইকুম, আমি উপায় প্রধান কার্যালয় থেকে বলছি। আপনার ওয়ালেটের ট্রানজেকশন লিমিট ১ লক্ষ টাকায় উন্নীত করতে অবিলম্বে এই এজেন্ট নম্বরে ২,৫০০ টাকা সিকিউরিটি ফি ক্যাশ-আউট করুন।',
    lang: 'bn'
  },
  {
    id: 'otp-harvest-bn',
    title: 'OTP Harvest (ওটিপি ও পিন ফাঁদ)',
    category: 'Credential Theft',
    icon: 'KeyRound',
    text: 'জরুরি নিরাপত্তা সতর্কতা: আপনার উপায় অ্যাকাউন্টে সন্দেহজনক লগইন ধরা পড়েছে। ওয়ালেট বন্ধ হওয়া রোধ করতে আপনার মোবাইলে আসা ৬ সংখ্যার OTP কোডটি এখনই এসএমএস করে পাঠান।',
    lang: 'bn'
  },
  {
    id: 'account-takeover',
    title: 'Account Takeover (অ্যাকাউন্ট টেকওভার)',
    category: 'ATO Threat',
    icon: 'AlertTriangle',
    text: 'ALERT: New device logged into your upay wallet from Sylhet at 03:14 AM. If this was not you, send your 4-digit PIN immediately to cancel the pending transfer of ৳24,500.',
    lang: 'en'
  },
  {
    id: 'prize-scam',
    title: 'Prize Lottery Scam (লটারি বিজয়ী)',
    category: 'Fake Reward',
    icon: 'Gift',
    text: 'অভিনন্দন! আপনার মোবাইল নম্বর উপায় ধামাকা ক্যাম্পেইনে ৫০,০০০ টাকা ক্যাশ প্রাইজ জিতেছে! পুরস্কার গ্রহণ করতে প্রসেসিং ফি বাবদ ১,০২০ টাকা এই নম্বরে পাঠান।',
    lang: 'bn'
  },
  {
    id: 'emergency-request',
    title: 'Emergency Medical Request (হাসপাতাল নাটক)',
    category: 'Social Engineering',
    icon: 'HeartHandshake',
    text: 'দোস্ত আমি বিপদে পড়েছি! অ্যাক্সিডেন্ট হয়ে হাসপাতালে আছি, এই মুহূর্তে ওষুধের জন্য ৫,০০০ টাকা লাগবে। আমার ফোন নষ্ট, এই নম্বরে জলদি উপায় সেন্ড মানি কর, কাল সকালে ফেরত দিব।',
    lang: 'bn'
  },
  {
    id: 'benign-official',
    title: 'Legitimate Official Notice (বৈধ নোটিশ)',
    category: 'Official Safe Notice',
    icon: 'ShieldCheck',
    text: 'প্রিয় গ্রাহক, উপায় কখনো আপনার গোপন পিন বা এসএমএস ওটিপি জানতে চাইবে না। প্রতারণা থেকে সাবধান থাকুন। যেকোনো তথ্যে কল করুন 16268 নম্বরে।',
    lang: 'bn'
  }
];

export const OFFICIAL_DEMO_SCENARIOS = [
  {
    id: 'demo-fake-agent',
    name: '1. Fake Agent Impersonation',
    nameBn: '১. ফেক এজেন্ট প্রতারণা',
    targetView: 'scam-shield',
    targetTab: 'message',
    category: 'Social Engineering',
    badge: 'HIGH RISK (88/100)',
    badgeColor: 'rose',
    description: 'Impersonates upay customer service agent demanding an upfront "security verification fee" to raise wallet limits.',
    descriptionBn: 'উপায় কর্মকর্তা সেজে অ্যাকাউন্ট লিমিট বাড়ানোর নামে অগ্রিম ভেরিফিকেশন ফি দাবি।',
    inputText: 'আসসালামু আলাইকুম, আমি উপায় প্রধান কার্যালয় থেকে বলছি। আপনার ওয়ালেটের ট্রানজেকশন লিমিট ১ লক্ষ টাকায় উন্নীত করতে অবিলম্বে এই এজেন্ট নম্বরে ২,৫০০ টাকা সিকিউরিটি ফি ক্যাশ-আউট করুন।',
    deterministicReport: {
      riskScore: 88,
      riskLevel: 'HIGH',
      summary: 'Upay agent impersonation detected with high-risk demand for advance fee.',
      summary_bn: 'উপায় কর্মকর্তার ভুয়া পরিচয় ব্যবহার করে অগ্রিম ফি চাওয়ার প্রতারণামূলক প্যাটার্ন সনাক্ত হয়েছে।',
      signals: [
        { type: 'UPAY_AGENT_IMPERSONATION', points: 40, evidence: 'উপায় প্রধান কার্যালয় থেকে বলছি', explanation: 'Official agents never initiate outbound requests demanding money.' },
        { type: 'UPFRONT_FEE_DEMAND', points: 30, evidence: '২,৫০০ টাকা সিকিউরিটি ফি', explanation: 'Legitimate MFS features never require pre-transfers to activate.' },
        { type: 'URGENCY_TRIGGER', points: 18, evidence: 'অবিলম্বে এই এজেন্ট নম্বরে', explanation: 'Artificial urgency forces rushed decisions.' }
      ],
      case_card: {
        what_happened: 'Caller impersonating an upay representative asked user to cash out ৳2,500 to unlock wallet limits.',
        why_risky: 'Classic advance-fee fraud targeting MFS customers. Upay never requires fee payments to verify accounts.',
        what_upay_should_do: 'Enforce soft friction delay. Display an in-app advisory banner that upay never charges verification fees.'
      },
      decision_recommendation: 'SOFT_FRICTION',
      requires_human_review: false,
      ml: {
        message_probability: 0.942,
        reason_codes: [
          { ngram: 'উপায় প্রধান', contribution: 0.28 },
          { ngram: 'সিকিউরিটি ফি', contribution: 0.34 },
          { ngram: 'অবিলম্বে', contribution: 0.21 }
        ]
      },
      scoring: {
        rule_score: 88,
        ml_score: 94,
        llm_adjustment: 0,
        final_score: 88
      }
    }
  },
  {
    id: 'demo-otp-harvest',
    name: '2. OTP & PIN Harvesting',
    nameBn: '২. ওটিপি ও পিন ফাঁদ',
    targetView: 'scam-shield',
    targetTab: 'message',
    category: 'Credential Theft',
    badge: 'CRITICAL RISK (96/100)',
    badgeColor: 'rose',
    description: 'Deceptive SMS claiming account suspension unless user shares 6-digit OTP code.',
    descriptionBn: 'অ্যাকাউন্ট বন্ধ হওয়ার ভয় দেখিয়ে ৬ ডিজিটের ওটিপি কোড হাতিয়ে নেওয়ার চেষ্টা।',
    inputText: 'জরুরি নিরাপত্তা সতর্কতা: আপনার উপায় অ্যাকাউন্টে সন্দেহজনক লগইন ধরা পড়েছে। ওয়ালেট বন্ধ হওয়া রোধ করতে আপনার মোবাইলে আসা ৬ সংখ্যার OTP কোডটি এখনই এসএমএস করে পাঠান।',
    deterministicReport: {
      riskScore: 96,
      riskLevel: 'CRITICAL',
      summary: 'Direct credential harvesting detected. Exploits threat of account blockage to steal OTP.',
      summary_bn: 'সরাসরি ওটিপি হাতিয়ে নেওয়ার চেষ্টা সনাক্ত হয়েছে। অ্যাকাউন্ট বন্ধের ভয় দেখিয়ে তথ্য চুরির কৌশল।',
      signals: [
        { type: 'OTP_HARVESTING_ATTEMPT', points: 50, evidence: '৬ সংখ্যার OTP কোডটি এখনই এসএমএস', explanation: 'OTPs grant absolute session takeover capability.' },
        { type: 'ACCOUNT_SUSPENSION_THREAT', points: 30, evidence: 'ওয়ালেট বন্ধ হওয়া রোধ করতে', explanation: 'Creates panic to bypass rational caution.' },
        { type: 'URGENT_DEADLINE', points: 16, evidence: 'এখনই এসএমএস করে পাঠান', explanation: 'Short deadline suppresses verification.' }
      ],
      case_card: {
        what_happened: 'Target received a spoofed SMS threatening wallet closure unless OTP is transmitted.',
        why_risky: 'Revealing OTP allows adversary to bind new device and drain balance immediately.',
        what_upay_should_do: 'Flag destination phone number. Send proactive push notification warning user never to disclose OTP.'
      },
      decision_recommendation: 'HOLD_FOR_REVIEW',
      requires_human_review: true,
      review_reason: 'Critical credential harvesting signature requires analyst review of origin phone number.',
      ml: {
        message_probability: 0.985,
        reason_codes: [
          { ngram: 'OTP কোড', contribution: 0.42 },
          { ngram: 'ওয়ালেট বন্ধ', contribution: 0.31 },
          { ngram: 'এখনই এসএমএস', contribution: 0.22 }
        ]
      },
      scoring: {
        rule_score: 96,
        ml_score: 98,
        llm_adjustment: 0,
        final_score: 96
      }
    }
  },
  {
    id: 'demo-account-takeover',
    name: '3. Account Takeover (ATO)',
    nameBn: '৩. অ্যাকাউন্ট টেকওভার',
    targetView: 'pre-send',
    category: 'ATO Behavioral Anomaly',
    badge: 'CRITICAL RISK (92/100)',
    badgeColor: 'rose',
    description: 'Transaction submitted from a brand-new device (age 0 days) in Sylhet at 03:15 AM to an unknown wallet for ৳24,500.',
    descriptionBn: 'ভোর ৩:১৫ মিনিটে নতুন ডিভাইস থেকে অপরিচিত নম্বরে অস্বাভাবিক বড় অঙ্কের লেনদেন।',
    transactionData: {
      sender: '01711000001',
      receiver: '01999888777',
      amount: 24500,
      type: 'send_money',
      channel: 'app',
      device_id: 'dev_brand_new_9918',
      device_age_days: 0,
      geo_district: 'Sylhet',
      is_new_recipient: true,
      hour: 3
    }
  },
  {
    id: 'demo-mule-ring',
    name: '4. Mule Network Ring',
    nameBn: '৪. মানি-মিউল নেটওয়ার্ক',
    targetView: 'review',
    category: 'Graph Network Analysis',
    badge: 'GRAPH ALERT (94/100)',
    badgeColor: 'purple',
    description: 'Wallet 01700999001 received 12 rapid inflows from separate victims followed by immediate cash-out to 4 agents.',
    descriptionBn: '১২ জন ভিকটিমের টাকা এক ওয়ালেটে দ্রুত একত্রিত করে ৪টি এজেন্টের মাধ্যমে তাৎক্ষণিক ক্যাশ-আউট।',
    muleWallet: '01700999001'
  },
  {
    id: 'demo-agent-anomaly',
    name: '5. Agent Structuring Anomaly',
    nameBn: '৫. এজেন্ট অস্বাভাবিকতা ও স্মারফিং',
    targetView: 'review',
    category: 'Agent Anomaly',
    badge: 'PEER ANOMALY (85/100)',
    badgeColor: 'amber',
    description: 'Agent 01800999001 exhibits structuring behavior: repetitive ৳24,900 cash-outs at 2:00 AM (Z-score 5.2 std dev vs peer group).',
    descriptionBn: 'লিমিট ফাঁকি দিতে রাত ২টায় বারবার ২৪,৯০০ টাকার ক্যাশ-আউট (সহকর্মীদের চেয়ে ৫.২ গুণ বেশি)।',
    agentId: '01800999001'
  },
  {
    id: 'demo-benign-lookalike',
    name: '6. Benign Look-alike (Legitimate)',
    nameBn: '৬. বৈধ অফিসিয়াল নোটিশ (নিরাপদ)',
    targetView: 'scam-shield',
    targetTab: 'message',
    category: 'Legitimate Advisory',
    badge: 'SAFE (4/100)',
    badgeColor: 'emerald',
    description: 'Official security advisory informing customer that upay never requests private PINs.',
    descriptionBn: 'উপায়-এর অফিসিয়াল নিরাপত্তা বার্তা যেখানে সতর্ক করা হয়েছে কখনো পিন শেয়ার না করতে।',
    inputText: 'প্রিয় গ্রাহক, উপায় কখনো আপনার পিন বা ওটিপি জানতে চাইবে না। সতর্ক থাকুন এবং নিরাপদ লেনদেন করুন। প্রয়োজনে কল করুন 16268।',
    deterministicReport: {
      riskScore: 4,
      riskLevel: 'LOW',
      summary: 'Legitimate advisory communication detected. No fraud markers present.',
      summary_bn: 'বৈধ প্রাতিষ্ঠানিক সতর্কবার্তা সনাক্ত হয়েছে। কোনো প্রতারণামূলক ঝুঁকি নেই।',
      signals: [],
      case_card: {
        what_happened: 'Legitimate brand advisory reminding customer of PIN confidentiality.',
        why_risky: 'No fraud risk. This is safe, expected communication from official helpline 16268.',
        what_upay_should_do: 'Allow immediately. No intervention needed.'
      },
      decision_recommendation: 'ALLOW',
      requires_human_review: false,
      ml: {
        message_probability: 0.012,
        reason_codes: []
      },
      scoring: {
        rule_score: 0,
        ml_score: 4,
        llm_adjustment: 0,
        final_score: 4
      }
    }
  }
];
