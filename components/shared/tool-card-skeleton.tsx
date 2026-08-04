export function ToolCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-5 w-16 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

export function ToolGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  );
}
