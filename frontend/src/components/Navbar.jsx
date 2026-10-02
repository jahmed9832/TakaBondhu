import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mic, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ 
  currentPage = 'scam-shield', 
  onNavigate,
  onSelectVoice
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProtected, setIsProtected] = useState(true);

  useEffect(() => {
    // Lightweight background health check to set AI Protected status
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setIsProtected(data.status === 'ok' || data.status === 'degraded');
      })
      .catch(() => {
        setIsProtected(false);
      });
  }, []);

  const handleNav = (page) => {
    onNavigate?.(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy-950/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Tagline (Logo click -> Scam Shield) */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => handleNav('scam-shield')}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 ring-2 ring-navy-950"></span>
            </span>
          </div>

          <div>
            <span className="text-xl font-black tracking-tight text-white block">
              TAKA<span className="text-cyan-400">BONDHU</span>
            </span>
            <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              Protect. Save. Plan.
            </p>
          </div>
        </div>

        {/* Minimal Navigation: ONLY Scam Shield & Savings Guide */}
        <nav className="hidden md:flex items-center p-1.5 rounded-2xl bg-navy-900/80 border border-slate-800 text-sm font-semibold">
          <button
            type="button"
            onClick={() => handleNav('scam-shield')}
            className={`px-5 py-2 rounded-xl transition-all ${
              currentPage === 'scam-shield'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Scam Shield
          </button>

          <button
            type="button"
            onClick={() => handleNav('savings-guide')}
            className={`px-5 py-2 rounded-xl transition-all ${
              currentPage === 'savings-guide'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Savings Guide
          </button>
        </nav>

        {/* Right Status Indicator & Quick Action */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Subtle "AI Protected" Status Indicator */}
          <div className="hidden sm:inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${isProtected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">AI Protected</span>
          </div>

          {/* Voice Quick Action */}
          <button
            type="button"
            onClick={() => {
              if (currentPage !== 'scam-shield') {
                onNavigate?.('scam-shield');
              }
              onSelectVoice?.();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-500/10"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden xs:inline">Talk to TakaBondhu</span>
            <span className="xs:hidden">Voice</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-950/95 border-b border-slate-800 px-4 pt-2 pb-5 space-y-2 animate-fade-in">
          <button
            type="button"
            onClick={() => handleNav('scam-shield')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between ${
              currentPage === 'scam-shield'
                ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>Scam Shield</span>
            {currentPage === 'scam-shield' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleNav('savings-guide')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between ${
              currentPage === 'savings-guide'
                ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>Savings Guide</span>
            {currentPage === 'savings-guide' && <span className="w-2 h-2 rounded-full bg-violet-400"></span>}
          </button>
        </div>
      )}
    </header>
  );
}
