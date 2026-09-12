import type { ZzzBuildDiagnostics } from "../types";
import { BENCHMARK_ROLLS, MAX_ROLLS } from "../scoring";
import { formatStat } from "../labels";
import { useI18n } from "../../i18n";
import type { ZzzScoringMeta } from "../weights";

/**
 * The aggregate view of a build: how many rolls are working, where the dead
 * ones sit, and how the totals stand against the caps a guide sets ("CRIT
 * Rate until 80%"). Same shape as the Star Rail diagnostics, minus reroll
 * advice, which Zenless has no mechanic for.
 */
export function BuildPanel({ d, meta, tint }: { d: ZzzBuildDiagnostics; meta: ZzzScoringMeta; tint: string }) {
  const { t } = useI18n();
  const effectivePct = (d.effectiveRolls / MAX_ROLLS) * 100;
  const wastedPct = (d.wastedRolls / MAX_ROLLS) * 100;
  const critOk = d.critRatio !== null && d.critRatio >= 1.6 && d.critRatio <= 2.6;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">{t("zzz", "usefulRolls")}</h3>
          <p className="font-mono text-sm">
            <span className="font-bold text-zzz-text">{d.effectiveRolls}</span>
            <span className="text-zzz-muted"> {t("zzz", "ofTotal", { total: d.totalRolls })}</span>
          </p>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zzz-fill">
          <div className="animate-bar-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${effectivePct}%`, backgroundColor: tint }} />
          <div className="absolute inset-y-0 bg-zzz-muted/30" style={{ left: `${effectivePct}%`, width: `${wastedPct}%` }} />
          <div className="absolute inset-y-0 w-px bg-zzz-signal" style={{ left: `${(BENCHMARK_ROLLS / MAX_ROLLS) * 100}%` }} title={t("zzz", "benchmarkTitle", { n: BENCHMARK_ROLLS })} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zzz-muted">
          {d.effectiveRolls >= BENCHMARK_ROLLS
            ? t("zzz", "atBenchmark", { benchmark: BENCHMARK_ROLLS })
            : d.totalRolls >= BENCHMARK_ROLLS
              ? t("zzz", "pastBenchmark", {
                  total: d.totalRolls,
                  benchmark: BENCHMARK_ROLLS,
                  wasted: d.wastedRolls,
                })
              : t("zzz", "shortOfBenchmark", {
                  wasted: d.wastedRolls,
                  benchmark: BENCHMARK_ROLLS,
                })}
</p>
      </div>

      {meta.priority && (
        <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
          <h3 className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">{t("zzz", "statsPriority")}</h3>
          <p className="font-mono text-sm text-zzz-text">{meta.priority}</p>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">{t("zzz", "substatTotals")}</h3>
          <ul className="space-y-1">
            {d.totals.slice(0, 6).map((total) => (
              <li key={total.id} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-zzz-text/85">
                  <span className="font-mono text-zzz-muted">{total.rolls}x</span>{" "}
                  {t("zzzStats", String(total.id) as "11101")}
                </span>
                <span className="shrink-0 font-mono text-sm text-zzz-text">+{formatStat(total.id, total.value)}</span>
              </li>
            ))}
          </ul>
          {d.critRatio !== null && (
            <div className="mt-2 flex items-baseline justify-between border-t border-zzz-line pt-2">
              <span className="text-sm text-zzz-muted">{t("zzz", "critRatio")}</span>
              <span className="font-mono text-sm">
                <span className={critOk ? "text-zzz-accent" : "text-zzz-signal"}>1 : {d.critRatio.toFixed(2)}</span>
                <span className="ml-1.5 text-zzz-muted">{t("zzz", "critRatioTarget")}</span>
              </span>
            </div>
          )}
          {d.thresholds.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-zzz-line pt-2">
              {d.thresholds.map((th) => (
                <li key={th.id} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-zzz-muted">
                    {t("zzz", "fromDiscs", { stat: t("zzzStats", String(th.id) as "11101") })}{" "}
                    <span className="text-zzz-text/70">{t("zzz", "cap", { n: th.target })}</span>
                  </span>
                  <span className={`font-mono ${th.current >= th.target ? "text-zzz-accent" : "text-zzz-text"}`}>
                    {formatStat(th.id, th.current)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">{t("zzz", "deadRolls")}</h3>
          {d.waste.length === 0 ? (
            <p className="text-sm text-zzz-accent">{t("zzz", "nothingWasted")}</p>
          ) : (
            <ul className="space-y-1">
              {d.waste.slice(0, 5).map((w, i) => (
                <li key={`${w.slot}-${w.id}-${i}`} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-zzz-muted">
                    <span className="text-zzz-text/80">{t("zzzSlots", String(w.slot) as "1")}</span> {t("zzzStats", String(w.id) as "11101")}
                  </span>
                  <span className="shrink-0 font-mono text-zzz-muted">{t("zzz", "rollsCount", { n: w.rolls })}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 space-y-1 border-t border-zzz-line pt-2">
            {d.sets.map((s) => (
              <p key={s.setId} className="truncate text-sm text-zzz-text/80">
                <span className="font-mono text-zzz-accent">{t("zzz", "pieces", { n: s.pieces })}</span> {s.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
