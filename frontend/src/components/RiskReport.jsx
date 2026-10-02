import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  FileText,
  BookOpen,
  Sparkles,
  Cpu,
  UserCheck,
  Scale,
  Layers,
  ArrowRight
} from 'lucide-react';
import SafeVerificationModal from './SafeVerificationModal';

export default function RiskReport({ report, originalMessage, onReset }) {
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  if (!report) return null;

  const {
    riskScore = 0,
    riskLevel = 'LOW',
    summary = 'Potential scam indicators evaluated.',
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
    engineStatus = {},
    trace_id = ''
  } = report;

  // Determine styling based on risk level
  const getRiskTheme = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          barColor: 'from-rose-500 to-red-600',
          headline: 'High likelihood of fraud. Do not send money or share credentials.',
          icon: AlertOctagon,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          barColor: 'from-orange-500 to-red-500',
          headline: 'Severe risk patterns detected. Do not transfer funds.',
          icon: ShieldAlert,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          barColor: 'from-amber-500 to-yellow-500',
          headline: 'Suspicious cues detected. Verify through official helpline.',
          icon: AlertTriangle,
        };
      default: // LOW
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          barColor: 'from-emerald-500 to-teal-500',
          headline: 'No critical threats detected. Routine vigilance advised.',
          icon: ShieldCheck,
        };
    }
  };

  const theme = getRiskTheme(riskLevel);
  const RiskIcon = theme.icon;

  const displaySignals = Array.isArray(signals) ? signals.slice(0, 5) : [];
  const hasRagKnowledge = Array.isArray(retrievedKnowledge) && retrievedKnowledge.length > 0;
  const reasonCodes = Array.isArray(ml?.reason_codes) ? ml.reason_codes : [];

  const handleCopySafeResponse = () => {
    if (!safeResponse) return;
    navigator.clipboard.writeText(safeResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2500);
  };

  const handleCopyFullReport = () => {
    const reportText = `[TakaBondhu — Scam Shield Risk Report]
Risk Level: ${riskLevel} RISK (${riskScore}/100)
Tactic: ${case_card?.what_happened || summary}
Assessment: ${theme.headline}
Trace ID: ${trace_id}

[1] Prediction (Model + Rules):
• Rule Engine Score: ${scoring?.rules_score ?? 'N/A'}/100 (Weight: 40%)
• ML Model Score: ${scoring?.ml_score ?? 'N/A'}/100 (Weight: 60%, Calibrated Prob: ${ml?.probability ? (ml.probability * 100).toFixed(1) + '%' : 'N/A'})
• Contextual Adjustment: ${scoring?.llm_adjustment ?? 0} (Clamped [-10, +10])
• Final Score: ${riskScore}/100

[2] Track 01 Case Card:
• What Happened: ${case_card?.what_happened || 'N/A'}
• Why It Is Risky: ${case_card?.why_risky || 'N/A'}
• What upay Should Do Now: ${case_card?.upay_action || 'N/A'}

[3] Recommended Safe Actions:
${recommendedActions.map((a, i) => `${i + 1}. ${a.replace(/^[❌✅]\s*/, '')}`).join('\n')}

Protected by TakaBondhu (Scam Shield — AI Hackathon 2026).`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <section id="results" className="py-8 animate-slide-up">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Polished Result Card */}
        <div className={`glass-card rounded-3xl p-6 sm:p-10 border ${theme.border} relative overflow-hidden shadow-2xl space-y-8`}>
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${theme.badgeBg} border`}>
                <RiskIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                    SCAM RISK INTELLIGENCE
                  </span>
                  {/* ML Status Chip */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    ml?.status === 'active'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {ml?.status === 'active' 
                      ? `ML Active (${ml.model_version || 'v1.0.0'})` 
                      : 'ML Unavailable (Rules Only)'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Multi-Tier Risk Assessment
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>How to Verify</span>
              </button>

              <button
                type="button"
                onClick={handleCopyFullReport}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition-all flex items-center space-x-1.5"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* NEEDS HUMAN REVIEW BANNER (Mandatory for High Divergence or Borderline Decisions) */}
          {needs_human_review && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider block text-amber-300">
                    OVERSIGHT TRIGGERED: NEEDS HUMAN REVIEW
                  </span>
                  <p className="text-xs text-amber-100 mt-0.5">
                    {review_reason || 'Algorithmic disagreement detected. Sensitive actions must not be approved automatically.'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/40 self-start sm:self-auto">
                No Autonomous Action
              </span>
            </div>
          )}

          {/* Primary Gauge Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-navy-950/70 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className={`inline-flex px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border mb-3 ${theme.badgeBg}`}>
                {riskLevel} RISK
              </div>

              <div className="flex items-baseline space-x-2">
                <span className={`text-6xl sm:text-7xl font-black tracking-tight ${theme.text}`}>
                  {riskScore}
                </span>
                <span className="text-2xl font-bold text-slate-400">/ 100</span>
              </div>

              <p className="mt-3 text-base sm:text-lg font-bold text-white">
                "{theme.headline}"
              </p>
              {trace_id && (
                <span className="text-[11px] font-mono text-slate-500 mt-1">
                  Trace ID: {trace_id}
                </span>
              )}
            </div>

            {/* Score Visual Bar */}
            <div className="w-full md:w-64 flex flex-col space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Risk Threshold (T=50)</span>
                <span className={theme.text}>{riskLevel}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${theme.barColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(Math.max(riskScore, 6), 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 text-center md:text-right font-mono">
                Flagged: {riskScore >= 50 ? 'YES (Score >= 50)' : 'NO (Score < 50)'}
              </span>
            </div>
          </div>

          {/* TRACK 01 CASE CARD (Answers the 3 Organizer Questions) */}
          {case_card && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 border border-cyan-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-300">
                    Track 01 Triage Case Card (Deterministic Grounding)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {case_card.human_oversight_required ? '⚠️ Human Oversight Required' : '✓ Low Friction'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Question 1 */}
                <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    (1) What Happened?
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {case_card.what_happened}
                  </p>
                </div>

                {/* Question 2 */}
                <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    (2) Why Is It Risky?
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {case_card.why_risky}
                  </p>
                </div>

                {/* Question 3 */}
                <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    (3) What upay Should Do Now
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {case_card.upay_action}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* THREE VISUALLY SEPARATED BLOCKS REQUIRED BY ORGANIZERS */}
          <div className="space-y-6 pt-2">
            
            {/* BLOCK A: PREDICTION (MODEL + RULES) */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-700/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-base font-bold text-white">
                    Block A: Prediction (Deterministic Rules + Machine Learning)
                  </h4>
                </div>
                <span className="text-xs font-mono text-cyan-300">
                  Computed purely in code
                </span>
              </div>

              {/* Score Blend Formula Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Rule Engine Score</span>
                  <div className="text-lg font-black text-white mt-0.5">
                    {scoring?.rules_score ?? 'N/A'}<span className="text-xs text-slate-500 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Weight: 40%</span>
                </div>

                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">ML Model Probability</span>
                  <div className="text-lg font-black text-cyan-300 mt-0.5">
                    {typeof ml?.probability === 'number' ? `${(ml.probability * 100).toFixed(1)}%` : 'Unavailable'}
                  </div>
                  <span className="text-[10px] text-slate-500">Weight: 60%</span>
                </div>

                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Contextual LLM Adj.</span>
                  <div className="text-lg font-black text-amber-300 mt-0.5">
                    {scoring?.llm_adjustment > 0 ? `+${scoring.llm_adjustment}` : scoring?.llm_adjustment ?? 0}
                  </div>
                  <span className="text-[10px] text-slate-500">Clamped [-10, +10]</span>
                </div>

                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Final Risk Score</span>
                  <div className={`text-lg font-black ${theme.text} mt-0.5`}>
                    {riskScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Band: {riskLevel}</span>
                </div>
              </div>

              {/* ML Contributing Character N-Grams (Attribution) */}
              {reasonCodes.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-mono font-semibold text-slate-300 block mb-2">
                    Top Contributing Fraud Character N-Grams (Model Attribution):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {reasonCodes.map((r, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-navy-950 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center space-x-1.5">
                        <span>"{r.ngram}"</span>
                        <span className="text-[10px] text-slate-400 font-bold">+{r.contribution}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rule Signals with Verbatim Evidence */}
              <div className="pt-2">
                <span className="text-xs font-mono font-semibold text-slate-300 block mb-2">
                  Deterministic Rule Evidence:
                </span>
                {displaySignals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No deterministic risk rules triggered.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displaySignals.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
                        <div className="flex justify-between font-bold text-white mb-1">
                          <span>{s.type}</span>
                          <span className="text-rose-400 font-mono">+{s.points} pts</span>
                        </div>
                        {s.evidence && (
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 mb-1 break-words">
                            "{s.evidence}"
                          </div>
                        )}
                        <p className="text-slate-400">{s.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BLOCK B: ASSUMPTIONS */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <Scale className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-bold text-white">
                  Block B: System Assumptions & Operational Baseline
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-navy-950/70 border border-slate-800">
                  <strong className="text-white block mb-1">Prevalence Assumption</strong>
                  Assumed 5% real-world scam base rate in typical MFS inbox communications.
                </div>
                <div className="p-3 rounded-xl bg-navy-950/70 border border-slate-800">
                  <strong className="text-white block mb-1">Operating Threshold T=50</strong>
                  Selected strictly on validation split to maximize recall subject to FPR &lt;= 5%.
                </div>
                <div className="p-3 rounded-xl bg-navy-950/70 border border-slate-800">
                  <strong className="text-white block mb-1">Human-in-the-Loop</strong>
                  Any score &gt;= 50 or algorithmic conflict requires human confirmation before irreversible action.
                </div>
              </div>
            </div>

            {/* BLOCK C: AI-GENERATED EXPLANATION */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-bold text-white">
                  Block C: AI-Generated Contextual Explanation
                </h4>
              </div>

              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                "{summary}"
              </p>

              {reasoning && (
                <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
                  {reasoning}
                </p>
              )}
            </div>

          </div>

          {/* Curated Safety Knowledge (RAG) */}
          {hasRagKnowledge && (
            <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Curated Safety Guidance (RAG Knowledge)</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-400">
                  Curated Knowledge Base
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {retrievedKnowledge.map((doc, idx) => (
                  <div key={doc.id || idx} className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {doc.category}
                      </span>
                      {doc.similarity && (
                        <span className="text-[10px] font-mono text-cyan-400">
                          {Math.round(doc.similarity * 100)}% relevance
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-white mb-1">{doc.title}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">"{doc.excerpt}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <div className="p-6 sm:p-8 rounded-3xl bg-navy-950 border border-slate-800 space-y-4">
            <h4 className="text-lg font-bold text-white">Recommended Defensive Actions</h4>
            <div className="space-y-2">
              {recommendedActions.map((action, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {idx + 1}
                  </span>
                  <span>{action.replace(/^[❌✅]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Response Template */}
          {safeResponse && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  Safe Response Template
                </h5>
                <p className="text-xs sm:text-sm font-mono text-slate-200">
                  "{safeResponse}"
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySafeResponse}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-navy-950 hover:bg-cyan-400 transition-all flex items-center space-x-1.5 flex-shrink-0"
              >
                {copiedResponse ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

      <SafeVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </section>
  );
}
