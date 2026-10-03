import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Scale, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { apiUrl } from '../apiConfig';
import { useI18n } from '../i18n';

export default function PreSendChecker({ initialTx = null, lang = 'bn', isLargeText = false }) {
  const { t } = useI18n(lang);

  const [sender, setSender] = useState('01811000001');
  const [receiver, setReceiver] = useState('01811000002');
  const [amount, setAmount] = useState('18500');
  const [type, setType] = useState('send_money');
  const [memo, setMemo] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  // Soft friction countdown modal state
  const [showFrictionModal, setShowFrictionModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [confirmedByCustomer, setConfirmedByCustomer] = useState(false);

  // Sync initialTx if passed from demo bar
  useEffect(() => {
    if (initialTx) {
      if (initialTx.sender) setSender(initialTx.sender);
      if (initialTx.receiver) setReceiver(initialTx.receiver);
      if (initialTx.amount) setAmount(String(initialTx.amount));
      if (initialTx.type) setType(initialTx.type);
      if (typeof initialTx.is_new_recipient === 'boolean') {
        setIsNewRecipient(initialTx.is_new_recipient);
      } else if (typeof initialTx.is_new_recipient === 'number') {
        setIsNewRecipient(initialTx.is_new_recipient === 1);
      }
      setResult(null);
    }
  }, [initialTx]);

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
        device_age_days: initialTx?.device_age_days ?? 120,
        hour: initialTx?.hour ?? new Date().getHours()
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

  // Determine ONE big verdict for transfer check
  const recommendation = result?.decision_recommendation || 'ALLOW';
  const isHold = recommendation === 'HOLD_FOR_REVIEW';
  const isFriction = recommendation === 'SOFT_FRICTION';
  const isAllow = !isHold && !isFriction;

  const verdictTheme = isHold ? {
    title: t('verdictRisky'),
    reason: lang === 'bn' 
      ? 'অস্বাভাবিক লেনদেনের লক্ষণ রয়েছে। আমাদের টিম এটি পর্যালোচনা করবে। অনুগ্রহ করে উপায়ের সাথে যোগাযোগ করুন।' 
      : 'Suspicious transfer anomaly detected. Our team will review this. Please confirm with upay.',
    steps: lang === 'bn' ? [
      'এই নম্বরে টাকা পাঠাবেন না।',
      'লেনদেনটি ফ্রড টিমের পর্যালোচনার জন্য রাখা হয়েছে — কোনো টাকা কাটা হয়নি।',
      'প্রয়োজনে উপায়ের অফিশিয়াল হেল্পলাইনে (16268) কল করুন।'
    ] : [
      'Do not dispatch funds to this recipient.',
      'Transfer held for fraud operations review — no money has been deducted.',
      'Contact upay customer helpline (16268) for immediate assistance.'
    ],
    icon: AlertOctagon,
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/40',
    text: 'text-rose-400'
  } : isFriction ? {
    title: t('verdictCareful'),
    reason: lang === 'bn'
      ? 'নতুন প্রাপককে বড় অঙ্কের টাকা পাঠানো হচ্ছে। নিশ্চিত না হয়ে টাকা পাঠাবেন না।'
      : 'Large transfer to a brand-new recipient. Verify the receiver before proceeding.',
    steps: lang === 'bn' ? [
      'প্রাপকের সাথে সরাসরি কথা বলে নম্বরটি শতভাগ সঠিক কি না নিশ্চিত হোন।',
      'কোনো অপরিচিত ব্যক্তির প্ররোচনায় টাকা পাঠাবেন না।',
      'সন্দেহ হলে ১০ সেকেন্ড ভাবুন এবং লেনদেন স্থগিত রাখুন।'
    ] : [
      'Directly call the recipient to verify their exact number.',
      'Never send funds under urgency or instructions from strangers.',
      'Take a 10-second pause to reflect before confirming.'
    ],
    icon: AlertTriangle,
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/40',
    text: 'text-amber-400'
  } : {
    title: t('verdictSafe'),
    reason: lang === 'bn'
      ? 'লেনদেনটি স্বাভাবিক ও নিরাপদ দেখাচ্ছে।'
      : 'Transfer pattern matches normal safe activity.',
    steps: lang === 'bn' ? [
      'আপনি স্বাভাবিকভাবে টাকা পাঠাতে পারেন।',
      'মনে রাখবেন, কখনোই কারো সাথে আপনার গোপন পিন শেয়ার করবেন না।'
    ] : [
      'You may proceed with the transfer.',
      'Remember, never share your secret wallet PIN with anyone.'
    ],
    icon: ShieldCheck,
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400'
  };

  const VerdictIcon = verdictTheme.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in space-y-6">
      
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
            {lang === 'bn' ? 'টাকা পাঠানোর সুরক্ষা' : 'Pre-Send Protection'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
            {lang === 'bn' ? 'স্বয়ংক্রিয় ব্লক নেই' : 'Zero Autonomous Block'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
          {t('preSendTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          {t('preSendSubtitle')}
        </p>
      </div>

      {/* Transfer Form with 1-Line Helper Texts Under Every Input */}
      <form onSubmit={handleScreen} className="bg-navy-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Sender Wallet */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              {t('senderLabel')}
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-teal-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('senderHelper')}
            </p>
          </div>

          {/* Receiver Wallet */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              {t('receiverLabel')}
            </label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-teal-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('receiverHelper')}
            </p>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200">
                {t('amountLabel')}
              </label>
              <span 
                title={lang === 'bn' ? 'লেনদেনের টাকার পরিমাণ (১০ থেকে ২৫,০০০ ৳)' : 'Transfer amount in BDT (10 to 25,000)'}
                className="cursor-help text-[10px] text-slate-400 border border-slate-700 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ?
              </span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-teal-500"
              required
              min="10"
              max="25000"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('amountHelper')}
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              {t('typeLabel')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="send_money">Send Money (P2P)</option>
              <option value="cash_out">Cash Out (Agent)</option>
              <option value="merchant_payment">Merchant Payment</option>
              <option value="bill_pay">Bill Pay</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'bn' ? 'লেনদেনের ধরন নির্বাচন করুন' : 'Select transaction type'}
            </p>
          </div>
        </div>

        {/* Memo / Reference */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1">
            {t('memoLabel')}
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={lang === 'bn' ? 'টাকা পাঠানোর সাথে কোনো মেসেজ থাকলে লিখুন' : 'Any message or note accompanying this transfer'}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {t('memoHelper')}
          </p>
        </div>

        {/* New Recipient Checkbox */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isNewRecipient}
              onChange={(e) => setIsNewRecipient(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
            />
            <span className="text-xs text-slate-200 font-semibold">{t('newRecipientLabel')}</span>
          </label>
          <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
            {t('newRecipientHelper')}
          </p>
        </div>

        {/* Screen Button with Helper */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center space-x-2 min-h-[48px]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{t('btnPreSendChecking')}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>{t('btnPreSendCheck')}</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            {lang === 'bn' 
              ? 'টাকা পাঠানোর আগে নম্বর ও লেনদেন নিরাপদ কি না পরীক্ষা করে নিশ্চিত হোন' 
              : 'Screen recipient and transfer risk before sending'}
          </p>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* RESULT DISPLAY: ONE BIG VERDICT FIRST */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          
          {/* ONE Big Verdict Card */}
          <div className={`p-6 rounded-3xl bg-navy-950/90 border ${verdictTheme.border} shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
            <div className="flex items-start space-x-4">
              <div className={`p-3.5 rounded-2xl ${verdictTheme.badge} border flex-shrink-0 mt-1`}>
                <VerdictIcon className="w-9 h-9" />
              </div>

              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border mb-2 ${verdictTheme.badge}`}>
                  {verdictTheme.title}
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  "{verdictTheme.reason}"
                </h3>

                <p className="text-xs text-slate-400 mt-2">
                  {t('noAutonomousBlockNotice')}
                </p>
              </div>
            </div>

            {/* Risk Score & Tooltip */}
            <div className="self-end md:self-center flex flex-col items-end md:items-end flex-shrink-0 md:pl-6 md:border-l md:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400 font-semibold">
                  {lang === 'bn' ? 'ঝুঁকি স্কোর' : 'Risk Score'}
                </span>
                <span 
                  title={t('tooltipScore')}
                  className="cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700"
                >
                  ?
                </span>
              </div>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className={`text-4xl font-black ${verdictTheme.text}`}>
                  {result.risk_score}
                </span>
                <span className="text-sm font-semibold text-slate-500">/১০০</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono mt-0.5">
                {result.latency_ms} ms
              </span>
            </div>
          </div>

          {/* EXACTLY 2-3 "WHAT TO DO NOW" STEPS */}
          <div className="p-6 rounded-3xl bg-navy-950/80 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{t('whatToDoTitle')}</span>
            </h4>

            <div className="space-y-2.5">
              {verdictTheme.steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-2xl bg-navy-900/70 border border-slate-800/80 text-xs sm:text-sm text-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed mt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COLLAPSIBLE TECHNICAL DETAILS */}
          <div className="border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full py-3 px-4 rounded-2xl bg-navy-900/60 hover:bg-navy-900 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-between text-xs sm:text-sm font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>{showTechnicalDetails ? t('detailsToggleClose') : t('detailsToggleOpen')}</span>
              </div>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* EXPANDED TECHNICAL DETAILS (3 Required Separate Blocks) */}
            {showTechnicalDetails && (
              <div className="mt-4 space-y-4 animate-slide-down">
                
                {/* BLOCK 1: PREDICTION (Rules + Model) */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-teal-400" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                        {t('blockAPredictionTitle')}
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-teal-400">
                      Multi-Signal Fusion
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'লেনদেন ঝুঁকি' : 'Txn Risk'}</span>
                      <span className="text-base font-bold text-white">{result.signals?.txn_score ?? 'N/A'}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'বার্তা ঝুঁকি' : 'Message Risk'}</span>
                      <span className="text-base font-bold text-white">{result.signals?.message_score ?? 'N/A'}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'আচরণগত বিচ্যুতি' : 'Anomaly Risk'}</span>
                      <span className="text-base font-bold text-white">{result.signals?.anomaly_score ?? 'N/A'}%</span>
                    </div>
                  </div>

                  {/* Rule Traces */}
                  {result.rule_trace && result.rule_trace.length > 0 && (
                    <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t('ruleEvidenceTitle')}:
                      </span>
                      <ul className="space-y-1">
                        {result.rule_trace.map((r, i) => (
                          <li key={i} className="text-xs text-rose-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            <span className="font-mono text-cyan-300">{r.rule_id || r.type}:</span> {r.desc || r.evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* BLOCK 2: ASSUMPTIONS */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      {t('blockBAssumptionsTitle')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <strong className="text-white block mb-0.5">Threshold Policy</strong>
                      Score &lt; 40 allows; 40–69 soft friction; &ge; 70 human review queue.
                    </div>
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <strong className="text-white block mb-0.5">Regulatory Ceiling</strong>
                      Single P2P ceiling ৳25,000. Structuring checks near boundary.
                    </div>
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <strong className="text-white block mb-0.5">Anti-Leakage</strong>
                      Quarantined time splits and unseen topological mule rings.
                    </div>
                  </div>
                </div>

                {/* BLOCK 3: AI EXPLANATION & CASE CARD */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      {t('blockCExplanationTitle')}
                    </h5>
                  </div>

                  {result.case_card && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-teal-400 block mb-0.5">What Happened?</span>
                        <p className="text-slate-300">{result.case_card.what_happened}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-amber-400 block mb-0.5">Why Risky?</span>
                        <p className="text-slate-300">{result.case_card.why_risky}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-rose-400 block mb-0.5">Upay Next Step</span>
                        <p className="text-slate-300">{result.case_card.what_upay_should_do || result.case_card.upay_action}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* SOFT FRICTION PAUSE POPUP MODAL */}
      {showFrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{t('frictionTitle')}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">{t('frictionWarning')}</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left mb-5">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedByCustomer}
                  onChange={(e) => setConfirmedByCustomer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500"
                />
                <span className="text-xs text-slate-200">{t('frictionConfirm')}</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFrictionModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={countdown > 0 || !confirmedByCustomer}
                onClick={() => setShowFrictionModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 text-xs font-bold transition-all"
              >
                {countdown > 0 ? `${t('frictionWait')} (${countdown}s)` : t('frictionProceed')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
