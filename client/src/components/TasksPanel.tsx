import type { Lead } from "../services/api";
import { ActionButton } from "./ActionButton";

type TasksPanelProps = {
  leads: Lead[];
  onContactLead?: (lead: Lead) => void;
  onOpenAutomation?: () => void;
  onImportLeads?: () => void;
};

function formatWindow(lead: Lead) {
  return `Próximas ${Math.max(4, lead.slaHours || 8)}h`;
}

function formatChannel(lead: Lead) {
  return lead.outreachChannel || "WhatsApp";
}

export function TasksPanel({ leads, onContactLead, onOpenAutomation, onImportLeads }: TasksPanelProps) {
  if (!leads.length) {
    return (
      <section className="rounded-[28px] border border-[#13223714] bg-white/90 p-5 shadow-[0_16px_36px_rgba(19,34,55,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Tarefas urgentes de hoje</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#132237]">Sem tarefas urgentes</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#415066]">
              A fila está limpa. Se quiser acelerar a próxima vaga, importe leads ou ative uma automação.
            </p>
          </div>
          <span className="rounded-full bg-[#f3f7ff] px-3 py-1 text-xs font-semibold text-[#415066]">Estado vazio</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {onImportLeads ? (
            <ActionButton onClick={onImportLeads}>Importar leads</ActionButton>
          ) : null}
          {onOpenAutomation ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1322371f] bg-white px-4 py-2.5 text-sm font-semibold text-[#132237] transition hover:border-[#174dbb4a] hover:bg-[#f7faff]"
              onClick={onOpenAutomation}
              type="button"
            >
              Abrir automações
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-[#13223714] bg-white/90 p-5 shadow-[0_16px_36px_rgba(19,34,55,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Tarefas urgentes de hoje</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#132237]">Contacte primeiro o que pode avançar já</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#415066]">
            Cada card indica a janela ideal, o canal recomendado e a próxima ação para acelerar a conversão.
          </p>
        </div>
        <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#174dbb]">{leads.length} em lista</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {leads.slice(0, 4).map((lead) => (
          <article className="rounded-[24px] border border-[#13223714] bg-[#fffaf4] p-4 shadow-[0_10px_24px_rgba(19,34,55,0.04)]" key={lead.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#132237]">{lead.name}</p>
                <p className="mt-1 text-sm text-[#415066]">{lead.nextStep || lead.recommendedAction}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#174dbb]">Urgente</span>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-[#415066] sm:grid-cols-2">
              <p><span className="font-semibold text-[#132237]">Janela ideal:</span> {formatWindow(lead)}</p>
              <p><span className="font-semibold text-[#132237]">Canal:</span> {formatChannel(lead)}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton onClick={() => onContactLead?.(lead)}>Contactar</ActionButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
