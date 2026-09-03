/**
 * Domain models for the Honkai: Star Rail scorer.
 *
 * Deliberately parallel to, but separate from, the Genshin types in
 * ../types. The two games differ in slot count, stat pool and reroll
 * mechanic, and forcing one shape over both would mean an abstraction that
 * has to be re-litigated every time either game ships something new.
 */

import type { RerollAdvice } from "./reroll";

/** Enka's internal stat keys, used verbatim so no mapping table can drift. */
export type HsrStatKey =
  | "HPDelta"
  | "AttackDelta"
  | "DefenceDelta"
  | "HPAddedRatio"
  | "AttackAddedRatio"
  | "DefenceAddedRatio"
  | "SpeedDelta"
  | "CriticalChanceBase"
  | "CriticalDamageBase"
  | "StatusProbabilityBase"
  | "StatusResistanceBase"
  | "BreakDamageAddedRatioBase"
  | "HealRatioBase"
  | "SPRatioBase"
  | "PhysicalAddedRatio"
  | "FireAddedRatio"
  | "IceAddedRatio"
  | "ThunderAddedRatio"
  | "WindAddedRatio"
  | "QuantumAddedRatio"
  | "ImaginaryAddedRatio";

/** The six relic slots. NECK and OBJECT are the Planar Ornament pair. */
export type HsrSlot = "HEAD" | "HAND" | "BODY" | "FOOT" | "NECK" | "OBJECT";

export const HSR_SLOTS: HsrSlot[] = ["HEAD", "HAND", "BODY", "FOOT", "NECK", "OBJECT"];

export interface HsrSubstat {
  key: HsrStatKey;
  /** Displayed value: percentages as percents (12.5), flats as flats (38.1). */
  value: number;
  /** Upgrades that landed here, stated by Enka rather than inferred. */
  rolls: number;
  /**
   * Value as a share of the best this many rolls could have produced.
   * 1.0 means every roll was max tier.
   */
  quality: number;
}

export interface HsrRelic {
  /** Stable per-relic identity, derived from content rather than fetch time. */
  id: string;
  tid: number;
  slot: HsrSlot;
  setId: number;
  setName: string;
  rarity: number;
  level: number;
  mainStat: { key: HsrStatKey; value: number };
  substats: HsrSubstat[];
  /** Total upgrades on the piece: 8 or 9, depending on its starting substats. */
  totalRolls: number;
  score: HsrRelicScore;
  /** Whether a Variable Die is worth spending here. Filled in after scoring. */
  reroll: RerollAdvice;
}

export interface HsrRelicScore {
  /** Weighted potential as a share of this character's ideal, 0-200 scale. */
  potentialPercent: number;
  /**
   * Letter grade, or null when the piece cannot be graded: a non-5-star, a
   * main stat the character has no use for, or a zero score. The percent is
   * still reported so the substats can be judged on their own.
   */
  grade: string | null;
  /** Whether the main stat is one the character can use (always true for Head and Hands). */
  mainStatOk: boolean;
  /** Raw weighted roll value, aggregated into the build score. */
  weighted: number;
  /** The reachable ceiling for a piece this size on this character. */
  ideal: number;
  /** Rolls landing on stats this character actually uses. */
  effectiveRolls: number;
  /** Rolls on stats with no meaningful weight for this character. */
  wastedRolls: number;
}

/**
 * Trace levels. Enka states these as a flat list of point ids, where the last
 * three digits identify the node: 001 basic attack, 002 skill, 003 ultimate,
 * 004 talent, 007 technique, and anything above 100 is a bonus node that is
 * either taken or not.
 */
export interface HsrTraces {
  basic: number;
  skill: number;
  ultimate: number;
  talent: number;
  /** Bonus nodes taken, out of the ones this character has. */
  bonusTaken: number;
  bonusTotal: number;
}

/** Final stats, as the game's character screen shows them. */
export interface HsrStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  /** Percentages as percents: 57.4 rather than 0.574. */
  critRate: number;
  critDmg: number;
  breakEffect: number;
  energyRegen: number;
  effectHitRate: number;
  effectRes: number;
  healRatio: number;
  /** The character's own element, the only damage bonus worth showing. */
  elementalDmg: number;
}

export interface HsrLightCone {
  id: number;
  name: string;
  path: string;
  level: number;
  /** Ascension, 0-6. Needed to read the right row of the stat curve. */
  promotion: number;
  /** Superimposition, 1-5. */
  superimposition: number;
}

export interface HsrCharacter {
  avatarId: number;
  name: string;
  path: string;
  element: string;
  rarity: number;
  level: number;
  /** Ascension, 0-6. Needed to read the right row of the stat curve. */
  promotion: number;
  /** Eidolon, 0-6. */
  eidolon: number;
  lightCone: HsrLightCone | null;
  traces: HsrTraces | null;
  /** Every skill-tree node the player has taken, for the trace stat bonuses. */
  traceNodes: number[];
  relics: HsrRelic[];
  stats: HsrStats;
  diagnostics: BuildDiagnostics;
}

/**
 * The aggregate view, and the reason this tool exists alongside a per-piece
 * grade. Six individually excellent relics can still add up to a build that
 * is a quarter dead weight, and no per-piece score can see that.
 */
export interface BuildDiagnostics {
  /**
   * Build quality on the same 0-200 scale as the per-piece grades: 100 is
   * solid, 200 is every upgrade on the best stat at max quality.
   */
  score: number;
  grade: string;
  /** Upgrades across all six relics. The realistic ceiling is 54. */
  totalRolls: number;
  /** Of those, the ones on stats this character uses. */
  effectiveRolls: number;
  wastedRolls: number;
  /**
   * effectiveRolls measured against BENCHMARK_ROLLS, so it lines up with the
   * "how far off a good build am I" question a DPS score answers.
   */
  efficiency: number;
  /** Where the wasted rolls actually sit, worst slot first. */
  waste: { slot: HsrSlot; key: HsrStatKey; rolls: number }[];
  /** Substat totals by stat, for the distribution view. */
  totals: { key: HsrStatKey; rolls: number; value: number }[];
  /** Crit ratio check: CRIT DMG per point of CRIT Rate, ideal is 2.0. */
  critRatio: number | null;
  /** Sets contributing a bonus, by piece count. */
  sets: { setId: number; name: string; pieces: number }[];
}

export interface HsrShowcase {
  uid: string;
  nickname: string;
  level: number;
  signature: string;
  characters: HsrCharacter[];
  fetchedAt: number;
}
