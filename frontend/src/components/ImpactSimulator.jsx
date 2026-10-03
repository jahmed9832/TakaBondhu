import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

import { apiUrl } from '../apiConfig';

export default function ImpactSimulator({ lang = 'bn', isLargeText = false }) {
  // 3 user inputs with plain labels
  const [attempts, setAttempts] = useState(10000);
  const [avgLoss, setAvgLoss] = useState(8500);
  const [successRate, setSuccessRate] = useState(35);

  // Loaded strictly from API (ml/reports/results.json & impact/assumptions.json)
  const [catchRate, setCatchRate] = useState(null);
  const [yearlyRunningCost, setYearlyRunningCost] = useState(null);
  const [scenariosData, setScenariosData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formatInWords, setFormatInWords] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await fetch(apiUrl('/v1/impact/config'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCatchRate(data.metrics?.catch_rate_pct ?? null);
            setYearlyRunningCost(data.metrics?.yearly_running_cost_bdt ?? null);
            setAvgLoss(data.defaults?.avg_loss_per_scam_bdt ?? 8500);
            setSuccessRate(data.defaults?.attempt_success_rate_pct ?? 35);
            setAttempts(data.defaults?.scam_attempts_per_month ?? 10000);
            setScenariosData(data.scenarios ?? null);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not load impact config from API:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  // Format currency either in Words (Lakh/Crore) or full digits
  const formatBDT = (amount, inWords = formatInWords) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '৳০';
    const rounded = Math.round(amount);

    if (inWords) {
      if (Math.abs(rounded) >= 10000000) {
        const crore = (rounded / 10000000).toFixed(1);
        return `৳${crore} ${lang === 'bn' ? 'কোটি' : 'Crore'}`;
      }
      if (Math.abs(rounded) >= 100000) {
        const lakh = (rounded / 100000).toFixed(1);
        return `৳${lakh} ${lang === 'bn' ? 'লক্ষ' : 'Lakh'}`;
      }
    }
    return `৳${rounded.toLocaleString('en-US')}`;
  };

  // Safe fallback catch rate & running cost from config only
  const activeCatchRate = catchRate ?? 0;
  const activeRunningCost = yearlyRunningCost ?? 0;

  // Formula: attempts × % TakaBondhu catches × % that would have succeeded × avg loss × 12 − yearly running cost
  const monthlyGrossSaved = attempts * (activeCatchRate / 100) * (successRate / 100) * avgLoss;
  const yearlyGrossSaved = monthlyGrossSaved * 12;
  const yearlyNetSaved = Math.max(0, yearlyGrossSaved - activeRunningCost);

  // Scenario computations
  const getScenarioSaved = (scenarioKey) => {
    const s = scenariosData?.[scenarioKey];
    if (!s) return yearlyNetSaved;
    const sCatch = s.catch_rate_pct;
    const sSucc = s.success_rate_pct;
    const sLoss = avgLoss * (s.loss_multiplier || 1.0);
    const gross = attempts * (sCatch / 100) * (sSucc / 100) * sLoss * 12;
    return Math.max(0, gross - activeRunningCost);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Visible Provenance & Assumptions Disclaimer Banner */}
      <div 
        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm flex items-start gap-3 shadow-sm"
        role="alert"
      >
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-300 block mb-0.5">
            {lang === 'bn' ? 'স্বচ্ছ অনুমান বিজ্ঞপ্তি' : 'Transparency Notice'}
          </span>
          {lang === 'bn' 
            ? 'Illustrative estimate based on stated assumptions and a synthetic benchmark, not real upay data / শুধু অনুমান — বাস্তব উপায় ডেটা নয়'
            : 'Illustrative estimate based on stated assumptions and a synthetic benchmark, not real upay data.'
          }
        </div>
      </div>

      {/* 2. Top Header and Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            {lang === 'bn' ? 'কত টাকা বাঁচবে (সিমুলেটর)' : 'Money Saved Calculator'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {lang === 'bn' 
              ? '৩টি সহজ তথ্য দিয়ে দেখুন TakaBondhu বছরে সম্ভাব্য কত কোটি টাকা বাঁচাতে সাহায্য করবে।'
              : 'Enter 3 simple metrics to see estimated annual scam loss savings.'
            }
          </p>
        </div>

        {/* ৳ + words toggle */}
        <button
          onClick={() => setFormatInWords(!formatInWords)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          title={lang === 'bn' ? 'টাকার অংক কথায় (কোটি/লক্ষ) অথবা সংখ্যায় দেখুন' : 'Toggle currency in words vs numbers'}
        >
          {formatInWords ? (
            <ToggleRight className="w-5 h-5 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-slate-400" />
          )}
          <span>{formatInWords ? (lang === 'bn' ? '৳ কথায় (কোটি/লক্ষ)' : '৳ In Words (Crore/Lakh)') : (lang === 'bn' ? '৳ সংখ্যায়' : '৳ Exact Number')}</span>
        </button>
      </div>

      {/* 3. The 3 Simple Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Input 1: Scam attempts per month */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-attempts" className="text-sm font-semibold text-slate-200">
                {lang === 'bn' ? 'মাসে কতটি স্ক্যাম চেষ্টা হয়' : 'Scam attempts per month'}
              </label>
              <span 
                className="text-slate-400 hover:text-slate-200 cursor-help"
                title={lang === 'bn' ? 'প্রতি মাসে গ্রাহকদের লক্ষ্য করে প্রতারণার চেষ্টার আনুমানিক সংখ্যা (ডিফল্ট ১০,০০০)' : 'Estimated scam attempts targeted at customers each month'}
              >
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {lang === 'bn' ? 'ডিফল্ট: ১০,০০০ টি / মাস' : 'Default: 10,000 / month'}
            </p>
          </div>
          <div className="relative">
            <input
              id="input-attempts"
              type="number"
              min="100"
              max="1000000"
              step="500"
              value={attempts}
              onChange={(e) => setAttempts(Math.max(1, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Input 2: Average loss per scam */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-avgloss" className="text-sm font-semibold text-slate-200">
                {lang === 'bn' ? 'একটি স্ক্যামে গড় ক্ষতি (৳)' : 'Average loss per scam (৳)'}
              </label>
              <span 
                className="text-slate-400 hover:text-slate-200 cursor-help"
                title={lang === 'bn' ? 'একটি সফল প্রতারণায় গ্রাহকের গড় আর্থিক ক্ষতি (assumptions.json থেকে নেওয়া)' : 'Average loss per successful fraud incident'}
              >
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {lang === 'bn' ? 'ডিফল্ট: ৳৮,৫০০ টাকা' : 'Default: ৳8,500'}
            </p>
          </div>
          <div className="relative">
            <input
              id="input-avgloss"
              type="number"
              min="500"
              max="50000"
              step="500"
              value={avgLoss}
              onChange={(e) => setAvgLoss(Math.max(1, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Input 3: How many would have succeeded */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-successrate" className="text-sm font-semibold text-slate-200">
                {lang === 'bn' ? 'কতভাগ সফল হতো (%)' : 'How many would succeed (%)'}
              </label>
              <span 
                className="text-slate-400 hover:text-slate-200 cursor-help"
                title={lang === 'bn' ? 'কোনো বাধা না থাকলে কত শতাংশ প্রতারণা সফল হতো (ডিফল্ট ৩৫%)' : 'Percentage of scam attempts that would succeed if unblocked'}
              >
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {lang === 'bn' ? 'ডিফল্ট: ৩৫% (সংরক্ষণশীল)' : 'Default: 35%'}
            </p>
          </div>
          <div className="relative">
            <input
              id="input-successrate"
              type="number"
              min="5"
              max="100"
              step="1"
              value={successRate}
              onChange={(e) => setSuccessRate(Math.min(100, Math.max(1, Number(e.target.value) || 0)))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Big Result Line */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="text-sm font-medium text-emerald-400 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          {lang === 'bn' ? 'আনুমানিক বার্ষিক নিট সাশ্রয়' : 'Estimated Annual Net Benefit'}
        </div>

        <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight my-2">
          {lang === 'bn' ? (
            <>
              TakaBondhu বছরে আনুমানিক{' '}
              <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy">
                {formatBDT(yearlyNetSaved)}
              </span>{' '}
              টাকা বাঁচাতে পারে
            </>
          ) : (
            <>
              TakaBondhu could help save about{' '}
              <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy">
                {formatBDT(yearlyNetSaved)}
              </span>{' '}
              per year
            </>
          )}
        </div>

        {/* 5. Visible Step-by-Step Formula */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300 font-mono bg-slate-950/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1 font-sans">
            {lang === 'bn' ? '📐 হিসাবের স্পষ্ট ধাপ ও সূত্র:' : '📐 Transparent Step-by-Step Formula:'}
          </div>
          <div className="overflow-x-auto whitespace-nowrap py-1">
            <span className="text-emerald-300">{attempts.toLocaleString()}</span>
            <span className="text-slate-500"> (চেষ্টা) × </span>
            <span className="text-cyan-300">{activeCatchRate}%</span>
            <span className="text-slate-500"> (শনাক্ত) × </span>
            <span className="text-amber-300">{successRate}%</span>
            <span className="text-slate-500"> (সফলতা) × </span>
            <span className="text-emerald-300">৳{avgLoss.toLocaleString()}</span>
            <span className="text-slate-500"> (ক্ষতি) × </span>
            <span className="text-purple-300">১২ মাস</span>
            <span className="text-slate-500"> − </span>
            <span className="text-rose-300">৳{(activeRunningCost / 10000000).toFixed(2)} কোটি</span>
            <span className="text-slate-500"> (বার্ষিক খরচ) = </span>
            <span className="text-emerald-400 font-bold">{formatBDT(yearlyNetSaved, false)}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-2">
            {lang === 'bn' 
              ? `* মডেলের সনাক্তকরণ হার (${activeCatchRate}%) সরাসরি ml/reports/results.json থেকে API দ্বারা লোড করা হয়েছে।`
              : `* Model catch rate (${activeCatchRate}%) loaded directly via API from ml/reports/results.json.`}
          </p>
        </div>
      </div>

      {/* 6. Small Best / Base / Worst Row */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {lang === 'bn' ? 'বিভিন্ন অনুমানের দৃশ্যপট (সংবেদনশীলতা বিশ্লেষণ)' : 'Sensitivity Scenarios (Worst / Base / Best)'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Conservative / Worst */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-800/40">
            <div className="text-xs text-slate-400">
              {lang === 'bn' ? 'সতর্ক অনুমান (Worst)' : 'Conservative (Worst)'}
            </div>
            <div className="text-base font-bold text-amber-300 mt-1">
              {formatBDT(getScenarioSaved('conservative'))}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'bn' ? 'শনাক্ত ৫৮.৭%, সফলতা ২৫%' : '58.7% catch, 25% success'}
            </div>
          </div>

          {/* Base / Expected */}
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20">
            <div className="text-xs text-emerald-400 font-medium">
              {lang === 'bn' ? 'স্বাভাবিক অনুমান (Base)' : 'Base Expected'}
            </div>
            <div className="text-base font-bold text-emerald-300 mt-1">
              {formatBDT(yearlyNetSaved)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn' ? `শনাক্ত ${activeCatchRate}%, সফলতা ${successRate}%` : `${activeCatchRate}% catch, ${successRate}% success`}
            </div>
          </div>

          {/* Optimistic / Best */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-800/40">
            <div className="text-xs text-slate-400">
              {lang === 'bn' ? 'সর্বোচ্চ অনুমান (Best)' : 'Optimistic (Best)'}
            </div>
            <div className="text-base font-bold text-cyan-300 mt-1">
              {formatBDT(getScenarioSaved('optimistic'))}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'bn' ? 'শনাক্ত ৯৮.৩%, সফলতা ৪৫%' : '98.3% catch, 45% success'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
