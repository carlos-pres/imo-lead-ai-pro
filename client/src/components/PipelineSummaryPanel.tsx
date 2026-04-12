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
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Resumo da pipeline</p>
          <h2 className="text-xl font-semibold text-white">Leitura rápida da operação</h2>
        </div>
        <button className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-400/70" onClick={onOpenPipeline} type="button">
          Ver pipeline
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Lead prioritário</p>
          <strong className="mt-1 block text-lg text-white">{priorityLeadName}</strong>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Ação recomendada agora</p>
          <strong className="mt-1 block text-lg text-white">{recommendedAction}</strong>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-200">Leads em acompanhamento</p>
          <strong className="mt-1 block text-lg text-white">{activeLeadCount}</strong>
        </article>
      </div>
    </section>
  );
}

