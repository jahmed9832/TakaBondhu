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
    description: 'Impersonates upay customer service agent demanding an upfront "security verification fee" to raise wallet limits.',
    descriptionBn: 'উপায় কর্মকর্তা সেজে অ্যাকাউন্ট লিমিট বাড়ানোর নামে অগ্রিম ভেরিফিকেশন ফি দাবি।',
    inputText: 'আসসালামু আলাইকুম, আমি উপায় প্রধান কার্যালয় থেকে বলছি। আপনার ওয়ালেটের ট্রানজেকশন লিমিট ১ লক্ষ টাকায় উন্নীত করতে অবিলম্বে এই এজেন্ট নম্বরে ২,৫০০ টাকা সিকিউরিটি ফি ক্যাশ-আউট করুন।'
  },
  {
    id: 'demo-otp-harvest',
    name: '2. OTP & PIN Harvesting',
    nameBn: '২. ওটিপি ও পিন ফাঁদ',
    targetView: 'scam-shield',
    targetTab: 'message',
    category: 'Credential Theft',
    description: 'Deceptive SMS claiming account suspension unless user shares 6-digit OTP code.',
    descriptionBn: 'অ্যাকাউন্ট বন্ধ হওয়ার ভয় দেখিয়ে ৬ ডিজিটের ওটিপি কোড হাতিয়ে নেওয়ার চেষ্টা।',
    inputText: 'জরুরি নিরাপত্তা সতর্কতা: আপনার উপায় অ্যাকাউন্টে সন্দেহজনক লগইন ধরা পড়েছে। ওয়ালেট বন্ধ হওয়া রোধ করতে আপনার মোবাইলে আসা ৬ সংখ্যার OTP কোডটি এখনই এসএমএস করে পাঠান।'
  },
  {
    id: 'demo-account-takeover',
    name: '3. Account Takeover (ATO)',
    nameBn: '৩. অ্যাকাউন্ট টেকওভার',
    targetView: 'pre-send',
    category: 'ATO Behavioral Anomaly',
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
      recipient_age_days: 0,
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
    description: 'Wallet cust_mule_04_unseen received rapid repetitive inflows totaling ৳2.5M from 4 victims.',
    descriptionBn: '৪ জন ভিকটিমের থেকে দ্রুত মোট ২৫ লাখ টাকার বেশি লেনদেন এক ওয়ালেটে (cust_mule_04_unseen) সংগ্রহ।',
    muleWallet: 'cust_mule_04_unseen'
  },
  {
    id: 'demo-agent-anomaly',
    name: '5. Agent Structuring Anomaly',
    nameBn: '৫. এজেন্ট অস্বাভাবিকতা ও স্মারফিং',
    targetView: 'review',
    category: 'Agent Anomaly',
    description: 'Agent agent_0001 exhibits structuring behavior: repetitive ৳24,500–৳24,950 cash-outs at late night (Z-score 5.0 std dev vs peer group).',
    descriptionBn: 'লিমিট ফাঁকি দিতে গভীর রাতে বারবার ২৪,৫০০-২৪,৯৫০ টাকার ক্যাশ-আউট (সহকর্মীদের চেয়ে ৫.০ গুণ বেশি Z-স্কোর)।',
    agentId: 'agent_0001'
  },
  {
    id: 'demo-benign-lookalike',
    name: '6. Benign Look-alike (Legitimate)',
    nameBn: '৬. বৈধ অফিসিয়াল নোটিশ (নিরাপদ)',
    targetView: 'scam-shield',
    targetTab: 'message',
    category: 'Legitimate Advisory',
    description: 'Official security advisory informing customer that upay never requests private PINs.',
    descriptionBn: 'উপায়-এর অফিসিয়াল নিরাপত্তা বার্তা যেখানে সতর্ক করা হয়েছে কখনো পিন শেয়ার না করতে।',
    inputText: 'প্রিয় গ্রাহক, উপায় কখনো আপনার পিন বা ওটিপি জানতে চাইবে না। সতর্ক থাকুন এবং নিরাপদ লেনদেন করুন। প্রয়োজনে কল করুন 16268।'
  }
];
