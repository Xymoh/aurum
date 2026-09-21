import { useState } from "react";
import type { Artifact } from "../../types/artifact";
import type { SetBonusResult } from "../../types/character";
import { tint } from "../../lib/grade";
import { useI18n } from "../../i18n";

interface SetBonusRowProps {
  artifacts: Artifact[];
  setBonus: SetBonusResult;
}

/** One colour per distinct set, drawn from the theme so light mode gets its own. */
const SET_COLORS = [
  "var(--accent)",
  "var(--grade-a)",
  "var(--grade-b)",
  "var(--grade-c)",
  "var(--grade-ss)",
];

function MatchStatusIndicator({ matchStatus }: { matchStatus: SetBonusResult["matchStatus"] }) {
  const { t } = useI18n();
  switch (matchStatus) {
    case "full_match":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-verdict-high">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t("showcase", "fullMatch")}
        </span>
      );
    case "partial_match":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-verdict-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4" />
          </svg>
          {t("showcase", "partialMatch")}
        </span>
      );
    case "no_match":
    case "no_recommendation":
      return null;
  }
}

/**
 * The game's own picture for a set is its flower, and Enka names every piece
 * `UI_RelicIcon_<setId>_<slot>` with 4 for the flower, so the set id alone is
 * enough to fetch it. A set that lacks the image (or a failed load) falls back
 * to the text-only chip rather than a broken-image glyph.
 */
function SetIcon({ setId, setName }: { setId: string; setName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={`https://enka.network/ui/UI_RelicIcon_${setId}_4.png`}
      alt={setName}
      width={24}
      height={24}
      loading="lazy"
      decoding="async"
      className="icon-dark-bg -ml-1.5 h-6 w-6 flex-shrink-0 rounded-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function SetBonusRow({ artifacts, setBonus }: SetBonusRowProps) {
  const { t } = useI18n();
  if (artifacts.length === 0) return null;

  // Assign colors - kept for the pill borders/backgrounds below.
  const setColors = new Map<string, string>();
  for (const art of artifacts) {
    if (!setColors.has(art.setId)) {
      setColors.set(art.setId, SET_COLORS[setColors.size % SET_COLORS.length]);
    }
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card/40 px-4 py-3 sm:px-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-muted">
        {t("showcase", "setBonuses")}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {setBonus.activeSets.length === 0 ? (
          <span className="text-sm text-dark-muted">{t("showcase", "noSetBonus")}</span>
        ) : (
          <>
            {setBonus.activeSets.map((activeSet) => {
              const color = setColors.get(activeSet.setId) ?? "var(--surface-muted)";
              return (
                <span
                  key={activeSet.setId}
                  className="inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-3 text-sm font-medium"
                  style={{ borderColor: tint(color, 50), color, backgroundColor: tint(color, 10) }}
                >
                  <SetIcon setId={activeSet.setId} setName={activeSet.setName} />
                  {activeSet.setName}
                  <span
                    className="rounded-full border px-1.5 py-[1px] font-mono text-xs font-bold"
                    style={{ borderColor: tint(color, 45) }}
                  >
                    {t("showcase", "pieces", { count: activeSet.pieces })}
                  </span>
                </span>
              );
            })}
            {setBonus.matchStatus !== "no_recommendation" && (
              <MatchStatusIndicator matchStatus={setBonus.matchStatus} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
