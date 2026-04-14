export function StatusBadge({ status }: { status: "ativa" | "pausada" | "rascunho" | "quente" | "morno" | "frio" | string }) {
  const tone =
    status === "ativa" || status === "quente"
      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-700"
      : status === "pausada" || status === "morno"
        ? "border-amber-400/50 bg-amber-500/15 text-amber-700"
        : status === "rascunho" || status === "frio"
          ? "border-[#13223724] bg-[#fffaf4] text-[#132237]"
          : "border-[#174dbb52] bg-[#174dbb14] text-[#174dbb]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}
