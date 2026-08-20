export function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Player header skeleton */}
      <div className="flex items-center justify-between p-5 rounded-xl bg-dark-card border border-dark-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full skeleton" />
          <div className="space-y-2.5">
            <div className="w-40 h-5 skeleton rounded" />
            <div className="w-28 h-3.5 skeleton rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 rounded-lg skeleton" />
          <div className="w-20 h-8 rounded-lg skeleton" />
        </div>
      </div>

      {/* Card stack skeleton - single-column dak.gg style */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-dark-border bg-dark-card overflow-hidden">
            {/* Header skeleton - collapsed bar */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-1 h-10 rounded-full skeleton flex-shrink-0" />
              <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-28 h-3.5 skeleton rounded" />
                <div className="w-20 h-3 skeleton rounded" />
              </div>
              <div className="w-14 h-6 rounded-md skeleton" />
              <div className="w-3.5 h-3.5 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
