import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  UserCheck, 
  FileText, 
  Clock, 
  ArrowRight,
  Network,
  Activity,
  AlertOctagon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import MuleNetworkGraph from './MuleNetworkGraph';
import { apiUrl } from '../apiConfig';

export default function ReviewQueue({ onBackToAnalyzer, lang = 'bn' }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'reviewed'
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState('summary'); // 'summary' | 'graph' | 'baseline'

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
    window.open('/api/review/export', '_blank');
  };

  const reviewedCount = cases.filter(c => c.status === 'reviewed').length;
  const pendingCount = cases.filter(c => c.status === 'pending').length;

  const filteredCases = cases.filter(c => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'reviewed') return c.status === 'reviewed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Track 01 Trust & Risk
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Human-in-the-Loop Operations
            </span>
          </div>
          <h2 className="text-3xl font-black text-white mt-2 flex items-center space-x-3">
            <ClipboardList className="w-8 h-8 text-cyan-400" />
            <span>Fraud Operations Triage Console</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Human oversight queue for high-impact alerts. Decisions submitted here feed the active retraining export buffer.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-navy-950 hover:bg-cyan-400 transition-all flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Retraining CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Ticker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Pending Analyst Review</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount} cases</div>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Triaged by Analysts</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{reviewedCount} cases</div>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Daily Review Capacity Target</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">Top 20 / 1,000 tx</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6">
        {['all', 'pending', 'reviewed'].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === tab
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cases List */}
      {loading && cases.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400 mb-3" />
          <p>Loading reviewer queue...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="p-12 rounded-3xl bg-navy-900/40 border border-slate-800 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
          <h4 className="text-lg font-bold text-white">Queue Clear</h4>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'pending'
              ? 'All flagged cases have been triaged by human fraud ops analysts.'
              : 'No cases in review queue. Run a transfer check or message scan to generate alerts.'}
          </p>
          <button
            type="button"
            onClick={onBackToAnalyzer}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-cyan-300 hover:bg-slate-800 transition-all inline-flex items-center space-x-2"
          >
            <span>Back to Bondhu Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCases.map(item => {
            const isPending = item.status === 'pending';
            const isSubmitting = submittingId === item.id;
            const isExpanded = expandedCaseId === item.id;

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-3xl border transition-all ${
                  isPending 
                    ? 'bg-navy-900/80 border-slate-800 shadow-xl' 
                    : 'bg-navy-950/60 border-slate-900 opacity-80'
                }`}
              >
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
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

                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCaseId(isExpanded ? null : item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Inspect Evidence'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Case Card 3 Mandatory Questions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                      1. What Happened?
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.redacted_text ? `Text: "${item.redacted_text}"` : (item.scam_type || 'Unusual transaction velocity alert.')}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      2. Why is it Risky?
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.review_reason || 'Deviation from sender account baseline coupled with suspicious recipient cues.'}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
                      3. What Should Upay Do Next?
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      RECOMMENDATION: Soft friction modal shown to user. Hold settlement pending analyst approval.
                    </p>
                  </div>
                </div>

                {/* Detailed Evidence Panel when Expanded */}
                {isExpanded && (
                  <div className="my-5 border-t border-slate-800 pt-4 space-y-4 animate-fade-in">
                    <div className="flex space-x-2 border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveEvidenceTab('summary')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${activeEvidenceTab === 'summary' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
                      >
                        Feature Attributions & Rules
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEvidenceTab('graph')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${activeEvidenceTab === 'graph' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
                      >
                        Mule Network Topology
                      </button>
                    </div>

                    {activeEvidenceTab === 'summary' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-slate-300 block mb-2">Deterministic Rule Traces</span>
                          <p className="text-xs text-slate-400">Triggered rule: <span className="font-mono text-cyan-300">R02_NEW_DEV_LARGE_TRANSFER</span></p>
                          <p className="text-xs text-slate-400 mt-1">Severity: <span className="text-rose-400 font-bold">HIGH</span></p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-slate-300 block mb-2">Tree Feature Contributions</span>
                          <p className="text-xs text-slate-400">Recipient age days &le; 3 (+30.0 pts)</p>
                          <p className="text-xs text-slate-400 mt-1">Device age days = 0 (+35.0 pts)</p>
                        </div>
                      </div>
                    )}

                    {activeEvidenceTab === 'graph' && (
                      <MuleNetworkGraph targetWallet={item.scam_type || 'cust_mule_01'} lang={lang} />
                    )}
                  </div>
                )}

                {/* Triage Decision Actions */}
                {isPending ? (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Analyst investigation notes (optional)..."
                      value={notes[item.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                      className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 flex-grow sm:max-w-md focus:ring-1 focus:ring-cyan-500"
                    />

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(item.id, 'false_alarm')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center space-x-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>False Alarm</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(item.id, 'escalate')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center space-x-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Escalate L2</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(item.id, 'confirmed_scam')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-400 transition-all flex items-center space-x-1.5 shadow-lg shadow-rose-500/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm Scam</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Decision: <strong className="text-white uppercase">{item.decision}</strong></span>
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
  );
}
