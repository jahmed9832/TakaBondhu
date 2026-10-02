import React from 'react';
import { ShieldCheck, ArrowRight, Mic, Lock, Eye, AlertOctagon } from 'lucide-react';

export default function Hero({ onAnalyzeClick, onVoiceClick }) {
  return (
    <section className="relative pt-12 pb-16 overflow-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-gradient-to-tr from-cyan-600/10 via-blue-600/10 to-indigo-600/10 blur-[130px] -z-10 rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Subtle pill tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Your AI Companion for Safer Financial Decisions</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-semibold">Protect. Save. Plan.</span>
        </div>

        {/* Large Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Stay one step{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
            ahead of scams.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Check suspicious messages, calls, and payment requests before you act.
        </p>

        {/* Primary Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={onAnalyzeClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-3 group"
          >
            <span>Analyze a Message</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onVoiceClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-navy-900/90 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-white transition-all flex items-center justify-center space-x-2.5 shadow-lg group"
          >
            <Mic className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>🎙️ Talk to TakaBondhu</span>
          </button>
        </div>

        {/* Value Props Row */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
          
          <div className="p-4 rounded-2xl bg-navy-950/70 border border-slate-800/90 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Tier Analysis</h4>
              <p className="text-xs text-slate-400 mt-0.5">Rule patterns + AI contextual breakdown.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-navy-950/70 border border-slate-800/90 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Zero Account Link</h4>
              <p className="text-xs text-slate-400 mt-0.5">No login or banking credentials required.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-navy-950/70 border border-slate-800/90 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Realtime Voice</h4>
              <p className="text-xs text-slate-400 mt-0.5">Spoken safety guidance in Bangla.</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
