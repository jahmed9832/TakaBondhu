import React from 'react';
import { ShieldCheck, MessageSquare, Send, PiggyBank, Users } from 'lucide-react';
import { useI18n } from '../i18n';

export default function Footer({ onNavigate, lang = 'bn' }) {
  const { t } = useI18n(lang);

  const handleNav = (page) => {
    onNavigate?.(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-navy-950 border-t border-slate-800/80 pt-8 pb-8 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
          
          {/* Brand Info */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">
                {lang === 'bn' ? 'টাকাবন্ধু' : 'TAKABONDHU'}
              </span>
              <p className="text-[11px] text-slate-400">
                {t('footerBrand')}
              </p>
            </div>
          </div>

          {/* 4 Big Product Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleNav('scam-shield')}
              className="text-slate-300 hover:text-cyan-400 transition-colors flex items-center space-x-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('navCheckMessage')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('pre-send')}
              className="text-slate-300 hover:text-teal-400 transition-colors flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('navBeforeSend')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('savings-guide')}
              className="text-slate-300 hover:text-violet-400 transition-colors flex items-center space-x-1"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>{t('navTakaPlan')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('review')}
              className="text-slate-300 hover:text-amber-400 transition-colors flex items-center space-x-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('navFraudTeam')}</span>
            </button>
          </div>

        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-center sm:text-left text-[11px]">
          <div>
            {t('footerCopyright')}
          </div>
          <div>
            {t('footerDisclaimer')}
          </div>
        </div>

      </div>
    </footer>
  );
}
