type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#13223724] bg-white/90 p-5 text-[#132237]">
      <p className="text-sm font-semibold text-[#132237]">{title}</p>
      <p className="mt-1 text-sm text-[#415066]">{description}</p>
      {ctaLabel && onCta ? (
        <button className="mt-4 rounded-xl border border-[#174dbb52] bg-gradient-to-r from-[#174dbb] to-[#2e7df6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#174dbb18] hover:brightness-110" onClick={onCta} type="button">
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
