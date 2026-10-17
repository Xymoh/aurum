import { useI18n } from "../../i18n";

export function LoadingSkeleton() {
  const { t } = useI18n();
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse" role="status">
      <span className="sr-only">{t("showcase", "loading")}</span>
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

      {/* Card stack skeleton, shaped like a collapsed CharacterCard (banner,
          slot pills, stat row) so the page does not jump when cards arrive. */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-dark-border bg-dark-card overflow-hidden"
          >
            <div className="flex min-h-[112px] items-center gap-3 px-4 py-3 sm:min-h-[128px] sm:px-6">
              <div className="hidden w-1 h-10 rounded-full skeleton flex-shrink-0 sm:block" />
              <div className="flex-1 space-y-2">
                <div className="w-36 h-5 skeleton rounded" />
                <div className="w-48 h-4 skeleton rounded" />
              </div>
              <div className="hidden w-16 h-8 rounded-md skeleton sm:block" />
              <div className="w-8 h-8 skeleton rounded-full" />
            </div>
            <div className="space-y-2 border-t border-dark-border/40 px-4 py-2.5 sm:px-6">
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 5 }, (_, j) => (
                  <div key={j} className="h-6 w-24 rounded-md skeleton sm:w-28" />
                ))}
              </div>
              <div className="h-5 w-32 rounded skeleton sm:w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
