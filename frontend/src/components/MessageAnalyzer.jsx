import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  Send, 
  ClipboardPaste, 
  RotateCcw, 
  AlertCircle, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Gift,
  KeyRound,
  HeartHandshake,
  Link as LinkIcon,
  Headphones,
  Radio,
  Mic,
  MessageSquare
} from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import LiveVoiceCard from './LiveVoiceCard';
import { useI18n } from '../i18n';

const iconMap = {
  AlertTriangle: AlertTriangle,
  Headphones: Headphones,
  Gift: Gift,
  KeyRound: KeyRound,
  HeartHandshake: HeartHandshake,
  Link: LinkIcon
};

export default function MessageAnalyzer({ 
  onAnalyze, 
  isLoading, 
  error, 
  analyzerRef, 
  activeTab = 'text', 
  setActiveTab,
  initialText = '',
  lang = 'bn'
}) {
  const { t } = useI18n(lang);
  const [internalTab, setInternalTab] = useState('text');
  const currentTab = setActiveTab ? activeTab : internalTab;
  const setTab = setActiveTab || setInternalTab;

  const [inputText, setInputText] = useState(initialText);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  React.useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  const handleSelectScenario = (scenario) => {
    setSelectedScenarioId(scenario.id);
    setInputText(scenario.text);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setSelectedScenarioId(null);
      }
    } catch {
      alert(lang === 'bn' ? 'ক্লিপবোর্ড এক্সেস পাওয়া যায়নি। অনুগ্রহ করে হাতে পেস্ট করুন (Ctrl+V)।' : 'Clipboard access denied. Please paste manually (Ctrl+V).');
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedScenarioId(null);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onAnalyze(inputText.trim());
  };

  return (
    <section ref={analyzerRef} id="analyzer" className="py-8 sm:py-12 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mode Switcher: Voice vs Text */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6">
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all min-h-[44px] ${
              currentTab === 'text'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                : 'bg-navy-900/70 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>{t('navCheckMessage')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('voice')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all min-h-[44px] ${
              currentTab === 'voice'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                : 'bg-navy-900/70 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>🎙️ {lang === 'bn' ? 'ভয়েস সহকারী' : 'Voice Assistant'}</span>
          </button>
        </div>

        {/* Tab 1: Live Voice Card */}
        {currentTab === 'voice' && (
          <LiveVoiceCard 
            lang={lang}
            onScrollToAnalyzer={() => analyzerRef?.current?.scrollIntoView({ behavior: 'smooth' })} 
          />
        )}

        {/* Tab 2: Text Message Analyzer */}
        {currentTab === 'text' && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2.5 mb-1">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('analyzerTitle')}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                {t('analyzerSubtitle')}
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <label htmlFor="scam-message-input" className="font-semibold text-slate-300">
                    {t('inputMessageLabel')}
                  </label>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 text-xs font-medium flex items-center space-x-1"
                      title={t('btnPaste')}
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>{t('btnPaste')}</span>
                    </button>
                    {inputText && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-rose-400 text-xs font-medium flex items-center space-x-1"
                        title={t('btnClear')}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('btnClear')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  id="scam-message-input"
                  rows={4}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (selectedScenarioId) setSelectedScenarioId(null);
                  }}
                  disabled={isLoading}
                  placeholder={t('inputMessagePlaceholder')}
                  className="w-full bg-navy-950/90 border border-slate-700/80 rounded-2xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 font-sans text-sm sm:text-base leading-relaxed transition-all resize-y min-h-[120px]"
                />
                
                {/* 1-Line Helper Text under Input */}
                <p className="text-[11px] text-slate-400 mt-1">
                  {t('inputMessageHelper')}
                </p>
              </div>

              {/* Submit Button with Helper Text */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm sm:text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 min-h-[48px]"
                >
                  <Search className="w-4 h-4" />
                  <span>{isLoading ? t('btnAnalyzing') : t('btnAnalyze')}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-1.5">
                  {lang === 'bn' 
                    ? 'মেসেজটি স্ক্যাম বা ভুয়া কি না মুহূর্তেই পরীক্ষা করুন' 
                    : 'Tap to instantly check if this message contains scam signs'}
                </p>
              </div>
            </form>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
