import type { BuildDiagnostics, HsrRelic } from "../types";
import { BENCHMARK_ROLLS, MAX_ROLLS } from "../scoring";
import { formatStat } from "../labels";
import { useI18n } from "../../i18n";
import { useHsrVerdict } from "../verdict";

/**
 * The aggregate view of a build.
 *
 * A per-piece grade answers "did this relic roll well". It cannot answer "all
 * six of my relics are graded S, so why is my damage mediocre", because the
 * cause is spread across pieces: upgrades that landed on stats the character
 * does not use. Six relics that are each 80% useful look excellent one at a
 * time and lose a fifth of the build together.
 *
 * Laid out as three plain statements rather than a wall of figures. The
 * previous version showed everything at once and buried the one number that
 * matters.
 */
export function DiagnosticsPanel({
  d,
  tint,
  relics,
}: {
  d: BuildDiagnostics;
  tint: string;
  relics: HsrRelic[];
}) {
  const { t } = useI18n();
  const verdict = useHsrVerdict();
  // Cheapest wins first, the same ordering the Genshin side uses for "Room to
  // Improve": best odds at the top, since every die costs the same.
  const nextMoves = relics
    .filter((r) => r.reroll.action === "reroll")
    .sort((a, b) => b.reroll.improveChance - a.reroll.improveChance)
    .slice(0, 3);
  const toReplace = relics.filter((r) => r.reroll.action === "replace");

  const effectivePct = (d.effectiveRolls / MAX_ROLLS) * 100;
  const wastedPct = (d.wastedRolls / MAX_ROLLS) * 100;
  const critOk = d.critRatio !== null && d.critRatio >= 1.6 && d.critRatio <= 2.6;

  return (
    <div className="space-y-3">
      {/* Headline: how many upgrades are working, and against what bar. */}
      <div className="rounded-lg border border-hsr-border/70 bg-hsr-inset p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            {t("hsr", "usefulRolls")}
          </h3>
          <p className="font-mono text-sm">
            <span className="font-bold text-hsr-text">{d.effectiveRolls}</span>
            <span className="text-hsr-muted"> {t("hsr", "ofTotal", { total: d.totalRolls })}</span>
          </p>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-hsr-fill">
          <div
            className="animate-bar-grow absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${effectivePct}%`, backgroundColor: tint }}
          />
          <div
            className="absolute inset-y-0 bg-hsr-muted/30"
            style={{ left: `${effectivePct}%`, width: `${wastedPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-hsr-gold"
            style={{ left: `${(BENCHMARK_ROLLS / MAX_ROLLS) * 100}%` }}
            title={t("hsr", "benchmarkTitle", { n: BENCHMARK_ROLLS })}
          />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-hsr-muted">
          {d.effectiveRolls >= BENCHMARK_ROLLS
            ? t("hsr", "atBenchmark", { benchmark: BENCHMARK_ROLLS })
            : d.totalRolls >= BENCHMARK_ROLLS
              ? t("hsr", "pastBenchmark", {
                  total: d.totalRolls,
                  benchmark: BENCHMARK_ROLLS,
                  wasted: d.wastedRolls,
                })
              : t("hsr", "shortOfBenchmark", {
                  wasted: d.wastedRolls,
                  benchmark: BENCHMARK_ROLLS,
                })}
</p>
      </div>

      {(nextMoves.length > 0 || toReplace.length > 0) && (
        <div className="rounded-lg border border-hsr-border/70 bg-hsr-inset p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            {t("hsr", "bestNextMoves")}
          </h3>
          <ul className="space-y-1">
            {nextMoves.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">
                  <span className="text-hsr-text">{t("hsrSlots", r.slot)}</span>{" "}
                  <span className="text-hsr-muted">{verdict(r.reroll).label}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-hsr-muted">
                  {Math.round(r.reroll.improveChance * 100)}{t("hsr", "perDie")}
                </span>
              </li>
            ))}
            {toReplace.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">
                  <span className="text-hsr-text">{t("hsrSlots", r.slot)}</span>{" "}
                  <span className="text-verdict-replace">{t("hsr", "farmReplacementShort")}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-hsr-muted">
                  {t("hsr", "topsOut", { n: r.reroll.realisticCeiling.toFixed(0) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Left: what the build actually adds up to. */}
        <div className="rounded-lg border border-hsr-border/70 bg-hsr-inset p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            {t("hsr", "substatTotals")}
          </h3>
          <ul className="space-y-1">
            {d.totals.slice(0, 6).map((total) => (
              <li key={total.key} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-hsr-text/85">
                  <span className="font-mono text-hsr-muted">{total.rolls}x</span>{" "}
                  {t("hsrStats", total.key)}
                </span>
                <span className="shrink-0 font-mono text-sm text-hsr-text">
                  +{formatStat(total.key, total.value)}
                </span>
              </li>
            ))}
          </ul>

          {d.critRatio !== null && (
            <div className="mt-2 flex items-baseline justify-between border-t border-hsr-line pt-2">
              <span className="text-sm text-hsr-muted">{t("hsr", "critRatio")}</span>
              <span className="font-mono text-sm">
                <span className={critOk ? "text-hsr-accent" : "text-warn"}>
                  1 : {d.critRatio.toFixed(2)}
                </span>
                <span className="ml-1.5 text-hsr-muted">{t("hsr", "critRatioTarget")}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: what to actually do about it. */}
        <div className="rounded-lg border border-hsr-border/70 bg-hsr-inset p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            {t("hsr", "deadRolls")}
          </h3>
          {d.waste.length === 0 ? (
            <p className="text-sm text-hsr-accent">
              {t("hsr", "nothingWasted")}
            </p>
          ) : (
            <ul className="space-y-1">
              {d.waste.slice(0, 5).map((w, i) => (
                <li
                  key={`${w.slot}-${w.key}-${i}`}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="truncate text-hsr-muted">
                    <span className="text-hsr-text/80">{t("hsrSlots", w.slot)}</span>{" "}
                    {t("hsrStats", w.key)}
                  </span>
                  <span className="shrink-0 font-mono text-hsr-muted">{t("hsr", "rollsCount", { n: w.rolls })}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 space-y-1 border-t border-hsr-line pt-2">
            {d.sets.map((s) => (
              <p key={s.setId} className="truncate text-sm text-hsr-text/80">
                <span className="font-mono text-hsr-glow">{t("hsr", "pieces", { n: s.pieces })}</span> {s.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
