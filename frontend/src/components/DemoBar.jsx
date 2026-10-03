import React from 'react';
import { Sparkles, ShieldAlert, KeyRound, Smartphone, Network, UserX, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_DEMO_SCENARIOS } from '../data/sampleScenarios';

const iconMap = {
  'demo-fake-agent': HeadphonesIcon,
  'demo-otp-harvest': KeyRound,
  'demo-account-takeover': Smartphone,
  'demo-mule-ring': Network,
  'demo-agent-anomaly': UserX,
  'demo-benign-lookalike': CheckCircle2
};

function HeadphonesIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export default function DemoBar({ activeDemoId, onSelectDemo, lang = 'en' }) {
  return (
    <div className="bg-navy-900/90 border-b border-cyan-500/30 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-md shadow-cyan-950/40 sticky top-20 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Banner Title */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {lang === 'bn' ? 'অফলাইন ডেমো মোড (১-ক্লিক)' : 'Demo Mode (1-Click Test Scenarios)'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 hidden lg:inline">
            100% Deterministic & Offline
          </span>
        </div>

        {/* 6 Scenario Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {OFFICIAL_DEMO_SCENARIOS.map((scenario) => {
            const Icon = iconMap[scenario.id] || Sparkles;
            const isSelected = activeDemoId === scenario.id;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectDemo(scenario)}
                title={scenario.description}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
                  isSelected
                    ? 'bg-cyan-500 text-navy-950 font-bold border-cyan-300 shadow-md shadow-cyan-500/30 scale-105'
                    : 'bg-navy-950/80 text-slate-300 border-slate-700/80 hover:border-cyan-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-navy-950' : 'text-cyan-400'}`} />
                <span className="whitespace-nowrap text-[11px]">
                  {lang === 'bn' ? scenario.nameBn : scenario.name}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
