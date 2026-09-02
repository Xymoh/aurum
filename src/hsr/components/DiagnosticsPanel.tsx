import type { BuildDiagnostics } from "../types";
import { BENCHMARK_ROLLS, MAX_ROLLS } from "../scoring";
import { SLOT_LABELS, formatStat, statLabel } from "../labels";

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
export function DiagnosticsPanel({ d, tint }: { d: BuildDiagnostics; tint: string }) {
  const effectivePct = (d.effectiveRolls / MAX_ROLLS) * 100;
  const wastedPct = (d.wastedRolls / MAX_ROLLS) * 100;
  const critOk = d.critRatio !== null && d.critRatio >= 1.6 && d.critRatio <= 2.6;

  return (
    <div className="space-y-3">
      {/* Headline: how many upgrades are working, and against what bar. */}
      <div className="rounded-lg border border-hsr-border/70 bg-black/25 p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            Useful rolls
          </h3>
          <p className="font-mono text-sm">
            <span style={{ color: tint }}>{d.effectiveRolls}</span>
            <span className="text-hsr-muted"> of {d.totalRolls}</span>
          </p>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${effectivePct}%`, backgroundColor: tint }}
          />
          <div
            className="absolute inset-y-0 bg-white/10"
            style={{ left: `${effectivePct}%`, width: `${wastedPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-hsr-gold/70"
            style={{ left: `${(BENCHMARK_ROLLS / MAX_ROLLS) * 100}%` }}
            title={`Benchmark: ${BENCHMARK_ROLLS} useful rolls`}
          />
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-hsr-muted">
          {d.effectiveRolls >= BENCHMARK_ROLLS ? (
            <>
              At or above the {BENCHMARK_ROLLS}-roll benchmark for a strong build.
            </>
          ) : d.totalRolls >= BENCHMARK_ROLLS ? (
            <>
              This build carries <span className="text-hsr-text">{d.totalRolls}</span> upgrades,
              past the {BENCHMARK_ROLLS}-roll benchmark, but{" "}
              <span className="text-hsr-text">{d.wastedRolls}</span> sit on stats this character
              never uses. That gap is what a per-piece grade cannot show.
            </>
          ) : (
            <>
              <span className="text-hsr-text">{d.wastedRolls}</span> upgrades sit on stats this
              character never uses, leaving it short of the {BENCHMARK_ROLLS}-roll benchmark.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Left: what the build actually adds up to. */}
        <div className="rounded-lg border border-hsr-border/70 bg-black/20 p-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            Substat totals
          </h3>
          <ul className="space-y-1">
            {d.totals.slice(0, 6).map((t) => (
              <li key={t.key} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] text-hsr-text/85">
                  <span className="font-mono text-hsr-muted">{t.rolls}x</span> {statLabel(t.key)}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-hsr-text">
                  +{formatStat(t.key, t.value)}
                </span>
              </li>
            ))}
          </ul>

          {d.critRatio !== null && (
            <div className="mt-2 flex items-baseline justify-between border-t border-white/5 pt-2">
              <span className="text-[11px] text-hsr-muted">Crit ratio</span>
              <span className="font-mono text-[11px]">
                <span className={critOk ? "text-hsr-accent" : "text-amber-400"}>
                  1 : {d.critRatio.toFixed(2)}
                </span>
                <span className="ml-1.5 text-hsr-muted/70">target 1 : 2</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: what to actually do about it. */}
        <div className="rounded-lg border border-hsr-border/70 bg-black/20 p-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hsr-muted">
            Where the dead rolls sit
          </h3>
          {d.waste.length === 0 ? (
            <p className="text-[11px] text-hsr-accent">
              Nothing wasted. Every upgrade is on a stat this character uses.
            </p>
          ) : (
            <ul className="space-y-1">
              {d.waste.slice(0, 5).map((w, i) => (
                <li
                  key={`${w.slot}-${w.key}-${i}`}
                  className="flex items-baseline justify-between gap-2 text-[11px]"
                >
                  <span className="truncate text-hsr-muted">
                    <span className="text-hsr-text/80">{SLOT_LABELS[w.slot]}</span>{" "}
                    {statLabel(w.key)}
                  </span>
                  <span className="shrink-0 font-mono text-hsr-muted">{w.rolls} rolls</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
            {d.sets.map((s) => (
              <p key={s.setId} className="truncate text-[11px] text-hsr-text/80">
                <span className="font-mono text-hsr-glow">{s.pieces}pc</span> {s.name}
              </p>
            ))}
            {d.mainStatMisses.length > 0 && (
              <p className="text-[11px] text-amber-400/90">
                Main stat mismatch: {d.mainStatMisses.map((s) => SLOT_LABELS[s]).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
