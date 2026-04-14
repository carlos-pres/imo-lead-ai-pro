import type { Lead } from "../services/api";
import { ActionButton } from "./ActionButton";
import { EmptyState } from "./EmptyState";

type TasksPanelProps = {
  leads: Lead[];
  onScheduleFollowUp?: () => void;
  onOpenAutomation?: () => void;
};

export function TasksPanel({ leads, onScheduleFollowUp, onOpenAutomation }: TasksPanelProps) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="Sem tarefas urgentes"
        description="A equipa estÃ¡ em dia. Pode abrir a automaÃ§Ã£o para preparar a prÃ³xima cadÃªncia."
        ctaLabel="Abrir automaÃ§Ãµes"
        onCta={onOpenAutomation}
      />
    );
  }

  return (
    <section className="rounded-3xl border border-[#1322371a] bg-white/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#174dbb]">Tarefas urgentes</p>
          <h3 className="text-xl font-semibold text-[#132237]">Seguimentos prioritÃ¡rios</h3>
        </div>
        <ActionButton onClick={onScheduleFollowUp}>Agendar seguimento</ActionButton>
      </div>
      <div className="mt-4 space-y-3">
        {leads.slice(0, 4).map((lead) => (
          <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4" key={lead.id}>
            <p className="text-sm font-semibold text-[#132237]">{lead.name}</p>
            <p className="text-sm text-[#415066]">{lead.nextStep || lead.recommendedAction}</p>
            <p className="mt-1 text-xs text-[#7a8698]">Janela ideal de contacto: {lead.slaHours}h</p>
          </article>
        ))}
      </div>
    </section>
  );
}
