import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

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
    <section className="relative min-h-screen overflow-hidden bg-gradient-dark px-6 pb-20 pt-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-gold-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-600/20 px-4 py-2">
            <Sparkles className="h-4 w-4 text-gold-400" />
            <span className="text-sm font-semibold text-gold-300">{eyebrow}</span>
          </div>
        </div>

        <h1 className="mb-8 text-center text-5xl font-bold leading-tight text-white md:text-7xl">
          {title}
        </h1>

        <p className="mx-auto mb-12 max-w-3xl text-center text-xl leading-relaxed text-slate-300 md:text-2xl">
          {description}
        </p>

        {badge && (
          <div className="mb-12 flex justify-center">
            <span className="rounded-full border border-gold-500/40 bg-gold-500/20 px-6 py-2 text-sm font-semibold text-gold-300">
              {badge}
            </span>
          </div>
        )}

        <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={onPrimaryClick}
            className="flex items-center gap-2 rounded-xl bg-gradient-gold px-8 py-4 text-lg font-semibold text-black-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold-500/30"
            type="button"
          >
            {primaryButtonLabel}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onSecondaryClick}
            className="rounded-xl border border-gold-500/40 bg-black-800/50 px-8 py-4 text-lg font-semibold text-gold-400 transition-all duration-300 hover:border-gold-400/60 hover:bg-black-700/50"
            type="button"
          >
            {secondaryButtonLabel}
          </button>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-2 text-3xl font-bold text-gold-400">87%</div>
            <p className="text-sm text-slate-400">Taxa de conversão com IA</p>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-gold-500">24/7</div>
            <p className="text-sm text-slate-400">Agente operacional</p>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-gold-300">10x</div>
            <p className="text-sm text-slate-400">Mais rápido que manual</p>
          </div>
        </div>
      </div>
    </section>
  );
};
