import type { Lead } from "../services/api";

export function ActivityFeed({ leads }: { leads: Lead[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Atividade recente</p>
        <h3 className="text-xl font-semibold text-white">Últimos movimentos da operação</h3>
      </div>
      <div className="mt-4 space-y-3">
        {leads.slice(0, 4).map((lead) => (
          <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4" key={lead.id}>
            <p className="text-sm font-semibold text-white">{lead.name}</p>
            <p className="text-sm text-slate-200">{lead.recommendedAction}</p>
            <p className="mt-1 text-xs text-slate-300">Pipeline: {lead.pipelineStage}</p>
          </article>
        ))}
        {leads.length === 0 ? (
          <p className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
            Ainda sem atividade recente. Assim que houver movimentos, aparecem aqui.
          </p>
        ) : null}
      </div>
    </section>
  );
}

