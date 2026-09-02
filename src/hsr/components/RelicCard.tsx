import type { HsrRelic } from "../types";
import { WASTE_THRESHOLD, weightOf, type HsrWeights } from "../weights";
import { SLOT_LABELS, formatStat, gradeColor, statLabel } from "../labels";
import { relicIcon } from "../images";

/**
 * One relic.
 *
 * Rolls read as pips rather than a count, because the question is "where did
 * my upgrades go" and a number in a column does not make a lopsided piece
 * obvious. Dead stats are dimmed rather than painted red: at six relics on
 * screen, colouring every wasted roll turned the page into an alarm.
 */
export function RelicCard({ relic, weights }: { relic: HsrRelic; weights: HsrWeights }) {
  const { score } = relic;
  const icon = relicIcon(relic.tid);

  return (
    <div className="rounded-lg border border-hsr-border/70 bg-hsr-card/60 p-2.5">
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <img
            src={icon}
            alt=""
            loading="lazy"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded bg-black/30 object-contain"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-hsr-glow">
            {SLOT_LABELS[relic.slot]}
          </p>
          <p className="truncate text-xs text-hsr-muted" title={relic.setName}>
            {relic.setName}
          </p>
        </div>
        <span className={`shrink-0 font-mono text-sm font-bold ${gradeColor(score.grade)}`}>
          {score.grade}
        </span>
      </div>

      <div className="mb-2 flex items-baseline justify-between rounded bg-black/25 px-2 py-1">
        <span className="text-sm font-medium text-hsr-text">
          {statLabel(relic.mainStat.key)}
        </span>
        <span className="font-mono text-sm text-hsr-text">
          {formatStat(relic.mainStat.key, relic.mainStat.value)}
        </span>
      </div>
      <ul className="space-y-1">
        {relic.substats.map((sub) => {
          const dead = weightOf(weights, sub.key) < WASTE_THRESHOLD;
          return (
            <li key={sub.key} className="flex items-center justify-between gap-2">
              <span className={`text-sm ${dead ? "text-hsr-muted/50" : "text-hsr-text/85"}`}>
                {statLabel(sub.key)}
              </span>
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5" title={`${sub.rolls} upgrades`}>
                  {Array.from({ length: sub.rolls }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 w-[3px] rounded-sm ${
                        dead ? "bg-hsr-muted/25" : "bg-hsr-accent/70"
                      }`}
                    />
                  ))}
                </span>
                <span
                  className={`w-14 text-right font-mono text-sm ${
                    dead ? "text-hsr-muted/50" : "text-hsr-text"
                  }`}
                >
                  {formatStat(sub.key, sub.value)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5 font-mono text-xs">
        <span className="text-hsr-muted">
          <span className={score.wastedRolls > 0 ? "text-hsr-text" : "text-hsr-accent"}>
            {score.effectiveRolls}
          </span>
          /{relic.totalRolls} useful
        </span>
        <span className={gradeColor(score.grade)}>{score.potentialPercent.toFixed(0)}%</span>
      </div>
    </div>
  );
}
