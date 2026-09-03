import type { ZzzBuildDiagnostics } from "../types";
import { BENCHMARK_ROLLS, MAX_ROLLS } from "../scoring";
import { SLOT_LABELS, formatStat, statLabel } from "../labels";
import type { ZzzScoringMeta } from "../weights";

/**
 * The aggregate view of a build: how many rolls are working, where the dead
 * ones sit, and how the totals stand against the caps a guide sets ("CRIT
 * Rate until 80%"). Same shape as the Star Rail diagnostics, minus reroll
 * advice, which Zenless has no mechanic for.
 */
export function BuildPanel({ d, meta, tint }: { d: ZzzBuildDiagnostics; meta: ZzzScoringMeta; tint: string }) {
  const effectivePct = (d.effectiveRolls / MAX_ROLLS) * 100;
  const wastedPct = (d.wastedRolls / MAX_ROLLS) * 100;
  const critOk = d.critRatio !== null && d.critRatio >= 1.6 && d.critRatio <= 2.6;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">Useful rolls</h3>
          <p className="font-mono text-sm">
            <span className="font-bold text-zzz-text">{d.effectiveRolls}</span>
            <span className="text-zzz-muted"> of {d.totalRolls}</span>
          </p>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zzz-fill">
          <div className="animate-bar-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${effectivePct}%`, backgroundColor: tint }} />
          <div className="absolute inset-y-0 bg-zzz-muted/30" style={{ left: `${effectivePct}%`, width: `${wastedPct}%` }} />
          <div className="absolute inset-y-0 w-px bg-zzz-signal" style={{ left: `${(BENCHMARK_ROLLS / MAX_ROLLS) * 100}%` }} title={`Benchmark: ${BENCHMARK_ROLLS} useful rolls`} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zzz-muted">
          {d.effectiveRolls >= BENCHMARK_ROLLS ? (
            <>At or above the {BENCHMARK_ROLLS}-roll benchmark for a strong build.</>
          ) : d.totalRolls >= BENCHMARK_ROLLS ? (
            <>
              This build carries <span className="text-zzz-text">{d.totalRolls}</span> rolls, past the {BENCHMARK_ROLLS}-roll
              benchmark, but <span className="text-zzz-text">{d.wastedRolls}</span> sit on stats this agent never uses.
            </>
          ) : (
            <>
              <span className="text-zzz-text">{d.wastedRolls}</span> rolls sit on stats this agent never uses, leaving it short
              of the {BENCHMARK_ROLLS}-roll benchmark.
            </>
          )}
        </p>
      </div>

      {meta.priority && (
        <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
          <h3 className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">Prydwen priority</h3>
          <p className="font-mono text-sm text-zzz-text">{meta.priority}</p>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">Substat totals</h3>
          <ul className="space-y-1">
            {d.totals.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-zzz-text/85">
                  <span className="font-mono text-zzz-muted">{t.rolls}x</span> {statLabel(t.id)}
                </span>
                <span className="shrink-0 font-mono text-sm text-zzz-text">+{formatStat(t.id, t.value)}</span>
              </li>
            ))}
          </ul>
          {d.critRatio !== null && (
            <div className="mt-2 flex items-baseline justify-between border-t border-zzz-line pt-2">
              <span className="text-sm text-zzz-muted">Crit ratio (substats)</span>
              <span className="font-mono text-sm">
                <span className={critOk ? "text-zzz-accent" : "text-zzz-signal"}>1 : {d.critRatio.toFixed(2)}</span>
                <span className="ml-1.5 text-zzz-muted">target 1 : 2</span>
              </span>
            </div>
          )}
          {d.thresholds.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-zzz-line pt-2">
              {d.thresholds.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-zzz-muted">
                    {statLabel(t.id)} from discs <span className="text-zzz-text/70">(cap {t.target}%)</span>
                  </span>
                  <span className={`font-mono ${t.current >= t.target ? "text-zzz-accent" : "text-zzz-text"}`}>
                    {formatStat(t.id, t.current)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-zzz-border/70 bg-zzz-inset p-3">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zzz-muted">Where the dead rolls sit</h3>
          {d.waste.length === 0 ? (
            <p className="text-sm text-zzz-accent">Nothing wasted. Every roll is on a stat this agent uses.</p>
          ) : (
            <ul className="space-y-1">
              {d.waste.slice(0, 5).map((w, i) => (
                <li key={`${w.slot}-${w.id}-${i}`} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-zzz-muted">
                    <span className="text-zzz-text/80">{SLOT_LABELS[w.slot]}</span> {statLabel(w.id)}
                  </span>
                  <span className="shrink-0 font-mono text-zzz-muted">{w.rolls} rolls</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 space-y-1 border-t border-zzz-line pt-2">
            {d.sets.map((s) => (
              <p key={s.setId} className="truncate text-sm text-zzz-text/80">
                <span className="font-mono text-zzz-accent">{s.pieces}pc</span> {s.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
