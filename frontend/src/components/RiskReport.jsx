import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Copy, 
  Check, 
  BookOpen, 
  Sparkles, 
  Cpu, 
  Scale, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import SafeVerificationModal from './SafeVerificationModal';
import { useI18n } from '../i18n';

export default function RiskReport({ report, originalMessage, onReset, lang = 'bn' }) {
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const { t } = useI18n(lang);

  if (!report) return null;

  const {
    riskScore = 0,
    riskLevel = 'LOW',
    summary = '',
    signals = [],
    recommendedActions = [],
    safeResponse = '',
    reasoning,
    retrievedKnowledge = [],
    scoring = {},
    ml = {},
    case_card = {},
    needs_human_review = false,
    review_reason = '',
    trace_id = ''
  } = report;

  // Determine ONE big verdict
  // green "নিরাপদ / Looks safe", yellow "সাবধান / Be careful", red "ঝুঁকিপূর্ণ / Risky — don't send money"
  const isRisky = riskScore >= 70 || riskLevel === 'CRITICAL' || riskLevel === 'HIGH';
  const isCareful = !isRisky && (riskScore >= 40 || riskLevel === 'MEDIUM');
  const isSafe = !isRisky && !isCareful;

  const verdictTheme = isRisky ? {
    color: 'rose',
    title: t('verdictRisky'),
    reason: t('reasonRisky'),
    steps: t('stepsRisky'),
    icon: AlertOctagon,
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    barColor: 'from-rose-500 to-red-600'
  } : isCareful ? {
    color: 'amber',
    title: t('verdictCareful'),
    reason: t('reasonCareful'),
    steps: t('stepsCareful'),
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    barColor: 'from-amber-500 to-yellow-500'
  } : {
    color: 'emerald',
    title: t('verdictSafe'),
    reason: t('reasonSafe'),
    steps: t('stepsSafe'),
    icon: ShieldCheck,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    barColor: 'from-emerald-500 to-teal-500'
  };

  const VerdictIcon = verdictTheme.icon;
  const displaySignals = Array.isArray(signals) ? signals.slice(0, 5) : [];
  const reasonCodes = Array.isArray(ml?.reason_codes) ? ml.reason_codes : [];
  const hasRagKnowledge = Array.isArray(retrievedKnowledge) && retrievedKnowledge.length > 0;

  const handleCopySafeResponse = () => {
    if (!safeResponse) return;
    navigator.clipboard.writeText(safeResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2500);
  };

  const handleCopyFullReport = () => {
    const reportText = `[TakaBondhu Report]
Verdict: ${verdictTheme.title} (Score ${riskScore}/100)
Reason: ${verdictTheme.reason}
Guidance: ${t('humanReviewNotice')}
Trace ID: ${trace_id}`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <section id="results" className="py-8 animate-slide-up">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Result Card */}
        <div className={`rounded-3xl p-6 sm:p-9 border ${verdictTheme.border} ${verdictTheme.bg} relative overflow-hidden shadow-2xl space-y-6 backdrop-blur-xl`}>
          
          {/* Top Bar with Copy and Reset */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'bn' ? 'যাচাইয়ের ফলাফল' : 'Check Results'}</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyFullReport}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                title={lang === 'bn' ? 'ফলাফল কপি করুন' : 'Copy Report'}
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
              >
                {lang === 'bn' ? 'নতুন বার্তা' : 'New Check'}
              </button>
            </div>
          </div>

          {/* ONE BIG VERDICT BANNER */}
          <div className="p-6 rounded-3xl bg-navy-950/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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

                {needs_human_review && (
                  <p className="text-xs text-amber-300 font-semibold mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{t('humanReviewNotice')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Score & "?" Tooltip */}
            <div className="self-end md:self-center flex flex-col items-end md:items-end flex-shrink-0 md:pl-6 md:border-l md:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400 font-semibold">
                  {lang === 'bn' ? 'ঝুঁকি স্কোর' : 'Risk Score'}
                </span>
                <span 
                  title={t('tooltipScore')}
                  className="cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700 hover:bg-slate-700"
                >
                  ?
                </span>
              </div>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className={`text-4xl font-black ${verdictTheme.text}`}>
                  {riskScore}
                </span>
                <span className="text-sm font-semibold text-slate-500">/১০০</span>
              </div>
            </div>
          </div>

          {/* EXACTLY 2-3 "WHAT TO DO NOW" STEPS */}
          <div className="p-6 rounded-3xl bg-navy-950/80 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{t('whatToDoTitle')}</span>
            </h4>

            <div className="space-y-2.5">
              {verdictTheme.steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-2xl bg-navy-900/70 border border-slate-800/80 text-xs sm:text-sm text-slate-200">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed mt-0.5">{step}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              {t('noAutonomousBlockNotice')}
            </p>
          </div>

          {/* Safe Response Template (if applicable) */}
          {safeResponse && (
            <div className="p-4 rounded-2xl bg-navy-900/60 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">
                  {lang === 'bn' ? 'প্রতারককে উত্তর দেওয়ার নিরাপদ বার্তা:' : 'Safe Response to Sender:'}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 font-medium">"{safeResponse}"</p>
              </div>
              <button
                type="button"
                onClick={handleCopySafeResponse}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-navy-950 hover:bg-cyan-400 transition-all flex items-center space-x-1.5 flex-shrink-0 self-end sm:self-auto"
              >
                {copiedResponse ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedResponse ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'বার্তা কপি করুন' : 'Copy')}</span>
              </button>
            </div>
          )}

          {/* COLLAPSIBLE TECHNICAL DETAILS SECTION */}
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
              <div className="mt-4 space-y-5 animate-slide-down">
                
                {/* BLOCK A: PREDICTION (MODEL + RULES) */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                        {t('blockAPredictionTitle')}
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Deterministic Rules (40%) + ML (60%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Rule Score</span>
                      <span className="text-base font-black text-white">{scoring?.rules_score ?? 'N/A'}/100</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">ML Probability</span>
                      <span className="text-base font-black text-cyan-300">
                        {typeof ml?.probability === 'number' ? `${(ml.probability * 100).toFixed(1)}%` : 'Active'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">LLM Adj.</span>
                      <span className="text-base font-black text-amber-300">
                        {scoring?.llm_adjustment > 0 ? `+${scoring.llm_adjustment}` : scoring?.llm_adjustment ?? 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Final Score</span>
                      <span className={`text-base font-black ${verdictTheme.text}`}>{riskScore}/100</span>
                    </div>
                  </div>

                  {/* Rule signals & verbatim evidence */}
                  {displaySignals.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                        {t('ruleEvidenceTitle')}:
                      </span>
                      <div className="space-y-1.5">
                        {displaySignals.map((s, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-navy-950 border border-slate-800/80 text-xs">
                            <div className="flex justify-between font-bold text-white mb-0.5">
                              <span>{s.type}</span>
                              <span className="text-rose-400 font-mono">+{s.points} pts</span>
                            </div>
                            {s.evidence && (
                              <p className="font-mono text-cyan-300 text-[11px] break-words">"{s.evidence}"</p>
                            )}
                            <p className="text-slate-400 text-[11px] mt-0.5">{s.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model N-gram attributions */}
                  {reasonCodes.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Contributing Terms:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {reasonCodes.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-navy-950 border border-cyan-500/30 text-xs font-mono text-cyan-300">
                            "{r.ngram}" <span className="text-slate-400 font-bold">+{r.contribution}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOCK B: ASSUMPTIONS & BASELINE */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      {t('blockBAssumptionsTitle')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <strong className="text-white block mb-0.5">Prevalence Base Rate</strong>
                      5% assumed background scam rate in inbound SMS.
                    </div>
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <strong className="text-white block mb-0.5">Operating Threshold</strong>
                      T=50 tuned strictly on validation split (FPR &le; 5%).
                    </div>
                    <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                      <strong className="text-white block mb-0.5">Human Oversight</strong>
                      Zero autonomous account blocks or money freezes.
                    </div>
                  </div>
                </div>

                {/* BLOCK C: AI EXPLANATION & CASE CARD */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      {t('blockCExplanationTitle')}
                    </h5>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {summary}
                  </p>

                  {/* Case Card 3 Questions */}
                  {case_card && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
                      <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-0.5">What Happened?</span>
                        <p className="text-slate-300">{case_card.what_happened}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-amber-400 block mb-0.5">Why Risky?</span>
                        <p className="text-slate-300">{case_card.why_risky}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <span className="text-[10px] font-bold uppercase text-rose-400 block mb-0.5">Upay Next Step</span>
                        <p className="text-slate-300">{case_card.upay_action}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Curated Safety Knowledge (RAG) */}
                {hasRagKnowledge && (
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lang === 'bn' ? 'নির্ভরযোগ্য সুরক্ষা জ্ঞানভাণ্ডার (RAG)' : 'Curated Safety Guidance (RAG)'}</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {retrievedKnowledge.map((doc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/20 text-xs">
                          <strong className="text-white block mb-0.5">{doc.title}</strong>
                          <p className="text-slate-300 line-clamp-2">"{doc.excerpt}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>

      <SafeVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </section>
  );
}
