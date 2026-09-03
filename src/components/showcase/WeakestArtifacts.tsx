import { useMemo } from "react";
import type { Artifact } from "../../types/artifact";
import type { CharacterData } from "../../types/character";
import { gradeVar, tint } from "../../lib/grade";
import { formatScore } from "../../lib/format";
import { getWeakestArtifacts } from "../../lib/insights";
import { getRerollTier, formatChance } from "../../lib/reroll";
import { TargetIcon, DiceIcon, RecycleIcon } from "../ui/icons";
import { GradeBadge } from "../ui/GradeBadge";
import { useI18n } from "../../i18n";

const ENKA_UI_BASE = "https://enka.network/ui";
const LIMIT = 6;

/** Reroll tier ids map onto the localized verdict labels. */
const TIER_LABEL = {
  high: "rerollNow",
  medium: "worthRerolling",
  low: "lowPriority",
} as const;

interface WeakestArtifactsProps {
  characters: CharacterData[];
  onSelectCharacter: (characterId: string) => void;
}

/**
 * The verdict, with the one detail the player needs to act on it: which two
 * stats to nominate. That used to sit in a hover-only tooltip; everything
 * else (multi-try odds, ceiling) is on the artifact card one click away.
 */
function ActionLine({ artifact }: { artifact: Artifact }) {
  const { t } = useI18n();
  const reroll = artifact.score.reroll;

  if (reroll.action === "reroll") {
    const tier = getRerollTier(reroll.expectedDust);
    if (tier) {
      return (
        <div className="rounded-md px-2 py-1" style={{ backgroundColor: tint(tier.color, 12), color: tier.color }}>
          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <DiceIcon className="h-3 w-3 flex-shrink-0" />
              {t("verdict", TIER_LABEL[tier.id])}
            </span>
            <span className="whitespace-nowrap font-mono">
              {formatChance(reroll.improveChance)} · {t("verdict", "dust", { n: reroll.dustCost })}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] opacity-90">
            {t("verdict", "tipNominate", { stats: reroll.targetStats.join(" + ") })}
          </p>
        </div>
      );
    }
  }

  if (reroll.action === "replace") {
    return (
      <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={{ backgroundColor: tint("var(--verdict-replace)", 12), color: "var(--verdict-replace)" }}>
        <RecycleIcon className="h-3 w-3" /> {t("verdict", "farmReplacement")}
      </div>
    );
  }

  if (reroll.action === "level_up") {
    return (
      <div className="rounded-md bg-dark-border/40 px-2 py-1 text-xs font-semibold text-dark-muted">
        {t("verdict", "levelTo20")}
      </div>
    );
  }

  return null;
}

export function WeakestArtifacts({ characters, onSelectCharacter }: WeakestArtifactsProps) {
  const { t } = useI18n();
  const items = useMemo(() => getWeakestArtifacts(characters, LIMIT), [characters]);

  if (items.length === 0) return null;

  return (
    <section className="game-panel border border-dark-border bg-dark-card/40 p-4 sm:p-5" aria-labelledby="room-to-improve">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="room-to-improve" className="flex items-center gap-2 text-sm font-semibold text-dark-text">
          <TargetIcon className="h-4 w-4 text-accent" /> {t("showcase", "roomToImprove")}
        </h2>
        <span className="text-sm text-dark-muted">{t("showcase", "roomToImproveSub")}</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ artifact, characterId, characterName, characterIcon }) => {
          const color = gradeVar(artifact.score.grade);
          const avatarUrl = characterIcon ? `${ENKA_UI_BASE}/${characterIcon}.png` : null;

          return (
            <button
              key={artifact.id}
              type="button"
              onClick={() => onSelectCharacter(characterId)}
              className="flex flex-col gap-2 rounded-lg border border-dark-border bg-dark-card px-3 py-2.5 text-left transition-colors hover:border-accent/50 hover:bg-dark-card-hover"
              aria-label={t("showcase", "jumpTo", { name: characterName })}
            >
              <div className="flex items-center gap-2">
                <div className="icon-dark-bg h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-dark-border/60 bg-dark-bg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-dark-muted">
                      {characterName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-dark-text">{characterName}</div>
                  <div className="text-xs text-dark-muted">
                    {t("slots", artifact.slot)} · +{artifact.level}
                  </div>
                </div>

                {/* Score reads as the headline number, not a dim afterthought */}
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>
                    {formatScore(artifact.score.potentialPercent)}
                  </span>
                  <GradeBadge grade={artifact.score.grade} size="xs" />
                </div>
              </div>

              <ActionLine artifact={artifact} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
