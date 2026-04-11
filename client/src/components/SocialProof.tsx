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
    <section className="bg-black-950 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gold-500/20 bg-gradient-to-br from-black-900 to-black-950 p-6 text-center transition-all hover:border-gold-500/40"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold">
                <div className="text-black-900">{metric.icon}</div>
              </div>
              <div className="mb-2 bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-3xl font-bold text-transparent">
                {metric.value}
              </div>
              <div className="mb-1 font-semibold text-white">{metric.label}</div>
              <p className="text-xs text-slate-400">{metric.description}</p>
            </div>
          ))}
        </div>

        {testimonials && testimonials.length > 0 && (
          <div className="mt-20">
            <h3 className="mb-12 text-center text-3xl font-bold text-white">O que dizem os nossos clientes</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gold-500/20 bg-gradient-to-br from-black-900 to-black-950 p-8"
                >
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-gold-500 text-gold-500" />
                    ))}
                  </div>
                  <p className="mb-6 leading-relaxed italic text-slate-300">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img src={testimonial.avatar} alt={testimonial.author} className="h-10 w-10 rounded-full" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-xs text-slate-400">{testimonial.role}</div>
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
