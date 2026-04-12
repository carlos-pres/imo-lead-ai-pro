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
        description="A equipa está em dia. Pode abrir a automação para preparar a próxima cadência."
        ctaLabel="Abrir automações"
        onCta={onOpenAutomation}
      />
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Tarefas urgentes</p>
          <h3 className="text-xl font-semibold text-white">Seguimentos prioritários</h3>
        </div>
        <ActionButton onClick={onScheduleFollowUp}>Agendar seguimento</ActionButton>
      </div>
      <div className="mt-4 space-y-3">
        {leads.slice(0, 4).map((lead) => (
          <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4" key={lead.id}>
            <p className="text-sm font-semibold text-white">{lead.name}</p>
            <p className="text-sm text-slate-200">{lead.nextStep || lead.recommendedAction}</p>
            <p className="mt-1 text-xs text-slate-300">Janela ideal de contacto: {lead.slaHours}h</p>
          </article>
        ))}
      </div>
    </section>
  );
}

