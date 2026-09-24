/** Flattens a Genshin character's curated build into the shared target model. */

import charactersData from "../../data/characters.json";
import artifactsData from "../../data/artifacts.json";
import { ELEMENT_COLORS, type GenshinElement } from "../../types/character";
import {
  getBuildConfig,
  getSetRecommendationLabels,
  getSetRecommendations,
  getSetRecommendationSource,
  idealMainStatsFor,
  scoringWeightsFor,
} from "../scoring";
import { isTravelerId, parseTravelerBuildId, TRAVELER_ELEMENTS, travelerBuildId } from "../travelerBuilds";
import type { BuildListing, BuildTarget, TargetSlot, TargetStat, Translate } from "./model";
import { rankSubstats } from "./model";

const ENKA_UI = "https://enka.network/ui";
/** Project Amber's copy of the game UI, which has all seven element icons (Enka's lacks Cryo). */
const AMBER_UI = "https://gi.yatta.moe/assets/UI";
/** The element icons are filed under the game's internal element names. */
const ELEMENT_ICON: Record<GenshinElement, string> = {
  Pyro: "Fire",
  Hydro: "Water",
  Anemo: "Wind",
  Cryo: "Ice",
  Geo: "Rock",
  Electro: "Electric",
  Dendro: "Grass",
};
/** Aether: the body the build index lists the Traveler's pages under. */
const LISTED_TRAVELER = "10000005";

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

export function statLabel(key: string, t: Translate): string {
  const element = ELEMENT_OF[key];
  if (element) return t("buildStats", "elementDmg", { element: t("elements", element) });
  const mapped = STAT_KEY[key];
  return mapped ? t("buildStats", mapped) : key;
}

/** Drops the duplicate spellings so a goblet lists Cryo DMG once, not twice. */
export function uniqueLabels(keys: string[], t: Translate): string[] {
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

/**
 * What to farm for a slot on this character: the ideal main stats and the
 * top recommended set, so "farm a replacement" can say which one.
 */
export function farmTargetFor(
  avatarId: number,
  idealStats: string[],
  t: Translate,
  /** The Traveler's element, whose sets are the ones to farm. */
  element?: GenshinElement,
): { mains: string[]; setName: string | null } {
  const top = getSetRecommendations(avatarId, element)[0];
  const fourPiece = top?.find((p) => p.pieces === 4) ?? top?.[0];
  return {
    mains: uniqueLabels(idealStats, t),
    setName: fourPiece ? (SETS[fourPiece.setId]?.name ?? null) : null,
  };
}

function iconUrl(icon: string | undefined): string | null {
  return icon ? `${ENKA_UI}/${icon}.png` : null;
}

/** The element's badge, which is what tells the Traveler's pages apart. */
function elementBadge(element: GenshinElement, t: Translate): { iconUrl: string; label: string } {
  return { iconUrl: `${AMBER_UI}/UI_Buff_Element_${ELEMENT_ICON[element]}.png`, label: t("elements", element) };
}

/** Whether the entry is a real curated build or the scaling-derived fallback. */
function isCurated(id: string): boolean {
  const config = getBuildConfig(Number(id));
  return Boolean(config && Object.keys(config.main_stats_ideal ?? {}).length > 0);
}

/**
 * Whether a build page exists for this character. A character released after
 * the tables were last refreshed has none yet, and a showcase card should not
 * link to a 404.
 */
export function hasGenshinBuild(avatarId: number | string): boolean {
  return String(avatarId) in CHARACTERS;
}

/**
 * Where a page id that is no longer one now lives: the Traveler's bare
 * avatar id, from before each element had a page, opens the element the
 * tables give them. Null for every other id.
 */
export function movedGenshinBuild(id: string): string | null {
  const character = CHARACTERS[id];
  return character && isTravelerId(Number(id)) ? travelerBuildId(id, character.element as GenshinElement) : null;
}

/**
 * The build page a showcase character opens: their own, or for the
 * Traveler, the page for the element they are on.
 */
export function genshinBuildId(avatarId: number, element: GenshinElement): string {
  return isTravelerId(avatarId) ? travelerBuildId(avatarId, element) : String(avatarId);
}

/**
 * The name a page goes by: the character's, and for the Traveler the
 * element as well, since each element is its own build.
 */
function pageName(name: string, traveler: { element: GenshinElement } | null, t: Translate): string {
  return traveler ? `${name} (${t("elements", traveler.element)})` : name;
}

export function listGenshinBuilds(t: Translate): BuildListing[] {
  return Object.entries(CHARACTERS)
    // The table includes Manekin and Manekina, the Miliastra Wonderland
    // avatars, which exist only in that mode and have no build, no art and
    // no icon. A picker row for either is a broken tile.
    .filter(([id]) => getBuildConfig(Number(id)) !== null)
    .flatMap(([id, c]): BuildListing[] => {
      const base = {
        name: c.name,
        iconUrl: iconUrl(c.icon),
        // Enka does not publish rarity in this table; the picker sorts by name.
        rarity: 0,
        generic: !isCurated(id),
      };
      if (!isTravelerId(Number(id))) return [{ ...base, id, tags: [t("elements", c.element as GenshinElement), c.weapon] }];
      // One page per element, for each body; the index lists Aether's.
      return TRAVELER_ELEMENTS.map((element) => ({
        ...base,
        id: travelerBuildId(id, element),
        name: pageName(c.name, { element }, t),
        tags: [t("elements", element), c.weapon],
        badge: elementBadge(element, t),
        ...(id === LISTED_TRAVELER ? {} : { unlisted: true }),
      }));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getGenshinBuild(id: string, t: Translate): BuildTarget | null {
  const traveler = parseTravelerBuildId(id);
  const baseId = traveler ? String(traveler.avatarId) : id;
  const character = CHARACTERS[baseId];
  // The Traveler's pages are per element; their bare avatar id is not one.
  if (!character || (!traveler && isTravelerId(Number(id)))) return null;

  const avatarId = Number(baseId);
  const element = traveler?.element ?? (character.element as GenshinElement);
  const config = getBuildConfig(avatarId, element);

  // The scorer's own list, so the page and the grade can never disagree: the
  // guide's picks first, and for the Traveler the element's own.
  const slots: TargetSlot[] = SLOTS.map((slot) => ({
    slot: t("slots", slot),
    stats: uniqueLabels(idealMainStatsFor(slot, avatarId, element), t),
  }));

  // The scorer's own view of the weights, flat stats derived and main-stat-only
  // entries dropped, so the page and the grade can never disagree.
  const substats: TargetStat[] = rankSubstats(
    Object.entries(scoringWeightsFor(avatarId)).map(([key, weight]) => ({
      label: statLabel(key, t),
      weight: weight as number,
    })),
  );

  return {
    game: "genshin",
    id,
    name: pageName(character.name, traveler, t),
    iconUrl: iconUrl(character.icon),
    portraitUrl: character.icon
      ? `${ENKA_UI}/${character.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
      : null,
    tags: [t("elements", element), character.weapon],
    rarity: 0,
    accent: ELEMENT_COLORS[element] ?? "#d4a853",
    generic: !isCurated(baseId),
    ...(traveler ? { badge: elementBadge(element, t) } : {}),
    slots,
    substats,
    sets: getSetRecommendations(avatarId, element).map((parts, i) => ({
      label: getSetRecommendationLabels(avatarId, element)[i] ?? null,
      parts: parts.map((p) => ({
        setId: p.setId,
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
    setsSource: getSetRecommendationSource(avatarId, element),
  };
}
