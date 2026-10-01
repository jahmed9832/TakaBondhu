import React from 'react';
import { ShieldCheck, Scale, Database, SearchCheck, CheckCircle2, Lock } from 'lucide-react';

export default function AISafetySection() {
  const principles = [
    {
      title: 'Guidance, Not Absolute Financial Advice',
      description: 'TakaBachao provides contextual risk intelligence and warning sign detection to guide personal judgment, not automated financial or legal decisions.',
      icon: Scale,
      color: 'cyan'
    },
    {
      title: 'Verification Through Official Channels',
      description: 'Users are always encouraged to independently cross-check unverified demands via authenticated banking telephone numbers, mobile apps, or physical branches.',
      icon: SearchCheck,
      color: 'blue'
    },
    {
      title: 'Zero Real Customer Financial Data',
      description: 'The platform operates exclusively on user-submitted message excerpts and synthetic demonstration data. No banking credentials, account balances, or PII are stored.',
      icon: Database,
      color: 'emerald'
    },
    {
      title: 'Evidence-Based Explanations',
      description: 'AI assessments strictly cite factual message patterns (artificial urgency, fee threats, credential harvesting) without claiming unverified certainty.',
      icon: ShieldCheck,
      color: 'amber'
    }
  ];

  return (
    <section id="ai-safety" className="py-20 bg-navy-950/80 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Responsible AI Framework</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Safety & Ethical Principles
          </h2>
          <p className="mt-3 text-slate-300 text-base">
            How TakaBachao maintains strict ethical standards, protects user privacy, and ensures balanced evidence-based risk guidance.
          </p>
        </div>

        {/* Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-navy-900/60 hover:border-slate-700 transition-all flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5 flex items-center space-x-2">
                    <span>{item.title}</span>
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 border border-slate-800 text-center max-w-4xl mx-auto">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <strong className="text-cyan-400">Notice for Hackathon Evaluators:</strong> TakaBachao is engineered for educational awareness and defensive literacy. In production deployment, it integrates with pre-approved banking fraud feeds and regulatory hotlines for real-time threat reporting.
          </p>
        </div>

      </div>
    </section>
  );
}
