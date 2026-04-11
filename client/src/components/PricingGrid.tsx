import React from "react";
import { Check, Zap } from "lucide-react";

export interface PricingCardData {
  name: string;
  description: string;
  price: number;
  billingPeriod: "month" | "year";
  isPopular?: boolean;
  features: string[];
  buttonLabel: string;
  onButtonClick: () => void;
}

interface PricingGridProps {
  title: string;
  description: string;
  cards: PricingCardData[];
}

export const PricingGrid: React.FC<PricingGridProps> = ({ title, description, cards }) => {
  return (
    <section className="bg-gradient-dark px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-400">{description}</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                card.isPopular
                  ? "md:scale-105 border-2 border-gold-500/50 bg-gradient-to-br from-gold-500/15 to-gold-600/15 shadow-2xl shadow-gold-500/20"
                  : "border border-gold-500/20 bg-black-900/50 hover:border-gold-500/40"
              }`}
            >
              {card.isPopular && (
                <div className="absolute left-6 top-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/90 px-3 py-1 text-xs font-bold text-black-900">
                    <Zap className="h-3.5 w-3.5" />
                    MAIS VENDIDO
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="mb-2 text-2xl font-bold text-white">{card.name}</h3>
                <p className="mb-6 text-sm text-slate-400">{card.description}</p>

                <div className="mb-8 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">€{card.price}</span>
                  <span className="text-slate-400">/{card.billingPeriod === "month" ? "mês" : "ano"}</span>
                </div>

                <button
                  onClick={card.onButtonClick}
                  className={`mb-8 w-full rounded-xl py-3 font-semibold transition-all duration-300 ${
                    card.isPopular
                      ? "bg-gradient-gold text-black-900 hover:shadow-lg hover:shadow-gold-500/30"
                      : "border border-gold-500/30 bg-gold-500/20 text-gold-400 hover:bg-gold-500/30"
                  }`}
                  type="button"
                >
                  {card.buttonLabel}
                </button>

                <div className="space-y-4">
                  {card.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-400" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!card.isPopular && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-gold-500 to-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
