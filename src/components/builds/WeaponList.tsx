import { useI18n } from "../../i18n";
import type { GuideWeapon } from "../../lib/buildTarget/guide";
import type { ShareGame } from "../../lib/shareCard/model";
import { ChevronIcon } from "../ui/icons";
import { RemoteImg } from "../ui/RemoteImg";
import { GuideTextView } from "./GuideTextView";
import { rarityTone } from "./rarity";
import type { BuildSkin } from "./skin";

/** How each game writes a weapon's refinement: R5, S1, P1. */
const REFINEMENT_PREFIX: Record<ShareGame, string> = { genshin: "R", hsr: "S", zzz: "P" };

interface WeaponListProps {
  weapons: GuideWeapon[];
  game: ShareGame;
  skin: BuildSkin;
  /** The character's name, for the "equipped" tooltip. */
  name: string;
  /** What the visitor's own copy of the character wields, when their showcase is loaded. */
  equippedId?: string | null;
}

/**
 * The guide's weapons, best first, each with what it actually does. The
 * first passive starts open; the rest are one click away, so the ranking
 * stays readable at a glance.
 */
export function WeaponList({ weapons, game, skin, name, equippedId }: WeaponListProps) {
  const { t } = useI18n();

  return (
    <ol className="space-y-2">
      {weapons.map((weapon, i) => {
        const equipped = equippedId != null && equippedId === weapon.id;
        const refinement = weapon.refinement ? `${REFINEMENT_PREFIX[game]}${weapon.refinement}` : null;
        return (
          <li
            // Not the id alone: a guide can rank one weapon twice, at S1 and at S5.
            key={`${i}-${weapon.id}`}
            className={`game-panel-sm border p-2.5 ${skin.card}`}
            style={
              equipped
                ? {
                    borderColor: "var(--color-verdict-high)",
                    // The HSR and ZZZ notches draw their own diagonal from
                    // this variable, not from border-color; without it the
                    // cut corners keep the default border colour and read
                    // as gaps in the highlight.
                    ["--panel-corner" as string]: "var(--color-verdict-high)",
                  }
                : undefined
            }
          >
            <div className="flex items-start gap-3">
              <span className={`w-4 shrink-0 pt-1 text-right font-mono text-xs ${skin.muted}`}>{i + 1}</span>
              <span
                className="h-12 w-12 shrink-0 overflow-hidden rounded-md sm:h-14 sm:w-14"
                style={{ background: rarityTone(game, weapon.rarity) }}
              >
                {weapon.iconUrl && (
                  <RemoteImg src={weapon.iconUrl} alt="" loading="lazy" width={56} height={56} className="h-full w-full object-contain" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-sm font-semibold ${skin.text}`}>{weapon.name}</span>
                  {refinement && (
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${skin.card} ${skin.accent}`}
                      title={t("guide", "refinementHint", { label: refinement })}
                    >
                      {refinement}
                    </span>
                  )}
                  {equipped && (
                    <span
                      className="rounded border border-verdict-high/40 bg-verdict-high/10 px-1.5 py-0.5 text-[11px] font-semibold text-verdict-high"
                      title={t("guide", "equippedHint", { name })}
                    >
                      ✓ {t("guide", "equipped")}
                    </span>
                  )}
                </div>
                {weapon.stats.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    {weapon.stats.map((stat, j) => (
                      <span key={`${j}-${stat.label}`}>
                        <span className={skin.muted}>{stat.label}</span>{" "}
                        <span className={`font-mono tabular-nums ${skin.text}`}>{stat.value}</span>
                      </span>
                    ))}
                  </div>
                )}
                {weapon.passive && (
                  <details className="group mt-1.5" open={i === 0}>
                    <summary
                      className={`inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold [&::-webkit-details-marker]:hidden ${skin.accent}`}
                    >
                      <ChevronIcon className="h-3.5 w-3.5 -rotate-90 transition-transform group-open:rotate-0" aria-hidden="true" />
                      {weapon.passive.name || t("guide", "passive")}
                    </summary>
                    <GuideTextView text={weapon.passive.text} skin={skin} className="mt-1" />
                  </details>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
