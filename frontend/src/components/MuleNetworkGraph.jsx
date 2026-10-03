import React, { useState, useEffect } from 'react';
import { Network, ArrowRight, RefreshCw, AlertTriangle, Users, DollarSign, HelpCircle } from 'lucide-react';
import { apiUrl } from '../apiConfig';
import { useI18n } from '../i18n';

export default function MuleNetworkGraph({ targetWallet = 'cust_mule_04_unseen', lang = 'bn' }) {
  const [wallet, setWallet] = useState(targetWallet);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useI18n(lang);

  const fetchGraph = async (walletId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/v1/mule-network/${encodeURIComponent(walletId)}`));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch mule network');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetWallet) {
      setWallet(targetWallet);
      fetchGraph(targetWallet);
    }
  }, [targetWallet]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (wallet.trim()) {
      fetchGraph(wallet.trim());
    }
  };

  const edges = data?.edges || [];
  const isMule = data?.is_mule_suspect;

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {t('demoDataBadge')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {lang === 'bn' ? 'নেটওয়ার্ক ম্যাপ' : 'Network Map'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'bn' ? 'মিউল নেটওয়ার্ক ও লেনদেন প্রবাহ' : 'Mule Network & Fund Flow'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn' 
              ? 'একাধিক ব্যক্তির টাকা দ্রুত এক ওয়ালেটে এনে তাৎক্ষণিক ক্যাশ-আউট করার চক্র সনাক্তকরণ।'
              : 'Detects rapid fund pooling from multiple senders followed by immediate cash-out.'}
          </p>
        </div>

        {/* Search Input with helper */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder={lang === 'bn' ? 'ওয়ালেট নম্বর...' : 'Wallet Number...'}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-cyan-500 min-h-[38px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center gap-1 transition-all min-h-[38px]"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>{lang === 'bn' ? 'খুঁজুন' : 'Search'}</span>}
          </button>
        </form>
      </div>

      {/* Summary KPI Strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{lang === 'bn' ? 'মিউল ঝুঁকি' : 'Risk'}</span>
              <span title={t('tooltipScore')} className="cursor-help text-[10px] text-slate-500 border border-slate-700 rounded-full w-3.5 h-3.5 flex items-center justify-center">?</span>
            </div>
            <span className={`text-lg font-black mt-0.5 block ${isMule ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.risk_score}/১০০
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">{lang === 'bn' ? 'মোট ইনপুট' : 'Inflow'}</span>
            <span className="text-sm sm:text-base font-bold text-cyan-400 mt-0.5 block">৳{data.total_inflow?.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">{lang === 'bn' ? 'মোট ক্যাশ-আউট' : 'Outflow'}</span>
            <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">৳{data.total_outflow?.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">{lang === 'bn' ? 'প্রেরক সংখ্যা' : 'Senders'}</span>
            <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">{data.unique_senders} {lang === 'bn' ? 'জন' : ''}</span>
          </div>
        </div>
      )}

      {/* Interactive SVG Network Graph */}
      <div className="relative h-60 sm:h-72 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-3">
        {loading ? (
          <div className="text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
            <span>{lang === 'bn' ? 'নেটওয়ার্ক ম্যাপ প্রস্তুত হচ্ছে...' : 'Loading network map...'}</span>
          </div>
        ) : error ? (
          <div className="text-center text-rose-400 text-xs">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <span>{error}</span>
          </div>
        ) : (
          <svg className="w-full h-full" viewBox="0 0 600 300">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>
              <marker id="arrow-outflow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Inflow Edges from Left */}
            {edges.filter(e => e.direction === 'inflow').slice(0, 5).map((e, idx, arr) => {
              const startY = 60 + idx * (180 / Math.max(1, arr.length - 1));
              return (
                <g key={`in-${idx}`}>
                  <line 
                    x1="120" y1={startY} 
                    x2="280" y2="150" 
                    stroke="#06b6d4" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                    markerEnd="url(#arrow)"
                    opacity="0.75"
                  />
                  <circle cx="120" cy={startY} r="14" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                  <text x="120" y={startY + 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    V{idx+1}
                  </text>
                  <text x="190" y={(startY + 150) / 2 - 4} fill="#67e8f9" fontSize="8" fontFamily="monospace">
                    ৳{(e.amount || 0).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Outflow Edges to Right */}
            {edges.filter(e => e.direction === 'outflow').slice(0, 3).map((e, idx, arr) => {
              const endY = 80 + idx * (140 / Math.max(1, arr.length - 1));
              return (
                <g key={`out-${idx}`}>
                  <line 
                    x1="320" y1="150" 
                    x2="480" y2={endY} 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    markerEnd="url(#arrow-outflow)"
                    opacity="0.85"
                  />
                  <circle cx="480" cy={endY} r="16" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  <text x="480" y={endY + 4} textAnchor="middle" fill="#fcd34d" fontSize="8" fontFamily="monospace">
                    {e.target.startsWith('agent_') ? 'AGT' : 'CASH'}
                  </text>
                  <text x="390" y={(150 + endY) / 2 - 4} fill="#fcd34d" fontSize="8" fontFamily="monospace">
                    ৳{(e.amount || 0).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Target Central Hub Node */}
            <circle cx="300" cy="150" r="26" fill={isMule ? "#450a0a" : "#022c22"} stroke={isMule ? "#ef4444" : "#10b981"} strokeWidth="3" />
            {isMule && (
              <circle cx="300" cy="150" r="34" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" />
            )}
            <text x="300" y="154" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
              {isMule ? (lang === 'bn' ? 'মিউল' : 'MULE') : (lang === 'bn' ? 'ওয়ালেট' : 'WALLET')}
            </text>
            <text x="300" y="195" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
              {data?.wallet_id}
            </text>
          </svg>
        )}
      </div>

      {/* Reason Codes */}
      {data?.reasons && data.reasons.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-1">
            {lang === 'bn' ? 'শনাক্তকৃত নেটওয়ার্ক কারণসমূহ:' : 'Identified Network Flags:'}
          </span>
          <ul className="space-y-1">
            {data.reasons.map((r, i) => (
              <li key={i} className="text-xs text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
