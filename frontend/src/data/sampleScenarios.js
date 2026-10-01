export const SAMPLE_SCENARIOS = [
  {
    id: 'account-suspension',
    title: 'Fake Account Suspension',
    category: 'Urgent Threat',
    icon: 'AlertTriangle',
    text: 'URGENT NOTICE: Your bank account has been flagged for suspicious activity and will be permanently BLOCKED within 2 hours. Send ৳500 immediately to verify your identity and restore access: https://secure-bank-verify.xyz/login',
  },
  {
    id: 'customer-support',
    title: 'Fake Customer Support',
    category: 'Impersonation',
    icon: 'Headphones',
    text: 'Hello from Official Helpdesk Support. We noticed an unauthorized transaction of $480 on your card. To cancel this debit, please install AnyDesk or reply with your 6-digit verification code right now so our agent can revert it.',
  },
  {
    id: 'prize-scam',
    title: 'Prize Scam',
    category: 'Fake Reward',
    icon: 'Gift',
    text: 'CONGRATULATIONS! Your mobile number won the 2026 International Tech Sweepstakes grand prize of $10,000 USD! To release your funds, transfer the $50 clearance processing fee via wire transfer to our agent today.',
  },
  {
    id: 'otp-request',
    title: 'OTP Request',
    category: 'Credential Theft',
    icon: 'KeyRound',
    text: 'Dear customer, your mobile banking session is expiring. We have dispatched a one-time OTP to your SMS. Read back the 6-digit code immediately to prevent your wallet from deactivation.',
  },
  {
    id: 'emergency-request',
    title: 'Emergency Money Request',
    category: 'Social Engineering',
    icon: 'HeartHandshake',
    text: 'Hey, I lost my phone and wallet in an accident and this is my friend’s number. I am stranded at the clinic and urgently need ৳3,000 for medicine. Please bKash it right now to 01700-000000, I will pay you back tomorrow morning!',
  },
  {
    id: 'suspicious-payment-link',
    title: 'Suspicious Payment Link',
    category: 'Phishing',
    icon: 'Link',
    text: 'Your package courier delivery #BD-9482 could not be dispatched due to an unpaid customs fee of ৳120. Update your address and pay the fee immediately to avoid parcel destruction: http://courier-track-express.top/pay',
  }
];

export const SIMULATION_SCENARIOS = [
  {
    id: 'sim-bank',
    title: 'The Imposter Bank Manager',
    difficulty: 'High Urgency',
    description: 'A message claims your debit card was used in another city and asks you to confirm your PIN to reverse the charge.',
    sender: 'Bank Security Alert (Unknown Sender)',
    message: 'URGENT: Your Visa card ending in 4021 was charged ৳18,500 at 02:14 AM. If this was not you, send your 4-digit card PIN and the OTP you received to cancel this transaction immediately.',
    analysisHint: 'Legitimate banks NEVER ask for your PIN or OTP to reverse transactions.'
  },
  {
    id: 'sim-relative',
    title: 'The "Stuck at Hospital" Friend',
    difficulty: 'Emotional Pressure',
    description: 'An unknown number claiming to be a friend in an emergency demanding immediate mobile wallet transfer.',
    sender: '+880 1823-999999',
    message: 'Bro please don’t call this number! My phone got stolen and I am at the emergency room with an injured leg. Send ৳5,000 to this bKash merchant urgently for the hospital deposit!',
    analysisHint: 'Always call the person on their known real phone number or contact common relatives first before sending money.'
  },
  {
    id: 'sim-parcel',
    title: 'The Trapped Courier Parcel',
    difficulty: 'Low Dollar Lure',
    description: 'A small fee request (৳150) that leads to a fake payment gateway stealing debit card details.',
    sender: 'Global Express Logistics',
    message: 'Final notice: Your overseas delivery is held at customs. A minimal tariff of ৳150 is overdue. Settle payment within 60 minutes at http://express-customs-bd.site/fee to prevent package destruction.',
    analysisHint: 'Scammers use micro-payments (৳100 - ৳500) because victims don’t hesitate, but the linked website captures entire credit card details.'
  }
];
