import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  Send, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { SIMULATION_SCENARIOS } from '../data/sampleScenarios';

export default function ScamSimulatorModal({ isOpen, onClose, onTransferToAnalyzer }) {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [userChoice, setUserChoice] = useState(null); // 'pay' | 'verify' | 'share'
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const currentScenario = SIMULATION_SCENARIOS[selectedScenarioIndex];

  const handleSelectScenario = (index) => {
    setSelectedScenarioIndex(index);
    setUserChoice(null);
    setFeedback(null);
  };

  const handleTestDecision = (choice) => {
    setUserChoice(choice);
    if (choice === 'verify') {
      setFeedback({
        type: 'success',
        title: 'Outstanding Decision! 🛡️',
        message: 'You refused to panic. By independently verifying through the official customer care helpline, you stopped the scam before giving away credentials or funds.'
      });
    } else if (choice === 'pay') {
      setFeedback({
        type: 'danger',
        title: 'Trapped by Social Engineering! ⚠️',
        message: 'The scammer successfully triggered urgency panic. If real money were sent via mobile wallet or wire, financial recovery would be nearly impossible.'
      });
    } else if (choice === 'share') {
      setFeedback({
        type: 'critical',
        title: 'Critical Account Breach! 🚨',
        message: 'Never share an OTP, PIN, or password! Legitimate banks and service providers already have your database records and never demand secrets.'
      });
    }
  };

  const handleSendToLiveAnalyzer = () => {
    onTransferToAnalyzer(currentScenario.message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-navy-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-navy-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ScamRadar Interactive Simulation Lab
              </h3>
              <p className="text-xs text-slate-400">
                Practice identifying psychological traps in simulated scenarios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Scenario Tabs */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Select Scenario to Simulate:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SIMULATION_SCENARIOS.map((scen, idx) => (
                <button
                  key={scen.id}
                  onClick={() => handleSelectScenario(idx)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    selectedScenarioIndex === idx
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md'
                      : 'bg-navy-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">{scen.title}</div>
                  <div className="text-[10px] text-cyan-400 mt-0.5">{scen.difficulty}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Incoming Message Phone Display */}
          <div className="p-5 rounded-2xl bg-navy-950 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-semibold text-slate-200">
                  Incoming Alert from: <span className="text-cyan-300">{currentScenario.sender}</span>
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">Just now</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-100 text-sm leading-relaxed font-sans">
              "{currentScenario.message}"
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[11px]">Simulation Mode • Safe Sandbox</span>
              </span>
              <button
                onClick={handleSendToLiveAnalyzer}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center space-x-1"
              >
                <span>Send to Live AI Analyzer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Decision Prompt */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2">
              What is your immediate response?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleTestDecision('pay')}
                className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col justify-between ${
                  userChoice === 'pay'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                    : 'bg-navy-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Option A</span>
                <span className="font-normal text-slate-400 mt-1">Send the requested money right now to resolve the issue</span>
              </button>

              <button
                onClick={() => handleTestDecision('share')}
                className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col justify-between ${
                  userChoice === 'share'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-navy-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Option B</span>
                <span className="font-normal text-slate-400 mt-1">Reply with my OTP or PIN so they can cancel the charge</span>
              </button>

              <button
                onClick={() => handleTestDecision('verify')}
                className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col justify-between ${
                  userChoice === 'verify'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400'
                    : 'bg-navy-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Option C (Shielded)</span>
                <span className="font-normal text-slate-400 mt-1">Pause, do not pay, and verify on official hotline</span>
              </button>
            </div>
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm animate-fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-bold text-sm mb-1">{feedback.title}</div>
              <p className="leading-relaxed text-slate-300">{feedback.message}</p>
              
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <strong>Scam Shield Rule:</strong> {currentScenario.analysisHint}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-navy-950/80 flex items-center justify-between">
          <button
            onClick={() => {
              setUserChoice(null);
              setFeedback(null);
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Scenario</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Done Practicing
          </button>
        </div>

      </div>
    </div>
  );
}
