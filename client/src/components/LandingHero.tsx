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
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fffaf4] via-[#f7faff] to-[#efe4d3] px-6 pb-20 pt-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#174dbb12] blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-[#174dbb12] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#13223724] bg-[#174dbb18] px-4 py-2">
            <Sparkles className="h-4 w-4 text-[#174dbb]" />
            <span className="text-sm font-semibold text-[#174dbb]">{eyebrow}</span>
          </div>
        </div>

        <h1 className="mb-8 text-center text-5xl font-bold leading-tight text-[#132237] md:text-7xl">
          {title}
        </h1>

        <p className="mx-auto mb-12 max-w-3xl text-center text-xl leading-relaxed text-[#7a8698] md:text-2xl">
          {description}
        </p>

        {badge && (
          <div className="mb-12 flex justify-center">
            <span className="rounded-full border border-[#174dbb52] bg-[#174dbb14] px-6 py-2 text-sm font-semibold text-[#174dbb]">
              {badge}
            </span>
          </div>
        )}

        <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={onPrimaryClick}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#174dbb] to-[#2e7df6] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#174dbb20]"
            type="button"
          >
            {primaryButtonLabel}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onSecondaryClick}
            className="rounded-xl border border-[#174dbb52] bg-white/90 px-8 py-4 text-lg font-semibold text-[#174dbb] transition-all duration-300 hover:border-[#174dbb75] hover:bg-white/90"
            type="button"
          >
            {secondaryButtonLabel}
          </button>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-2 text-3xl font-bold text-[#174dbb]">87%</div>
            <p className="text-sm text-[#8ea0b5]">Taxa de conversÃ£o com IA</p>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-[#174dbb]">24/7</div>
            <p className="text-sm text-[#8ea0b5]">Agente operacional</p>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-[#174dbb]">10x</div>
            <p className="text-sm text-[#8ea0b5]">Mais rÃ¡pido que manual</p>
          </div>
        </div>
      </div>
    </section>
  );
};
