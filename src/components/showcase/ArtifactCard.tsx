import type { Artifact } from "../../types/artifact";
import { GRADE_THRESHOLDS } from "../../lib/constants";
import { getRerollTier, chanceWithin, formatChance } from "../../lib/reroll";
import scoreIconImg from "../../assets/svg/ico-score.svg";
import { DiceIcon, WarningIcon, RecycleIcon, CheckIcon } from "../ui/icons";
import { useState } from "react";

const ENKA_UI_BASE = "https://enka.network/ui";

interface ArtifactCardProps {
  artifact: Artifact;
}

function formatStatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString();
}

/** Look up grade color and text color from GRADE_THRESHOLDS */
function getGradeColors(grade: string): { color: string; textColor: string } {
  const entry = GRADE_THRESHOLDS.find((t) => t.grade === grade);
  return entry ? { color: entry.color, textColor: entry.textColor } : { color: "#4b5563", textColor: "#ffffff" };
}

// ── Chevron icon for roll indicators (Fribbels-style) ── color comes from the wrapping span's currentColor.
function RollChevrons({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <svg width={Math.min(count * 5 + 4, 24)} height="8" viewBox={`0 0 ${Math.min(count * 5 + 4, 24)} 8`} style={{ opacity: 0.75 }}>
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

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const [iconError, setIconError] = useState(false);
  const { color: gradeColor } = getGradeColors(artifact.score.grade);
  const artIconUrl = artifact.icon ? `${ENKA_UI_BASE}/${artifact.icon}.png` : null;
  const reroll = artifact.score.reroll;
  const rerollTier = reroll.action === "reroll" ? getRerollTier(reroll.expectedDust) : null;

  return (
    <div
      className="flex flex-col rounded-lg p-3 gap-1.5 w-full bg-dark-card border border-dark-border"
      style={{
        borderRadius: "6px",
      }}
    >
      {/* Top row: icon + level */}
      <div className="flex items-center justify-between">
        <div className="w-18 h-18 rounded-md overflow-hidden bg-dark-bg icon-dark-bg border border-dark-border/40 flex-shrink-0">
          {artIconUrl && !iconError ? (
            <img src={artIconUrl} alt={artifact.setName} className="w-full h-full object-cover" loading="lazy" onError={() => setIconError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-dark-muted font-mono">
              {artifact.slot.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: gradeColor }}>
            <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" />
          </svg>
          <span className="text-md font-mono font-semibold text-dark-text">+{artifact.level}</span>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-dark-border/30" />

      {/* Main stat */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-dark-muted truncate flex items-center gap-1">
          {artifact.mainStat.isCorrect === false && (
            <span title="Main stat doesn't match recommended. Consider farming for the ideal main stat.">
              <WarningIcon className="w-3 h-3 flex-shrink-0 cursor-help text-amber-500" />
            </span>
          )}
          {artifact.mainStat.displayName}
        </span>
        <span className="text-sm font-mono font-bold text-dark-text">
          {formatStatValue(artifact.mainStat.value, artifact.mainStat.isPercentage)}
        </span>
      </div>

      {/* Divider */}
      <hr className="border-dark-border/30" />

      {/* Substats */}
      <div className="flex flex-col gap-0.5">
        {artifact.substats.map((sub) => {
          const rolls = sub.rollCount;
          const rollColor = rolls >= 4 ? "#4ade80" : rolls >= 3 ? "#facc15" : rolls >= 2 ? "#fb923c" : "#6b7280";
          return (
            <div key={sub.statKey} className="flex items-center justify-between">
              <span className="text-[11px] text-dark-muted/80 truncate flex-1 min-w-0">{sub.displayName}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ color: rollColor }}>
                  <RollChevrons count={rolls} />
                </span>
                <span className="text-[11px] font-mono text-dark-text/80 tabular-nums text-right w-[50px]">
                  {formatStatValue(sub.value, sub.isPercentage)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <hr className="border-dark-border/30" />

      {/* Score footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <img src={scoreIconImg} alt="" className="w-3 h-3 opacity-60" />
          <span className="text-[10px] text-dark-muted">Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-dark-text">{artifact.score.potentialPercent.toFixed(1)}</span>
          <span className="text-[10px] font-extrabold px-1 py-0.5 rounded" style={{ backgroundColor: `${gradeColor}22`, color: gradeColor }}>
            {artifact.score.grade}
          </span>
        </div>
      </div>

      {/* Dust of Enlightenment advice - see lib/reroll.ts for the model */}
      {rerollTier && (
        <div
          className="flex items-center justify-between rounded px-1.5 py-1 -mx-1.5"
          style={{ backgroundColor: `${rerollTier.color}1c` }}
          title={
            `${rerollTier.blurb}\n\n` +
            `Each reshape costs ${reroll.dustCost} dust and has a ` +
            `${formatChance(reroll.improveChance)} chance of gaining 5%+ score.\n` +
            `2 tries (${reroll.dustCost * 2} dust): ${formatChance(chanceWithin(reroll.improveChance, 2))} likely\n` +
            `4 tries (${reroll.dustCost * 4} dust): ${formatChance(chanceWithin(reroll.improveChance, 4))} likely\n\n` +
            `Nominate: ${reroll.targetStats.join(" + ")}\n` +
            `Typical gain when it hits: +${reroll.medianGain.toFixed(0)}%\n` +
            `Realistic good outcome: ${reroll.realisticCeiling.toFixed(0)}%`
          }
        >
          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: rerollTier.color }}>
            <DiceIcon className="w-3 h-3" />
            {rerollTier.label}
          </span>
          <span className="text-[10px] font-mono font-bold whitespace-nowrap" style={{ color: rerollTier.color }}>
            {formatChance(reroll.improveChance)}
            <span className="opacity-70"> / try</span>
          </span>
        </div>
      )}

      {reroll.action === "replace" && (
        <div
          className="flex items-center gap-1 rounded px-1.5 py-1 -mx-1.5 bg-dark-border/30"
          title={reroll.reason}
        >
          <RecycleIcon className="w-3 h-3 text-dark-muted flex-shrink-0" />
          <span className="text-[10px] font-semibold text-dark-muted">Farm a replacement</span>
        </div>
      )}

      {reroll.action === "level_up" && (
        <div
          className="flex items-center gap-1 rounded px-1.5 py-1 -mx-1.5 bg-dark-border/30"
          title={reroll.reason}
        >
          <span className="text-[10px] font-semibold text-dark-muted">Level to +20 to reshape</span>
        </div>
      )}

      {/* An explicit "nothing to do" verdict - an empty slot here would be
          ambiguous, reading as "not calculated" rather than "already fine". */}
      {reroll.action === "none" && reroll.eligible && (
        <div
          className="flex items-center gap-1 rounded px-1.5 py-1 -mx-1.5"
          title={
            `${reroll.reason}\n\n` +
            `Only a ${formatChance(reroll.improveChance)} chance a reshape would gain 5%+ score, ` +
            `so dust is better spent elsewhere.`
          }
        >
          <CheckIcon className="w-3 h-3 text-dark-muted flex-shrink-0" />
          <span className="text-[10px] font-semibold text-dark-muted">Well rolled</span>
        </div>
      )}
    </div>
  );
}
