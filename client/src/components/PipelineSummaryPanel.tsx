type PipelineSummaryPanelProps = {
  priorityLeadName: string;
  recommendedAction: string;
  activeLeadCount: number;
  onOpenPipeline?: () => void;
};

export function PipelineSummaryPanel({
  priorityLeadName,
  recommendedAction,
  activeLeadCount,
  onOpenPipeline,
}: PipelineSummaryPanelProps) {
  return (
    <section className="rounded-3xl border border-[#1322371a] bg-white/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8698]">Resumo da pipeline</p>
          <h2 className="text-xl font-semibold text-[#132237]">Leitura rápida da pipeline</h2>
        </div>
        <button
          className="rounded-xl border border-[#13223724] bg-white/90 px-4 py-2 text-sm font-semibold text-[#132237] hover:border-[#174dbb75]"
          onClick={onOpenPipeline}
          type="button"
        >
          Ver pipeline
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Lead prioritário</p>
          <strong className="mt-1 block text-lg text-[#132237]">{priorityLeadName}</strong>
        </article>
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Ação recomendada agora</p>
          <strong className="mt-1 block text-lg text-[#132237]">{recommendedAction}</strong>
        </article>
        <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4">
          <p className="text-sm text-[#415066]">Leads na pipeline</p>
          <strong className="mt-1 block text-lg text-[#132237]">{activeLeadCount}</strong>
        </article>
      </div>
    </section>
  );
}
