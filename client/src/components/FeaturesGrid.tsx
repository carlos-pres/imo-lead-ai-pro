import React from "react";

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

interface FeaturesGridProps {
  title: string;
  description: string;
  features: FeatureCardProps[];
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ title, description, features }) => {
  return (
    <section className="bg-black-950 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-400">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-gold-500/20 bg-gradient-to-br from-black-900 to-black-950 p-8 transition-all duration-300 hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/15"
            >
              <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-gradient-gold p-3">
                <div className="text-black-900">{feature.icon}</div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
              <p className="mb-4 leading-relaxed text-slate-400">{feature.description}</p>
              {feature.highlight && (
                <div className="border-t border-gold-500/20 pt-4">
                  <p className="text-sm font-semibold text-gold-400">{feature.highlight}</p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl bg-gradient-to-r from-gold-500 to-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
