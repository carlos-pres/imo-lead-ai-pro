import type { RoiMetrics } from "../lib/selectors";
import { formatEuro } from "../lib/utils";

export function RoiPanel({ metrics }: { metrics: RoiMetrics }) {
  return (
    <section className="rounded-3xl border border-[#1322371a] bg-white/90 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8698]">ROI comercial</p>
        <h3 className="text-xl font-semibold text-[#132237]">Impacto operacional da equipa</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Tempo mÃ©dio de resposta</p>
          <strong className="mt-1 block text-2xl text-[#132237]">{metrics.averageResponseHours}h</strong>
        </article>
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Taxa de contacto</p>
          <strong className="mt-1 block text-2xl text-[#132237]">{metrics.contactRate}%</strong>
        </article>
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Taxa de conversÃ£o</p>
          <strong className="mt-1 block text-2xl text-[#132237]">{metrics.conversionRate}%</strong>
        </article>
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Valor potencial recuperado</p>
          <strong className="mt-1 block text-2xl text-[#132237]">{formatEuro(metrics.recoveredPotentialValue)}</strong>
        </article>
      </div>
    </section>
  );
}
