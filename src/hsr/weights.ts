/**
 * Substat weights for Honkai: Star Rail.
 *
 * Keyed by Path rather than by character. That is a deliberate trade: a
 * per-character table scores a known character slightly better, but every
 * character released after the table was written falls off it. Paths are
 * fixed game structure, so a character shipped tomorrow still lands on
 * sensible weights the moment Enka knows its Path.
 *
 * Per-character overrides sit in CHARACTER_OVERRIDES for the cases where a
 * character genuinely breaks its Path's mould. Absent an override, nothing
 * degrades: the Path weights apply and the build still scores.
 */

import type { HsrStatKey } from "./types";
import characters from "./data/characters.json";

export type HsrWeights = Partial<Record<HsrStatKey, number>>;

const CHARS = characters as Record<
  string,
  { name: string; path: string; element: string; rarity: number }
>;

/** Below this, a roll is doing nothing useful and counts as waste. */
export const WASTE_THRESHOLD = 0.2;

const DPS: HsrWeights = {
  CriticalChanceBase: 1.0,
  CriticalDamageBase: 1.0,
  AttackAddedRatio: 0.75,
  SpeedDelta: 0.5,
  AttackDelta: 0.25,
  BreakDamageAddedRatioBase: 0.15,
};

const HARMONY: HsrWeights = {
  SpeedDelta: 1.0,
  AttackAddedRatio: 0.5,
  BreakDamageAddedRatioBase: 0.45,
  CriticalChanceBase: 0.35,
  CriticalDamageBase: 0.35,
  // A buffer that gets crowd-controlled buffs nobody that turn, so Effect RES
  // and bulk do real work here even though they add no damage of their own.
  StatusResistanceBase: 0.3,
  HPAddedRatio: 0.25,
  DefenceAddedRatio: 0.25,
  AttackDelta: 0.15,
};

const NIHILITY: HsrWeights = {
  StatusProbabilityBase: 0.85,
  SpeedDelta: 0.8,
  AttackAddedRatio: 0.7,
  BreakDamageAddedRatioBase: 0.6,
  CriticalChanceBase: 0.5,
  CriticalDamageBase: 0.5,
  AttackDelta: 0.2,
};

const PRESERVATION: HsrWeights = {
  DefenceAddedRatio: 0.85,
  HPAddedRatio: 0.7,
  SpeedDelta: 0.7,
  CriticalChanceBase: 0.45,
  CriticalDamageBase: 0.45,
  StatusResistanceBase: 0.3,
  DefenceDelta: 0.2,
  HPDelta: 0.2,
};

const ABUNDANCE: HsrWeights = {
  SpeedDelta: 0.9,
  HPAddedRatio: 0.85,
  DefenceAddedRatio: 0.4,
  StatusResistanceBase: 0.35,
  HPDelta: 0.25,
  AttackAddedRatio: 0.2,
};

/**
 * Internal Path names as they appear in the game data. The English names
 * players know are in PATH_LABELS.
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
 * Characters whose kit contradicts their Path's default. Kept intentionally
 * short: an entry here is a maintenance liability, so it should earn its
 * place by being clearly wrong otherwise.
 */
export const CHARACTER_OVERRIDES: Record<string, HsrWeights> = {
  // Break-damage carries: crit does almost nothing for them.
  "1225": { // Fugue
    BreakDamageAddedRatioBase: 1.0,
    SpeedDelta: 0.9,
    AttackAddedRatio: 0.6,
    StatusProbabilityBase: 0.4,
    CriticalChanceBase: 0.1,
    CriticalDamageBase: 0.1,
  },
  // Silver Wolf LV.999 sits on the Elation path beside genuine damage dealers,
  // but her value is debuffs, not damage, so the generic profile scored her
  // wrong. Guides name SPD, CRIT Rate and CRIT DMG as the substats and say
  // outright not to stack ATK.
  //
  // Note the distinction that tripped this up once already: HP% and DEF% are
  // recommended as her sphere and rope MAIN stats, for bulk in one large
  // chunk. That says nothing about substat rolls, which the same guides do not
  // list. Weighting substat HP% highly on the strength of a main-stat
  // recommendation made three wasted rolls read as useful.
  "1506": { // Silver Wolf LV.999
    SpeedDelta: 1.0,
    CriticalDamageBase: 0.85,
    CriticalChanceBase: 0.85,
    StatusResistanceBase: 0.3,
    BreakDamageAddedRatioBase: 0.25,
    HPAddedRatio: 0.15,
    DefenceAddedRatio: 0.15,
    AttackAddedRatio: 0.1,
  },
  "1310": { // Firefly
    BreakDamageAddedRatioBase: 1.0,
    SpeedDelta: 0.85,
    AttackAddedRatio: 0.6,
    DefenceAddedRatio: 0.2,
    CriticalChanceBase: 0.05,
    CriticalDamageBase: 0.05,
  },
};

export function getCharacterInfo(avatarId: number) {
  return CHARS[String(avatarId)] ?? null;
}

/**
 * Weights for a character. Falls back through override -> Path -> generic DPS,
 * so an unknown avatarId still produces a usable score rather than nothing.
 */
export function getWeights(avatarId: number): HsrWeights {
  const override = CHARACTER_OVERRIDES[String(avatarId)];
  if (override) return override;
  const info = getCharacterInfo(avatarId);
  return (info && PATH_WEIGHTS[info.path]) || DPS;
}

export function weightOf(weights: HsrWeights, key: HsrStatKey): number {
  return weights[key] ?? 0;
}
