/**
 * Domain models for the Honkai: Star Rail scorer.
 *
 * Deliberately parallel to, but separate from, the Genshin types in
 * ../types. The two games differ in slot count, stat pool and reroll
 * mechanic, and forcing one shape over both would mean an abstraction that
 * has to be re-litigated every time either game ships something new.
 */

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

/** Slots whose main stat is fixed by the game, so it carries no information. */
export const FIXED_MAIN_SLOTS: HsrSlot[] = ["HEAD", "HAND"];

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
}

export interface HsrRelicScore {
  /** Weighted potential as a share of this character's ideal, 0-200 scale. */
  potentialPercent: number;
  grade: string;
  /** Raw weighted roll value, aggregated into the build score. */
  weighted: number;
  /** Rolls landing on stats this character actually uses. */
  effectiveRolls: number;
  /** Rolls on stats with no meaningful weight for this character. */
  wastedRolls: number;
  mainStatFits: boolean;
}

export interface HsrLightCone {
  id: number;
  name: string;
  path: string;
  level: number;
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
  /** Eidolon, 0-6. */
  eidolon: number;
  lightCone: HsrLightCone | null;
  relics: HsrRelic[];
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
  /** Slots whose main stat does not suit this character. */
  mainStatMisses: HsrSlot[];
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
