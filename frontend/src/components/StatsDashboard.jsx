import React from 'react';
import { MessageSquareText, ShieldAlert, AlertTriangle, Users, Info, TrendingUp } from 'lucide-react';

export default function StatsDashboard() {
  const stats = [
    {
      label: 'Messages Analyzed',
      value: '127',
      change: '+14% today',
      icon: MessageSquareText,
      color: 'cyan',
      glowClass: 'from-cyan-500/10 to-blue-500/5',
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: 'High Risk Detected',
      value: '34',
      change: '26.7% flag rate',
      icon: AlertTriangle,
      color: 'rose',
      glowClass: 'from-rose-500/10 to-pink-500/5',
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/20'
    },
    {
      label: 'Potential Scams',
      value: '21',
      change: 'Confirmed patterns',
      icon: ShieldAlert,
      color: 'amber',
      glowClass: 'from-amber-500/10 to-yellow-500/5',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20'
    },
    {
      label: 'Users Protected',
      value: '89',
      change: 'Zero money lost',
      icon: Users,
      color: 'emerald',
      glowClass: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <section id="stats" className="py-12 border-y border-slate-800/80 bg-navy-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Simulated Platform Telemetry
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Demo Data
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Synthetic metric benchmarks tracking simulated scam message intercepts.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Figures are simulated metrics for hackathon evaluation</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`glass-card p-5 rounded-2xl border ${item.borderColor} bg-gradient-to-br ${item.glowClass} relative overflow-hidden group hover:border-slate-600 transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 ${item.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                    <span>{item.change}</span>
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {item.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
                    {item.label}
                  </div>
                </div>

                {/* Subtle corner light */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors pointer-events-none" />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
