import { useState } from "react";
import type { Artifact } from "../../types/artifact";
import { getRerollTier, chanceWithin, formatChance } from "../../lib/reroll";
import { gradeVar, tint } from "../../lib/grade";
import { formatScore, formatStatValue } from "../../lib/format";
import scoreIconImg from "../../assets/svg/ico-score.svg";
import { DiceIcon, WarningIcon, RecycleIcon, CheckIcon } from "../ui/icons";
import { GradeBadge } from "../ui/GradeBadge";
import { InfoTip } from "../ui/InfoTip";
import { useI18n } from "../../i18n";

const TIER_LABEL = { high: "rerollNow", medium: "worthRerolling", low: "lowPriority" } as const;
const TIER_BLURB = { high: "blurbHigh", medium: "blurbMedium", low: "blurbLow" } as const;

const ENKA_UI_BASE = "https://enka.network/ui";

interface ArtifactCardProps {
  artifact: Artifact;
}

// ── Chevron icon for roll indicators (Fribbels-style) ── color comes from the wrapping span's currentColor.
function RollChevrons({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <svg width={Math.min(count * 5 + 4, 24)} height="8" viewBox={`0 0 ${Math.min(count * 5 + 4, 24)} 8`} style={{ opacity: 0.85 }} aria-hidden="true">
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <g key={i} transform={`translate(${i * 5 + 1} 0) scale(0.35)`}>
          <g transform="translate(24 1) scale(-1 1)">
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" d="M8 12L15 5M8 12L15 19" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Colour for how many upgrades a substat took: the same ramp as verdicts. */
function rollColor(rolls: number): string {
  if (rolls >= 4) return "var(--verdict-high)";
  if (rolls >= 3) return "var(--verdict-medium)";
  if (rolls >= 2) return "var(--grade-ss)";
  return "var(--verdict-low)";
}

/** Localized justification for a non-reroll verdict, keyed off the action. */
function useReasonText(reroll: Artifact["score"]["reroll"]): string {
  const { t } = useI18n();
  if (reroll.action === "level_up") return t("verdict", "reasonLevelUp");
  if (reroll.action === "replace") {
    return reroll.realisticCeiling > 0
      ? t("verdict", "reasonReplaceWeak", { ceiling: reroll.realisticCeiling.toFixed(0) })
      : t("verdict", "reasonReplaceNoValue");
  }
  return t("verdict", "reasonNone");
}

/** A verdict row: label on the left, figure on the right, coloured as one unit. */
function VerdictRow({
  color,
  icon,
  label,
  value,
  sub,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  value?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md px-2 py-1.5" style={{ backgroundColor: tint(color, 12), color }}>
      {/* Wraps rather than truncates: in a two-column phone grid the row is
          150px wide, and "Reroll now" matters more than staying on one line. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span className="flex items-center gap-1 text-xs font-semibold">
          {icon}
          {label}
        </span>
        {value && <span className="whitespace-nowrap font-mono text-xs font-bold">{value}</span>}
      </div>
      {sub && <p className="mt-0.5 truncate text-[11px] opacity-90">{sub}</p>}
    </div>
  );
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const { t } = useI18n();
  const [iconError, setIconError] = useState(false);
  const gradeColor = gradeVar(artifact.score.grade);
  const artIconUrl = artifact.icon ? `${ENKA_UI_BASE}/${artifact.icon}.png` : null;
  const reroll = artifact.score.reroll;
  const reasonText = useReasonText(reroll);
  const rerollTier = reroll.action === "reroll" ? getRerollTier(reroll.expectedDust) : null;

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-lg border border-dark-border bg-dark-card p-3">
      {/* Top row: icon + level */}
      <div className="flex items-center justify-between">
        <div className="icon-dark-bg h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-dark-border/40 bg-dark-bg">
          {artIconUrl && !iconError ? (
            <img src={artIconUrl} alt={artifact.setName} className="h-full w-full object-cover" loading="lazy" onError={() => setIconError(true)} />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xs text-dark-muted">
              {artifact.slot.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-sm font-semibold text-dark-text">+{artifact.level}</span>
          <span className="text-[11px] uppercase tracking-wider text-dark-muted">{t("slots", artifact.slot)}</span>
        </div>
      </div>

      <hr className="border-dark-border/40" />

      {/* Main stat */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 truncate text-sm text-dark-muted">
          {artifact.mainStat.isCorrect === false && (
            <InfoTip content={t("verdict", "mainStatWarning")} label={t("verdict", "mainStatWarning")} className="shrink-0">
              <WarningIcon className="h-3.5 w-3.5 text-warn" />
            </InfoTip>
          )}
          <span className="truncate">{artifact.mainStat.displayName}</span>
        </span>
        <span className="font-mono text-sm font-bold text-dark-text">
          {formatStatValue(artifact.mainStat.value, artifact.mainStat.isPercentage)}
        </span>
      </div>

      <hr className="border-dark-border/40" />

      {/* Substats */}
      <div className="flex flex-col gap-0.5">
        {artifact.substats.map((sub) => (
          <div key={sub.statKey} className="flex items-center justify-between gap-1">
            <span className="min-w-0 flex-1 truncate text-sm text-dark-muted">
              <span className="sm:hidden">{sub.shortName}</span>
              <span className="hidden sm:inline">{sub.displayName}</span>
            </span>
            <div className="flex flex-shrink-0 items-center gap-1">
              <span style={{ color: rollColor(sub.rollCount) }} aria-label={`${sub.rollCount} rolls`}>
                <RollChevrons count={sub.rollCount} />
              </span>
              <span className="w-[50px] text-right font-mono text-sm tabular-nums text-dark-text">
                {formatStatValue(sub.value, sub.isPercentage)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <hr className="border-dark-border/40" />

      {/* Score footer */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <img src={scoreIconImg} alt="" className="h-3 w-3 flex-shrink-0 opacity-60" />
          <span className="hidden truncate text-xs text-dark-muted sm:inline">{t("showcase", "score")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold tabular-nums" style={{ color: gradeColor }}>
            {formatScore(artifact.score.potentialPercent)}
          </span>
          <GradeBadge grade={artifact.score.grade} size="xs" />
        </div>
      </div>

      {/* Dust of Enlightenment advice - see lib/reroll.ts for the model. The
          two stats to nominate are visible; the odds for several tries live
          in the popover, which opens on hover, focus or tap. */}
      {rerollTier && (
        <InfoTip
          className="-mx-1"
          content={
            <div className="space-y-1.5">
              <p className="font-medium">{t("verdict", TIER_BLURB[rerollTier.id])}</p>
              <p className="text-dark-muted">
                {t("verdict", "tipCost", { dust: reroll.dustCost, chance: formatChance(reroll.improveChance) })}
              </p>
              <ul className="space-y-0.5 font-mono text-dark-muted">
                {[2, 4].map((tries) => (
                  <li key={tries}>
                    {t("verdict", "tipTries", {
                      tries,
                      dust: reroll.dustCost * tries,
                      chance: formatChance(chanceWithin(reroll.improveChance, tries)),
                    })}
                  </li>
                ))}
              </ul>
              <p className="text-dark-muted">{t("verdict", "tipMedianGain", { gain: reroll.medianGain.toFixed(0) })}</p>
              <p className="text-dark-muted">{t("verdict", "tipCeiling", { ceiling: reroll.realisticCeiling.toFixed(0) })}</p>
            </div>
          }
        >
          <VerdictRow
            color={rerollTier.color}
            icon={<DiceIcon className="h-3 w-3" />}
            label={t("verdict", TIER_LABEL[rerollTier.id])}
            value={`${formatChance(reroll.improveChance)}${t("verdict", "perTry")}`}
            sub={t("verdict", "tipNominate", { stats: reroll.targetStats.join(" + ") })}
          />
        </InfoTip>
      )}

      {/* Energy Recharge is a breakpoint stat - losing it can cost a whole
          burst per rotation. Shown as its own probability next to the reroll
          odds so the two can be weighed against each other, rather than one
          quietly cancelling the other. */}
      {reroll.erRisk && (
        <InfoTip
          className="-mx-1"
          content={t("verdict", "erNote", {
            chance: formatChance(reroll.erBreachChance),
            threshold: reroll.erThreshold,
          })}
        >
          <VerdictRow
            color="var(--warn)"
            icon={<WarningIcon className="h-3 w-3 flex-shrink-0" />}
            label={t("verdict", "erAtRisk")}
            value={`${formatChance(reroll.erBreachChance)}${t("verdict", "perTry")}`}
          />
        </InfoTip>
      )}

      {reroll.action === "replace" && (
        <InfoTip className="-mx-1" content={reasonText}>
          <VerdictRow
            color="var(--verdict-replace)"
            icon={<RecycleIcon className="h-3 w-3 flex-shrink-0" />}
            label={t("verdict", "farmReplacement")}
          />
        </InfoTip>
      )}

      {reroll.action === "level_up" && (
        <InfoTip className="-mx-1" content={reasonText}>
          <VerdictRow color="var(--verdict-ok)" icon={null} label={t("verdict", "levelTo20")} />
        </InfoTip>
      )}

      {/* An explicit "nothing to do" verdict - an empty slot here would be
          ambiguous, reading as "not calculated" rather than "already fine". */}
      {reroll.action === "none" && reroll.eligible && (
        <InfoTip className="-mx-1" content={t("verdict", "tipWellRolled", { chance: formatChance(reroll.improveChance) })}>
          <VerdictRow
            color="var(--verdict-ok)"
            icon={<CheckIcon className="h-3 w-3 flex-shrink-0" />}
            label={t("verdict", "wellRolled")}
          />
        </InfoTip>
      )}
    </div>
  );
}
