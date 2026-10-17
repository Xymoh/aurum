import { useMemo } from "react";
import type { CharacterData } from "../../types/character";
import { farmPlan, type FarmReason } from "../../lib/farmPlan";
import { RecycleIcon } from "../ui/icons";
import { RemoteImg } from "../ui/RemoteImg";
import { useI18n } from "../../i18n";
import artifactsData from "../../data/artifacts.json";

const SETS = artifactsData as Record<string, { name: string }>;
const ENKA_UI_BASE = "https://enka.network/ui";

const REASON_KEY: Record<FarmReason, "farmReasonReplace" | "farmReasonMain" | "farmReasonEmpty"> = {
  replace: "farmReasonReplace",
  mainStat: "farmReasonMain",
  empty: "farmReasonEmpty",
};

interface FarmPlanProps {
  characters: CharacterData[];
  onSelectCharacter: (characterId: string) => void;
}

/**
 * Where to spend resin next: the domains whose drops would fix the most weak
 * slots across the showcase. The per-piece verdicts say what is wrong; this
 * says which run fixes the most of it at once.
 */
export function FarmPlan({ characters, onSelectCharacter }: FarmPlanProps) {
  const { t } = useI18n();
  const plan = useMemo(() => farmPlan(characters), [characters]);

  if (plan.length === 0) return null;

  return (
    <section
      className="game-panel border border-dark-border bg-dark-card/40 p-4 sm:p-5"
      aria-labelledby="farm-next"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="farm-next" className="flex items-center gap-2 text-sm font-semibold text-dark-text">
          <RecycleIcon className="h-4 w-4 text-accent" /> {t("showcase", "farmNext")}
        </h2>
        <span className="text-sm text-dark-muted">{t("showcase", "farmNextSub")}</span>
      </div>

      <ol className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
        {plan.map((target) => (
          <li
            key={target.setIds.join("+")}
            className="rounded-lg border border-dark-border bg-dark-card px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <div className="flex shrink-0 -space-x-2">
                {target.setIds.map((id) => (
                  <RemoteImg
                    key={id}
                    src={`${ENKA_UI_BASE}/UI_RelicIcon_${id}_4.png`}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    className="h-8 w-8 rounded-full border border-dark-border/60 bg-dark-bg object-contain"
                  />
                ))}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-snug text-dark-text">
                  {target.setIds.map((id) => SETS[id]?.name ?? id).join(" + ")}
                </h3>
                <p className="text-xs text-dark-muted">
                  {target.pieces.length === 1
                    ? t("showcase", "farmFixesOne")
                    : t(
                        "showcase",
                        target.characterCount === 1 ? "farmFixesOneCharacter" : "farmFixes",
                        { pieces: target.pieces.length, characters: target.characterCount },
                      )}
                </p>
              </div>
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {target.pieces.map((piece) => (
                <li key={`${piece.characterId}-${piece.slot}`}>
                  <button
                    type="button"
                    onClick={() => onSelectCharacter(piece.characterId)}
                    title={t("showcase", REASON_KEY[piece.reason])}
                    className="rounded-md border border-dark-border/70 bg-dark-bg/40 px-2 py-0.5 text-xs text-dark-text transition-colors hover:border-accent/50"
                  >
                    {piece.characterName} · {t("slots", piece.slot)}
                    <span className="sr-only"> ({t("showcase", REASON_KEY[piece.reason])})</span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
