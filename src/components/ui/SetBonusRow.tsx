import type { Artifact } from "../../types/artifact";
import type { SetBonusResult } from "../../types/character";
import { useI18n } from "../../i18n";

interface SetBonusRowProps {
  artifacts: Artifact[];
  setBonus: SetBonusResult;
}

const SET_COLORS = [
  "#d4a853",
  "#a855f7",
  "#3b82f6",
  "#22c55e",
  "#f97316",
];

function MatchStatusIndicator({ matchStatus }: { matchStatus: SetBonusResult["matchStatus"] }) {
  const { t } = useI18n();
  switch (matchStatus) {
    case "full_match":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400" title="Full set match">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t("showcase", "fullMatch")}
        </span>
      );
    case "partial_match":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400" title="Partial set match">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="rounded-xl border border-dark-border px-5 py-4">
      <div className="text-[11px] uppercase font-semibold tracking-wider text-dark-muted mb-2.5">
        {t("showcase", "setBonuses")}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {setBonus.activeSets.length === 0 ? (
          <span className="text-xs text-dark-muted/50">{t("showcase", "noSetBonus")}</span>
        ) : (
          <>
            {setBonus.activeSets.map((activeSet) => {
              const color = setColors.get(activeSet.setId) ?? "#6b7280";
              return (
                <span
                  key={activeSet.setId}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: color, color, backgroundColor: `${color}12` }}
                >
                  {activeSet.setName}
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[10px] font-bold"
                    style={{ backgroundColor: color, color: "#0f1117" }}
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
