import type { ZzzDisc } from "../types";
import { WASTE_THRESHOLD, weightOf, type ZzzWeights } from "../weights";
import { SLOT_LABELS, formatStat, statLabel } from "../labels";
import { setIcon } from "../images";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { InfoTip } from "../../components/ui/InfoTip";
import { formatScore } from "../../lib/format";
import { gradeTextClass } from "../../lib/grade";

const ZZZ_PANEL = "border-zzz-border bg-zzz-panel text-zzz-text";

/**
 * One drive disc.
 *
 * Rolls read as pips, one per roll. Unlike the other two games every pip is
 * the same colour, because every roll of a stat is worth the same: the pips
 * answer "where did the upgrades go", and there is no "how lucky were they".
 * Dead stats are struck through rather than painted red, so a full build does
 * not read as an alarm.
 */
export function DiscCard({ disc, weights }: { disc: ZzzDisc; weights: ZzzWeights }) {
  const { score } = disc;
  const icon = setIcon(disc.setId);

  return (
    <div className="rounded-lg border border-zzz-border/70 bg-zzz-card/60 p-2.5">
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <img src={icon} alt="" loading="lazy" width={44} height={44} className="h-11 w-11 shrink-0 rounded bg-zzz-inset object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold uppercase tracking-wider text-zzz-accent">
            {SLOT_LABELS[disc.slot]}
          </p>
          <p className="truncate text-xs text-zzz-muted" title={disc.setName}>
            {disc.setName}
          </p>
        </div>
        {score.grade ? (
          <GradeBadge grade={score.grade} size="sm" />
        ) : (
          <InfoTip
            panelClassName={ZZZ_PANEL}
            align="right"
            content="This main stat does nothing for the agent, so the disc is not a candidate however well its substats rolled. The percent below still measures the substats."
          >
            <span className="rounded-md bg-zzz-signal/15 px-1.5 py-0.5 text-xs font-bold uppercase text-zzz-signal">
              Wrong main
            </span>
          </InfoTip>
        )}
      </div>

      <div className="mb-2 flex items-baseline justify-between rounded bg-zzz-inset px-2 py-1">
        <span className="text-sm font-medium text-zzz-text">{statLabel(disc.mainStat.id)}</span>
        <span className="font-mono text-sm text-zzz-text">{formatStat(disc.mainStat.id, disc.mainStat.value)}</span>
      </div>

      <ul className="space-y-1">
        {disc.substats.map((sub) => {
          const dead = weightOf(weights, sub.id) < WASTE_THRESHOLD;
          return (
            <li key={sub.id} className="flex items-center justify-between gap-2">
              <span className={`text-sm ${dead ? "text-zzz-muted line-through decoration-zzz-muted/50" : "text-zzz-text/85"}`}>
                {statLabel(sub.id)}
              </span>
              <span className="flex items-center gap-2">
                <InfoTip
                  align="right"
                  panelClassName={ZZZ_PANEL}
                  label={`${sub.rolls} rolls of ${formatStat(sub.id, sub.perRoll)}`}
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">
                        {sub.rolls} {sub.rolls === 1 ? "roll" : "rolls"} × {formatStat(sub.id, sub.perRoll)}
                      </p>
                      <p className="text-zzz-muted">
                        Every roll of {statLabel(sub.id)} is worth exactly {formatStat(sub.id, sub.perRoll)} in Zenless, so
                        there is no roll quality to show, only how many landed here.
                      </p>
                      {dead && <p className="text-zzz-muted">This stat does nothing for the agent, so these rolls count as wasted.</p>}
                    </div>
                  }
                >
                  <span className={`inline-flex items-center gap-[3px] ${dead ? "opacity-40" : ""}`} aria-hidden="true">
                    {Array.from({ length: sub.rolls }, (_, i) => (
                      <span key={i} className="h-2.5 w-[3px] rounded-sm bg-zzz-accent" />
                    ))}
                  </span>
                </InfoTip>
                <span className={`w-14 text-right font-mono text-sm tabular-nums ${dead ? "text-zzz-muted" : "text-zzz-text"}`}>
                  {formatStat(sub.id, sub.value)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-zzz-line pt-1.5 font-mono text-xs">
        <span className="text-zzz-muted">
          <span className={score.wastedRolls > 0 ? "text-zzz-text" : "text-zzz-accent"}>{score.effectiveRolls}</span>
          /{disc.totalRolls} useful
        </span>
        <span className={`font-bold ${score.grade ? gradeTextClass(score.grade) : "text-zzz-muted"}`}>
          {formatScore(score.potentialPercent)}
        </span>
      </div>
    </div>
  );
}
