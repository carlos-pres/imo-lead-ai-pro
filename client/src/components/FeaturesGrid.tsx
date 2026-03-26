import React from 'react';

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

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({
  title,
  description,
  features,
}) => {
  return (
    <section className="py-20 px-6 bg-black-950">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{title}</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group p-8 rounded-2xl bg-gradient-to-br from-black-900 to-black-950 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/15"
            >
              {/* Icon Container */}
              <div className="mb-6 inline-flex items-center justify-center p-3 rounded-xl bg-gradient-gold">
                <div className="text-black-900">{feature.icon}</div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 mb-4 leading-relaxed">{feature.description}</p>

              {feature.highlight && (
                <div className="pt-4 border-t border-gold-500/20">
                  <p className="text-sm text-gold-400 font-semibold">{feature.highlight}</p>
                </div>
              )}

              {/* Hover effect line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-gold-400 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
