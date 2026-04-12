export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
      : score >= 60
        ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
        : "border-slate-500 bg-slate-700/40 text-slate-100";

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>IA {score}</span>;
}

