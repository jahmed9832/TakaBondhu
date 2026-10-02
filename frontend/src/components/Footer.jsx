import React from 'react';
import { ShieldCheck, PiggyBank } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-navy-950 border-t border-slate-800/80 pt-12 pb-10 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between pb-8 border-b border-slate-800/80 gap-6">
          
          {/* Brand Info */}
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                TAKA<span className="text-cyan-400">BONDHU</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              "Protect. Save. Plan." Your AI companion for safer financial decisions.
            </p>
          </div>

          {/* Clean 2-Product Navigation */}
          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={() => {
                onNavigate?.('scam-shield');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-300 hover:text-cyan-400 transition-colors font-medium flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scam Shield</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate?.('savings-guide');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-300 hover:text-violet-400 transition-colors font-medium flex items-center space-x-1.5"
            >
              <PiggyBank className="w-3.5 h-3.5 text-violet-400" />
              <span>Savings Guide</span>
            </button>
          </div>

        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-center sm:text-left text-[11px]">
          <div>
            © {new Date().getFullYear()} TakaBondhu. All rights reserved.
          </div>
          <div>
            Educational safety tool • Never input actual bank passwords, PINs, or financial credentials
          </div>
        </div>

      </div>
    </footer>
  );
}
