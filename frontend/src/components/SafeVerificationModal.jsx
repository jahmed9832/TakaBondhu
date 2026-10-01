import React from 'react';
import { X, ShieldCheck, Globe, PhoneCall, AlertTriangle, KeyRound, Check } from 'lucide-react';

export default function SafeVerificationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const rules = [
    {
      icon: Globe,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Use the official website / app',
      description: 'Open a fresh browser tab and manually type the official website address (e.g., your bank’s verified domain) or launch the official mobile app. Never click web links enclosed in unverified messages.'
    },
    {
      icon: PhoneCall,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Use a verified customer support number',
      description: 'Look up the customer care helpline printed directly on the physical back of your debit card or on an official monthly statement. Always initiate the call yourself.'
    },
    {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      title: 'Never use contact details provided in a suspicious message',
      description: 'Fraudsters often operate fake support lines and spoofed WhatsApp numbers. Any telephone number, callback request, or email inside the message leads straight to the scammer.'
    },
    {
      icon: KeyRound,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      title: 'Never share OTP / PIN / password',
      description: 'Legitimate financial institutions, telecom operators, and support agents already have internal records and will NEVER ask you to disclose your OTP, PIN, CVV, or passwords.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-navy-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-navy-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                How to Verify Safely
              </h3>
              <p className="text-xs text-slate-400">
                4 golden security rules to independently authenticate unverified demands
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

        {/* Rules Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {rules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 hover:border-slate-700 transition-all flex items-start space-x-4"
              >
                <div className={`p-2.5 rounded-xl border ${rule.bgColor} ${rule.color} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
                    <span>{idx + 1}. {rule.title}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-navy-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Remember: Real institutions give you time to verify.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Got It, Stay Safe</span>
          </button>
        </div>

      </div>
    </div>
  );
}
