import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const { type = 'info', message } = toast;

  const getStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-navy-900 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10';
      case 'error':
        return 'bg-navy-900 border-rose-500/40 text-rose-200 shadow-rose-500/10';
      default:
        return 'bg-navy-900 border-cyan-500/40 text-cyan-200 shadow-cyan-500/10';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full">
      <div className={`p-4 rounded-2xl border shadow-2xl flex items-center justify-between space-x-3 backdrop-blur-xl ${getStyle()}`}>
        <div className="flex items-center space-x-2.5">
          {getIcon()}
          <span className="text-xs sm:text-sm font-medium leading-snug">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
