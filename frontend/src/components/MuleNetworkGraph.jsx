import React, { useState, useEffect } from 'react';
import { Network, ShieldAlert, ArrowRight, RefreshCw, AlertTriangle, Users, DollarSign } from 'lucide-react';

export default function MuleNetworkGraph({ targetWallet = 'cust_mule_01', lang = 'bn' }) {
  const [wallet, setWallet] = useState(targetWallet);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchGraph = async (walletId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/v1/mule-network/${encodeURIComponent(walletId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch mule network');
      setData(json);
      const target = (json.nodes || []).find(n => n.id === walletId) || json.nodes?.[0];
      setSelectedNode(target || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph(wallet);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (wallet.trim()) {
      fetchGraph(wallet.trim());
    }
  };

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const isMule = data?.is_mule_suspect;

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30">
              NetworkX Graph Analytics
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Ego-Network Discovery
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'bn' ? 'মানি-মিউল নেটওয়ার্ক গ্রাফ ভিজ্যুয়ালাইজেশন' : 'Money-Mule Network Topology'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn' 
              ? 'একাধিক ভুক্তভোগীর দ্রুত ফান্ড ইনপুট এবং অস্বাভাবিক ক্যাশ-আউট প্রবাহ সনাক্তকরণ।'
              : 'Detects multi-hop fan-in from disparate victims and rapid fund dispersion.'}
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Wallet / Agent ID"
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center gap-1 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Inspect</span>}
          </button>
        </form>
      </div>

      {/* Summary KPI Strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Mule Risk Score</span>
            <span className={`text-xl font-black ${isMule ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.risk_score}/100
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Inflow</span>
            <span className="text-base font-bold text-cyan-400">৳{data.total_inflow?.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Outflow</span>
            <span className="text-base font-bold text-amber-400">৳{data.total_outflow?.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Unique Senders / Fan-In</span>
            <span className="text-base font-bold text-white">{data.unique_senders} senders</span>
          </div>
        </div>
      )}

      {/* Interactive SVG Network Graph */}
      <div className="relative h-64 sm:h-80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
        {loading ? (
          <div className="text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
            <span>Analyzing directed transaction graph...</span>
          </div>
        ) : error ? (
          <div className="text-center text-rose-400 text-xs">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <span>{error}</span>
          </div>
        ) : (
          <svg className="w-full h-full" viewBox="0 0 600 300">
            {/* Defs for arrow markers */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>
              <marker id="arrow-outflow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Central Target Node at (300, 150) */}
            {/* Draw Inflow Edges from left (100, y) to center (300, 150) */}
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
                  <circle cx="120" cy={startY} r="14" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" className="cursor-pointer hover:scale-110 transition-transform" />
                  <text x="120" y={startY + 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    V{idx+1}
                  </text>
                  <text x="190" y={(startY + 150) / 2 - 4} fill="#67e8f9" fontSize="8" fontFamily="monospace">
                    ৳{(e.amount || 0).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Draw Outflow Edges from center (300, 150) to right (480, y) */}
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
                  <circle cx="480" cy={endY} r="16" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" className="cursor-pointer hover:scale-110 transition-transform" />
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
              {isMule ? 'MULE' : 'TARGET'}
            </text>
            <text x="300" y="195" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
              {data?.wallet_id}
            </text>
          </svg>
        )}
      </div>

      {/* Reason Codes & Topological Evidence */}
      {data?.reasons && data.reasons.length > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-1">
            {lang === 'bn' ? 'নেটওয়ার্ক ট্রপোলজি প্রমাণ (Graph Evidence):' : 'Network Graph Evidence:'}
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
