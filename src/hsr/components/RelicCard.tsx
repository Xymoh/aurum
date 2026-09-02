import type { HsrRelic } from "../types";
import { WASTE_THRESHOLD, weightOf, type HsrWeights } from "../weights";
import { SLOT_LABELS, formatStat, gradeColor, statLabel } from "../labels";

/**
 * One relic. Rolls are shown as pips rather than only as a number, because the
 * question a player actually has is "where did my upgrades go", and a count in
 * text does not make a lopsided piece visible at a glance.
 */
export function RelicCard({ relic, weights }: { relic: HsrRelic; weights: HsrWeights }) {
  const { score } = relic;

  return (
    <div className="rounded-lg border border-hsr-border bg-hsr-card/80 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-hsr-glow">
            {SLOT_LABELS[relic.slot]}
          </p>
          <p className="truncate text-[10px] text-hsr-muted" title={relic.setName}>
            {relic.setName}
          </p>
        </div>
        <div className="text-right">
          <span className={`font-mono text-sm font-bold ${gradeColor(score.grade)}`}>
            {score.grade}
          </span>
          <p className="font-mono text-[10px] text-hsr-muted">
            {score.potentialPercent.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between rounded bg-hsr-bg/60 px-2 py-1">
        <span className="text-[11px] text-hsr-text/90">{statLabel(relic.mainStat.key)}</span>
        <span className="font-mono text-[11px] text-hsr-text">
          {formatStat(relic.mainStat.key, relic.mainStat.value)}
        </span>
      </div>
      {!score.mainStatFits && (
        <p className="mb-2 text-[10px] text-amber-400">Main stat does not suit this character</p>
      )}

      <ul className="space-y-1">
        {relic.substats.map((sub) => {
          const dead = weightOf(weights, sub.key) < WASTE_THRESHOLD;
          return (
            <li key={sub.key} className="flex items-center justify-between gap-2">
              <span className={`text-[11px] ${dead ? "text-rose-400/80" : "text-hsr-text/85"}`}>
                {statLabel(sub.key)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex gap-0.5" title={`${sub.rolls} upgrades`}>
                  {Array.from({ length: sub.rolls }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 w-1 rounded-sm ${dead ? "bg-rose-500/50" : "bg-hsr-accent/70"}`}
                    />
                  ))}
                </span>
                <span className="w-14 text-right font-mono text-[11px] text-hsr-text">
                  {formatStat(sub.key, sub.value)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex justify-between border-t border-hsr-border/60 pt-1.5 font-mono text-[10px]">
        <span className="text-hsr-accent">{score.effectiveRolls} useful</span>
        {score.wastedRolls > 0 ? (
          <span className="text-rose-400">{score.wastedRolls} wasted</span>
        ) : (
          <span className="text-hsr-muted">no waste</span>
        )}
      </div>
    </div>
  );
}
