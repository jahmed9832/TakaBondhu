import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mic, Menu, X, Sparkles, Globe, Type, BarChart3, AlertOctagon, PiggyBank, Search } from 'lucide-react';
import { apiUrl } from '../apiConfig';

export default function Navbar({ 
  currentPage = 'scam-shield', 
  onNavigate,
  onSelectVoice,
  lang = 'en',
  setLang,
  isLargeText = false,
  setIsLargeText
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProtected, setIsProtected] = useState(true);

  useEffect(() => {
    // Lightweight background health check to set AI Protected status
    fetch(apiUrl('/api/health'))
      .then(res => res.json())
      .then(data => {
        setIsProtected(data.status === 'ok' || data.status === 'degraded');
      })
      .catch(() => {
        setIsProtected(true); // Default to protected in demo/offline
      });
  }, []);

  const handleNav = (page) => {
    onNavigate?.(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy-950/90 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
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
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black tracking-tight text-white block">
                TAKA<span className="text-cyan-400">BONDHU</span>
              </span>
              <span className="text-xs font-bold text-cyan-300">
                (টাকাবন্ধু)
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 tracking-wider">
              {lang === 'bn' ? "Upay-এর বিশ্বস্ত টাকা সুরক্ষা বন্ধু" : "Upay's friend that keeps your money safe."}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-navy-900/80 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleNav('scam-shield')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              currentPage === 'scam-shield'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {lang === 'bn' ? 'মেসেজ ও কল স্ক্যান' : 'Scam Screener'}
          </button>

          <button
            type="button"
            onClick={() => handleNav('pre-send')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              currentPage === 'pre-send'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {lang === 'bn' ? 'সেন্ড মানি চেক' : 'Pre-Send Check'}
          </button>

          <button
            type="button"
            onClick={() => handleNav('savings-guide')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              currentPage === 'savings-guide'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {lang === 'bn' ? 'টাকা প্ল্যান (সঞ্চয়)' : 'Taka Plan'}
          </button>

          <button
            type="button"
            onClick={() => handleNav('review')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              currentPage === 'review'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {lang === 'bn' ? 'ফ্রড অপস কনসোল' : 'Fraud Ops Console'}
          </button>

          <button
            type="button"
            onClick={() => handleNav('impact')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              currentPage === 'impact'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {lang === 'bn' ? 'বিজনেস ইমপ্যাক্ট' : 'Impact Simulator'}
          </button>
        </nav>

        {/* Right Controls: Language, Accessibility, Voice */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 text-xs font-bold flex items-center space-x-1"
            title="Toggle Bangla / English"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Large Text Accessibility Toggle */}
          <button
            type="button"
            onClick={() => setIsLargeText(!isLargeText)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1 transition-all ${
              isLargeText 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Toggle Large Text Accessibility"
          >
            <Type className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isLargeText ? 'A+' : 'A'}</span>
          </button>

          {/* Voice Quick Action */}
          <button
            type="button"
            onClick={() => {
              if (currentPage !== 'scam-shield') {
                onNavigate?.('scam-shield');
              }
              onSelectVoice?.();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-500/10"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'কথা বলুন' : 'Voice'}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950/95 border-b border-slate-800 px-4 pt-2 pb-5 space-y-2 animate-fade-in">
          <button
            type="button"
            onClick={() => handleNav('scam-shield')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              currentPage === 'scam-shield' ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>{lang === 'bn' ? 'মেসেজ ও কল স্ক্যান' : 'Scam Screener (Message & Voice)'}</span>
            {currentPage === 'scam-shield' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleNav('pre-send')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              currentPage === 'pre-send' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300' : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>{lang === 'bn' ? 'সেন্ড মানি চেক (Pre-Send)' : 'Pre-Send Check (Soft Friction)'}</span>
            {currentPage === 'pre-send' && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleNav('savings-guide')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              currentPage === 'savings-guide' ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300' : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>{lang === 'bn' ? 'টাকা প্ল্যান (সঞ্চয় নির্দেশিকা)' : 'Taka Plan (Savings Coach)'}</span>
            {currentPage === 'savings-guide' && <span className="w-2 h-2 rounded-full bg-violet-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleNav('review')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              currentPage === 'review' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>{lang === 'bn' ? 'ফ্রড অপস কনসোল' : 'Fraud Ops Console (Case Cards & Mule Graph)'}</span>
            {currentPage === 'review' && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleNav('impact')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              currentPage === 'impact' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>{lang === 'bn' ? 'বিজনেস ইমপ্যাক্ট সিমুলেটর' : 'Impact Simulator & Model Evaluation'}</span>
            {currentPage === 'impact' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>
        </div>
      )}
    </header>
  );
}
