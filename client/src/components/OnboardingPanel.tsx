import { useMemo } from "react";
import { ActionButton } from "./ActionButton";

type OnboardingPanelProps = {
  totalLeads: number;
  priorityLeadName?: string;
  hasFollowUp: boolean;
  hasAutomation: boolean;
  onImportLeads?: () => void;
  onSyncApi?: () => void | Promise<void>;
  onOpenPipeline?: () => void;
  onOpenAutomation?: () => void;
};

type OnboardingStep = {
  label: string;
  state: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  onCta?: () => void;
};

export function OnboardingPanel({
  totalLeads,
  priorityLeadName,
  hasFollowUp,
  hasAutomation,
  onImportLeads,
  onSyncApi,
  onOpenPipeline,
  onOpenAutomation,
}: OnboardingPanelProps) {
  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        label: "Sincronizar API",
        state: onSyncApi ? "Ligada" : "Pendente",
        description: "Ligue a fonte principal para manter a carteira sincronizada com o cockpit.",
        done: Boolean(onSyncApi),
        ctaLabel: "Sincronizar",
        onCta: onSyncApi,
      },
      {
        label: "Importar leads",
        state: totalLeads > 0 ? `${totalLeads} leads importados` : "Pendente",
        description: "Traga a carteira para dentro da vista executiva com um carregamento limpo.",
        done: totalLeads > 0,
        ctaLabel: onImportLeads ? "Importar leads" : "Abrir pipeline",
        onCta: onImportLeads || onOpenPipeline,
      },
      {
        label: "Definir origem prioritária",
        state: priorityLeadName || hasFollowUp ? "Origem inicial definida" : "Sem prioridade definida",
        description: "Escolha a origem que vai alimentar a primeira decisão comercial do cockpit.",
        done: Boolean(priorityLeadName || hasFollowUp),
        ctaLabel: "Abrir pipeline",
        onCta: onOpenPipeline,
      },
      {
        label: "Ativar primeira automação",
        state: hasAutomation ? "Automação ativa" : "Pendente",
        description: "Lance a primeira cadência para o agente começar a operar sem atrito.",
        done: hasAutomation,
        ctaLabel: "Abrir automações",
        onCta: onOpenAutomation,
      },
    ],
    [hasAutomation, hasFollowUp, onImportLeads, onOpenAutomation, onOpenPipeline, onSyncApi, priorityLeadName, totalLeads]
  );

  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-[28px] border border-[#13223714] bg-white/90 p-5 shadow-[0_16px_36px_rgba(19,34,55,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Configuração inicial</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#132237]">Ligue o cockpit às suas fontes de leads em poucos minutos.</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#415066]">
            Configuração guiada para colocar a equipa a trabalhar com IA, sem adicionar ruído operacional.
          </p>
        </div>
        <span className="rounded-full bg-[#f3f7ff] px-3 py-1 text-xs font-semibold text-[#415066]">{completed}/4 passos concluídos</span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <article
            className="rounded-[24px] border border-[#13223714] bg-[#fffaf4] p-4 shadow-[0_10px_24px_rgba(19,34,55,0.04)]"
            key={step.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#132237]">{step.label}</p>
                <p className="mt-1 text-sm text-[#415066]">{step.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step.done ? "bg-emerald-100 text-emerald-700" : "bg-[#f3f7ff] text-[#415066]"}`}>
                {step.state}
              </span>
            </div>
            {step.onCta ? (
              <div className="mt-4">
                <ActionButton onClick={step.onCta}>{step.ctaLabel}</ActionButton>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
