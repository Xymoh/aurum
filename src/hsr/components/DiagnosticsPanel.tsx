import type { BuildDiagnostics } from "../types";
import { BENCHMARK_ROLLS, MAX_ROLLS } from "../scoring";
import { SLOT_LABELS, efficiencyColor, formatStat, statLabel } from "../labels";

/**
 * The aggregate view of a build.
 *
 * A per-piece grade answers "did this relic roll well". It cannot answer "all
 * six of my relics are graded S, so why is my damage mediocre", because the
 * usual cause is spread across pieces: upgrades that landed on stats the
 * character does not use. Six relics that are each 80% useful look excellent
 * one at a time and lose a fifth of the build together.
 */
export function DiagnosticsPanel({ d }: { d: BuildDiagnostics }) {
  const effectivePct = (d.effectiveRolls / MAX_ROLLS) * 100;
  const wastedPct = (d.wastedRolls / MAX_ROLLS) * 100;

  return (
    <div className="rounded-lg border border-hsr-border bg-hsr-panel/70 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-hsr-muted">
          Roll efficiency
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-mono text-2xl font-bold ${efficiencyColor(d.efficiency)}`}>
            {d.efficiency.toFixed(1)}%
          </span>
          <span className="text-[10px] text-hsr-muted">of benchmark</span>
        </div>
      </div>

      {/* One bar, three truths: how many upgrades landed, how many count, and
          where the benchmark sits. */}
      <div className="relative h-6 w-full overflow-hidden rounded bg-hsr-bg">
        <div
          className="absolute inset-y-0 left-0 bg-hsr-accent/80"
          style={{ width: `${effectivePct}%` }}
        />
        <div
          className="absolute inset-y-0 bg-rose-500/40"
          style={{ left: `${effectivePct}%`, width: `${wastedPct}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-hsr-gold"
          style={{ left: `${(BENCHMARK_ROLLS / MAX_ROLLS) * 100}%` }}
          title={`Benchmark: ${BENCHMARK_ROLLS} effective rolls`}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
        <span className="text-hsr-accent">{d.effectiveRolls} effective</span>
        <span className="text-rose-400">{d.wastedRolls} wasted</span>
        <span className="text-hsr-muted">{d.totalRolls} total</span>
        <span className="text-hsr-gold/80">benchmark {BENCHMARK_ROLLS}</span>
      </div>

      {d.totalRolls >= BENCHMARK_ROLLS && d.effectiveRolls < BENCHMARK_ROLLS && (
        <p className="mt-3 rounded border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-amber-200/90">
          This build carries {d.totalRolls} upgrades, more than the {BENCHMARK_ROLLS}-roll
          benchmark, but only {d.effectiveRolls} of them land on stats this character uses. That
          gap is what a per-piece grade cannot show you.
        </p>
      )}

      {d.waste.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-hsr-muted">
            Where the wasted rolls sit
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {d.waste.slice(0, 8).map((w, i) => (
              <span
                key={`${w.slot}-${w.key}-${i}`}
                className="rounded border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] text-rose-300"
              >
                {SLOT_LABELS[w.slot]} {statLabel(w.key)} x{w.rolls}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-hsr-muted">
            Substat totals
          </h4>
          <ul className="space-y-0.5">
            {d.totals.slice(0, 6).map((t) => (
              <li key={t.key} className="flex justify-between font-mono text-[11px]">
                <span className="text-hsr-text/80">
                  <span className="text-hsr-muted">{t.rolls}x</span> {statLabel(t.key)}
                </span>
                <span className="text-hsr-text">+{formatStat(t.key, t.value)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          {d.critRatio !== null && (
            <div>
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-hsr-muted">
                Crit ratio (substats)
              </h4>
              <p className="font-mono text-[11px]">
                <span
                  className={
                    d.critRatio >= 1.6 && d.critRatio <= 2.6 ? "text-hsr-accent" : "text-amber-400"
                  }
                >
                  1 : {d.critRatio.toFixed(2)}
                </span>
                <span className="ml-1.5 text-hsr-muted">target 1 : 2</span>
              </p>
            </div>
          )}

          {d.sets.length > 0 && (
            <div>
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-hsr-muted">
                Sets
              </h4>
              <ul className="space-y-0.5">
                {d.sets.map((s) => (
                  <li key={s.setId} className="text-[11px] text-hsr-text/80">
                    <span className="font-mono text-hsr-glow">{s.pieces}pc</span> {s.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {d.mainStatMisses.length > 0 && (
            <div>
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-hsr-muted">
                Main stat mismatch
              </h4>
              <p className="text-[11px] text-amber-400">
                {d.mainStatMisses.map((s) => SLOT_LABELS[s]).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
