import type { HsrRelic } from "../types";
import { WASTE_THRESHOLD, weightOf, type HsrWeights } from "../weights";
import { SLOT_LABELS, formatStat, gradeColor, statLabel } from "../labels";
import { relicIcon } from "../images";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { InfoTip } from "../../components/ui/InfoTip";
import { formatScore } from "../../lib/format";
import { tint } from "../../lib/grade";
import { WarningIcon } from "../../components/ui/icons";
import { RollPips } from "../../components/ui/RollPips";
import { HIGH_ROLL } from "../scoring";

/** Colour per verdict, from the shared tokens so light mode gets its own set. */
const VERDICT_COLOR: Record<string, string> = {
  high: "var(--verdict-high)",
  medium: "var(--verdict-medium)",
  low: "var(--verdict-low)",
  replace: "var(--verdict-replace)",
  none: "var(--verdict-ok)",
};

const HSR_PANEL = "border-hsr-border bg-hsr-panel text-hsr-text";

function formatChance(p: number): string {
  if (p <= 0) return "0%";
  if (p < 0.01) return "<1%";
  return `${Math.round(p * 100)}%`;
}

/**
 * One relic.
 *
 * Rolls read as pips rather than a count, because the question is "where did
 * my upgrades go" and a number in a column does not make a lopsided piece
 * obvious. Dead stats are dimmed rather than painted red: at six relics on
 * screen, colouring every wasted roll turned the page into an alarm. Dimmed,
 * not faded: the label still has to be readable to know what was wasted.
 */
export function RelicCard({ relic, weights }: { relic: HsrRelic; weights: HsrWeights }) {
  const { score, reroll } = relic;
  const icon = relicIcon(relic.tid);
  const verdictColor =
    reroll.action === "replace"
      ? VERDICT_COLOR.replace
      : reroll.action === "none"
        ? VERDICT_COLOR.none
        : VERDICT_COLOR[reroll.priority ?? "low"];

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
            className="h-11 w-11 shrink-0 rounded bg-hsr-inset object-contain"
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
        {score.grade ? (
          <GradeBadge grade={score.grade} size="sm" />
        ) : (
          <InfoTip
            content={
              score.mainStatOk
                ? "Not graded: only 5-star relics with a usable score get a letter."
                : "Not graded: this main stat does nothing for the character, so the piece is not a candidate however well its substats rolled."
            }
            panelClassName={HSR_PANEL}
            align="right"
            label="Why is there no grade?"
          >
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: tint("var(--warn)", 12), color: "var(--warn)" }}>
              <WarningIcon className="h-3 w-3" />
              {score.mainStatOk ? "n/a" : "wrong main"}
            </span>
          </InfoTip>
        )}
      </div>

      <div className="mb-2 flex items-baseline justify-between rounded bg-hsr-inset px-2 py-1">
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
              <span className={`text-sm ${dead ? "text-hsr-muted line-through decoration-hsr-muted/50" : "text-hsr-text/85"}`}>
                {statLabel(sub.key)}
              </span>
              <span className="flex items-center gap-2">
                {/* Enka states how many rolls landed here and their combined
                    quality, not each roll on its own, so every pip carries the
                    stat's average tier. */}
                <InfoTip
                  align="right"
                  panelClassName={HSR_PANEL}
                  label={`${sub.rolls} rolls, average ${Math.round(sub.quality * 100)}% of max`}
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">
                        {sub.rolls} {sub.rolls === 1 ? "roll" : "rolls"} · average {Math.round(sub.quality * 100)}% of max
                      </p>
                      <p className="text-hsr-muted">
                        Best possible for {sub.rolls} rolls: +{formatStat(sub.key, sub.rolls * (HIGH_ROLL[sub.key] ?? 0))}. Star Rail
                        reports the combined quality of a stat's rolls, not each roll on its own.
                      </p>
                      {dead && <p className="text-hsr-muted">This stat does nothing for the character, so these rolls count as wasted.</p>}
                    </div>
                  }
                >
                  <RollPips rolls={Array.from({ length: sub.rolls }, () => sub.quality)} muted={dead} />
                </InfoTip>
                <span
                  className={`w-14 text-right font-mono text-sm tabular-nums ${
                    dead ? "text-hsr-muted" : "text-hsr-text"
                  }`}
                >
                  {formatStat(sub.key, sub.value)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-hsr-line pt-1.5 font-mono text-xs">
        <span className="text-hsr-muted">
          <span className={score.wastedRolls > 0 ? "text-hsr-text" : "text-hsr-accent"}>
            {score.effectiveRolls}
          </span>
          /{relic.totalRolls} useful
        </span>
        <span className={`font-bold ${gradeColor(score.grade)}`}>{formatScore(score.potentialPercent)}</span>
      </div>

      {/* What to actually do with the piece. A die costs the same whatever the
          slot, so the verdict is driven by the odds alone. The reasoning opens
          on hover, focus or tap. */}
      {reroll.eligible && (
        <InfoTip className="mt-2" content={reroll.reason} panelClassName={HSR_PANEL}>
          <div
            className="rounded-md px-2 py-1.5"
            style={{ backgroundColor: tint(verdictColor, 12), color: verdictColor }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold">{reroll.label}</span>
              {reroll.action === "reroll" && (
                <span className="shrink-0 font-mono text-xs font-bold">
                  {formatChance(reroll.improveChance)}
                  <span className="opacity-70"> / die</span>
                </span>
              )}
            </div>
            {reroll.action === "reroll" && reroll.targetStats.length > 0 && (
              <p className="mt-0.5 truncate text-[11px] opacity-90">
                Hope for {reroll.targetStats.map(statLabel).join(" or ")}
              </p>
            )}
          </div>
        </InfoTip>
      )}
    </div>
  );
}
