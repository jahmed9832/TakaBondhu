import React, { useState, useEffect } from 'react';
import { MessageSquareText, ShieldAlert, AlertTriangle, Users, Info, TrendingUp, RefreshCw, Cpu, Activity } from 'lucide-react';

export default function StatsDashboard() {
  const [runtimeData, setRuntimeData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [rtRes, bmRes] = await Promise.all([
        fetch('/api/metrics/runtime').catch(() => null),
        fetch('/api/metrics').catch(() => null)
      ]);

      if (rtRes && rtRes.ok) {
        const rtJson = await rtRes.json();
        setRuntimeData(rtJson);
      }
      if (bmRes && bmRes.ok) {
        const bmJson = await bmRes.json();
        setBenchmarkData(bmJson);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalRequests = runtimeData?.total_requests ?? 0;
  const flaggedScams = runtimeData?.flagged_scams ?? 0;
  const needsReview = runtimeData?.needs_review ?? 0;
  const reviewsDone = runtimeData?.review_decisions?.total_reviewed ?? 0;
  const p50 = runtimeData?.latency_ms?.p50;
  const isDemoEmpty = totalRequests === 0;

  const testUnseen = benchmarkData?.evaluation?.test_unseen?.hybrid;

  return (
    <section id="stats" className="py-10 border-y border-slate-800/80 bg-navy-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Live Runtime Telemetry & Model Benchmarks
              </h3>
              <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${
                isDemoEmpty 
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {isDemoEmpty ? 'Demo Mode (Awaiting traffic)' : 'Live Active'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Zero invented numbers. Live session telemetry updates every 5s; model benchmarks directly read from frozen test reports.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Runtime Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Card 1: Total Analyzed */}
          <div className="glass-card p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-cyan-400">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">Session live</span>
            </div>
            <div className="mt-1">
              <div className="text-3xl font-black text-white tracking-tight">
                {totalRequests}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1">
                Messages Analyzed
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {isDemoEmpty ? 'Run demo or analyze above' : `${runtimeData?.ml_available_calls ?? 0} with ML online`}
              </div>
            </div>
          </div>

          {/* Card 2: Flagged Scams */}
          <div className="glass-card p-5 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-pink-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">Score &gt;= 50</span>
            </div>
            <div className="mt-1">
              <div className="text-3xl font-black text-white tracking-tight">
                {flaggedScams}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1">
                Scams Flagged
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {totalRequests > 0 ? `${((flaggedScams / totalRequests) * 100).toFixed(1)}% flag rate` : '0.0% flag rate'}
              </div>
            </div>
          </div>

          {/* Card 3: Needs Review */}
          <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">HITL Required</span>
            </div>
            <div className="mt-1">
              <div className="text-3xl font-black text-white tracking-tight">
                {needsReview}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1">
                Human Review Triggers
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {reviewsDone} decisions logged
              </div>
            </div>
          </div>

          {/* Card 4: Measured Latency */}
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">Measured p50</span>
            </div>
            <div className="mt-1">
              <div className="text-3xl font-black text-white tracking-tight">
                {p50 !== null && p50 !== undefined ? `${p50} ms` : 'not run'}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1">
                Pipeline Latency
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                p95: {runtimeData?.latency_ms?.p95 !== null && runtimeData?.latency_ms?.p95 !== undefined ? `${runtimeData.latency_ms.p95} ms` : 'not run'}
              </div>
            </div>
          </div>

        </div>

        {/* Real Benchmark Validation Strip (from frozen ml/reports/results.json) */}
        {testUnseen && (
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Official Benchmark on Frozen Test Set (test_unseen — 72 Held-out Template Families)
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Model: {benchmarkData?.metadata?.model_version || 'TF-IDF+LR v1'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">Precision</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {(testUnseen.precision * 100).toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">Recall</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {(testUnseen.recall * 100).toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">F1 Score</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  {(testUnseen.f1 * 100).toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">Benign FPR</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {(testUnseen.fpr * 100).toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-slate-400 text-[11px]">Robustness (Evasions)</div>
                <div className="text-base font-bold text-purple-400 mt-0.5">
                  {benchmarkData?.robustness ? `${(benchmarkData.robustness.recall * 100).toFixed(2)}%` : 'not run'}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
