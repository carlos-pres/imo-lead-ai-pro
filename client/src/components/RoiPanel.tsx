import type { RoiMetrics } from "../lib/selectors";
import { formatEuro } from "../lib/utils";

type RoiPanelProps = {
  metrics: RoiMetrics;
  leadCount: number;
  averagePriority: number;
};

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-[24px] border border-[#13223714] bg-[#fffaf4] p-4 shadow-[0_10px_24px_rgba(19,34,55,0.04)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#7a8698]">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold tracking-tight text-[#132237]">{value}</strong>
      {note ? <p className="mt-2 text-sm leading-6 text-[#415066]">{note}</p> : null}
    </article>
  );
}

export function RoiPanel({ metrics, leadCount, averagePriority }: RoiPanelProps) {
  const hasData = leadCount > 0;

  return (
    <section className="rounded-[28px] border border-[#13223714] bg-white/90 p-5 shadow-[0_16px_36px_rgba(19,34,55,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Desempenho comercial</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#132237]">Leitura executiva do impacto da operação</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#415066]">
            Resumo compacto para perceber tempo de resposta, contacto, conversão e valor recuperado sem ruído visual.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Tempo médio de resposta"
          note={hasData ? "Tempo médio até ao primeiro contacto registado." : "Ainda sem dados suficientes"}
          value={metrics.averageResponseHours > 0 ? `${metrics.averageResponseHours}h` : "—"}
        />
        <MetricCard
          label="Taxa de contacto"
          note={hasData ? "Percentagem de leads com contacto registado." : "Ainda sem dados suficientes"}
          value={metrics.contactRate > 0 ? `${metrics.contactRate}%` : "—"}
        />
        <MetricCard
          label="Taxa de conversão"
          note={hasData ? "Percentagem de leads já em visita ou proposta." : "Ainda sem dados suficientes"}
          value={metrics.conversionRate > 0 ? `${metrics.conversionRate}%` : "—"}
        />
        <MetricCard
          label="Valor potencial recuperado"
          note={hasData ? "Valor acumulado dos leads já em fase avançada." : "Ainda sem dados suficientes"}
          value={metrics.recoveredPotentialValue > 0 ? formatEuro(metrics.recoveredPotentialValue) : "—"}
        />
        <MetricCard
          label="Leads em carteira"
          note={hasData ? "Volume ativo sob acompanhamento comercial." : "Ainda sem dados suficientes"}
          value={String(leadCount)}
        />
        <MetricCard
          label="Pontuação média de prioridade"
          note={hasData ? "Score médio calculado pela IA para orientar a ação." : "Ainda sem dados suficientes"}
          value={averagePriority > 0 ? String(averagePriority) : "—"}
        />
      </div>
    </section>
  );
}
