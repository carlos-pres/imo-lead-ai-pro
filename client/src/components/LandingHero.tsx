import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LandingHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  badge?: string;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  eyebrow,
  title,
  description,
  primaryButtonLabel,
  secondaryButtonLabel,
  onPrimaryClick,
  onSecondaryClick,
  badge,
}) => {
  return (
    <section className="relative min-h-screen bg-gradient-dark pt-32 pb-20 px-6 overflow-hidden">
      {/* Gradient overlay background - GOLD PREMIUM */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-gold-600/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Eyebrow */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-600/20 border border-gold-500/30">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-semibold text-gold-300">{eyebrow}</span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white text-center mb-8 leading-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
          {description}
        </p>

        {/* Badge if provided */}
        {badge && (
          <div className="flex justify-center mb-12">
            <span className="px-6 py-2 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-sm font-semibold">
              {badge}
            </span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onPrimaryClick}
            className="group relative px-8 py-4 rounded-xl bg-gradient-gold font-semibold text-black-900 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/30 hover:scale-105 flex items-center gap-2"
          >
            {primaryButtonLabel}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onSecondaryClick}
            className="px-8 py-4 rounded-xl bg-black-800/50 border border-gold-500/40 font-semibold text-gold-400 text-lg transition-all duration-300 hover:bg-black-700/50 hover:border-gold-400/60"
          >
            {secondaryButtonLabel}
          </button>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-gold-400 mb-2">87%</div>
            <p className="text-sm text-slate-400">Taxa de conversão com IA</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold-500 mb-2">24/7</div>
            <p className="text-sm text-slate-400">Agente operacional</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold-300 mb-2">10x</div>
            <p className="text-sm text-slate-400">Mais rápido que manual</p>
          </div>
        </div>
      </div>
    </section>
  );
};
