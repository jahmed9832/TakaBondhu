import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  PiggyBank, 
  Users, 
  Mic, 
  Menu, 
  X, 
  Globe, 
  Type 
} from 'lucide-react';
import { useI18n } from '../i18n';

export default function Navbar({ 
  currentPage = 'scam-shield', 
  onNavigate,
  onSelectVoice,
  lang = 'bn',
  setLang,
  isLargeText = false,
  setIsLargeText
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n(lang);

  const handleNav = (page) => {
    onNavigate?.(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    {
      id: 'scam-shield',
      label: t('navCheckMessage'),
      subLabel: lang === 'bn' ? 'Check a Message' : 'মেসেজ চেক করুন',
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-600',
      activeRing: 'border-cyan-400 text-cyan-300'
    },
    {
      id: 'pre-send',
      label: t('navBeforeSend'),
      subLabel: lang === 'bn' ? 'Before You Send' : 'টাকা পাঠানোর আগে',
      icon: Send,
      color: 'from-teal-500 to-emerald-600',
      activeRing: 'border-teal-400 text-teal-300'
    },
    {
      id: 'savings-guide',
      label: t('navTakaPlan'),
      subLabel: lang === 'bn' ? 'Taka Plan' : 'টাকা-পরিকল্পনা',
      icon: PiggyBank,
      color: 'from-violet-500 to-indigo-600',
      activeRing: 'border-violet-400 text-violet-300'
    },
    {
      id: 'review',
      label: t('navFraudTeam'),
      subLabel: lang === 'bn' ? 'Fraud Team (for upay)' : 'ফ্রড টিম (উপায়ের জন্য)',
      icon: Users,
      color: 'from-amber-500 to-orange-600',
      activeRing: 'border-amber-400 text-amber-300'
    }
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy-950/95 border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Headline */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
          onClick={() => handleNav('scam-shield')}
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/40 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 ring-2 ring-navy-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                {lang === 'bn' ? 'টাকাবন্ধু' : 'TAKABONDHU'}
              </span>
              <span className="text-xs font-bold text-cyan-400">
                {lang === 'bn' ? '(TakaBondhu)' : '(টাকাবন্ধু)'}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
              {t('brandSub')}
            </p>
          </div>
        </div>

        {/* 4 Big Desktop Navigation Tabs */}
        <nav className="hidden xl:flex items-center p-1.5 rounded-2xl bg-navy-900/90 border border-slate-800 space-x-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 text-sm font-bold min-h-[44px] ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-cyan-500/20 scale-[1.02]`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Compact for Medium screens (lg to xl) */}
        <nav className="hidden lg:flex xl:hidden items-center p-1 rounded-2xl bg-navy-900/90 border border-slate-800 space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold min-h-[40px] ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools: Language, Accessibility, Voice */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* 1-Tap Language Toggle (Bangla <-> English) */}
          <button
            type="button"
            onClick={() => setLang?.(lang === 'bn' ? 'en' : 'bn')}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all min-h-[40px]"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Text Size Accessibility Toggle */}
          <button
            type="button"
            onClick={() => setIsLargeText?.(!isLargeText)}
            className={`px-2.5 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center space-x-1 transition-all min-h-[40px] ${
              isLargeText 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={t('textSizeToggle')}
          >
            <Type className="w-4 h-4 text-cyan-400" />
            <span>{isLargeText ? 'A+' : 'A'}</span>
          </button>

          {/* Voice Shortcut Button */}
          <button
            type="button"
            onClick={() => {
              if (currentPage !== 'scam-shield') {
                handleNav('scam-shield');
              }
              onSelectVoice?.();
            }}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-navy-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-400 transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-500/10 min-h-[40px]"
          >
            <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">{t('voiceBtnNav')}</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950/98 border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-between min-h-[48px] transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-md` 
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
