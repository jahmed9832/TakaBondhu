import React from 'react';
import { ShieldCheck, AlertCircle, Key, Lock, PhoneCall, Gift, Landmark, Clock, ArrowRight } from 'lucide-react';

const TIPS_CATALOG = [
  {
    id: 'otp-safety',
    topic: 'OTP & PIN Protection',
    topicBn: 'ওটিপি ও পিন সুরক্ষা',
    icon: Key,
    color: 'rose',
    title: 'Never Share 4-Digit PIN or 6-Digit OTP',
    titleBn: 'পিন বা ওটিপি কখনোই কাউকে দেবেন না',
    text: 'Upay agents or officers will never call or SMS to ask for your secret PIN or verification code under any circumstances.',
    textBn: 'উপায় কর্তৃপক্ষ বা কোনো কর্মকর্তা কখনোই আপনার অ্যাকাউন্টের গোপন পিন বা ওটিপি জানতে চেয়ে ফোন বা মেসেজ করবে না।'
  },
  {
    id: 'fake-agent-safety',
    topic: 'Agent Verification',
    topicBn: 'এজেন্ট পরিচিতি যাচাই',
    icon: Landmark,
    color: 'cyan',
    title: 'No Upfront Fee for Account Limits',
    titleBn: 'লিমিট বাড়াতে কোনো অগ্রিম ফি নেই',
    text: 'Upay limits are determined by KYC regulations and account verification. Anyone asking for an advance "clearance deposit" is a fraudster.',
    textBn: 'ওয়ালেটের লেনদেন সীমা বৃদ্ধির জন্য কোনো ধরনের সিকিউরিটি ফি বা অগ্রিম টাকা জমা দিতে হয় না। এমন দাবি করলে তা নিশ্চিত প্রতারণা।'
  },
  {
    id: 'lottery-safety',
    topic: 'Prize & Sweepstakes',
    topicBn: 'লটারি ও পুরস্কারের ফাঁদ',
    icon: Gift,
    color: 'amber',
    title: 'No Fee to Receive Legitimate Prizes',
    titleBn: 'পুরস্কার পাওয়ার জন্য টাকা দেওয়া লাগে না',
    text: 'If you win an official campaign, upay will never ask you to send money first to release the prize or pay VAT.',
    textBn: 'যেকোনো অফিশিয়াল ক্যাম্পেইনে বিজয়ী হলে পুরস্কার হস্তান্তরের জন্য কোনো প্রসেসিং ফি বা ভ্যাট আগে বিকাশ/উপায় করতে হয় না।'
  },
  {
    id: 'emergency-safety',
    topic: 'Emergency Hospital Calls',
    topicBn: 'হাসপাতাল বা বিপদের অজুহাত',
    icon: PhoneCall,
    color: 'purple',
    title: 'Direct Call Verification Rule',
    titleBn: 'পরিচিত নম্বরে সরাসরি কল করে যাচাই করুন',
    text: 'Before sending money to a stranger claiming to be a friend or relative in an accident, always call their actual known number first.',
    textBn: 'অপরিচিত নম্বর থেকে কোনো বন্ধু বা আত্মীয় বিপদে পড়েছে দাবি করলে, টাকা পাঠানোর আগে তার নিজস্ব পরিচিত নম্বরে কল দিয়ে নিশ্চিত হন।'
  },
  {
    id: 'soft-friction-rule',
    topic: 'Soft Friction Pause',
    topicBn: '১০ সেকেন্ডের বিরতি নিন',
    icon: Clock,
    color: 'emerald',
    title: 'Take 10 Seconds Before Sending Money',
    titleBn: 'সেন্ড মানি করার আগে ১০ সেকেন্ড চিন্তা করুন',
    text: 'Scammers rely on rushing you into panic. A 10-second breath breaks social engineering traps.',
    textBn: 'প্রতারকরা সবসময় গ্রাহককে দ্রুত সিদ্ধান্ত নিতে বাধ্য করে। সেন্ড মানি বোতাম চাপার আগে ১০ সেকেন্ড ভাবুন—টাকা ফেরত আনা অসম্ভব।'
  }
];

export default function MicroTips({ detectedPattern, lang = 'en' }) {
  // If a specific pattern was detected, highlight relevant tip first
  let tips = [...TIPS_CATALOG];
  if (detectedPattern?.includes('OTP')) {
    tips = [tips[0], tips[4], tips[1], tips[2]];
  } else if (detectedPattern?.includes('AGENT')) {
    tips = [tips[1], tips[4], tips[0], tips[3]];
  } else if (detectedPattern?.includes('PRIZE')) {
    tips = [tips[2], tips[4], tips[0], tips[1]];
  }

  return (
    <div className="py-8 border-t border-slate-800/80 bg-navy-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              {lang === 'bn' ? 'টাকাবন্ধু সচেতনতা টিপস' : 'Bondhu Financial Safety Micro-Tips'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {lang === 'bn' ? 'সরাসরি আর্থিক নিরাপত্তা নির্দেশিকা' : 'Instant guidance based on real MFS fraud patterns'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tips.slice(0, 4).map((tip) => {
            const Icon = tip.icon;
            return (
              <div 
                key={tip.id}
                className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      {lang === 'bn' ? tip.topicBn : tip.topic}
                    </span>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1.5 leading-snug">
                    {lang === 'bn' ? tip.titleBn : tip.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {lang === 'bn' ? tip.textBn : tip.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
