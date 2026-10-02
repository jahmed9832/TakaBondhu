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
  Cpu,
  Radio,
  Mic,
  MessageSquare
} from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import LiveVoiceCard from './LiveVoiceCard';

const iconMap = {
  AlertTriangle: AlertTriangle,
  Headphones: Headphones,
  Gift: Gift,
  KeyRound: KeyRound,
  HeartHandshake: HeartHandshake,
  Link: LinkIcon
};

export default function MessageAnalyzer({ onAnalyze, isLoading, error, analyzerRef, activeTab = 'text', setActiveTab }) {
  const [internalTab, setInternalTab] = useState('text');
  const currentTab = setActiveTab ? activeTab : internalTab;
  const setTab = setActiveTab || setInternalTab;

  const [inputText, setInputText] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

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
      alert('Clipboard access denied. Please paste manually (Ctrl+V).');
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedScenarioId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAnalyze(inputText.trim());
  };

  return (
    <section ref={analyzerRef} id="analyzer" className="py-12 sm:py-16 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mode Switcher: Live Voice vs Message Analyzer */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-8">
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2.5 transition-all ${
              currentTab === 'text'
                ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                : 'bg-navy-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Analyze a Message</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('voice')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2.5 transition-all ${
              currentTab === 'voice'
                ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                : 'bg-navy-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>🎙️ Talk to TakaBondhu</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-500/20 text-cyan-300 uppercase font-black">
              LIVE VOICE
            </span>
          </button>
        </div>

        {/* Tab 1: Live Voice Assistant */}
        {currentTab === 'voice' && (
          <LiveVoiceCard onScrollToAnalyzer={() => analyzerRef?.current?.scrollIntoView({ behavior: 'smooth' })} />
        )}

        {/* Tab 2: Text Message Analyzer */}
        {currentTab === 'text' && (
          <>
            {/* Analyzer Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-9 border border-slate-800 relative overflow-hidden shadow-2xl">
              
              {/* Card Header: Is this safe? / Paste a suspicious message... */}
              <div className="mb-6 pb-5 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Is this safe?
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-slate-300">
                  Paste a suspicious message or describe what happened.
                </p>
              </div>

              {/* Sample Scenarios Quick-Fill */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quick Test Scenarios:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Click to fill</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {SAMPLE_SCENARIOS.map((scenario) => {
                    const IconComponent = iconMap[scenario.icon] || AlertTriangle;
                    const isSelected = selectedScenarioId === scenario.id;

                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => handleSelectScenario(scenario)}
                        className={`p-2 rounded-xl border text-left transition-all text-xs flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-cyan-950/70 border-cyan-400/80 text-white ring-1 ring-cyan-400'
                            : 'bg-navy-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                            {scenario.category}
                          </span>
                        </div>
                        <span className="font-semibold line-clamp-1 text-[11px]">
                          {scenario.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                  <label htmlFor="scam-message-input" className="font-semibold uppercase tracking-wider text-slate-300">
                    Message Content
                  </label>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="hover:text-cyan-300 text-slate-400 transition-colors flex items-center space-x-1 font-medium"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                    {inputText && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="hover:text-rose-400 text-slate-400 transition-colors flex items-center space-x-1 font-medium"
                        title="Clear text"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    id="scam-message-input"
                    rows={5}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (selectedScenarioId) setSelectedScenarioId(null);
                    }}
                    disabled={isLoading}
                    placeholder="Example: Someone called saying my account will be blocked unless I send money immediately..."
                    className="w-full bg-navy-950/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 font-sans text-sm sm:text-base leading-relaxed transition-all resize-y min-h-[140px] shadow-inner"
                  />

                  {isLoading && (
                    <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center space-y-3 z-10">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin"></div>
                        <ShieldAlert className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white tracking-wide">
                          TakaBondhu AI Scanning...
                        </p>
                        <p className="text-xs text-cyan-300 font-mono mt-0.5">
                          Checking threat signals and safety guidance
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start space-x-2.5 animate-fade-in">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold">Notice:</span> {error}
                    </div>
                  </div>
                )}

                {/* Submit Action Bar */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>AI Context Analysis • Realtime Safety Guidance</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !inputText.trim()}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center space-x-2 shadow-lg ${
                      isLoading || !inputText.trim()
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
                        : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-95'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{isLoading ? 'Analyzing...' : 'Analyze with Scam Shield'}</span>
                  </button>
                </div>

              </form>

            </div>
          </>
        )}

      </div>
    </section>
  );
}
