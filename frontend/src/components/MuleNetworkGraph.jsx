import React, { useState, useEffect } from 'react';
import { 
  Network, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  HelpCircle,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { apiUrl, safeFetchJson } from '../apiConfig';
import { useI18n } from '../i18n';

// Pre-packaged realistic Upay transaction incident data
const SAMPLE_MULE_INCIDENT_TXS = [
  { sender: '01711223344', receiver: '01988776655', amount: 15000, type: 'send_money' },
  { sender: '01822334455', receiver: '01988776655', amount: 18500, type: 'send_money' },
  { sender: '01933445566', receiver: '01988776655', amount: 12000, type: 'send_money' },
  { sender: '01988776655', receiver: 'agent_0001', amount: 44000, type: 'cash_out' }
];

const SAMPLE_BENIGN_TXS = [
  { sender: '01711000001', receiver: '01811000002', amount: 3200, type: 'send_money' },
  { sender: '01811000002', receiver: 'merch_0001', amount: 1850, type: 'merchant_pay' }
];

const DEMO_PRESETS = [
  { id: 'cust_mule_04_unseen', labelBn: 'অদেখা মিউল চক্র (Mule Ring 04)', labelEn: 'Unseen Mule Ring 04', risk: 'critical' },
  { id: 'cust_mule_01', labelBn: 'তাত্ক্ষণিক ক্যাশ-আউট চক্র (Mule 01)', labelEn: 'Rapid Cash-out Mule 01', risk: 'critical' },
  { id: 'cust_mule_02', labelBn: 'সাইক্লিক লেয়ারিং অ্যাকাউন্ট (Mule 02)', labelEn: 'Layering Account 02', risk: 'high' },
  { id: '01811000001', labelBn: 'রহিম আহমেদ (নিয়মিত গ্রাহক)', labelEn: 'Rahim (Legitimate KYC)', risk: 'low' },
  { id: '01811000002', labelBn: 'করিম উল্লাহ (সন্দেহজনক ক্যাশআউট)', labelEn: 'Karim (Structuring Risk)', risk: 'medium' }
];

export default function MuleNetworkGraph({ targetWallet = 'cust_mule_04_unseen', lang = 'bn' }) {
  // Mode: 'demo' | 'real'
  const [mode, setMode] = useState('demo');
  const [wallet, setWallet] = useState(targetWallet);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useI18n(lang);

  // Real Data Transaction Builder State
  const [realTargetWallet, setRealTargetWallet] = useState('01988776655');
  const [customTransactions, setCustomTransactions] = useState(SAMPLE_MULE_INCIDENT_TXS);
  const [newTx, setNewTx] = useState({ sender: '', receiver: '', amount: '', type: 'send_money' });

  // 1. Fetch from server endpoint for given wallet
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

  // 2. Submit Custom Real Transactions to backend /v1/mule-network/analyze
  const analyzeRealTransactions = async (target, txList) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/v1/mule-network/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: target,
          transactions: txList
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to analyze custom transaction data');
      setData(json);
    } catch (err) {
      // Local client-side calculation fallback if backend unavailable
      console.warn('Backend analyze fallback, computing locally:', err);
      const computed = computeLocalMuleGraph(target, txList);
      setData(computed);
    } finally {
      setLoading(false);
    }
  };

  // Client-side instant graph computer fallback
  const computeLocalMuleGraph = (target, txList) => {
    let inflow = 0;
    let outflow = 0;
    const sendersMap = new Map();
    const receiversMap = new Map();
    const edges = [];

    for (const tx of txList) {
      const s = String(tx.sender || '').trim();
      const r = String(tx.receiver || '').trim();
      const amt = Number(tx.amount) || 0;
      const isIn = r.toLowerCase() === target.toLowerCase();
      const isOut = s.toLowerCase() === target.toLowerCase();

      if (isIn && s) {
        inflow += amt;
        const prev = sendersMap.get(s) || { amount: 0, count: 0 };
        sendersMap.set(s, { amount: prev.amount + amt, count: prev.count + 1 });
      } else if (isOut && r) {
        outflow += amt;
        const prev = receiversMap.get(r) || { amount: 0, count: 0 };
        receiversMap.set(r, { amount: prev.amount + amt, count: prev.count + 1 });
      }
    }

    for (const [s, val] of sendersMap.entries()) {
      edges.push({ source: s, target, amount: val.amount, tx_count: val.count, direction: 'inflow' });
    }
    for (const [r, val] of receiversMap.entries()) {
      edges.push({ source: target, target: r, amount: val.amount, tx_count: val.count, direction: 'outflow' });
    }

    const uniqueSenders = sendersMap.size;
    const uniqueReceivers = receiversMap.size;
    let risk = 15;
    const reasons = [];

    if (uniqueSenders >= 3) {
      risk += 35;
      reasons.push(`${uniqueSenders} unique accounts channeled funds into this central wallet.`);
    } else if (uniqueSenders >= 2) {
      risk += 15;
      reasons.push(`${uniqueSenders} distinct senders transferred money.`);
    }

    const ratio = inflow > 0 ? (outflow / inflow) : 0;
    if (inflow >= 10000 && ratio >= 0.70) {
      risk += 35;
      reasons.push(`Rapid fund drain: ${(ratio * 100).toFixed(0)}% of pooled funds cashed out.`);
    }

    if (edges.some(e => e.amount >= 20000 && e.amount % 500 === 0)) {
      risk += 15;
      reasons.push('High-value round structuring detected matching typical cash-out batches.');
    }

    const isMule = risk >= 60 || (uniqueSenders >= 3 && ratio >= 0.6);
    return {
      wallet_id: target,
      is_mule_suspect: isMule,
      risk_score: Math.min(99, Math.max(10, risk)),
      total_inflow: inflow,
      total_outflow: outflow,
      unique_senders: uniqueSenders,
      unique_receivers: uniqueReceivers,
      nodes: [
        { id: target, label: target, type: 'customer', is_target: true, is_mule: isMule },
        ...Array.from(sendersMap.keys()).map(s => ({ id: s, label: s, type: s.startsWith('agent_') ? 'agent' : 'customer' })),
        ...Array.from(receiversMap.keys()).map(r => ({ id: r, label: r, type: r.startsWith('agent_') ? 'agent' : (r.startsWith('merch_') ? 'merchant' : 'customer') }))
      ],
      edges,
      reasons: reasons.length ? reasons : ['Standard peer-to-peer transaction profile without structuring anomalies.']
    };
  };

  useEffect(() => {
    if (mode === 'demo' && targetWallet) {
      setWallet(targetWallet);
      fetchGraph(targetWallet);
    }
  }, [targetWallet, mode]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (wallet.trim()) {
      fetchGraph(wallet.trim());
    }
  };

  const handleAddTx = (e) => {
    e?.preventDefault();
    if (!newTx.sender || !newTx.receiver || !newTx.amount) return;
    const added = [
      ...customTransactions,
      {
        sender: newTx.sender.trim(),
        receiver: newTx.receiver.trim(),
        amount: Number(newTx.amount) || 0,
        type: newTx.type || 'send_money'
      }
    ];
    setCustomTransactions(added);
    setNewTx({ sender: '', receiver: '', amount: '', type: 'send_money' });
    analyzeRealTransactions(realTargetWallet, added);
  };

  const handleRemoveTx = (index) => {
    const updated = customTransactions.filter((_, i) => i !== index);
    setCustomTransactions(updated);
    analyzeRealTransactions(realTargetWallet, updated);
  };

  const handleLoadIncidentPreset = (presetList) => {
    setCustomTransactions(presetList);
    analyzeRealTransactions(realTargetWallet, presetList);
  };

  // CSV File Upload Reader
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        const parsedTxs = [];
        
        // Skip header if line includes sender
        const startIdx = lines[0].toLowerCase().includes('sender') ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 3) {
            parsedTxs.push({
              sender: parts[0],
              receiver: parts[1],
              amount: Number(parts[2]) || 0,
              type: parts[3] || 'send_money'
            });
          }
        }

        if (parsedTxs.length > 0) {
          setCustomTransactions(parsedTxs);
          analyzeRealTransactions(realTargetWallet, parsedTxs);
        }
      } catch (uploadErr) {
        console.warn('CSV parsing notice:', uploadErr);
      }
    };
    reader.readAsText(file);
  };

  const edges = data?.edges || [];
  const isMule = data?.is_mule_suspect;

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Bar: Mode Toggle & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
              mode === 'real'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {mode === 'real'
                ? (lang === 'bn' ? 'বাস্তব লেনদেন বিশ্লেষণ' : 'Live Real Data Analysis')
                : (lang === 'bn' ? 'ডেমো নমুনা ডেটা' : 'Demo Dataset Mode')}
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
              ? 'একাধিক প্রেরকের অর্থ একটি কেন্দ্রীয় ওয়ালেটে সংগ্রহ করে তাৎক্ষণিক ক্যাশ-আউট চক্র সনাক্তকরণ।'
              : 'Detects rapid multi-sender fund pooling and immediate cash-out structuring.'}
          </p>
        </div>

        {/* Mode Selector Pill Buttons */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              setMode('demo');
              fetchGraph(wallet);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'demo'
                ? 'bg-cyan-500 text-navy-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'নমুনা ডেটা (Demo)' : 'Demo Presets'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('real');
              analyzeRealTransactions(realTargetWallet, customTransactions);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              mode === 'real'
                ? 'bg-emerald-500 text-navy-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{lang === 'bn' ? 'বাস্তব ডেটা (Real Data)' : 'Real Data Input'}</span>
          </button>
        </div>
      </div>

      {/* DEMO MODE: Quick Preset Chips + Search Bar */}
      {mode === 'demo' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'নমুনা চক্র নির্বাচন করুন:' : 'Select Demo Preset:'}</span>
            </span>
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setWallet(preset.id);
                  fetchGraph(preset.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                  wallet === preset.id
                    ? 'bg-cyan-500 text-navy-950 font-bold border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {lang === 'bn' ? preset.labelBn : preset.labelEn}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder={lang === 'bn' ? 'যেকোনো ওয়ালেট নম্বর বা আইডি লিখুন...' : 'Enter wallet number or ID...'}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-cyan-500 flex-grow min-h-[38px]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center gap-1 transition-all min-h-[38px] shrink-0"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>{lang === 'bn' ? 'যাচাই করুন' : 'Search'}</span>}
            </button>
          </form>
        </div>
      )}

      {/* REAL DATA MODE: Custom Ledger / CSV Input Panel */}
      {mode === 'real' && (
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'bn' ? 'বাস্তব লেনদেন তালিকা ইনপুট ও বিশ্লেষণ' : 'Real Transaction Input & Analysis'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                ({customTransactions.length} {lang === 'bn' ? 'টি লেনদেন' : 'records'})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadIncidentPreset(SAMPLE_MULE_INCIDENT_TXS)}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-semibold hover:bg-rose-900/60 transition-all flex items-center gap-1"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>{lang === 'bn' ? 'মিউল ঘটনা লোড করুন' : 'Load Fraud Case'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadIncidentPreset(SAMPLE_BENIGN_TXS)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-900/60 transition-all flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{lang === 'bn' ? 'স্বাভাবিক লেনদেন লোড' : 'Load Normal Case'}</span>
              </button>

              <label className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3 text-cyan-400" />
                <span>{lang === 'bn' ? 'CSV আপলোড' : 'Upload CSV'}</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Central Target Wallet Setting */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs text-slate-300 shrink-0 font-medium">
              {lang === 'bn' ? 'কেন্দ্রীয় লক্ষ্য ওয়ালেট (Target Hub):' : 'Central Target Wallet:'}
            </span>
            <input
              type="text"
              value={realTargetWallet}
              onChange={(e) => {
                setRealTargetWallet(e.target.value);
                analyzeRealTransactions(e.target.value, customTransactions);
              }}
              placeholder="01988776655"
              className="bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-emerald-400 w-full sm:w-56"
            />
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? '(ইনফ্লো ও আউটফ্লোর কেন্দ্রবিন্দু)' : '(Central hub for inflow/outflow)'}
            </span>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2 sm:px-3">#</th>
                  <th className="p-2 sm:px-3">{lang === 'bn' ? 'প্রেরক (Sender)' : 'Sender'}</th>
                  <th className="p-2 sm:px-3">{lang === 'bn' ? 'প্রাপক (Receiver)' : 'Receiver'}</th>
                  <th className="p-2 sm:px-3">{lang === 'bn' ? 'পরিমাণ (BDT)' : 'Amount'}</th>
                  <th className="p-2 sm:px-3">{lang === 'bn' ? 'ধরন' : 'Type'}</th>
                  <th className="p-2 sm:px-3 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {customTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-2 sm:px-3 text-slate-500">{idx + 1}</td>
                    <td className="p-2 sm:px-3 text-cyan-300">{tx.sender}</td>
                    <td className="p-2 sm:px-3 text-amber-300">{tx.receiver}</td>
                    <td className="p-2 sm:px-3 text-white font-bold">৳{Number(tx.amount).toLocaleString()}</td>
                    <td className="p-2 sm:px-3 text-slate-400 text-[11px]">{tx.type}</td>
                    <td className="p-2 sm:px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveTx(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Transaction Form Row */}
          <form onSubmit={handleAddTx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
            <input
              type="text"
              placeholder={lang === 'bn' ? 'প্রেরক ওয়ালেট' : 'Sender wallet'}
              value={newTx.sender}
              onChange={(e) => setNewTx({ ...newTx, sender: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'প্রাপক ওয়ালেট' : 'Receiver wallet'}
              value={newTx.receiver}
              onChange={(e) => setNewTx({ ...newTx, receiver: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="number"
              placeholder={lang === 'bn' ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'}
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <select
              value={newTx.type}
              onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-mono"
            >
              <option value="send_money">send_money</option>
              <option value="cash_out">cash_out</option>
              <option value="merchant_pay">merchant_pay</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'যোগ করুন' : 'Add Tx'}</span>
            </button>
          </form>
        </div>
      )}

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
      <div className="relative h-64 sm:h-80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-3">
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
          <svg className="w-full h-full" viewBox="0 0 600 320">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>
              <marker id="arrow-outflow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Inflow Edges from Left */}
            {edges.filter(e => e.direction === 'inflow').slice(0, 6).map((e, idx, arr) => {
              const startY = 50 + idx * (220 / Math.max(1, arr.length - 1));
              return (
                <g key={`in-${idx}`}>
                  <line 
                    x1="110" y1={startY} 
                    x2="280" y2="160" 
                    stroke="#06b6d4" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                    markerEnd="url(#arrow)"
                    opacity="0.8"
                  />
                  <circle cx="110" cy={startY} r="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                  <text x="110" y={startY + 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    {e.source.slice(-4)}
                  </text>
                  <text x="185" y={(startY + 160) / 2 - 4} fill="#67e8f9" fontSize="8" fontFamily="monospace">
                    ৳{(e.amount || 0).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Outflow Edges to Right */}
            {edges.filter(e => e.direction === 'outflow').slice(0, 4).map((e, idx, arr) => {
              const endY = 70 + idx * (180 / Math.max(1, arr.length - 1));
              return (
                <g key={`out-${idx}`}>
                  <line 
                    x1="320" y1="160" 
                    x2="490" y2={endY} 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    markerEnd="url(#arrow-outflow)"
                    opacity="0.9"
                  />
                  <circle cx="490" cy={endY} r="17" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  <text x="490" y={endY + 4} textAnchor="middle" fill="#fcd34d" fontSize="8" fontFamily="monospace">
                    {e.target.startsWith('agent_') ? 'AGENT' : (e.target.startsWith('merch_') ? 'MERCH' : e.target.slice(-4))}
                  </text>
                  <text x="400" y={(160 + endY) / 2 - 4} fill="#fcd34d" fontSize="8" fontFamily="monospace">
                    ৳{(e.amount || 0).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Target Central Hub Node */}
            <circle 
              cx="300" 
              cy="160" 
              r="28" 
              fill={isMule ? "#450a0a" : "#022c22"} 
              stroke={isMule ? "#ef4444" : "#10b981"} 
              strokeWidth="3" 
            />
            {isMule && (
              <circle cx="300" cy="160" r="38" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" />
            )}
            <text x="300" y="164" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
              {isMule ? (lang === 'bn' ? 'মিউল' : 'MULE') : (lang === 'bn' ? 'ওয়ালেট' : 'WALLET')}
            </text>
            <text x="300" y="210" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
              {data?.wallet_id}
            </text>
          </svg>
        )}
      </div>

      {/* Reason Codes */}
      {data?.reasons && data.reasons.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-1">
            {lang === 'bn' ? 'শনাক্তকৃত নেটওয়ার্ক কারণ ও প্যাটার্নসমূহ:' : 'Identified Network Flags & Patterns:'}
          </span>
          <ul className="space-y-1.5">
            {data.reasons.map((r, i) => (
              <li key={i} className="text-xs text-rose-300 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0"></span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
