export function StatusBadge({ status }: { status: "ativa" | "pausada" | "rascunho" | "quente" | "morno" | "frio" | string }) {
  const tone =
    status === "ativa" || status === "quente"
      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
      : status === "pausada" || status === "morno"
        ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
        : status === "rascunho" || status === "frio"
          ? "border-slate-500 bg-slate-700/40 text-slate-100"
          : "border-cyan-400/40 bg-cyan-500/15 text-cyan-100";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

