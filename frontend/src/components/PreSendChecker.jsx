import React, { useState } from 'react';
import { 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Info, 
  Sparkles,
  ArrowRight,
  UserCheck,
  RefreshCw,
  AlertOctagon,
  FileCheck
} from 'lucide-react';
import { apiUrl } from '../apiConfig';

export default function PreSendChecker({ lang = 'bn', isLargeText = false }) {
  const [sender, setSender] = useState('01811000001');
  const [receiver, setReceiver] = useState('01811000002');
  const [amount, setAmount] = useState('18500');
  const [type, setType] = useState('send_money');
  const [memo, setMemo] = useState('জরুরি টাকা পাঠাও, অ্যাকাউন্ট ব্লক হবে');
  const [isNewRecipient, setIsNewRecipient] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Soft friction countdown modal state
  const [showFrictionModal, setShowFrictionModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [confirmedByCustomer, setConfirmedByCustomer] = useState(false);

  const t = {
    bn: {
      title: 'প্রাক-লেনদেন নিরাপত্তা যাচাই (Pre-Send Safety Check)',
      subtitle: 'টাকা পাঠানোর আগে টাকাবন্ধু যাচাই করে আপনাকে প্রতারণা থেকে সুরক্ষা দেয়।',
      senderWallet: 'আপনার উপায় ওয়ালেট',
      receiverWallet: 'প্রাপকের নম্বর / ওয়ালেট',
      amount: 'টাকার পরিমাণ (৳)',
      type: 'লেনদেনের ধরন',
      memo: 'বার্তা বা রেফারেন্স (ঐচ্ছিক)',
      newRecipient: 'প্রাপক প্রথমবার লেনদেন করছেন (New Recipient)',
      checkBtn: 'টাকাবন্ধু দিয়ে যাচাই করুন',
      presets: 'দ্রুত ডেমো পরিস্থিতি:',
      preset1: 'জরুরি প্রতারণামূলক লেনদেন (৳১৮,৫০০)',
      preset2: 'সীমাবদ্ধতার নিচে ক্যাশ-আউট (৳২৪,৯০০)',
      preset3: 'সাধারণ নিরাপদ লেনদেন (৳৫০০)',
      blockPrediction: '১. অ্যালগরিদম পূর্বাভাস (PREDICTION)',
      blockAssumptions: '২. নীতি ও অনুমান (ASSUMPTIONS)',
      blockExplanation: '৩. এআই ব্যাখ্যা ও পরামর্শ (AI EXPLANATION)',
      verdictAllow: 'নিরাপদ লেনদেন (ALLOW)',
      verdictFriction: 'সতর্কতামূলক যাচাই প্রয়োজন (SOFT FRICTION)',
      verdictHold: 'মানব পর্যালোচনার জন্য সংরক্ষিত (HOLD FOR REVIEW)',
      noAutonomousBlock: 'নীতি: কোনো লেনদেন স্বয়ংক্রিয়ভাবে বাতিল করা হয় না। শুধুমাত্র মানবিক পর্যালোচনার সুপারিশ করা হয়।',
      modalTitle: 'টাকাবন্ধুর বন্ধুসুলভ সতর্কতা',
      modalWarning: 'আপনি একজন নতুন প্রাপককে একটি বড় অঙ্কের টাকা পাঠাচ্ছেন। কোনো অপরিচিত ব্যক্তি যদি পুরস্কার, লটারি বা অ্যাকাউন্ট বন্ধের ভয় দেখিয়ে টাকা চায়, তবে পাঠাবেন না।',
      modalConfirm: 'আমি প্রাপকের পরিচয় নিজে কথা বলে নিশ্চিত করেছি',
      modalProceed: 'বুঝেছি, লেনদেন এগিয়ে নিন',
      modalWait: 'অনুগ্রহ করে অপেক্ষা করুন...',
      humanReviewNotice: 'লেনদেনটি স্থগিত রাখা হয়েছে। উপায় ফ্রড অপারেশন টিম তথ্য যাচাই করছে। আপনার অ্যাকাউন্ট থেকে কোনো টাকা কাটা হয়নি।'
    },
    en: {
      title: 'Pre-Send Transfer Safety Check',
      subtitle: "TakaBondhu screens proposed transactions before dispatch to keep your money safe.",
      senderWallet: 'Your Upay Wallet',
      receiverWallet: 'Recipient Number / Wallet',
      amount: 'Amount (BDT)',
      type: 'Transaction Type',
      memo: 'Memo or Reference (Optional)',
      newRecipient: 'First-time recipient (New Recipient)',
      checkBtn: 'Screen with TakaBondhu',
      presets: 'Quick Demo Scenarios:',
      preset1: 'Social Engineering Threat (৳18,500)',
      preset2: 'Boundary Structuring Cashout (৳24,900)',
      preset3: 'Safe Family Transfer (৳500)',
      blockPrediction: '1. PREDICTION (ML & Rules)',
      blockAssumptions: '2. ASSUMPTIONS & POLICIES',
      blockExplanation: '3. AI-GENERATED EXPLANATION',
      verdictAllow: 'SAFE TO DISPATCH (ALLOW)',
      verdictFriction: 'FRICTION WARNING REQUIRED (SOFT FRICTION)',
      verdictHold: 'HOLD FOR HUMAN REVIEW',
      noAutonomousBlock: 'Hard Rule: No money is ever blocked autonomously. Decisions route to human review or user friction.',
      modalTitle: 'TakaBondhu Safety Intervention',
      modalWarning: 'You are transferring funds to a recipient for the first time. If someone asked for this money claiming an account suspension, lottery fee, or emergency, please pause and verify.',
      modalConfirm: 'I have independently verified the recipient identity.',
      modalProceed: 'I Understand, Confirm Transfer',
      modalWait: 'Please reflect...',
      humanReviewNotice: 'Transaction held in triage queue. Upay Fraud Ops will review. No funds were debited.'
    }
  }[lang] || {};

  const handleApplyPreset = (scenario) => {
    if (scenario === 1) {
      setSender('01811000001');
      setReceiver('01811000099');
      setAmount('18500');
      setType('send_money');
      setMemo('জরুরি বিকাশ/উপায় অ্যাকাউন্ট ব্লক রোধে অবিলম্বে পাঠান');
      setIsNewRecipient(true);
    } else if (scenario === 2) {
      setSender('01811000002');
      setReceiver('agent_0001');
      setAmount('24900');
      setType('cash_out');
      setMemo('');
      setIsNewRecipient(false);
    } else {
      setSender('01811000001');
      setReceiver('01811000003');
      setAmount('500');
      setType('send_money');
      setMemo('নিলুফার জন্মদিনের উপহার');
      setIsNewRecipient(false);
    }
    setResult(null);
  };

  const handleScreen = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      transaction: {
        sender: sender.trim(),
        receiver: receiver.trim(),
        amount: Number(amount) || 0,
        type,
        channel: 'app',
        is_new_recipient: isNewRecipient ? 1 : 0,
        recipient_age_days: isNewRecipient ? 0 : 90,
        device_age_days: 120,
        hour: new Date().getHours()
      },
      message: memo.trim()
    };

    try {
      const res = await fetch(apiUrl('/v1/screen'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to screen transaction');

      setResult(data);

      if (data.decision_recommendation === 'SOFT_FRICTION') {
        setShowFrictionModal(true);
        setCountdown(5);
        setConfirmedByCustomer(false);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const textClass = isLargeText ? 'text-lg' : 'text-sm';
  const headingClass = isLargeText ? 'text-2xl' : 'text-xl';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Track 01 Upay Companion
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Zero Auto-Block
          </span>
        </div>
        <h2 className={`${headingClass} font-black text-white tracking-tight mt-2`}>
          {t.title}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Quick Presets */}
      <div className="bg-navy-900/60 p-4 rounded-2xl border border-slate-800 mb-6">
        <span className="text-xs font-semibold text-slate-400 block mb-2">{t.presets}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset(1)}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
          >
            ⚠️ {t.preset1}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(2)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
          >
            ⚡ {t.preset2}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(3)}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
          >
            ✅ {t.preset3}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleScreen} className="bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.senderWallet}
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.receiverWallet}
            </label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.amount}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500"
              required
              min="10"
              max="25000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.type}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="send_money">Send Money (P2P)</option>
              <option value="cash_out">Cash Out (Agent)</option>
              <option value="merchant_payment">Merchant Payment</option>
              <option value="bill_pay">Bill Pay</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.memo}
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="SMS বা রেফারেন্স বার্তা"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isNewRecipient}
              onChange={(e) => setIsNewRecipient(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-xs text-slate-300">{t.newRecipient}</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>{t.checkBtn}</span>
            </>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display: MANDATORY 3 VISUALLY SEPARATE BLOCKS */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Verdict Banner */}
          <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            result.decision_recommendation === 'HOLD_FOR_REVIEW'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : result.decision_recommendation === 'SOFT_FRICTION'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                {result.decision_recommendation === 'HOLD_FOR_REVIEW' ? (
                  <AlertOctagon className="w-8 h-8 text-rose-400" />
                ) : result.decision_recommendation === 'SOFT_FRICTION' ? (
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                )}
              </div>
              <div>
                <span className="text-xs uppercase font-mono tracking-wider font-semibold opacity-80 block">
                  {lang === 'bn' ? 'টাকাবন্ধু সিদ্ধান্ত সুপারিশ' : 'Recommendation'}
                </span>
                <h3 className="text-xl font-black tracking-tight text-white">
                  {result.decision_recommendation === 'HOLD_FOR_REVIEW' && t.verdictHold}
                  {result.decision_recommendation === 'SOFT_FRICTION' && t.verdictFriction}
                  {result.decision_recommendation === 'ALLOW' && t.verdictAllow}
                </h3>
                <p className="text-xs mt-0.5 text-slate-300">{t.noAutonomousBlock}</p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800/80 sm:pl-6">
              <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'ঝুঁকি স্কোর' : 'Risk Score'}</span>
              <span className="text-3xl font-black text-white">{result.risk_score}<span className="text-sm font-normal text-slate-400">/100</span></span>
              <span className="text-xs block text-cyan-400 font-mono mt-0.5">{result.latency_ms} ms</span>
            </div>
          </div>

          {/* BLOCK 1: PREDICTION (Models & Rules) */}
          <div className="bg-navy-900 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <h4 className="text-sm font-bold tracking-wider uppercase text-cyan-300">
                  {t.blockPrediction}
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">Deterministic Rules + ML Ensemble</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'লেনদেন এমএল স্কোর' : 'Txn ML Score'}</span>
                <span className="text-lg font-bold text-white">{result.signals?.txn_score ?? 'N/A'}%</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'বার্তা হুমকি স্কোর' : 'Message ML Score'}</span>
                <span className="text-lg font-bold text-white">{result.signals?.message_score ?? 'N/A'}%</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'আচরণগত বিচ্যুতি' : 'Behavior Anomaly'}</span>
                <span className="text-lg font-bold text-white">{result.signals?.anomaly_score ?? 'N/A'}%</span>
              </div>
            </div>

            {/* Rule Traces */}
            {result.rule_trace && result.rule_trace.length > 0 && (
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 mb-3">
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  {lang === 'bn' ? 'সক্রিয় সিকিউরিটি নিয়ম (Rule Traces):' : 'Triggered Security Rules:'}
                </span>
                <ul className="space-y-1">
                  {result.rule_trace.map((r, i) => (
                    <li key={i} className="text-xs text-rose-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span className="font-mono">{r.rule_id || r.type}:</span> {r.desc || r.evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* BLOCK 2: ASSUMPTIONS & POLICIES */}
          <div className="bg-navy-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h4 className="text-sm font-bold tracking-wider uppercase text-amber-300">
                  {t.blockAssumptions}
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">Synthetic Ecosystem & Review Thresholds</span>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-white">Review Threshold Policy:</strong> Score &lt; 40 allows immediate dispatch; 40–69 triggers client soft friction; &ge; 70 routes case to human fraud analyst triage queue.
              </p>
              <p>
                <strong className="text-white">Regulatory Ceiling Assumption:</strong> Single P2P transfer ceiling ৳25,000. Amounts in ৳24,000–৳24,999 carry non-linear structuring flags.
              </p>
              <p>
                <strong className="text-white">Anti-Leakage Partitioning:</strong> Evaluated on strict unseen time holdout (Days 61–90) and quarantined mule topological rings.
              </p>
            </div>
          </div>

          {/* BLOCK 3: AI-GENERATED EXPLANATION */}
          <div className="bg-navy-900 border border-violet-500/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
                <h4 className="text-sm font-bold tracking-wider uppercase text-violet-300">
                  {t.blockExplanation}
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">Grounded Investigation & Plain Bangla</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'কী ঘটেছে? (What Happened)' : 'What Happened?'}
                </span>
                <p className="text-sm text-slate-200 mt-1">{result.case_card?.what_happened}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'কেন এটি ঝুঁকিপূর্ণ? (Why is it risky?)' : 'Why is it risky?'}
                </span>
                <p className="text-sm text-slate-200 mt-1">{result.case_card?.why_risky}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'উপায়-এর পরবর্তী পদক্ষেপ (What should upay do?)' : 'What should upay do?'}
                </span>
                <p className="text-sm text-slate-200 mt-1">{result.case_card?.what_upay_should_do || result.case_card?.upay_action}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SOFT FRICTION POPUP MODAL */}
      {showFrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{t.modalTitle}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">{t.modalWarning}</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left mb-5">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedByCustomer}
                  onChange={(e) => setConfirmedByCustomer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <span className="text-xs text-slate-200">{t.modalConfirm}</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFrictionModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                বাতিল করুন (Cancel)
              </button>

              <button
                type="button"
                disabled={countdown > 0 || !confirmedByCustomer}
                onClick={() => setShowFrictionModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-navy-950 text-xs font-bold transition-all"
              >
                {countdown > 0 ? `${t.modalWait} (${countdown}s)` : t.modalProceed}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
