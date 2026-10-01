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
  Sparkles
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
    summary = 'Potential scam indicators detected.',
    signals = [],
    recommendedActions = [],
    safeResponse = '',
    reasoning,
    retrievedKnowledge = [],
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
          headline: 'Do not send money or share any credentials.',
          icon: AlertOctagon,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          barColor: 'from-orange-500 to-red-500',
          headline: 'High likelihood of fraud. Do not transfer funds.',
          icon: ShieldAlert,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          barColor: 'from-amber-500 to-yellow-500',
          headline: 'Suspicious elements detected. Verify before acting.',
          icon: AlertTriangle,
        };
      default: // LOW
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          barColor: 'from-emerald-500 to-teal-500',
          headline: 'No critical threats detected. Exercise normal vigilance.',
          icon: ShieldCheck,
        };
    }
  };

  const theme = getRiskTheme(riskLevel);
  const RiskIcon = theme.icon;

  // Filter down to the 3-5 most important signals only
  const displaySignals = Array.isArray(signals) ? signals.slice(0, 5) : [];

  // Filter RAG safety knowledge (only real retrieved documents)
  const hasRagKnowledge = Array.isArray(retrievedKnowledge) && retrievedKnowledge.length > 0;

  // Format "What to do now" actions
  const displayActions = Array.isArray(recommendedActions) && recommendedActions.length > 0
    ? recommendedActions.slice(0, 5)
    : [
        "Don't send money.",
        "Don't open the suspicious link.",
        "Verify through an official channel.",
        "Never share OTP or PIN."
      ];

  const handleCopySafeResponse = () => {
    if (!safeResponse) return;
    navigator.clipboard.writeText(safeResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2500);
  };

  const handleCopyFullReport = () => {
    const reportText = `[TakaBachao — Scam Shield Report]
Risk Level: ${riskLevel} RISK (${riskScore}/100)
Assessment: ${theme.headline}
Summary: ${summary}

Risk Signals:
${displaySignals.map(s => `• ${s.type}${s.evidence ? `: "${s.evidence}"` : ''} - ${s.explanation}`).join('\n')}

What to do now:
${displayActions.map((a, i) => `${i + 1}. ${a.replace(/^[❌✅]\s*/, '')}`).join('\n')}

Protected by TakaBachao (Scam Shield).`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <section id="results" className="py-8 animate-slide-up">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Polished Result Card */}
        <div className={`glass-card rounded-3xl p-6 sm:p-10 border ${theme.border} relative overflow-hidden shadow-2xl`}>
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${theme.badgeBg} border`}>
                <RiskIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                  SCAM RISK ASSESSMENT
                </span>
                <h3 className="text-xl font-bold text-white">
                  Analysis Result
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
                <span>How to Verify Safely</span>
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

          {/* Primary Risk Result Card: Level, Score, Headline */}
          <div className="my-8 p-6 sm:p-8 rounded-2xl bg-navy-950/70 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
            
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
            </div>

            {/* Score Visual Bar */}
            <div className="w-full md:w-64 flex flex-col space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Threat Gauge</span>
                <span className={theme.text}>{riskLevel}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${theme.barColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(Math.max(riskScore, 6), 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 text-center md:text-right">
                Based on combined signal evaluation
              </span>
            </div>

          </div>

          {/* SECTION: RISK SIGNALS (Top 3-5 most important signals only) */}
          <div className="my-8">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <span>Risk Signals</span>
              <span className="text-xs text-slate-400 font-normal">
                ({displaySignals.length} primary indicator{displaySignals.length === 1 ? '' : 's'})
              </span>
            </h4>

            {displaySignals.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>No high-risk threat signals detected.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displaySignals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-navy-950/70 border border-slate-800 hover:border-slate-700 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          ['CRITICAL', 'HIGH'].includes(signal.severity?.toUpperCase()) ? 'bg-rose-400' : 'bg-amber-400'
                        }`} />
                        <span>{signal.type}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {signal.severity}
                      </span>
                    </div>

                    {signal.evidence && (
                      <div className="my-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 break-words">
                        "{signal.evidence}"
                      </div>
                    )}

                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {signal.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: AI EXPLANATION ("Why this looks suspicious") */}
          <div className="my-8 p-6 rounded-2xl bg-navy-950/60 border border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Why this looks suspicious</span>
            </span>

            <p className="text-base text-slate-200 font-medium leading-relaxed mb-3">
              "{summary}"
            </p>

            {reasoning && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans pt-3 border-t border-slate-800/80">
                {reasoning}
              </p>
            )}
          </div>

          {/* SECTION: SAFETY KNOWLEDGE (Only show when RAG actually retrieved knowledge) */}
          {hasRagKnowledge && (
            <div className="my-8 p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Trusted Safety Guidance</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-400">
                  Verified Safety KB
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {retrievedKnowledge.map((doc, idx) => (
                  <div 
                    key={doc.id || idx}
                    className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {doc.category}
                        </span>
                        {doc.similarity && (
                          <span className="text-[10px] font-mono text-cyan-400">
                            {doc.similarity}% match
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-white mb-1 line-clamp-1">
                        {doc.title}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        "{doc.excerpt}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: WHAT TO DO NOW (Visually Prominent) */}
          <div className="my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900 border border-slate-700/80 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                    PROTECTIVE ACTION STEPS
                  </span>
                  <h4 className="text-xl font-bold text-white">
                    What to do now
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>How to Verify Safely</span>
              </button>
            </div>

            {/* Prominent Action Checklist */}
            <div className="space-y-3">
              {displayActions.map((action, idx) => {
                const cleanText = typeof action === 'string' 
                  ? action.replace(/^[❌✅]\s*/, '')
                  : action;

                return (
                  <div
                    key={idx}
                    className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm font-medium text-slate-200"
                  >
                    <span className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">
                      {cleanText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safe Response Template (Copy & Neutralize) */}
          {safeResponse && (
            <div className="my-8 p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      Recommended Safe Response Template
                    </h5>
                    <p className="text-xs text-slate-400">
                      Copy & send this back to neutralize pressure while you verify:
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySafeResponse}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-navy-950 hover:bg-cyan-400 transition-all flex items-center justify-center space-x-1.5 self-start sm:self-auto shadow-md shadow-cyan-500/20"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-navy-950" />
                      <span>Copied Template</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-xs sm:text-sm font-mono text-cyan-200">
                "{safeResponse}"
              </div>
            </div>
          )}

        </div>

      </div>

      {/* How to Verify Safely Modal */}
      <SafeVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </section>
  );
}
