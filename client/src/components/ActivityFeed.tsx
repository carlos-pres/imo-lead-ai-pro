import type { Lead } from "../services/api";

export function ActivityFeed({ leads }: { leads: Lead[] }) {
  return (
    <section className="rounded-3xl border border-[#1322371a] bg-white/90 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8698]">Atividade recente</p>
        <h3 className="text-xl font-semibold text-[#132237]">Ãšltimos movimentos da operaÃ§Ã£o</h3>
      </div>
      <div className="mt-4 space-y-3">
        {leads.slice(0, 4).map((lead) => (
          <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4" key={lead.id}>
            <p className="text-sm font-semibold text-[#132237]">{lead.name}</p>
            <p className="text-sm text-[#415066]">{lead.recommendedAction}</p>
            <p className="mt-1 text-xs text-[#7a8698]">Pipeline: {lead.pipelineStage}</p>
          </article>
        ))}
        {leads.length === 0 ? (
          <p className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4 text-sm text-[#415066]">
            Ainda sem atividade recente. Assim que houver movimentos, aparecem aqui.
          </p>
        ) : null}
      </div>
    </section>
  );
}
