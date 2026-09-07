/** Flattens a Star Rail character's scoring metadata into the target model. */

import type { BuildListing, BuildTarget, TargetSlot, TargetStat, Translate } from "../lib/buildTarget/model";
import { rankSubstats } from "../lib/buildTarget/model";
import charactersData from "./data/characters.json";
import { characterIcon, characterPreview, relicSetIcon } from "./images";
import { elementTint } from "./labels";
import type { HsrStatKey } from "./types";
import { getScoringMeta, prydwenSetsUrl, SELECTABLE_SLOTS } from "./weights";

const CHARACTERS = charactersData as Record<
  string,
  { name: string; path: string; element: string; rarity: number }
>;

export function listHsrBuilds(t: Translate): BuildListing[] {
  return Object.entries(CHARACTERS)
    .map(([id, c]) => ({
      id,
      name: c.name,
      iconUrl: characterIcon(Number(id)),
      tags: [t("hsrPaths", c.path as "Warrior"), c.element],
      rarity: c.rarity,
      generic: getScoringMeta(Number(id)).source !== "fribbels",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getHsrBuild(id: string, t: Translate): BuildTarget | null {
  const character = CHARACTERS[id];
  if (!character) return null;

  const avatarId = Number(id);
  const meta = getScoringMeta(avatarId);

  // Head and Hands have a fixed main stat, so there is nothing to advise on
  // them; only the four slots with a choice appear here.
  const slots: TargetSlot[] = SELECTABLE_SLOTS.map((slot) => ({
    slot: t("hsrSlots", slot),
    stats: (meta.parts[slot] ?? []).map((stat) => t("hsrStats", stat)),
  }));

  const substats: TargetStat[] = rankSubstats(
    Object.entries(meta.stats).map(([key, weight]) => ({
      label: t("hsrStats", key as HsrStatKey),
      weight: weight ?? 0,
    })),
  );

  return {
    game: "hsr",
    id,
    name: character.name,
    iconUrl: characterIcon(avatarId),
    portraitUrl: characterPreview(avatarId),
    tags: [t("hsrPaths", character.path as "Warrior"), character.element],
    rarity: character.rarity,
    accent: elementTint(character.element),
    generic: meta.source !== "fribbels",
    slots,
    substats,
    sets: [...meta.relicSets, ...meta.ornamentSets].map((parts) => ({
      parts: parts.map((p) => ({
        name: p.name,
        pieces: p.pieces,
        iconUrl: p.setId ? relicSetIcon(p.setId) : null,
      })),
    })),
    priority: null,
    thresholds: [],
    energyTarget: null,
    source: { label: "Fribbels HSR Optimizer", url: "https://github.com/fribbels/hsr-optimizer" },
    setsSource: meta.setsSource === "prydwen" ? { label: "Prydwen", url: prydwenSetsUrl(avatarId) } : null,
  };
}
