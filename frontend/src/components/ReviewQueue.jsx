import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Network,
  Calculator,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import MuleNetworkGraph from './MuleNetworkGraph';
import ImpactSimulator from './ImpactSimulator';
import { apiUrl } from '../apiConfig';
import { useI18n } from '../i18n';

export default function ReviewQueue({ onBackToAnalyzer, lang = 'bn', initialWallet = null, initialSection = 'queue' }) {
  const { t } = useI18n(lang);
  const [activeTab, setActiveTab] = useState(initialSection || 'queue'); // 'queue' | 'graph' | 'saved'
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'reviewed'
  const [expandedCaseId, setExpandedCaseId] = useState(null);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(initialSection);
    }
  }, [initialSection]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/review/queue'));
      const data = await res.json();
      setCases(data.cases || []);
      if (data.cases?.length > 0 && !expandedCaseId) {
        setExpandedCaseId(data.cases[0].id);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (caseId, decision) => {
    setSubmittingId(caseId);
    try {
      const res = await fetch(apiUrl('/v1/feedback'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Role': 'analyst'
        },
        body: JSON.stringify({
          caseId,
          decision,
          notes: notes[caseId] || '',
          analyst_id: 'ops_analyst_01'
        })
      });

      if (res.ok) {
        setCases(prev => prev.map(c => {
          if (c.id === caseId) {
            return {
              ...c,
              status: 'reviewed',
              decision,
              notes: notes[caseId] || '',
              reviewed_at: new Date().toISOString()
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to submit review decision:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleExportCSV = () => {
    window.open(apiUrl('/api/review/export'), '_blank');
  };

  const reviewedCount = cases.filter(c => c.status === 'reviewed').length;
  const pendingCount = cases.filter(c => c.status === 'pending').length;

  const filteredCases = cases.filter(c => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'reviewed') return c.status === 'reviewed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Header Bar with Demo Data Label */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {t('demoDataBadge')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {lang === 'bn' ? 'মানব-পর্যালোচনা' : 'Human Oversight'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-center space-x-3">
            <ClipboardList className="w-7 h-7 text-cyan-400" />
            <span>{t('fraudTeamTitle')}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {t('fraudTeamSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-navy-950 hover:bg-cyan-400 transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ডেটা এক্সপোর্ট (CSV)' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 3 Sub-Navigation Panels */}
      <div className="bg-navy-900/80 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-left transition-all ${
            activeTab === 'queue'
              ? 'bg-cyan-500/20 border border-cyan-400/50 text-white shadow-md'
              : 'bg-navy-950/60 border border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <span>{t('tabQueue')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 font-mono">
              {pendingCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{t('tabQueueDesc')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('graph')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-left transition-all ${
            activeTab === 'graph'
              ? 'bg-amber-500/20 border border-amber-400/50 text-white shadow-md'
              : 'bg-navy-950/60 border border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <span>{t('tabGraph')}</span>
            <Network className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{t('tabGraphDesc')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-left transition-all ${
            activeTab === 'saved'
              ? 'bg-emerald-500/20 border border-emerald-400/50 text-white shadow-md'
              : 'bg-navy-950/60 border border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <span>{t('tabMoneySaved')}</span>
            <Calculator className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{t('tabMoneySavedDesc')}</p>
        </button>
      </div>

      {/* SUB-PANEL 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Plain heading & one-line explanation */}
          <div className="p-4 rounded-2xl bg-navy-900/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">{t('tabQueue')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t('panelQueueDesc')}</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center space-x-1.5 self-start sm:self-auto">
              {['all', 'pending', 'reviewed'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    filter === f
                      ? 'bg-cyan-500 text-navy-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f === 'all' ? (lang === 'bn' ? 'সব' : 'All') : f === 'pending' ? (lang === 'bn' ? 'অমীমাংসিত' : 'Pending') : (lang === 'bn' ? 'পর্যালোচিত' : 'Reviewed')}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          {loading && cases.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400 mb-3" />
              <p>{lang === 'bn' ? 'রিভিউ তালিকা লোড হচ্ছে...' : 'Loading review queue...'}</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 rounded-3xl bg-navy-900/40 border border-slate-800 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
              <h4 className="text-lg font-bold text-white">{lang === 'bn' ? 'কোনো অমীমাংসিত কেস নেই' : 'Queue Clear'}</h4>
              <p className="text-sm text-slate-400 mt-1">
                {lang === 'bn' 
                  ? 'সবগুলো ফ্ল্যাগ করা লেনদেন সফলভাবে পর্যালোচনা করা হয়েছে।' 
                  : 'All flagged transactions have been reviewed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map(item => {
                const isPending = item.status === 'pending';
                const isSubmitting = submittingId === item.id;
                const isExpanded = expandedCaseId === item.id;

                return (
                  <div 
                    key={item.id} 
                    className={`p-6 rounded-3xl border transition-all ${
                      isPending 
                        ? 'bg-navy-900/90 border-slate-800 shadow-xl' 
                        : 'bg-navy-950/60 border-slate-900 opacity-80'
                    }`}
                  >
                    {/* Case Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold uppercase ${
                          item.risk_score >= 80 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : item.risk_score >= 50
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          Risk Score: {item.risk_score}/100
                        </span>

                        <span className="text-xs text-slate-400 font-mono">
                          ID: {item.id}
                        </span>

                        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedCaseId(isExpanded ? null : item.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <span>{isExpanded ? (lang === 'bn' ? 'সংক্ষেপ করুন' : 'Collapse') : (lang === 'bn' ? 'প্রমাণ দেখুন' : 'Inspect Evidence')}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Case Card 3 Plain Questions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                          {t('caseWhatHappened')}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {item.redacted_text ? `Text: "${item.redacted_text}"` : (item.scam_type || 'Unusual transaction velocity alert.')}
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          {t('caseWhyRisky')}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {item.review_reason || 'Deviation from sender account baseline coupled with suspicious recipient cues.'}
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
                          {t('caseWhatUpayShouldDo')}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {lang === 'bn' 
                            ? 'গ্রাহককে সতর্কতামূলক বার্তা দেখান। কর্মকর্তা যাচাই ছাড়া টাকা নিষ্পত্তি স্থগিত রাখুন।' 
                            : 'Hold settlement pending analyst verification. Notify customer.'}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Evidence */}
                    {isExpanded && (
                      <div className="my-4 border-t border-slate-800 pt-3">
                        <MuleNetworkGraph targetWallet={item.scam_type || initialWallet || '01700999001'} lang={lang} />
                      </div>
                    )}

                    {/* Triage Decision Buttons */}
                    {isPending ? (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder={lang === 'bn' ? 'পর্যবেক্ষকের মন্তব্য (ঐচ্ছিক)...' : 'Analyst notes (optional)...'}
                          value={notes[item.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                          className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 flex-grow sm:max-w-md focus:ring-1 focus:ring-cyan-500"
                        />

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDecision(item.id, 'false_alarm')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t('btnApprove')}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDecision(item.id, 'escalate')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center space-x-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t('btnEscalate')}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDecision(item.id, 'confirmed_scam')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-all flex items-center space-x-1 shadow-md shadow-rose-600/30"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t('btnFlagFraud')}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center space-x-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>{lang === 'bn' ? 'সিদ্ধান্ত:' : 'Decision:'} <strong className="text-white uppercase">{item.decision}</strong></span>
                        </span>
                        {item.notes && <span className="italic text-slate-500">"{item.notes}"</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-PANEL 2: MULE NETWORK GRAPH */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-navy-900/50 border border-slate-800">
            <h3 className="text-base font-bold text-white">{t('tabGraph')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('panelGraphDesc')}</p>
          </div>
          <MuleNetworkGraph targetWallet={initialWallet || '01700999001'} lang={lang} />
        </div>
      )}

      {/* SUB-PANEL 3: MONEY SAVED CALCULATOR */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-navy-900/50 border border-slate-800">
            <h3 className="text-base font-bold text-white">{t('tabMoneySaved')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('panelSavedDesc')}</p>
          </div>
          <ImpactSimulator lang={lang} />
        </div>
      )}

    </div>
  );
}
