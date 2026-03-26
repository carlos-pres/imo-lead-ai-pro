import React from 'react';
import { Check, Zap } from 'lucide-react';

export interface PricingCardData {
  name: string;
  description: string;
  price: number;
  billingPeriod: 'month' | 'year';
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

export const PricingGrid: React.FC<PricingGridProps> = ({
  title,
  description,
  cards,
}) => {
  return (
    <section className="py-20 px-6 bg-gradient-dark">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{title}</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`relative group rounded-2xl overflow-hidden transition-all duration-300 ${
                card.isPopular
                  ? 'md:scale-105 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20'
                  : 'bg-slate-900/50 border border-slate-800/50 hover:border-purple-500/30'
              }`}
            >
              {/* Popular Badge */}
              {card.isPopular && (
                <div className="absolute top-6 left-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/80 text-white text-xs font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    MAIS VENDIDO
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{card.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{card.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      €{card.price}
                    </span>
                    <span className="text-slate-400">/{card.billingPeriod === 'month' ? 'mês' : 'ano'}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={card.onButtonClick}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 mb-8 ${
                    card.isPopular
                      ? 'bg-gradient-agent text-white hover:shadow-lg hover:shadow-purple-500/30'
                      : 'bg-slate-800/50 text-white border border-slate-700/50 hover:bg-slate-800'
                  }`}
                >
                  {card.buttonLabel}
                </button>

                {/* Features List */}
                <div className="space-y-4">
                  {card.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hover effect */}
              {!card.isPopular && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
