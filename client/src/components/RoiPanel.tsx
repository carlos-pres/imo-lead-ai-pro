import type { RoiMetrics } from "../lib/selectors";
import { formatEuro } from "../lib/utils";

export function RoiPanel({ metrics }: { metrics: RoiMetrics }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">ROI comercial</p>
        <h3 className="text-xl font-semibold text-white">Impacto operacional da equipa</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Tempo médio de resposta</p>
          <strong className="mt-1 block text-2xl text-white">{metrics.averageResponseHours}h</strong>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Taxa de contacto</p>
          <strong className="mt-1 block text-2xl text-white">{metrics.contactRate}%</strong>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Taxa de conversão</p>
          <strong className="mt-1 block text-2xl text-white">{metrics.conversionRate}%</strong>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Valor potencial recuperado</p>
          <strong className="mt-1 block text-2xl text-white">{formatEuro(metrics.recoveredPotentialValue)}</strong>
        </article>
      </div>
    </section>
  );
}

