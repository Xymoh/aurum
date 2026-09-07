/**
 * Substat weights and ideal main stats for Honkai: Star Rail.
 *
 * Primary source: the per-character scoring metadata maintained in the
 * Fribbels HSR Optimizer (MIT), imported by scripts/fetch-fribbels-weights.mjs
 * into ./data/scoring-metadata.json. That table is what the "relic score" on
 * fribbels.github.io is built from, so a relic graded here should agree with
 * the grade a player sees there.
 *
 * Fallback: Path-level profiles, so a character released after the table was
 * last refreshed still scores sensibly the moment Enka knows their Path.
 *
 * Patch layer: CHARACTER_OVERRIDES, for the rare case where a guide site we
 * trust (Prydwen) disagrees with Fribbels and we side with the guide.
 */

import type { HsrSlot, HsrStatKey } from "./types";
import characters from "./data/characters.json";
import scoringMetadata from "./data/scoring-metadata.json";
import setNames from "./data/sets.json";
import setRecommendations from "./data/set-recommendations.json";

export type HsrWeights = Partial<Record<HsrStatKey, number>>;

/** The four slots whose main stat is a choice. Head and Hands are fixed. */
export type SelectableSlot = Extract<HsrSlot, "BODY" | "FOOT" | "NECK" | "OBJECT">;
export const SELECTABLE_SLOTS: SelectableSlot[] = ["BODY", "FOOT", "NECK", "OBJECT"];

export interface ScoringMeta {
  /** Substat weights, 0 to 1, flats already scaled to 40% of their percent stat. */
  stats: HsrWeights;
  /**
   * Ideal main stats per selectable slot. An empty list means any main stat
   * the slot can roll is acceptable, which is how Fribbels reads it too.
   */
  parts: Record<SelectableSlot, HsrStatKey[]>;
  /**
   * When set, a flat substat of this stat is weighted like its percent stat
   * on a relic whose main stat is that percent stat. Fribbels uses it for
   * characters who scale off a flat stat their main stat also provides.
   */
  flatMainstatBoost?: HsrStatKey;
  /** Recommended cavern relic loadouts, best first: a 4-piece or a 2+2. */
  relicSets: SetPick[][];
  /** Recommended planar ornament sets, best first. */
  ornamentSets: SetPick[][];
  /** Who answered for the sets: Prydwen fills in where Fribbels lists none. */
  setsSource: "fribbels" | "prydwen" | null;
  source: "fribbels" | "path";
}

/** One set within a recommendation. `setId` is null for a name no table knows. */
export interface SetPick {
  setId: string | null;
  name: string;
  pieces: number;
}

const CHARS = characters as Record<
  string,
  { name: string; path: string; element: string; rarity: number }
>;

interface MetadataEntry {
  name: string;
  stats: Record<string, number>;
  parts: Record<string, string[]>;
  flatMainstatBoost?: string;
  relicSets?: string[][];
  ornamentSets?: string[];
}
const FRIBBELS = (scoringMetadata as { characters: Record<string, MetadataEntry> }).characters;

const SET_NAMES = setNames as Record<string, string>;
const SET_ID_BY_NAME = new Map(Object.entries(SET_NAMES).map(([id, name]) => [name, id]));

interface FetchedSets {
  relicSets?: { setId: string; pieces: number }[][];
  ornamentSets?: { setId: string; pieces: number }[][];
  source?: string;
}
/** Prydwen's lists, for the characters Fribbels does not simulate. */
const PRYDWEN_SETS = (setRecommendations as { characters: Record<string, FetchedSets> }).characters;

/** Fribbels states names; the same name twice is a 4-piece, two names a 2+2. */
function fromFribbelsPair(pair: string[]): SetPick[] {
  const pick = (name: string, pieces: number): SetPick => ({ setId: SET_ID_BY_NAME.get(name) ?? null, name, pieces });
  return pair.length === 2 && pair[0] === pair[1] ? [pick(pair[0], 4)] : pair.map((name) => pick(name, 2));
}

function fromFetched(picks: { setId: string; pieces: number }[][] | undefined): SetPick[][] {
  return (picks ?? []).map((parts) => parts.map((p) => ({ setId: p.setId, name: SET_NAMES[p.setId] ?? p.setId, pieces: p.pieces })));
}

/**
 * Fribbels first, Prydwen where Fribbels has nothing: Fribbels only lists
 * sets for characters it runs damage simulations on, which leaves the
 * supports blank, and Prydwen covers everyone.
 */
function setsFor(avatarId: number, entry: MetadataEntry | undefined): Pick<ScoringMeta, "relicSets" | "ornamentSets" | "setsSource"> {
  const relicSets = (entry?.relicSets ?? []).map(fromFribbelsPair);
  const ornamentSets = (entry?.ornamentSets ?? []).map((name) => [{ setId: SET_ID_BY_NAME.get(name) ?? null, name, pieces: 2 }]);
  if (relicSets.length || ornamentSets.length) return { relicSets, ornamentSets, setsSource: "fribbels" };
  const fetched = PRYDWEN_SETS[String(avatarId)];
  const fromPrydwen = { relicSets: fromFetched(fetched?.relicSets), ornamentSets: fromFetched(fetched?.ornamentSets) };
  const any = fromPrydwen.relicSets.length || fromPrydwen.ornamentSets.length;
  return { ...fromPrydwen, setsSource: any ? "prydwen" : null };
}

/** The Prydwen page a character's sets were read from, when they were. */
export function prydwenSetsUrl(avatarId: number): string | null {
  return PRYDWEN_SETS[String(avatarId)]?.source ?? null;
}

/** Below this, a roll is doing nothing useful and counts as waste. */
export const WASTE_THRESHOLD = 0.2;

/**
 * Flat substats are worth 40% of their percent counterpart, whatever weight
 * the table gives them. Same rule as Fribbels (FLAT_STAT_SCALING) and as the
 * Genshin scorer, so a flat ATK roll means the same thing on both tabs.
 */
export const FLAT_STAT_SCALING = 0.4;

export const PERCENT_TO_FLAT: Partial<Record<HsrStatKey, HsrStatKey>> = {
  AttackAddedRatio: "AttackDelta",
  HPAddedRatio: "HPDelta",
  DefenceAddedRatio: "DefenceDelta",
};

function withFlatScaling(stats: HsrWeights): HsrWeights {
  const out: HsrWeights = { ...stats };
  for (const [pct, flat] of Object.entries(PERCENT_TO_FLAT) as [HsrStatKey, HsrStatKey][]) {
    const scaled = (out[pct] ?? 0) * FLAT_STAT_SCALING;
    if (scaled > 0) out[flat] = scaled;
    else delete out[flat];
  }
  return out;
}

const DPS: HsrWeights = {
  CriticalChanceBase: 1.0,
  CriticalDamageBase: 1.0,
  SpeedDelta: 1.0,
  AttackAddedRatio: 0.75,
};

const HARMONY: HsrWeights = {
  SpeedDelta: 1.0,
  CriticalDamageBase: 0.75,
  CriticalChanceBase: 0.5,
  AttackAddedRatio: 0.5,
  BreakDamageAddedRatioBase: 0.25,
  StatusResistanceBase: 0.25,
  HPAddedRatio: 0.25,
  DefenceAddedRatio: 0.25,
};

const NIHILITY: HsrWeights = {
  SpeedDelta: 1.0,
  StatusProbabilityBase: 1.0,
  AttackAddedRatio: 0.75,
  CriticalChanceBase: 0.5,
  CriticalDamageBase: 0.5,
  BreakDamageAddedRatioBase: 0.25,
  StatusResistanceBase: 0.25,
};

const PRESERVATION: HsrWeights = {
  SpeedDelta: 1.0,
  DefenceAddedRatio: 1.0,
  HPAddedRatio: 0.75,
  StatusResistanceBase: 0.5,
  CriticalChanceBase: 0.5,
  CriticalDamageBase: 0.5,
  StatusProbabilityBase: 0.25,
};

const ABUNDANCE: HsrWeights = {
  SpeedDelta: 1.0,
  HPAddedRatio: 1.0,
  DefenceAddedRatio: 0.75,
  StatusResistanceBase: 0.5,
  AttackAddedRatio: 0.25,
};

/**
 * Internal Path names as they appear in the game data. The English names
 * players know are in PATH_LABELS. These mirror Fribbels' role defaults
 * (0.75 ATK, 1.0 SPD, 1.0 CR, 1.0 CD for crit damage dealers, 0.25 RES on
 * offensive supports, 0.5 RES on sustains) and only apply when a character
 * has no entry of their own.
 */
const PATH_WEIGHTS: Record<string, HsrWeights> = {
  Warrior: DPS, // Destruction
  Rogue: DPS, // The Hunt
  Mage: DPS, // Erudition
  Memory: DPS, // Remembrance
  Elation: DPS, // Elation
  Shaman: HARMONY, // Harmony
  Warlock: NIHILITY, // Nihility
  Knight: PRESERVATION, // Preservation
  Priest: ABUNDANCE, // Abundance
};

export const PATH_LABELS: Record<string, string> = {
  Warrior: "Destruction",
  Rogue: "The Hunt",
  Mage: "Erudition",
  Memory: "Remembrance",
  Elation: "Elation",
  Shaman: "Harmony",
  Warlock: "Nihility",
  Knight: "Preservation",
  Priest: "Abundance",
};

/**
 * Patches applied over the imported table, keyed by avatarId. Each entry
 * should say which guide it follows and why it beats the Fribbels value, so
 * the next person can re-check it when either source moves.
 */
export const CHARACTER_OVERRIDES: Record<string, Partial<Pick<ScoringMeta, "stats" | "parts">>> = {};

export function getCharacterInfo(avatarId: number) {
  return CHARS[String(avatarId)] ?? null;
}

/**
 * The Trailblazer has one id per gender for each Path (8001/8002 Destruction,
 * 8003/8004 Preservation, and so on). Fribbels keys the odd one; the kit is
 * identical, so the even id borrows it.
 */
function metadataId(avatarId: number): string {
  if (avatarId >= 8000 && avatarId % 2 === 0) return String(avatarId - 1);
  return String(avatarId);
}

const EMPTY_PARTS: Record<SelectableSlot, HsrStatKey[]> = { BODY: [], FOOT: [], NECK: [], OBJECT: [] };

/**
 * Everything the scorer needs to know about a character. Falls through
 * override -> Fribbels -> Path -> generic DPS, so an unknown avatarId still
 * produces a usable score rather than nothing.
 */
export function getScoringMeta(avatarId: number): ScoringMeta {
  const entry = FRIBBELS[metadataId(avatarId)];
  const override = CHARACTER_OVERRIDES[String(avatarId)];

  let meta: ScoringMeta;
  if (entry) {
    meta = {
      stats: withFlatScaling(entry.stats as HsrWeights),
      parts: { ...EMPTY_PARTS, ...(entry.parts as Record<SelectableSlot, HsrStatKey[]>) },
      ...(entry.flatMainstatBoost ? { flatMainstatBoost: entry.flatMainstatBoost as HsrStatKey } : {}),
      ...setsFor(avatarId, entry),
      source: "fribbels",
    };
  } else {
    const info = getCharacterInfo(avatarId);
    meta = {
      stats: withFlatScaling((info && PATH_WEIGHTS[info.path]) || DPS),
      parts: { ...EMPTY_PARTS },
      ...setsFor(avatarId, undefined),
      source: "path",
    };
  }

  if (override) {
    if (override.stats) meta.stats = withFlatScaling({ ...meta.stats, ...override.stats });
    if (override.parts) meta.parts = { ...meta.parts, ...override.parts };
  }
  return meta;
}

/** Substat weights only, for callers that do not care about main stats. */
export function getWeights(avatarId: number): HsrWeights {
  return getScoringMeta(avatarId).stats;
}

export function weightOf(weights: HsrWeights, key: HsrStatKey): number {
  return weights[key] ?? 0;
}
