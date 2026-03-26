import React from 'react';
import { MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FinalCTAProps {
  title: string;
  description: string;
  primaryButtonLabel: string;
  primaryButtonAction: () => void;
  secondaryButtonLabel: string;
  secondaryButtonAction: () => void;
  whatsappNumber?: string;
  email?: string;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  title,
  description,
  primaryButtonLabel,
  primaryButtonAction,
  secondaryButtonLabel,
  secondaryButtonAction,
  whatsappNumber,
  email,
}) => {
  return (
    <section className="py-20 px-6 bg-gradient-dark">
      <div className="max-w-5xl mx-auto">
        {/* Main CTA Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500/15 to-gold-600/15 border border-gold-500/30 p-12 md:p-16">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/15 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-600/20 border border-gold-500/30 mb-6">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-semibold text-gold-300">Pronto para começar</span>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {title}
            </h2>

            {/* Description */}
            <p className="text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
              {description}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={primaryButtonAction}
                className="group px-8 py-4 rounded-xl bg-gradient-gold font-semibold text-black-900 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/30 hover:scale-105 flex items-center justify-center gap-2"
              >
                {primaryButtonLabel}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={secondaryButtonAction}
                className="px-8 py-4 rounded-xl bg-black-800/50 border border-gold-500/40 font-semibold text-gold-400 text-lg transition-all duration-300 hover:bg-black-700/50"
              >
                {secondaryButtonLabel}
              </button>
            </div>

            {/* Contact Info */}
            {(whatsappNumber || email) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gold-500/20">
                {whatsappNumber && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gold-600/20">
                      <MessageCircle className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Contacto rápido</div>
                      <div className="font-semibold text-white">{whatsappNumber}</div>
                      <div className="text-xs text-slate-400 mt-1">WhatsApp disponível 24/7</div>
                    </div>
                  </div>
                )}

                {email && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gold-600/20">
                      <MessageCircle className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Email comercial</div>
                      <div className="font-semibold text-white">{email}</div>
                      <div className="text-xs text-slate-400 mt-1">Resposta em menos de 1h</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { label: 'Seguro', value: 'SSL 256-bit' },
            { label: 'Conformidade', value: 'RGPD' },
            { label: 'Uptime', value: '99.9%' },
            { label: 'Suporte', value: '24/7' },
          ].map((badge, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-black-900/50 border border-gold-500/20 text-center"
            >
              <div className="text-xs text-slate-400 mb-1">{badge.label}</div>
              <div className="font-semibold text-white text-sm">{badge.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
