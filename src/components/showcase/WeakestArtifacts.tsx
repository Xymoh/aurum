import { useMemo } from "react";
import type { Artifact } from "../../types/artifact";
import type { CharacterData } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";
import { getWeakestArtifacts } from "../../lib/insights";
import { getRerollTier, chanceWithin, formatChance } from "../../lib/reroll";
import { TargetIcon, DiceIcon, RecycleIcon } from "../ui/icons";
import { useI18n } from "../../i18n";

const ENKA_UI_BASE = "https://enka.network/ui";
const LIMIT = 6;

/** Reroll tier ids map onto the localized verdict labels and blurbs. */
const TIER_LABEL = {
  high: "rerollNow",
  medium: "worthRerolling",
  low: "lowPriority",
} as const;

const TIER_BLURB = {
  high: "blurbHigh",
  medium: "blurbMedium",
  low: "blurbLow",
} as const;

interface WeakestArtifactsProps {
  characters: CharacterData[];
  onSelectCharacter: (characterId: string) => void;
}

/** Turn the reroll advice into a compact action chip for the card footer. */
function ActionChip({ artifact }: { artifact: Artifact }) {
  const { t } = useI18n();
  const reroll = artifact.score.reroll;
  const reasonText =
    reroll.action === "level_up"
      ? t("verdict", "reasonLevelUp")
      : reroll.realisticCeiling > 0
        ? t("verdict", "reasonReplaceWeak", { ceiling: reroll.realisticCeiling.toFixed(0) })
        : t("verdict", "reasonReplaceNoValue");

  if (reroll.action === "reroll") {
    const tier = getRerollTier(reroll.expectedDust);
    if (tier) {
      return (
        <span
          className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${tier.color}1f`, color: tier.color }}
          title={
            `${t("verdict", TIER_BLURB[tier.id])}\n\n` +
            `${t("verdict", "tipCost", {
              dust: reroll.dustCost,
              chance: formatChance(reroll.improveChance),
            })}\n` +
            `${t("verdict", "tipTries", {
              tries: 2,
              dust: reroll.dustCost * 2,
              chance: formatChance(chanceWithin(reroll.improveChance, 2)),
            })}\n\n` +
            `${t("verdict", "tipNominate", { stats: reroll.targetStats.join(" + ") })}`
          }
        >
          <DiceIcon className="w-2.5 h-2.5 flex-shrink-0" />
          {t("verdict", TIER_LABEL[tier.id])} · {formatChance(reroll.improveChance)} ·{" "}
          {t("verdict", "dust", { n: reroll.dustCost })}
        </span>
      );
    }
  }

  if (reroll.action === "replace") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold bg-dark-border/40 text-dark-muted"
        title={reasonText}
      >
        <RecycleIcon className="w-2.5 h-2.5" /> {t("verdict", "farmReplacement")}
      </span>
    );
  }

  if (reroll.action === "level_up") {
    return (
      <span
        className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold bg-dark-border/40 text-dark-muted"
        title={reasonText}
      >
        {t("verdict", "levelTo20")}
      </span>
    );
  }

  return null;
}

export function WeakestArtifacts({ characters, onSelectCharacter }: WeakestArtifactsProps) {
  const { t } = useI18n();
  const items = useMemo(() => getWeakestArtifacts(characters, LIMIT), [characters]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
          <TargetIcon className="w-4 h-4 text-accent" /> {t("showcase", "roomToImprove")}
        </h3>
        <span className="text-sm text-dark-muted">{t("showcase", "roomToImproveSub")}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map(({ artifact, characterId, characterName, characterIcon }) => {
          const gradeColor = GRADE_COLORS[artifact.score.grade] ?? "#6b7280";
          const avatarUrl = characterIcon ? `${ENKA_UI_BASE}/${characterIcon}.png` : null;

          return (
            <button
              key={artifact.id}
              type="button"
              onClick={() => onSelectCharacter(characterId)}
              className="flex flex-col gap-2 rounded-lg border border-dark-border bg-dark-card px-3 py-2.5 text-left hover:border-accent/50 hover:bg-dark-card-hover transition-colors"
              title={t("showcase", "jumpTo", { name: characterName })}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-bg icon-dark-bg border border-dark-border/60 flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-dark-muted">
                      {characterName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-dark-text truncate">{characterName}</div>
                  <div className="text-xs text-dark-muted">
                    {t("slots", artifact.slot)} · +{artifact.level}
                  </div>
                </div>

                {/* Score reads as the headline number, not a dim afterthought */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-sm font-mono font-bold tabular-nums" style={{ color: gradeColor }}>
                    {artifact.score.potentialPercent.toFixed(0)}%
                  </span>
                  <span
                    className="text-xs font-extrabold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${gradeColor}26`, color: gradeColor }}
                  >
                    {artifact.score.grade}
                  </span>
                </div>
              </div>

              <ActionChip artifact={artifact} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
