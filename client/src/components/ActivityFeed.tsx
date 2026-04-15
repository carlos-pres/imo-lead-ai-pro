import type { Lead } from "../services/api";

function formatRelativeTime(value?: string | null) {
  if (!value) return "Sem registo temporal";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Sem registo temporal";

  const deltaMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (deltaMinutes < 1) return "há instantes";
  if (deltaMinutes < 60) return `há ${deltaMinutes} min`;

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `há ${deltaHours}h`;

  const deltaDays = Math.round(deltaHours / 24);
  return `há ${deltaDays} dia${deltaDays > 1 ? "s" : ""}`;
}

function stageLabel(stage: Lead["pipelineStage"]) {
  switch (stage) {
    case "novo":
      return "Novo";
    case "qualificacao":
      return "Qualificação";
    case "contactado":
      return "Contactado";
    case "visita":
      return "Visita";
    case "proposta":
      return "Proposta";
    case "nurture":
      return "Seguimento";
    default:
      return "Pipeline";
  }
}

export function ActivityFeed({ leads }: { leads: Lead[] }) {
  const sortedLeads = [...leads].sort((a, b) => {
    const aTime = new Date(a.lastContactAt || a.createdAt).getTime();
    const bTime = new Date(b.lastContactAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <section className="rounded-[28px] border border-[#13223714] bg-white/90 p-5 shadow-[0_16px_36px_rgba(19,34,55,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Atividade recente</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#132237]">Registo recente do cockpit</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#415066]">
            Acompanhe os últimos movimentos para perceber o que foi feito, em que etapa está cada lead e quando voltou a haver contacto.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sortedLeads.slice(0, 4).map((lead) => (
          <article className="rounded-[24px] border border-[#13223714] bg-[#fffaf4] p-4 shadow-[0_10px_24px_rgba(19,34,55,0.04)]" key={lead.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#132237]">{lead.name}</p>
                <p className="mt-1 text-sm text-[#415066]">{lead.lastContactAt ? lead.recommendedAction : lead.nextStep || lead.recommendedAction}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#174dbb]">{stageLabel(lead.pipelineStage)}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#415066]">
              <p>
                <span className="font-semibold text-[#132237]">Última atualização:</span> {formatRelativeTime(lead.lastContactAt || lead.createdAt)}
              </p>
              <span className="text-[#c2c9d3]">•</span>
              <p>
                <span className="font-semibold text-[#132237]">Canal:</span> {lead.outreachChannel || "WhatsApp"}
              </p>
            </div>
          </article>
        ))}

        {!sortedLeads.length ? (
          <article className="rounded-[24px] border border-[#13223714] bg-[#fffaf4] p-4 text-sm leading-6 text-[#415066] shadow-[0_10px_24px_rgba(19,34,55,0.04)]">
            Ainda sem atividade recente. Assim que existirem interações, o cockpit passa a mostrar o histórico operacional aqui.
          </article>
        ) : null}
      </div>
    </section>
  );
}
