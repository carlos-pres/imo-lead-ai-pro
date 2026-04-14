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
    <section className="bg-[#fffaf4] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-[#132237] md:text-5xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-xl text-[#8ea0b5]">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-[#1322371a] bg-gradient-to-br from-[#fffaf4] to-[#f7faff] p-8 transition-all duration-300 hover:border-[#174dbb52] hover:shadow-lg hover:shadow-[#174dbb18]"
            >
              <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#174dbb] to-[#2e7df6] p-3">
                <div className="text-[#132237]">{feature.icon}</div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#132237]">{feature.title}</h3>
              <p className="mb-4 leading-relaxed text-[#8ea0b5]">{feature.description}</p>
              {feature.highlight && (
                <div className="border-t border-[#1322371a] pt-4">
                  <p className="text-sm font-semibold text-[#174dbb]">{feature.highlight}</p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl bg-gradient-to-r from-[#174dbb] to-[#2e7df6] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
