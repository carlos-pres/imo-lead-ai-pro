export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-700" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="h-3 w-full animate-pulse rounded bg-slate-800" key={index} />
        ))}
      </div>
    </div>
  );
}

