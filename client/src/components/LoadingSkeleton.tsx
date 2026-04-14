export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[#13223724] bg-white/90 p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-[#eef3fb]" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="h-3 w-full animate-pulse rounded bg-[#f7faff]" key={index} />
        ))}
      </div>
    </div>
  );
}

