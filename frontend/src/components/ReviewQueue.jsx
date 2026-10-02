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
  ArrowRight
} from 'lucide-react';

export default function ReviewQueue({ onBackToAnalyzer }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'reviewed'

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/review/queue');
      const data = await res.json();
      setCases(data.cases || []);
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
      const res = await fetch('/api/review/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          decision,
          notes: notes[caseId] || ''
        })
      });

      if (res.ok) {
        // Update local state
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
              Simulated Analyst Workflow
            </span>
          </div>
          <h2 className="text-3xl font-black text-white mt-2 flex items-center space-x-3">
            <ClipboardList className="w-8 h-8 text-cyan-400" />
            <span>Fraud Operations Review Queue</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Human-in-the-loop triage queue for high-risk flags and model disagreements. Decisions logged here generate labeled retraining data.
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
          <span className="text-xs text-slate-400 font-medium">Pending Triage</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Reviewed by Analyst</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{reviewedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Flagged Cases</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">{cases.length}</div>
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
              ? 'All flagged cases have been triaged by human analysts.'
              : 'No cases currently in the review queue. Run an analysis from Scam Shield to populate.'}
          </p>
          <button
            type="button"
            onClick={onBackToAnalyzer}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-cyan-300 hover:bg-slate-800 transition-all inline-flex items-center space-x-2"
          >
            <span>Back to Scam Shield</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map(item => {
            const isPending = item.status === 'pending';
            const isSubmitting = submittingId === item.id;

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-3xl border transition-all ${
                  isPending 
                    ? 'bg-navy-900/70 border-slate-800 hover:border-slate-700' 
                    : 'bg-navy-950/50 border-slate-800/60 opacity-85'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      item.risk_score >= 80 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : item.risk_score >= 60 
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {item.risk_level} ({item.risk_score}/100)
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Case: {item.id}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Type: {item.scam_type || 'unknown'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Human Review Reason */}
                {item.needs_human_review && (
                  <div className="my-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Human Review Triggered: {item.review_reason || 'Algorithmic conflict'}</span>
                  </div>
                )}

                {/* Redacted Message Text */}
                <div className="my-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-mono text-cyan-200 break-words">
                  "{item.redacted_text}"
                </div>

                {/* Reviewer Action Area */}
                {isPending ? (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Optional analyst notes (e.g. verified with call centre log)..."
                      value={notes[item.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                      className="w-full sm:w-80 px-3 py-1.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(item.id, 'confirm_scam')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex items-center space-x-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Confirm Scam</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(item.id, 'false_alarm')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>False Alarm</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(item.id, 'escalate')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all flex items-center space-x-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Decision: <strong className="text-white uppercase">{item.decision}</strong></span>
                      {item.notes && <span className="text-slate-500 italic">("{item.notes}")</span>}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Reviewed: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleTimeString() : 'yes'}
                    </span>
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
