type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-slate-100">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-200">{description}</p>
      {ctaLabel && onCta ? (
        <button className="mt-4 rounded-xl border border-slate-600 bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-400/70" onClick={onCta} type="button">
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

