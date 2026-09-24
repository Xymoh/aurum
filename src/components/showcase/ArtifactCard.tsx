import { useMemo, useState } from "react";
import type { Artifact, ArtifactSubstat } from "../../types/artifact";
import type { GenshinElement } from "../../types/character";
import { scorePercentile } from "../../lib/percentile";
import { RollPips } from "../ui/RollPips";
import { ROLL_TIER_BG, rollTier } from "../../lib/rollTier";
import { getRerollTier, chanceWithin, formatChance } from "../../lib/reroll";
import { gradeVar, tint } from "../../lib/grade";
import { formatScore, formatStatValue } from "../../lib/format";
import scoreIconImg from "../../assets/svg/ico-score.svg";
import { DiceIcon, WarningIcon, RecycleIcon, CheckIcon } from "../ui/icons";
import { GradeBadge } from "../ui/GradeBadge";
import { InfoTip } from "../ui/InfoTip";
import { useI18n } from "../../i18n";
import { farmTargetFor, uniqueLabels } from "../../lib/buildTarget/genshin";
import { RemoteImg } from "../ui/RemoteImg";

const TIER_LABEL = { high: "rerollNow", medium: "worthRerolling", low: "lowPriority" } as const;
const TIER_BLURB = { high: "blurbHigh", medium: "blurbMedium", low: "blurbLow" } as const;

const ENKA_UI_BASE = "https://enka.network/ui";

interface ArtifactCardProps {
  artifact: Artifact;
  /** The wearer, so a replacement verdict can name the set to farm. */
  avatarId?: number;
  /** The wearer's element: the Traveler's decides which of their guides names the set. */
  element?: GenshinElement;
  /** The wearer's name, for the percentile note. */
  characterName?: string;
}

/**
 * The roll history of one substat: every roll's value and tier, so "12.1%
 * CRIT Rate" can be read as "three good rolls" or "four poor ones".
 */
type Translate = ReturnType<typeof useI18n>["t"];

/**
 * One line naming the roll count and average tier. The accessible name of
 * the pip trigger and the popover heading say the same thing, so a screen
 * reader hears the number sighted readers see.
 */
function rollSummaryLabel(sub: ArtifactSubstat, t: Translate): string {
  if (sub.rolls.length === 0) return t("rolls", "unknown", { n: sub.rollCount + 1 });
  const avg = Math.round((sub.rolls.reduce((a, b) => a + b, 0) / sub.rolls.length) * 100);
  return sub.rolls.length === 1
    ? t("rolls", "summaryOne", { avg })
    : t("rolls", "summary", { n: sub.rolls.length, avg });
}

function RollBreakdown({ sub }: { sub: ArtifactSubstat }) {
  const { t } = useI18n();
  if (sub.rolls.length === 0) {
    return <p>{t("rolls", "unknown", { n: sub.rollCount + 1 })}</p>;
  }
  return (
    <div className="space-y-1">
      <p className="font-medium">{rollSummaryLabel(sub, t)}</p>
      <ul className="space-y-0.5 font-mono text-dark-muted">
        {sub.rolls.map((share, i) => {
          const tier = rollTier(share);
          return (
            <li key={i} className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-[3px] rounded-sm ${ROLL_TIER_BG[tier]}`} aria-hidden="true" />
              <span className="w-14 text-dark-text">
                +{formatStatValue(sub.maxRoll * share, sub.isPercentage)}
              </span>
              <span>
                {i === 0 ? t("rolls", "initial") : t("rolls", "upgrade")} · {t("rolls", tier)} ({Math.round(share * 100)}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
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

export function ArtifactCard({ artifact, avatarId, element, characterName }: ArtifactCardProps) {
  const { t } = useI18n();

  // Where this piece sits among what the game would drop for the slot:
  // the context a bare percent lacks. Simulated once per character and
  // main stat, then cached, so this is a lookup after the first card.
  const percentile = useMemo(
    () => (avatarId != null ? scorePercentile(avatarId, artifact.mainStat.statKey, artifact.score.potentialPercent) : null),
    [avatarId, artifact.mainStat.statKey, artifact.score.potentialPercent],
  );
  const topPct = percentile != null ? Math.max(1, Math.round((1 - percentile) * 100)) : null;
  const [iconError, setIconError] = useState(false);
  const gradeColor = gradeVar(artifact.score.grade);
  const artIconUrl = artifact.icon ? `${ENKA_UI_BASE}/${artifact.icon}.png` : null;
  const reroll = artifact.score.reroll;
  const reasonText = useReasonText(reroll);
  const rerollTier = reroll.action === "reroll" ? getRerollTier(reroll.expectedDust) : null;

  // What the slot wants, so the warning and the "farm a replacement" verdict
  // can both say it instead of leaving the reader to look it up.
  const idealLabels = uniqueLabels(artifact.mainStat.idealStats, t);
  const farm = avatarId != null ? farmTargetFor(avatarId, artifact.mainStat.idealStats, t, element) : null;
  const farmMain = farm && farm.mains.length > 0 ? farm.mains.join(" / ") : artifact.mainStat.displayName;
  const farmText = farm
    ? farm.setName
      ? t("verdict", "farmHint", { slot: t("slots", artifact.slot), main: farmMain, set: farm.setName })
      : t("verdict", "farmHintNoSet", { slot: t("slots", artifact.slot), main: farmMain })
    : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-lg border border-dark-border bg-dark-card p-3">
      {/* Top row: icon + level */}
      <div className="flex items-center justify-between">
        <div className="icon-dark-bg h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-dark-border/40 bg-dark-bg">
          {artIconUrl && !iconError ? (
            <RemoteImg src={artIconUrl} alt={artifact.setName} className="h-full w-full object-cover" loading="lazy" onError={() => setIconError(true)} />
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
            <InfoTip
              content={
                idealLabels.length > 0
                  ? t("verdict", "mainStatWarningIdeal", { ideal: idealLabels.join(" / "), stat: artifact.mainStat.displayName })
                  : t("verdict", "mainStatWarning")
              }
              label={t("verdict", "mainStatWarning")}
              className="shrink-0"
            >
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
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <InfoTip
                content={<RollBreakdown sub={sub} />}
                align="right"
                label={rollSummaryLabel(sub, t)}
              >
                <RollPips
                  rolls={sub.rolls}
                  unknownCount={sub.rolls.length === 0 ? sub.rollCount + 1 : 0}
                />
              </InfoTip>
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
          {/* Crit Value beside the score: the figure players already know,
              so the 0-200 number has something familiar to sit next to. */}
          {artifact.score.cv > 0 && (
            <InfoTip content={t("showcase", "cvHint")} label={t("stats", "cv")} align="right">
              <span className="font-mono text-[11px] tabular-nums text-dark-muted">
                {t("showcase", "cv")} {artifact.score.cv.toFixed(1)}
              </span>
            </InfoTip>
          )}
          {topPct != null ? (
            <InfoTip
              align="right"
              label={t("showcase", "percentileTop", { pct: topPct })}
              content={t("showcase", "percentileHint", {
                pct: Math.round((percentile ?? 0) * 100),
                slot: t("slots", artifact.slot),
                name: characterName ?? "",
              })}
            >
              <span className="font-mono text-sm font-bold tabular-nums underline decoration-dotted underline-offset-4" style={{ color: gradeColor }}>
                {formatScore(artifact.score.potentialPercent)}
              </span>
            </InfoTip>
          ) : (
            <span className="font-mono text-sm font-bold tabular-nums" style={{ color: gradeColor }}>
              {formatScore(artifact.score.potentialPercent)}
            </span>
          )}
          <GradeBadge grade={artifact.score.grade} size="xs" />
        </div>
      </div>
      {topPct != null && (
        <p className="-mt-1 text-right font-mono text-[11px] text-dark-muted">{t("showcase", "percentileTop", { pct: topPct })}</p>
      )}

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
              {reroll.nextGrade && (
                <p className="text-dark-muted">
                  {t("verdict", "tipNextGrade", { chance: formatChance(reroll.nextGradeChance), grade: reroll.nextGrade })}
                </p>
              )}
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
            sub={farmText}
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
