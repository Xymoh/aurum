/** Flattens a Genshin character's curated build into the shared target model. */

import charactersData from "../../data/characters.json";
import artifactsData from "../../data/artifacts.json";
import { ELEMENT_COLORS, type GenshinElement } from "../../types/character";
import { getBuildConfig, getSetRecommendations, getSetRecommendationSource } from "../scoring";
import { isTravelerId, travelerMainStats } from "../travelerBuilds";
import type { BuildListing, BuildTarget, TargetSlot, TargetStat, Translate } from "./model";
import { rankSubstats } from "./model";

const ENKA_UI = "https://enka.network/ui";

const CHARACTERS = charactersData as Record<
  string,
  { name: string; element: string; weapon: string; icon: string }
>;
const SETS = artifactsData as Record<string, { name: string; pieces: number }>;

/** The order the game lists them, so the page reads like the artifact screen. */
const SLOTS = ["SANDS", "GOBLET", "CIRCLET"] as const;

/**
 * Build-config keys are Genshin Optimizer's vocabulary, not Enka's, so they
 * need their own labels. Elemental damage is handled separately: it is one
 * label per element and the element names are already translated.
 */
const STAT_KEY: Record<string, "critRate" | "critDmg" | "atkPct" | "hpPct" | "defPct" | "em" | "er" | "healing" | "physicalDmg" | "elementalDmg" | "flatAtk" | "flatHp" | "flatDef"> = {
  CRIT_RATE: "critRate",
  CRIT_DMG: "critDmg",
  ATK_PERCENT: "atkPct",
  HP_PERCENT: "hpPct",
  DEF_PERCENT: "defPct",
  ELEMENTAL_MASTERY: "em",
  ENERGY_RECHARGE: "er",
  HEALING_BONUS: "healing",
  PHYSICAL_DMG: "physicalDmg",
  ELEMENTAL_DMG: "elementalDmg",
  FLAT_ATK: "flatAtk",
  FLAT_HP: "flatHp",
  FLAT_DEF: "flatDef",
};

/**
 * Both spellings of every elemental goblet. The data carries the game's
 * internal names (ICE_ADD_HURT) and Genshin Optimizer's (CRYO_DMG) for the
 * same stat, and a build page that dropped one would show a blank goblet for
 * half the roster.
 */
const ELEMENT_OF: Record<string, GenshinElement> = {
  PYRO_DMG: "Pyro", FIRE_ADD_HURT: "Pyro",
  HYDRO_DMG: "Hydro", WATER_ADD_HURT: "Hydro",
  ANEMO_DMG: "Anemo", WIND_ADD_HURT: "Anemo",
  ELECTRO_DMG: "Electro", ELEC_ADD_HURT: "Electro",
  DENDRO_DMG: "Dendro", GRASS_ADD_HURT: "Dendro",
  CRYO_DMG: "Cryo", ICE_ADD_HURT: "Cryo",
  GEO_DMG: "Geo", ROCK_ADD_HURT: "Geo",
};

function statLabel(key: string, t: Translate): string {
  const element = ELEMENT_OF[key];
  if (element) return t("buildStats", "elementDmg", { element: t("elements", element) });
  const mapped = STAT_KEY[key];
  return mapped ? t("buildStats", mapped) : key;
}

/** Drops the duplicate spellings so a goblet lists Cryo DMG once, not twice. */
function uniqueLabels(keys: string[], t: Translate): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    const label = statLabel(key, t);
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

function iconUrl(icon: string | undefined): string | null {
  return icon ? `${ENKA_UI}/${icon}.png` : null;
}

/** Whether the entry is a real curated build or the scaling-derived fallback. */
function isCurated(id: string): boolean {
  const config = getBuildConfig(Number(id));
  return Boolean(config && Object.keys(config.main_stats_ideal ?? {}).length > 0);
}

export function listGenshinBuilds(t: Translate): BuildListing[] {
  return Object.entries(CHARACTERS)
    // Enka's table includes unreleased placeholders (Manekin, Manekina at
    // the time of writing) with no build, no art and no icon. A picker row
    // for those is a broken tile; they come back the moment a build exists.
    .filter(([id]) => getBuildConfig(Number(id)) !== null)
    .map(([id, c]) => ({
      id,
      name: c.name,
      iconUrl: iconUrl(c.icon),
      tags: [t("elements", c.element as GenshinElement), c.weapon],
      // Enka does not publish rarity in this table; the picker sorts by name.
      rarity: 0,
      generic: !isCurated(id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getGenshinBuild(id: string, t: Translate): BuildTarget | null {
  const character = CHARACTERS[id];
  if (!character) return null;

  const avatarId = Number(id);
  const config = getBuildConfig(avatarId);
  const element = character.element as GenshinElement;

  // The Traveler's element is not in their avatarId, so the page shows the
  // element-specific mains the scorer would use once one is picked.
  const travelerMains = isTravelerId(avatarId) ? travelerMainStats(avatarId, element) : null;
  const mains = travelerMains ?? config?.main_stats_ideal ?? {};

  const slots: TargetSlot[] = SLOTS.map((slot) => ({
    slot: t("slots", slot),
    stats: uniqueLabels((mains as Record<string, string[]>)[slot] ?? [], t),
  }));

  const substats: TargetStat[] = rankSubstats(
    Object.entries(config?.substat_weights ?? {}).map(([key, weight]) => ({
      label: statLabel(key, t),
      weight: weight as number,
    })),
  );

  return {
    game: "genshin",
    id,
    name: character.name,
    iconUrl: iconUrl(character.icon),
    portraitUrl: character.icon
      ? `${ENKA_UI}/${character.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
      : null,
    tags: [t("elements", element), character.weapon],
    rarity: 0,
    accent: ELEMENT_COLORS[element] ?? "#d4a853",
    generic: !isCurated(id),
    slots,
    substats,
    sets: getSetRecommendations(avatarId).map((parts) => ({
      parts: parts.map((p) => ({
        name: SETS[p.setId]?.name ?? p.setId,
        pieces: p.pieces,
        // The plume: the piece whose art reads as the set at a glance.
        iconUrl: `${ENKA_UI}/UI_RelicIcon_${p.setId}_2.png`,
      })),
    })),
    priority: null,
    thresholds: [],
    energyTarget: config?.er_threshold ?? null,
    source: { label: "Genshin Optimizer", url: "https://github.com/frzyc/genshin-optimizer" },
    setsSource: (() => {
      const url = getSetRecommendationSource(avatarId);
      return url ? { label: "genshin.gg", url } : null;
    })(),
  };
}
