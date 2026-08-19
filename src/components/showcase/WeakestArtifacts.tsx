import { useMemo } from "react";
import type { CharacterData } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";
import { getWeakestArtifacts } from "../../lib/insights";

const ENKA_UI_BASE = "https://enka.network/ui";
const LIMIT = 6;

const SLOT_SHORT: Record<string, string> = {
  FLOWER: "Flower",
  PLUME: "Plume",
  SANDS: "Sands",
  GOBLET: "Goblet",
  CIRCLET: "Circlet",
};

interface WeakestArtifactsProps {
  characters: CharacterData[];
  onSelectCharacter: (characterId: string) => void;
}

export function WeakestArtifacts({ characters, onSelectCharacter }: WeakestArtifactsProps) {
  const items = useMemo(() => getWeakestArtifacts(characters, LIMIT), [characters]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
          <span aria-hidden="true">🎯</span> Room to Improve
        </h3>
        <span className="text-xs text-dark-muted">Lowest-scoring pieces across your account</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
        {items.map(({ artifact, characterId, characterName, characterIcon }) => {
          const gradeColor = GRADE_COLORS[artifact.score.grade] ?? "#6b7280";
          const avatarUrl = characterIcon ? `${ENKA_UI_BASE}/${characterIcon}.png` : null;
          const reroll = artifact.score.reroll;

          return (
            <button
              key={artifact.id}
              type="button"
              onClick={() => onSelectCharacter(characterId)}
              className="flex flex-col gap-1.5 min-w-[150px] flex-shrink-0 rounded-lg border border-dark-border bg-dark-card px-3 py-2.5 text-left hover:border-accent/50 hover:bg-dark-card-hover transition-colors"
              title={`Jump to ${characterName}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-dark-bg icon-dark-bg border border-dark-border/60 flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-dark-muted">
                      {characterName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-dark-text truncate">{characterName}</div>
                  <div className="text-[10px] text-dark-muted">{SLOT_SHORT[artifact.slot] ?? artifact.slot}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold" style={{ color: gradeColor }}>
                  {artifact.score.potentialPercent.toFixed(1)}%
                </span>
                <span
                  className="text-[10px] font-extrabold px-1 py-0.5 rounded"
                  style={{ backgroundColor: `${gradeColor}22`, color: gradeColor }}
                >
                  {artifact.score.grade}
                </span>
              </div>

              {reroll.eligible && reroll.upsidePercent >= 5 && (
                <div className="text-[10px] text-accent flex items-center gap-1">
                  <span aria-hidden="true">🎲</span> +{reroll.upsidePercent.toFixed(1)}% via reroll
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
