/** Flattens a Genshin character into the shared share-card model. */

import { ELEMENT_COLORS, type CharacterData } from "../../types/character";
import { ARTIFACT_SLOT_COUNT } from "../scoring";
import type { ShareCardModel, ShareContext, ShareStat } from "./model";

const ENKA_UI = "https://enka.network/ui";

type StatKey = "maxHp" | "atk" | "def" | "em" | "critRate" | "critDmg" | "er" | "elemDmg";

const PERCENT: Set<StatKey> = new Set(["critRate", "critDmg", "er", "elemDmg"]);

/**
 * Crit first, then the rest. The card shows eight stats and a Genshin build
 * has exactly eight, so nothing is dropped - but the order still decides what
 * the eye lands on, and crit is what a reader is looking for.
 */
const ORDER: Array<{ key: StatKey; of: (c: CharacterData) => number }> = [
  { key: "critRate", of: (c) => c.stats.critRate },
  { key: "critDmg", of: (c) => c.stats.critDmg },
  { key: "atk", of: (c) => c.stats.atk },
  { key: "elemDmg", of: (c) => c.stats.elementalDmg },
  { key: "em", of: (c) => c.stats.elementalMastery },
  { key: "er", of: (c) => c.stats.energyRecharge },
  { key: "maxHp", of: (c) => c.stats.maxHp },
  { key: "def", of: (c) => c.stats.def },
];

function statValue(key: StatKey, value: number): string {
  return PERCENT.has(key) ? `${value.toFixed(1)}%` : Math.round(value).toLocaleString();
}

export function genshinShareCard(character: CharacterData, ctx: ShareContext): ShareCardModel {
  const { t } = ctx;
  const build = character.buildScore;

  const stats: ShareStat[] = ORDER.map((s) => ({
    label: t("stats", s.key),
    value: statValue(s.key, s.of(character)),
  }));

  return {
    game: "genshin",
    uid: ctx.uid,
    playerName: ctx.playerName,
    name: character.name,
    level: `Lv${character.level}`,
    rank: `C${character.constellation}`,
    tags: [t("elements", character.element)],
    // The wish splash rather than the round icon: it is the only art Enka
    // publishes big enough to fill a card column.
    portraitUrl: character.icon
      ? `${ENKA_UI}/${character.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
      : null,
    // Matches the card banner's object-[center_22%].
    portraitFocus: { x: 0.5, y: 0.22 },
    accent: ELEMENT_COLORS[character.element] ?? "#d4a853",
    gear: character.weapon
      ? {
          name: character.weapon.name,
          iconUrl: `${ENKA_UI}/${character.weapon.icon}.png`,
          refine: `R${character.weapon.refinement}`,
        }
      : null,
    score: {
      value: build.total,
      grade: build.grade,
      complete: build.complete,
      note: t("shareCard", "pieces", {
        filled: build.artifactCount,
        total: ARTIFACT_SLOT_COUNT,
      }),
    },
    // Genshin has no roll-efficiency figure of its own - Enka states each
    // roll's tier, but the build score already spends it - so the line under
    // the score carries the main-stat count instead, which is the other
    // number a reader checks first.
    footnote: t("shareCard", "mainStats", {
      correct: build.correctMainStats,
      total: build.totalSelectableSlots,
    }),
    stats,
    pieces: character.artifacts.map((artifact) => ({
      iconUrl: artifact.icon ? `${ENKA_UI}/${artifact.icon}.png` : null,
      slot: t("slots", artifact.slot),
      score: artifact.score.potentialPercent,
      grade: artifact.score.grade,
    })),
  };
}
