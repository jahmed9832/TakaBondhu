/**
 * TakaBondhu Safety Knowledge Base
 * Curated financial fraud prevention and cybersecurity guidance for the prototype.
 * NOTE: These documents represent synthetic educational safety guidelines for TakaBondhu.
 * They are not official bank or MFS policies unless explicitly marked as such.
 */

export const KNOWLEDGE_DOCUMENTS = [
  {
    id: 'kb-acc-01',
    title: 'Account Suspension & Threat Scam Defense',
    category: 'ACCOUNT_SECURITY',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Financial institutions never demand money or immediate transfers under the threat of permanent account closure.',
    content: `
Account Suspension Scam Defense Protocol:
1. Threat of Immediate Closure: Scammers frequently generate artificial panic by claiming an account has been flagged for suspicious activity and will be permanently blocked within hours.
2. Demand for Reactivation Payments: Legitimate banking and Mobile Financial Services (MFS) will NEVER require an upfront fee, deposit, or money transfer to unlock or verify a customer account.
3. Verification Procedures: Official account reviews are handled in-branch or within the official mobile application through authenticated KYC workflows, never via unverified SMS or third-party payment requests.
4. Immediate Defensive Action: If an urgent account suspension warning is received, do not reply or send funds. Independently contact official customer service using verified numbers on your debit card or official website.
`.trim()
  },
  {
    id: 'kb-otp-01',
    title: 'OTP & Authentication Credential Safety',
    category: 'OTP_AND_CREDENTIAL_SAFETY',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'One-Time Passwords (OTPs) and PINs are secret keys. Legitimate representatives will never request your OTP or PIN.',
    content: `
One-Time Password (OTP) & PIN Confidentiality Standard:
1. Universal Non-Disclosure Rule: An OTP is equivalent to your digital signature and authorizes funds withdrawal. Never disclose an OTP, PIN, CVV, or password to anyone under any circumstances.
2. Impersonation of Support Agents: Scammers frequently claim to be "customer support", "fraud investigators", or "system administrators" verifying your identity. Legitimate representatives have zero operational need to know your OTP.
3. Distinguishing Safety Warnings: Automated alerts saying "Never share your OTP" are educational security advisories. In contrast, any message or caller asking you to "Provide the OTP" is an active social engineering attack.
4. Response Protocol: If an unexpected OTP arrives on your phone, your credentials may already be compromised. Immediately freeze your card and update your account password.
`.trim()
  },
  {
    id: 'kb-pay-01',
    title: 'Advance-Fee & Coerced Payment Scam Prevention',
    category: 'PAYMENT_SCAMS',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Requests for advance fees to unlock funds, release prizes, or reverse unauthorized transactions are fraudulent.',
    content: `
Advance-Fee & P2P Payment Fraud Prevention:
1. Advance Processing Fees: Any demand to transfer money (e.g. ৳500 or $50) to unlock a prize, receive a government grant, or claim an inheritance is a hallmark of advance-fee fraud.
2. Peer-to-Peer Transfer Pressure: Fraudsters insist on immediate transfers via mobile wallets (bKash, Nagad, upay, etc.) or cryptocurrency because these transactions are non-refundable and irreversible.
3. Reversal Traps: Scammers falsely claim they "accidentally sent money" and demand an immediate refund before you have independently verified your account balance.
4. Core Safety Principle: Never send money to receive money. Always check your official mobile app balance before acting on any transfer claim.
`.trim()
  },
  {
    id: 'kb-phi-01',
    title: 'Phishing Links & Malicious Domain Detection',
    category: 'PHISHING_AND_SUSPICIOUS_LINKS',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Inspect URLs carefully. Fake login portals mimic legitimate financial institutions using deceptive domains.',
    content: `
Phishing Links & Domain Security Guidance:
1. Lookalike & Typosquatted Domains: Attackers register domains like 'secure-bank-verify.xyz', 'bkash-bonus.net', or 'login-portal.site' to impersonate official institutions.
2. Credential Theft Portals: These links lead to replica login pages designed to harvest account numbers, passwords, PINs, and incoming OTPs in real time.
3. Shortened Links: Messages using URL shorteners (bit.ly, tinyurl) in financial contexts obscure the real destination and should always be treated as hostile.
4. Safe Link Handling: Never click links inside unsolicited SMS or email. Manually type the official domain in your browser or use the official mobile application.
`.trim()
  },
  {
    id: 'kb-sup-01',
    title: 'Fake Customer Support & Authority Impersonation',
    category: 'FAKE_CUSTOMER_SUPPORT',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Scammers spoof caller IDs and pose as bank managers, telecom agents, or police to demand compliance.',
    content: `
Authority & Customer Support Impersonation Guidelines:
1. Social Engineering by Title: Fraudsters invoke authority (e.g., "Central Bank Compliance Officer", "Cyber Crime Unit", "MFS Senior Manager") to create compliance and fear.
2. Caller ID Spoofing: Technological spoofing allows scammers to display official bank names or shortcodes on caller ID screens.
3. Verification Inversion: A legitimate bank will never call you and ask you to authenticate yourself by reading back private credentials that they supposedly sent you.
4. Safe Escalation: Terminate the call immediately. Hang up and dial the official hotline printed on the back of your bank card or official company portal.
`.trim()
  },
  {
    id: 'kb-prz-01',
    title: 'Lottery, Reward & Prize Scam Indicators',
    category: 'PRIZE_AND_REWARD_SCAMS',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'You cannot win a contest or lottery you never entered. Demands for fees to claim prizes are scams.',
    content: `
Lottery & Unsolicited Prize Scam Recognition:
1. Unsolicited Winnings: Messages announcing you have won ৳50,000, a car, or an international lottery without entering any competition are fraudulent.
2. Upfront Verification/Delivery Fees: The victim is told to pay tax, processing, customs, or delivery fees before the prize can be dispatched. Once paid, the fraudster disappears.
3. Exploitation of Joy: Scammers exploit excitement to bypass logical scrutiny and push for immediate payments.
4. Ground Truth: Legitimate lotteries deduct applicable taxes from the winnings themselves; they never require upfront out-of-pocket wire transfers.
`.trim()
  },
  {
    id: 'kb-soc-01',
    title: 'Social Engineering & Psychological Manipulation',
    category: 'SOCIAL_ENGINEERING',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Scammers manipulate emotions such as urgency, fear, greed, and obligation to prevent critical thinking.',
    content: `
Social Engineering Defense Principles:
1. Urgency Manipulation: Setting strict countdowns ("within 2 hours", "within 15 minutes") forces victims into panic mode where critical judgment is compromised.
2. Fear Exploitation: Threats of legal arrest, public defamation, or permanent financial loss are weaponized to force hasty actions.
3. The Golden Rule of Interruption: Whenever a communication creates intense urgency or fear, pause. Take 10 minutes to verify independently before taking any action.
4. Second-Opinion Safeguard: Discuss unexpected demands for money or secrets with a trusted family member or colleague before complying.
`.trim()
  },
  {
    id: 'kb-ver-01',
    title: 'Safe Account Verification & KYC Guidelines',
    category: 'SAFE_VERIFICATION',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Official account verification only occurs via authenticated in-app flows or physical branches.',
    content: `
Safe Account Verification & Identity Protocol:
1. Authorized In-App Channels: Up-to-date KYC (Know Your Customer) updates are submitted strictly through the verified mobile banking application with biometric or cryptographic safeguards.
2. No Third-Party Forms: Banks and payment services will never request biometric selfies, NID photos, or debit card numbers via Google Forms, WhatsApp, or unsecured web forms.
3. In-Person Branch Option: If any ambiguity exists regarding your account status, visit the nearest authorized customer care center or branch with your official identification.
4. Zero-Trust Verification: Always verify incoming requests through an independent, out-of-band channel that you initiate yourself.
`.trim()
  },
  {
    id: 'kb-gen-01',
    title: 'General Financial Cybersecurity Hygiene',
    category: 'GENERAL_FINANCIAL_SAFETY',
    source: 'TakaBondhu Safety Knowledge Base',
    excerpt: 'Adopt multi-factor authentication, secure device habits, and regular account balance monitoring.',
    content: `
General Financial Cybersecurity Hygiene:
1. Multi-Factor Authentication: Ensure your email, banking, and mobile wallet apps have biometric or app-based 2FA enabled wherever possible.
2. Routine Statement Audits: Regularly inspect transaction histories and set up instant SMS/push notifications for all account debits.
3. Device Security: Avoid banking on public Wi-Fi networks or unpatched mobile devices. Never install remote-access apps (AnyDesk, TeamViewer) at the request of an unverified caller.
4. Rapid Incident Reporting: If you suspect funds or credentials were lost to fraud, notify your financial institution's fraud hotline within 1 hour to initiate fund freezes and transaction recalls.
`.trim()
  }
];
