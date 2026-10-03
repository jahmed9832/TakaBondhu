import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Mic, 
  MessageSquare, 
  Send, 
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useI18n } from '../i18n';

export default function Hero({ onAnalyzeClick, onBeforeSendClick, onVoiceClick, lang = 'bn' }) {
  const { t } = useI18n(lang);

  return (
    <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 overflow-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/10 blur-[130px] -z-10 rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 mb-6 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>{lang === 'bn' ? 'উপায় গ্রাহকদের আর্থিক নিরাপত্তা সঙ্গী' : 'Smart Financial Safety for Upay Users'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-semibold">{lang === 'bn' ? 'যাচাই • সুরক্ষা • সঞ্চয়' : 'Protect • Save • Plan'}</span>
        </div>

        {/* 1 Large Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-200">
            {t('heroHeadline')}
          </span>
        </h1>

        {/* Short Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {t('heroSub')}
        </p>

        {/* 2 Big Action Buttons with 1-line helper text */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-2xl mx-auto">
          
          {/* Button 1: মেসেজ চেক করুন */}
          <div className="flex-1 flex flex-col items-center">
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="w-full py-4 px-6 rounded-2xl text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2.5 min-h-[56px] group"
            >
              <MessageSquare className="w-5 h-5 text-white" />
              <span>{t('btnHeroCheckMessage')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-slate-400 mt-2 text-center">
              {t('helperHeroCheck')}
            </span>
          </div>

          {/* Button 2: টাকা পাঠানোর আগে চেক */}
          <div className="flex-1 flex flex-col items-center">
            <button
              type="button"
              onClick={onBeforeSendClick}
              className="w-full py-4 px-6 rounded-2xl text-base font-bold bg-navy-900 border-2 border-teal-500/40 text-teal-300 hover:bg-teal-500/10 hover:border-teal-400 hover:text-white shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2.5 min-h-[56px] group"
            >
              <Send className="w-5 h-5 text-teal-400 group-hover:scale-105 transition-transform" />
              <span>{t('btnHeroBeforeSend')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-slate-400 mt-2 text-center">
              {t('helperHeroBeforeSend')}
            </span>
          </div>

        </div>

        {/* Voice Option Link */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onVoiceClick}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-3 rounded-lg hover:bg-cyan-500/10"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>🎙️ {t('btnHeroVoice')}</span>
          </button>
        </div>

        {/* Short "How it works" in 3 Icons */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 max-w-3xl mx-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            {t('howItWorksTitle')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start space-x-3.5 shadow-sm">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('step1Title')}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('step1Desc')}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start space-x-3.5 shadow-sm">
              <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex-shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('step2Title')}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('step2Desc')}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start space-x-3.5 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('step3Title')}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('step3Desc')}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
