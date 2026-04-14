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
    <section className="bg-gradient-to-br from-[#fffaf4] via-[#f7faff] to-[#efe4d3] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-[#132237] md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-xl text-[#8ea0b5]">{description}</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                card.isPopular
                  ? "md:scale-105 border-2 border-[#174dbb52] bg-gradient-to-br from-[#fffaf4] to-[#f7faff] shadow-2xl shadow-[#174dbb20]"
                  : "border border-[#1322371a] bg-white/88 hover:border-[#174dbb52]"
              }`}
            >
              {card.isPopular && (
                <div className="absolute left-6 top-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#174dbb] px-3 py-1 text-xs font-bold text-white">
                    <Zap className="h-3.5 w-3.5" />
                    MAIS VENDIDO
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="mb-2 text-2xl font-bold text-[#132237]">{card.name}</h3>
                <p className="mb-6 text-sm text-[#8ea0b5]">{card.description}</p>

                <div className="mb-8 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#132237]">â‚¬{card.price}</span>
                  <span className="text-[#8ea0b5]">/{card.billingPeriod === "month" ? "mÃªs" : "ano"}</span>
                </div>

                <button
                  onClick={card.onButtonClick}
                  className={`mb-8 w-full rounded-xl py-3 font-semibold transition-all duration-300 ${
                    card.isPopular
                      ? "bg-gradient-to-r from-[#174dbb] to-[#2e7df6] text-white hover:shadow-lg hover:shadow-[#174dbb20]"
                      : "border border-[#13223724] bg-[#174dbb14] text-[#174dbb] hover:bg-[#174dbb18]"
                  }`}
                  type="button"
                >
                  {card.buttonLabel}
                </button>

                <div className="space-y-4">
                  {card.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#174dbb]" />
                      <span className="text-sm text-[#7a8698]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!card.isPopular && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#174dbb] to-[#2e7df6] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
