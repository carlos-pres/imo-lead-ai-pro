import React from "react";
import { Star } from "lucide-react";

interface TrustMetric {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}

interface SocialProofProps {
  metrics: TrustMetric[];
  testimonials?: Array<{
    text: string;
    author: string;
    role: string;
    avatar?: string;
  }>;
}

export const SocialProof: React.FC<SocialProofProps> = ({ metrics, testimonials }) => {
  return (
    <section className="bg-[#fffaf4] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#1322371a] bg-gradient-to-br from-[#fffaf4] to-[#f7faff] p-6 text-center transition-all hover:border-[#174dbb52]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#174dbb] to-[#2e7df6]">
                <div className="text-[#132237]">{metric.icon}</div>
              </div>
              <div className="mb-2 bg-gradient-to-r from-[#174dbb] to-[#2e7df6] bg-clip-text text-3xl font-bold text-transparent">
                {metric.value}
              </div>
              <div className="mb-1 font-semibold text-[#132237]">{metric.label}</div>
              <p className="text-xs text-[#8ea0b5]">{metric.description}</p>
            </div>
          ))}
        </div>

        {testimonials && testimonials.length > 0 && (
          <div className="mt-20">
            <h3 className="mb-12 text-center text-3xl font-bold text-[#132237]">O que dizem os nossos clientes</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#1322371a] bg-gradient-to-br from-[#fffaf4] to-[#f7faff] p-8"
                >
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#174dbb] text-[#174dbb]" />
                    ))}
                  </div>
                  <p className="mb-6 leading-relaxed italic text-[#7a8698]">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img src={testimonial.avatar} alt={testimonial.author} className="h-10 w-10 rounded-full" />
                    )}
                    <div>
                      <div className="font-semibold text-[#132237]">{testimonial.author}</div>
                      <div className="text-xs text-[#8ea0b5]">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
