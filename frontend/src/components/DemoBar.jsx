import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Headphones, 
  KeyRound, 
  Smartphone, 
  Network, 
  UserX, 
  CheckCircle2,
  X
} from 'lucide-react';
import { OFFICIAL_DEMO_SCENARIOS } from '../data/sampleScenarios';
import { useI18n } from '../i18n';

const iconMap = {
  'demo-fake-agent': Headphones,
  'demo-otp-harvest': KeyRound,
  'demo-account-takeover': Smartphone,
  'demo-mule-ring': Network,
  'demo-agent-anomaly': UserX,
  'demo-benign-lookalike': CheckCircle2
};

const plainNames = {
  bn: {
    'demo-fake-agent': '১. ভুয়া এজেন্ট',
    'demo-otp-harvest': '২. ওটিপি চুরি',
    'demo-account-takeover': '৩. একাউন্ট দখল',
    'demo-mule-ring': '৪. টাকার চক্র (মিউল)',
    'demo-agent-anomaly': '৫. সন্দেহজনক এজেন্ট',
    'demo-benign-lookalike': '৬. নিরাপদ মেসেজ'
  },
  en: {
    'demo-fake-agent': '1. Fake Agent',
    'demo-otp-harvest': '2. OTP Theft',
    'demo-account-takeover': '3. Account Takeover',
    'demo-mule-ring': '4. Mule Network',
    'demo-agent-anomaly': '5. Suspicious Agent',
    'demo-benign-lookalike': '6. Safe Message'
  }
};

export default function DemoBar({ activeDemoId, onSelectDemo, lang = 'bn' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n(lang);

  const handlePick = (scenario) => {
    onSelectDemo?.(scenario);
    setIsOpen(false);
  };

  return (
    <div className="bg-navy-950/90 border-b border-slate-800/80 px-4 py-2 sticky top-20 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Small Collapsible Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isOpen 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/10' 
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400 hover:text-white'
          }`}
          aria-expanded={isOpen}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isOpen ? t('demoToggleClose') : t('demoToggleOpen')}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Small indicator label */}
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {lang === 'bn' ? '১-ক্লিক ডেমো দিয়ে কার্যকারিতা পরীক্ষা করুন' : '1-click real scenarios to test detection'}
        </span>

      </div>

      {/* Expanded Scenario Drawer */}
      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 pb-3 border-t border-slate-800 animate-slide-down">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              {t('demoBannerDesc')}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {OFFICIAL_DEMO_SCENARIOS.map((scenario) => {
              const Icon = iconMap[scenario.id] || Sparkles;
              const isSelected = activeDemoId === scenario.id;
              const title = plainNames[lang]?.[scenario.id] || (lang === 'bn' ? scenario.nameBn : scenario.name);

              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handlePick(scenario)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between group min-h-[56px] ${
                    isSelected
                      ? 'bg-cyan-500 text-navy-950 font-bold border-cyan-300 shadow-md scale-102'
                      : 'bg-navy-900/90 border-slate-800 text-slate-200 hover:border-cyan-400 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-navy-950' : 'text-cyan-400'}`} />
                    <span className="font-bold text-xs truncate">
                      {title}
                    </span>
                  </div>
                  <span className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-navy-900' : 'text-slate-400'}`}>
                    {lang === 'bn' ? scenario.descriptionBn : scenario.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
