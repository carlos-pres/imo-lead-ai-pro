export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-700"
      : score >= 60
        ? "border-[#174dbb52] bg-[#174dbb14] text-[#174dbb]"
        : "border-[#13223724] bg-[#fffaf4] text-[#132237]";

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>IA {score}</span>;
}
