// TakaBondhu - Unified Bilingual Localization (Bangla default, English option)
// Zero jargon on user screens (no "fusion", "n-gram", "PR-AUC", "SHAP", "z-score")

export const translations = {
  bn: {
    // Brand & Header
    brandTitle: 'টাকাবন্ধু',
    brandTagline: 'আপনার টাকার বন্ধু',
    brandSub: 'উপায় গ্রাহকদের বিশ্বস্ত টাকা সুরক্ষা বন্ধু',
    
    // Top Navigation (4 big tabs)
    navCheckMessage: 'মেসেজ চেক করুন',
    navBeforeSend: 'টাকা পাঠানোর আগে',
    navTakaPlan: 'টাকা-পরিকল্পনা',
    navFraudTeam: 'ফ্রড টিম (উপায়ের জন্য)',
    voiceBtnNav: 'ভয়েস',

    // Home / Hero
    heroHeadline: 'আপনার টাকার বন্ধু',
    heroSub: 'সন্দেহজনক মেসেজ বা লেনদেন যাচাই করে আপনার কষ্টার্জিত টাকা সুরক্ষিত রাখুন।',
    btnHeroCheckMessage: 'মেসেজ চেক করুন',
    btnHeroBeforeSend: 'টাকা পাঠানোর আগে চেক',
    btnHeroVoice: 'কথা বলে যাচাই করুন',
    helperHeroCheck: 'যেকোনো সন্দেহজনক এসএমএস বা বার্তা যাচাই করতে ট্যাপ করুন',
    helperHeroBeforeSend: 'কাউকে টাকা পাঠানোর আগে নম্বর ও লেনদেন নিরাপদ কি না পরীক্ষা করুন',

    // How it works (3 icons)
    howItWorksTitle: 'কীভাবে কাজ করে?',
    step1Title: '১. মেসেজ বা তথ্য দিন',
    step1Desc: 'সন্দেহজনক মেসেজটি পেস্ট করুন অথবা মুখে বলুন',
    step2Title: '২. মুহূর্তেই যাচাই',
    step2Desc: 'টাকাবন্ধুর বুদ্ধিমত্তা প্রতারণার লক্ষণ খুঁজে বের করে',
    step3Title: '৩. নিরাপদে থাকুন',
    step3Desc: 'পরিষ্কার পরামর্শ নিয়ে নিশ্চিন্তে আর্থিক সিদ্ধান্ত নিন',

    // Demo Bar (Collapsible)
    demoToggleOpen: 'উদাহরণ দেখুন',
    demoToggleClose: 'উদাহরণ বন্ধ করুন',
    demoBannerTitle: 'উদাহরণ পরীক্ষা (১-ক্লিক ডেমো)',
    demoBannerDesc: 'যেকোনো একটি উদাহরণে চাপ দিয়ে দেখুন কীভাবে কাজ করে:',
    scenarioFakeAgent: 'ভুয়া এজেন্ট',
    scenarioOtpHarvest: 'ওটিপি চুরি',
    scenarioAto: 'একাউন্ট দখল',
    scenarioMule: 'টাকার চক্র (মিউল)',
    scenarioAgentSmurf: 'সন্দেহজনক এজেন্ট',
    scenarioSafeMessage: 'নিরাপদ মেসেজ',

    // Message Analyzer
    analyzerTitle: 'মেসেজটি কি নিরাপদ?',
    analyzerSubtitle: 'আপনার মোবাইলে আসা এসএমএস বা বার্তাটি নিচে পেস্ট করুন বা লিখুন।',
    inputMessageLabel: 'মেসেজের লেখা',
    inputMessagePlaceholder: 'এখানে মেসেজ পেস্ট করুন... (যেমন: ওটিপি কোড পাঠান, বা লটারিতে টাকা জিতেছেন)',
    inputMessageHelper: 'আপনার গোপন পিন বা পাসওয়ার্ড কখনোই কাউকে দেবেন না।',
    btnPaste: 'কপি করা মেসেজ বসান',
    btnClear: 'মুছুন',
    btnAnalyze: 'মেসেজ যাচাই করুন',
    btnAnalyzing: 'যাচাই করা হচ্ছে...',
    btnSpeak: 'ভয়েসে কথা বলুন',
    listening: 'শুনছি... বলুন',

    // Big Verdicts (Rule: ONE big verdict first)
    verdictSafe: 'নিরাপদ',
    verdictCareful: 'সাবধান',
    verdictRisky: 'ঝুঁকিপূর্ণ — টাকা পাঠাবেন না',
    reasonSafe: 'এই বার্তায় কোনো স্পষ্ট প্রতারণা বা ভয়ের লক্ষণ মেলেনি। সাধারণ সতর্কতা বজায় রাখুন।',
    reasonCareful: 'কিছু সন্দেহজনক তথ্য রয়েছে। কোনো সিদ্ধান্ত নেওয়ার আগে উপায়ের সাথে নিশ্চিত হোন।',
    reasonRisky: 'এটি স্পষ্ট প্রতারণার ফাঁদ! কোনো অবস্থাতেই পিন কোড, ওটিপি বা টাকা পাঠাবেন না।',

    // 2-3 What to do now steps
    whatToDoTitle: 'এখন আপনার কী করা উচিত:',
    stepsSafe: [
      'স্বাভাবিকভাবে লেনদেন চালিয়ে যেতে পারেন।',
      'মনে রাখবেন, উপায় কখনোই আপনার গোপন পিন জানতে চাইবে না।'
    ],
    stepsCareful: [
      'মেসেজে থাকা কোনো লিংকে ক্লিক করবেন না বা টাকা পাঠাবেন না।',
      'প্রয়োজনে উপায়ের অফিশিয়াল হেল্পলাইনে (16268) কল করে তথ্য যাচাই করুন।'
    ],
    stepsRisky: [
      'কোনো টাকা বা ওটিপি/পিন কোড কাউকে দেবেন না।',
      'প্রেরকের নম্বরটি ব্লক করুন এবং উপায়ের হেল্পলাইনে প্রতারণার অভিযোগ জানান।'
    ],

    // Technical Details (Collapsed)
    detailsToggleOpen: 'বিস্তারিত দেখুন (কারিগরি ও নিরাপত্তা তথ্য)',
    detailsToggleClose: 'বিস্তারিত লুকান',
    ruleEvidenceTitle: 'শনাক্ত করা নিরাপত্তা সংকেত',
    blockAPredictionTitle: '১. পূর্বাভাষ বিশ্লেষণ (নিয়ম ও এআই মডেল)',
    blockBAssumptionsTitle: '২. সিস্টেমের মূল নীতিমালা ও অনুমান',
    blockCExplanationTitle: '৩. এআই-এর বিশ্লেষণ ও সারসংক্ষেপ',
    noAutonomousBlockNotice: 'টাকাবন্ধুর নীতি: কোনো টাকা স্বয়ংক্রিয়ভাবে আটকানো বা ফ্রিজ করা হয় না। প্রয়োজনে মানুষের দ্বারা পর্যালোচনার সুপারিশ করা হয়।',
    humanReviewNotice: 'আমাদের টিম এটি পর্যালোচনা করবে। অনুগ্রহ করে উপায়ের সাথে যোগাযোগ করুন।',

    // Pre-Send Checker
    preSendTitle: 'টাকা পাঠানোর আগে যাচাই',
    preSendSubtitle: 'কাউকে টাকা পাঠানোর আগে নম্বর ও লেনদেন নিরাপদ কি না পরীক্ষা করে নিশ্চিত হোন।',
    senderLabel: 'আপনার ওয়ালেট নম্বর',
    senderHelper: 'যে ওয়ালেট থেকে টাকা পাঠাচ্ছেন (১১ ডিজিট)',
    receiverLabel: 'প্রাপকের ওয়ালেট নম্বর',
    receiverHelper: 'যাকে টাকা পাঠাতে চান তার মোবাইল নম্বর',
    amountLabel: 'টাকার পরিমাণ (৳)',
    amountHelper: 'কত টাকা পাঠাতে চাচ্ছেন লিখুন',
    typeLabel: 'লেনদেনের ধরন',
    memoLabel: 'রেফারেন্স বা বার্তা (ঐচ্ছিক)',
    memoHelper: 'টাকা পাঠানোর কারণ বা সাথে থাকা মেসেজ',
    newRecipientLabel: 'এই নম্বরে কি প্রথমবার টাকা পাঠাচ্ছেন?',
    newRecipientHelper: 'নতুন প্রাপক হলে অতিরিক্ত সতর্কতা নেওয়া হয়',
    btnPreSendCheck: 'টাকা পাঠানোর আগে যাচাই করুন',
    btnPreSendChecking: 'যাচাই করা হচ্ছে...',
    frictionTitle: 'টাকাবন্ধুর বন্ধুসুলভ সতর্কতা',
    frictionWarning: 'আপনি একজন নতুন নম্বরে টাকা পাঠাচ্ছেন। কোনো অপরিচিত ব্যক্তি যদি লটারি, চাকরি বা ভয় দেখিয়ে টাকা চায়, তবে পাঠাবেন না।',
    frictionConfirm: 'আমি প্রাপকের পরিচয় নিজে কথা বলে নিশ্চিত হয়েছি',
    frictionProceed: 'বুঝেছি, লেনদেনে এগিয়ে যান',
    frictionWait: 'একটু ভাবুন...',

    // Fraud Team Tab (for upay)
    fraudTeamTitle: 'ফ্রড টিম ড্যাশবোর্ড (উপায়ের জন্য)',
    fraudTeamSubtitle: 'পর্যালোচনা কিউ, মিউল নেটওয়ার্ক এবং আর্থিক নিরাপত্তা প্রভাব।',
    demoDataBadge: 'ডেমো ডেটা — পরীক্ষামূলক পরিবেশ',
    tabQueue: 'রিভিউ কিউ',
    tabQueueDesc: 'উচ্চ ঝুঁকির কারণে পর্যালোচনার জন্য অপেক্ষমাণ লেনদেনের তালিকা।',
    tabGraph: 'মিউল নেটওয়ার্ক গ্রাফ',
    tabGraphDesc: 'সন্দেহজনক চক্র ও টাকা পাচারের নেটওয়ার্ক মানচিত্র।',
    tabMoneySaved: 'কত টাকা বাঁচবে',
    tabMoneySavedDesc: 'টাকাবন্ধুর সুরক্ষায় বছরে কত টাকা বাঁচতে পারে তার সহজ ক্যালকুলেটর।',
    caseCardHeader: 'কেস কার্ড (তদন্ত তথ্য)',
    caseWhatHappened: 'কী ঘটেছে?',
    caseWhyRisky: 'কেন এটি ঝুঁকিপূর্ণ?',
    caseWhatUpayShouldDo: 'উপায়ের কী করা উচিত?',
    btnApprove: 'নিরাপদ হিসেবে অনুমোদন',
    btnFlagFraud: 'ফ্রড হিসেবে চিহ্নিত করুন',
    btnEscalate: 'উচ্চতর তদন্তে পাঠান',

    // Money Saved Calculator (Part 2)
    calcTitle: 'কত টাকা বাঁচবে — সহজ ক্যালকুলেটর',
    calcSubtitle: 'বাস্তব প্যারামিটার ও মডেলের তথ্যের ওপর ভিত্তি করে আনুমানিক হিসাব।',
    calcAttemptsLabel: 'মাসে কতটি স্ক্যাম চেষ্টা হয়',
    calcAttemptsHelper: 'প্রতি মাসে গ্রাহকদের লক্ষ্য করে প্রতারণার মোট সংখ্যা (ডিফল্ট: ১০,০০০)',
    calcAvgLossLabel: 'একটি স্ক্যামে গড় ক্ষতি (৳)',
    calcAvgLossHelper: 'একটি সফল প্রতারণায় ভিকটিমের আনুমানিক গড় ক্ষতি',
    calcSuccessRateLabel: 'কতভাগ সফল হতো (%)',
    calcSuccessRateHelper: 'টাকাবন্ধু না থাকলে কত শতাংশ চেষ্টা সফল হতো',
    calcResultHeadline: 'TakaBondhu বছরে আনুমানিক ৳{amount} বাঁচাতে পারে',
    calcFormulaHeader: 'হিসাব পদ্ধতি:',
    calcFormulaText: 'চেষ্টা × % টাকাবন্ধু ধরে ({catchRate}%) × % সফল হতো ({successRate}%) × গড় ক্ষতি (৳{avgLoss}) × ১২ মাস − বাৎসরিক খরচ (৳{cost}) = ৳{netSaved}',
    calcDisclaimer: 'শুধু অনুমান — বাস্তব উপায় ডেটা নয়',
    calcToggleWords: 'বাংলা কথায় দেখান (কোটি/লাখ)',
    calcWorst: 'কম অনুমান',
    calcBase: 'মূল অনুমান',
    calcBest: 'উচ্চ অনুমান',

    // Tooltips
    tooltipScore: '০ থেকে ১০০-এর মধ্যে ঝুঁকির মাত্রা। বেশি সংখ্যা মানে বেশি ঝুঁকি।',
    tooltipAttempts: 'গ্রাহকদের পাঠানো মোট ভুয়া মেসেজ বা প্রতারণা চেষ্টার মাসিক সংখ্যা।',
    tooltipAvgLoss: 'বাংলাদেশ ব্যাংকিং ও এমএফএস পরিসংখ্যান অনুসারে গ্রাহকের গড় ক্ষতি।',
    tooltipSuccessRate: 'সচেতনতার অভাবে সাধারণ গ্রাহকদের যে অংশ ফাঁদে পা দেন।',
    tooltipCatchRate: 'মডেলের যাচাইকৃত রিকল ক্ষমতা (ml/reports/results.json থেকে সরাসরি প্রাপ্ত)।',

    // Accessibility & Footer
    textSizeToggle: 'লেখা বড়/স্বাভাবিক',
    langToggle: 'English',
    footerBrand: 'টাকাবন্ধু — আপনার আর্থিক নিরাপত্তা সঙ্গী।',
    footerCopyright: '© ২০২৬ টাকাবন্ধু। সর্বস্বত্ব সংরক্ষিত।',
    footerDisclaimer: 'এটি একটি শিক্ষামূলক ও পরীক্ষামূলক নিরাপত্তা প্ল্যাটফর্ম।'
  },

  en: {
    // Brand & Header
    brandTitle: 'TAKABONDHU',
    brandTagline: "Your money's friend",
    brandSub: "Upay's friend that keeps your money safe",
    
    // Top Navigation (4 big tabs)
    navCheckMessage: 'Check a Message',
    navBeforeSend: 'Before You Send',
    navTakaPlan: 'Taka Plan',
    navFraudTeam: 'Fraud Team (for upay)',
    voiceBtnNav: 'Voice',

    // Home / Hero
    heroHeadline: "Your money's friend",
    heroSub: 'Check suspicious messages and payments before you act to keep your money safe.',
    btnHeroCheckMessage: 'Check a Message',
    btnHeroBeforeSend: 'Check Before You Send',
    btnHeroVoice: 'Talk to Check',
    helperHeroCheck: 'Tap to screen any suspicious SMS or payment text',
    helperHeroBeforeSend: 'Test recipient and transfer risk before sending your money',

    // How it works (3 icons)
    howItWorksTitle: 'How it works',
    step1Title: '1. Paste or Speak',
    step1Desc: 'Paste the suspicious message or speak into your microphone',
    step2Title: '2. Instant Check',
    step2Desc: 'TakaBondhu instantly analyzes fraudulent signs and patterns',
    step3Title: '3. Stay Safe',
    step3Desc: 'Receive a clear verdict and 2-3 straightforward next steps',

    // Demo Bar (Collapsible)
    demoToggleOpen: 'Try an example',
    demoToggleClose: 'Hide examples',
    demoBannerTitle: 'Try an Example (1-Click Test)',
    demoBannerDesc: 'Tap any example to see how TakaBondhu works:',
    scenarioFakeAgent: 'Fake Agent',
    scenarioOtpHarvest: 'OTP Theft',
    scenarioAto: 'Account Takeover',
    scenarioMule: 'Mule Network',
    scenarioAgentSmurf: 'Suspicious Agent',
    scenarioSafeMessage: 'Safe Message',

    // Message Analyzer
    analyzerTitle: 'Is this safe?',
    analyzerSubtitle: 'Paste or type any suspicious message or SMS below.',
    inputMessageLabel: 'Message Content',
    inputMessagePlaceholder: 'Paste message here... (e.g. send OTP code, or you won prize money)',
    inputMessageHelper: 'Never share your secret PIN or password with anyone.',
    btnPaste: 'Paste Message',
    btnClear: 'Clear',
    btnAnalyze: 'Check Message',
    btnAnalyzing: 'Checking...',
    btnSpeak: 'Speak via Voice',
    listening: 'Listening... speak now',

    // Big Verdicts (Rule: ONE big verdict first)
    verdictSafe: 'Looks safe',
    verdictCareful: 'Be careful',
    verdictRisky: "Risky — don't send money",
    reasonSafe: 'No obvious fraud patterns detected. Practice standard financial care.',
    reasonCareful: 'Suspicious cues detected. Double check with upay before taking action.',
    reasonRisky: 'High likelihood of fraud! Never share your PIN, OTP, or send money.',

    // 2-3 What to do now steps
    whatToDoTitle: 'What to do now:',
    stepsSafe: [
      'You can proceed with your regular transaction.',
      'Remember, upay will never ask for your secret 4-digit PIN.'
    ],
    stepsCareful: [
      'Do not click links or send any advance money.',
      'Verify the request through official upay helpline 16268.'
    ],
    stepsRisky: [
      'Do not send money, OTP, or PIN under any condition.',
      'Block the caller and report the number to upay customer service.'
    ],

    // Technical Details (Collapsed)
    detailsToggleOpen: 'See details (Technical info)',
    detailsToggleClose: 'Hide details',
    ruleEvidenceTitle: 'Triggered Security Evidence',
    blockAPredictionTitle: '1. Prediction Analysis (Rules & Model)',
    blockBAssumptionsTitle: '2. Operating Assumptions & Baseline',
    blockCExplanationTitle: '3. AI-Generated Contextual Explanation',
    noAutonomousBlockNotice: 'Hard Rule: No money is ever blocked autonomously. Decisions guide human review.',
    humanReviewNotice: 'Our team will review this. Please confirm with upay.',

    // Pre-Send Checker
    preSendTitle: 'Before You Send Money',
    preSendSubtitle: 'Screen proposed transfers to prevent accidental loss or fraud.',
    senderLabel: 'Your Wallet Number',
    senderHelper: 'The 11-digit wallet sending the funds',
    receiverLabel: 'Recipient Wallet Number',
    receiverHelper: 'The number you intend to send money to',
    amountLabel: 'Amount (৳)',
    amountHelper: 'How much money you want to transfer',
    typeLabel: 'Transfer Type',
    memoLabel: 'Reference / Message (Optional)',
    memoHelper: 'Note or SMS accompanying this payment',
    newRecipientLabel: 'Sending to this recipient for the first time?',
    newRecipientHelper: 'Extra safety checks are applied for new recipients',
    btnPreSendCheck: 'Check Before Sending',
    btnPreSendChecking: 'Checking...',
    frictionTitle: 'TakaBondhu Safety Pause',
    frictionWarning: 'You are transferring funds to a new recipient. If an unknown person urged you to send this for a fee, prize, or job, stop and verify.',
    frictionConfirm: 'I have independently verified the recipient identity.',
    frictionProceed: 'I Understand, Proceed',
    frictionWait: 'Please reflect...',

    // Fraud Team Tab (for upay)
    fraudTeamTitle: 'Fraud Operations Team (for upay)',
    fraudTeamSubtitle: 'Triage review queue, mule network graphs, and fraud prevention impact.',
    demoDataBadge: 'demo data — synthetic testing environment',
    tabQueue: 'Review Queue',
    tabQueueDesc: 'High-risk flagged cases awaiting human analyst triage.',
    tabGraph: 'Mule Network Graph',
    tabGraphDesc: 'Visual mapping of mule accounts and rapid layering transfers.',
    tabMoneySaved: 'Money Saved',
    tabMoneySavedDesc: 'Transparent annual fraud savings calculator for upay operations.',
    caseCardHeader: 'Case Analysis (Triage Card)',
    caseWhatHappened: 'What happened?',
    caseWhyRisky: 'Why is it risky?',
    caseWhatUpayShouldDo: 'What upay should do',
    btnApprove: 'Approve (Safe)',
    btnFlagFraud: 'Flag as Fraud',
    btnEscalate: 'Escalate for Investigation',

    // Money Saved Calculator (Part 2)
    calcTitle: 'Money Saved — Simple Calculator',
    calcSubtitle: 'Calculated using empirical model metrics and baseline operational parameters.',
    calcAttemptsLabel: 'Scam attempts per month',
    calcAttemptsHelper: 'Estimated monthly fraudulent attempts targeting users (Default: 10,000)',
    calcAvgLossLabel: 'Average loss per scam (৳)',
    calcAvgLossHelper: 'Average BDT lost per successful fraud incident',
    calcSuccessRateLabel: 'How many would have succeeded (%)',
    calcSuccessRateHelper: 'Percentage of attempts that would succeed without TakaBondhu',
    calcResultHeadline: 'TakaBondhu could help save about ৳{amount} per year',
    calcFormulaHeader: 'Step-by-step formula:',
    calcFormulaText: 'attempts × % TakaBondhu catches ({catchRate}%) × % that would have succeeded ({successRate}%) × avg loss (৳{avgLoss}) × 12 − running cost (৳{cost}) = ৳{netSaved}',
    calcDisclaimer: 'Illustrative estimate based on stated assumptions and a synthetic benchmark, not real upay data',
    calcToggleWords: 'Show in words (crore/lakh)',
    calcWorst: 'Worst Case',
    calcBase: 'Base Case',
    calcBest: 'Best Case',

    // Tooltips
    tooltipScore: 'Risk score from 0 to 100. Higher values indicate higher probability of fraud.',
    tooltipAttempts: 'Estimated total volume of fraudulent messages or payment requests per month.',
    tooltipAvgLoss: 'Empirical loss per successful fraud incident from baseline assumptions.',
    tooltipSuccessRate: 'Estimated fraction of scam attempts that succeed if not intercepted.',
    tooltipCatchRate: 'Actual model recall at review capacity loaded dynamically from ml/reports/results.json.',

    // Accessibility & Footer
    textSizeToggle: 'Toggle Text Size',
    langToggle: 'বাংলা',
    footerBrand: 'TakaBondhu — Your companion for safer financial decisions.',
    footerCopyright: '© 2026 TakaBondhu. All rights reserved.',
    footerDisclaimer: 'An educational safety tool • Never input actual bank passwords or PINs.'
  }
};

export function useI18n(lang = 'bn') {
  const currentLang = translations[lang] ? lang : 'bn';
  const dict = translations[currentLang];
  
  const t = (key, fallback = '') => {
    return dict[key] || fallback || key;
  };

  return { t, lang: currentLang, dict };
}

export default translations;
