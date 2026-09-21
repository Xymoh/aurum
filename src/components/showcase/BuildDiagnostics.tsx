import { useMemo } from "react";
import type { CharacterData } from "../../types/character";
import { BENCHMARK_ROLLS, MAX_ROLLS, buildDiagnostics } from "../../lib/diagnostics";
import { formatScore, formatStatValue } from "../../lib/format";
import { useI18n } from "../../i18n";

/**
 * How many of a build's rolls are working, where the dead ones sit, and
 * the two targets a Genshin build is usually judged on: crit balance and
 * Energy Recharge. Sits under the score bar in the expanded card, the same
 * spot the Star Rail and Zenless panels occupy.
 */
export function BuildDiagnostics({ character }: { character: CharacterData }) {
  const { t } = useI18n();
  const d = useMemo(() => buildDiagnostics(character), [character]);
  if (d.totalRolls === 0) return null;

  const effectivePct = (d.effectiveRolls / MAX_ROLLS) * 100;
  const wastedPct = (d.wastedRolls / MAX_ROLLS) * 100;
  const critOk = d.critRatio !== null && d.critRatio >= 1.6 && d.critRatio <= 2.6;
  const energyOk = d.energy !== null && d.energy.current >= d.energy.target;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dark-border/70 bg-dark-bg/30 p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-muted">{t("diag", "usefulRolls")}</h4>
          <p className="font-mono text-sm">
            <span className="font-bold text-dark-text">{d.effectiveRolls}</span>
            <span className="text-dark-muted"> {t("diag", "ofTotal", { total: d.totalRolls })}</span>
          </p>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-dark-border/40">
          <div className="animate-bar-grow absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${effectivePct}%` }} />
          <div className="absolute inset-y-0 bg-dark-muted/30" style={{ left: `${effectivePct}%`, width: `${wastedPct}%` }} />
          <div
            className="absolute inset-y-0 w-px bg-warn"
            style={{ left: `${(BENCHMARK_ROLLS / MAX_ROLLS) * 100}%` }}
            title={t("diag", "benchmarkTitle", { n: BENCHMARK_ROLLS })}
          />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-dark-muted">
          {d.effectiveRolls >= BENCHMARK_ROLLS
            ? t("diag", "atBenchmark", { benchmark: BENCHMARK_ROLLS })
            : d.totalRolls >= BENCHMARK_ROLLS
              ? t("diag", "pastBenchmark", { total: d.totalRolls, benchmark: BENCHMARK_ROLLS, wasted: d.wastedRolls })
              : t("diag", "shortOfBenchmark", { wasted: d.wastedRolls, benchmark: BENCHMARK_ROLLS })}
          {d.weakest && (
            <>
              {" "}
              {t("diag", "weakestLink", { slot: t("slots", d.weakest.slot), score: formatScore(d.weakest.percent) })}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-dark-border/70 bg-dark-bg/30 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-dark-muted">{t("diag", "substatTotals")}</h4>
          <ul className="space-y-1">
            {d.totals.slice(0, 6).map((total) => (
              <li key={total.statKey} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-dark-text/85">
                  <span className="font-mono text-dark-muted">{total.rolls}x</span> {total.displayName}
                </span>
                <span className="shrink-0 font-mono text-sm text-dark-text">+{formatStatValue(total.value, total.isPercentage)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 border-t border-dark-border/60 pt-2">
            {d.critRatio !== null && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-dark-muted">{t("diag", "critRatio")}</span>
                <span className="font-mono text-sm">
                  <span className={critOk ? "text-verdict-high" : "text-warn"}>1 : {d.critRatio.toFixed(2)}</span>
                  <span className="ml-1.5 text-dark-muted">{t("diag", "critRatioTarget")}</span>
                </span>
              </div>
            )}
            {d.energy && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-dark-muted">{t("diag", "energyTarget")}</span>
                <span className="font-mono text-sm">
                  <span className={energyOk ? "text-verdict-high" : "text-warn"}>{d.energy.current.toFixed(1)}%</span>
                  <span className="ml-1.5 text-dark-muted">{t("diag", "energyOf", { target: d.energy.target })}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-dark-border/70 bg-dark-bg/30 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-dark-muted">{t("diag", "deadRolls")}</h4>
          {d.waste.length === 0 ? (
            <p className="text-sm text-verdict-high">{t("diag", "nothingWasted")}</p>
          ) : (
            <ul className="space-y-1">
              {d.waste.slice(0, 5).map((w, i) => (
                <li key={`${w.slot}-${w.statKey}-${i}`} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-dark-muted">
                    <span className="text-dark-text/80">{t("slots", w.slot)}</span> {w.displayName}
                  </span>
                  <span className="shrink-0 font-mono text-dark-muted">{t("diag", "rollsCount", { n: w.rolls })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
