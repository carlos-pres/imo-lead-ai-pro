import React from 'react';
import { Star } from 'lucide-react';

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
    <section className="py-20 px-6 bg-black-950">
      <div className="max-w-6xl mx-auto">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-black-900 to-black-950 border border-gold-500/20 hover:border-gold-500/40 transition-all"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-gold mb-4">
                <div className="text-black-900">{metric.icon}</div>
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300 mb-2">
                {metric.value}
              </div>
              <div className="text-white font-semibold mb-1">{metric.label}</div>
              <p className="text-xs text-slate-400">{metric.description}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-white text-center mb-12">
              O que dizem os nossos clientes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-2xl bg-gradient-to-br from-black-900 to-black-950 border border-gold-500/20"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gold-500 text-gold-500" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-300 mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-10 h-10 rounded-full"
                      />
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
