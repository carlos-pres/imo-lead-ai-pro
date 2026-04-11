import React from "react";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";

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
    <section className="bg-gradient-dark px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/15 to-gold-600/15 p-12 md:p-16">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-600/20 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-gold-400" />
              <span className="text-sm font-semibold text-gold-300">Pronto para começar</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl">{title}</h2>
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">{description}</p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={primaryButtonAction}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-8 py-4 text-lg font-semibold text-black-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold-500/30"
                type="button"
              >
                {primaryButtonLabel}
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={secondaryButtonAction}
                className="rounded-xl border border-gold-500/40 bg-black-800/50 px-8 py-4 text-lg font-semibold text-gold-400 transition-all duration-300 hover:bg-black-700/50"
                type="button"
              >
                {secondaryButtonLabel}
              </button>
            </div>

            {(whatsappNumber || email) && (
              <div className="grid grid-cols-1 gap-6 border-t border-gold-500/20 pt-8 md:grid-cols-2">
                {whatsappNumber && (
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-gold-600/20 p-3">
                      <MessageCircle className="h-6 w-6 text-gold-400" />
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-slate-400">Contacto rápido</div>
                      <div className="font-semibold text-white">{whatsappNumber}</div>
                      <div className="mt-1 text-xs text-slate-400">WhatsApp disponível 24/7</div>
                    </div>
                  </div>
                )}

                {email && (
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-gold-600/20 p-3">
                      <MessageCircle className="h-6 w-6 text-gold-400" />
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-slate-400">Email comercial</div>
                      <div className="font-semibold text-white">{email}</div>
                      <div className="mt-1 text-xs text-slate-400">Resposta em menos de 1h</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: "Seguro", value: "SSL 256-bit" },
            { label: "Conformidade", value: "RGPD" },
            { label: "Uptime", value: "99.9%" },
            { label: "Suporte", value: "24/7" },
          ].map((badge, idx) => (
            <div key={idx} className="rounded-xl border border-gold-500/20 bg-black-900/50 p-4 text-center">
              <div className="mb-1 text-xs text-slate-400">{badge.label}</div>
              <div className="text-sm font-semibold text-white">{badge.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
