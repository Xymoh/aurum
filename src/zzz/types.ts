/**
 * Domain models for the Zenless Zone Zero scorer.
 *
 * Parallel to the Star Rail models rather than shared with them: the games
 * differ in slot count, stat pool and, most of all, in roll mechanics. ZZZ
 * substats grow by a fixed amount per roll, so there is no roll quality here
 * at all, only a roll count.
 */

/** Enka PropertyIds, kept as numbers so the tables can be used verbatim. */
export type ZzzStatId = number;

/** The six drive disc slots. 1 to 3 have fixed main stats, 4 to 6 are chosen. */
export type ZzzSlot = 1 | 2 | 3 | 4 | 5 | 6;
export const ZZZ_SLOTS: ZzzSlot[] = [1, 2, 3, 4, 5, 6];
export type SelectableZzzSlot = 4 | 5 | 6;
export const SELECTABLE_ZZZ_SLOTS: SelectableZzzSlot[] = [4, 5, 6];

export interface ZzzSubstat {
  id: ZzzStatId;
  /** Rolls on this stat, including the one that created it. Stated by Enka. */
  rolls: number;
  /** Fixed value of one roll, in display units (percent as 3.0, flats raw). */
  perRoll: number;
  /** rolls x perRoll, in display units. */
  value: number;
}

export interface ZzzDisc {
  /** Stable per-disc identity, derived from content rather than fetch time. */
  id: string;
  itemId: number;
  slot: ZzzSlot;
  setId: number;
  setName: string;
  rarity: number;
  level: number;
  mainStat: { id: ZzzStatId; value: number };
  substats: ZzzSubstat[];
  /** Total rolls on the piece: 8 or 9 at +15, depending on its starting substats. */
  totalRolls: number;
  score: ZzzDiscScore;
}

export interface ZzzDiscScore {
  /** Weighted potential as a share of the optimal disc for this slot, 0-200. */
  potentialPercent: number;
  /** Letter grade, or null when the disc cannot be graded: wrong main stat or zero score. */
  grade: string | null;
  mainStatOk: boolean;
  weighted: number;
  ideal: number;
  effectiveRolls: number;
  wastedRolls: number;
}

/** Final stats, as the game's agent screen shows them. */
export interface ZzzStats {
  hp: number;
  atk: number;
  def: number;
  impact: number;
  /** Percentages as percents: 14.6 rather than 0.146. */
  critRate: number;
  critDmg: number;
  anomalyMastery: number;
  anomalyProficiency: number;
  energyRegen: number;
  penRatio: number;
  pen: number;
  elementalDmg: number;
}

export interface ZzzEngine {
  id: number;
  name: string;
  level: number;
  /** Modification rank, 1-5. */
  rank: number;
  /** Breakthrough, 0-5. Drives the engine's stat curve, unlike the rank. */
  breakLevel: number;
  rarity: number;
  image: string;
}

export interface ZzzAgent {
  id: number;
  name: string;
  rarity: number;
  /** Attack, Stun, Anomaly, Support, Defense, Rupture. */
  profession: string;
  element: string;
  level: number;
  /** Promotion rank, indexing the agent's stat curve. */
  promotion: number;
  /** Mindscape Cinema level, 0-6. */
  mindscape: number;
  /** Core skill enhancement, A to F in game, 0-6 here. */
  coreSkill: number;
  skills: { basic: number; dodge: number; assist: number; special: number; chain: number };
  engine: ZzzEngine | null;
  discs: ZzzDisc[];
  stats: ZzzStats;
  diagnostics: ZzzBuildDiagnostics;
}

export interface ZzzBuildDiagnostics {
  /** Mean of the six slots on the 0-200 scale, an empty slot counting as zero. */
  score: number;
  grade: string;
  totalRolls: number;
  effectiveRolls: number;
  wastedRolls: number;
  waste: { slot: ZzzSlot; id: ZzzStatId; rolls: number }[];
  totals: { id: ZzzStatId; rolls: number; value: number }[];
  critRatio: number | null;
  sets: { setId: number; name: string; pieces: number }[];
  /** Stats a guide caps ("CRIT Rate until 80%"), with the build's total for each. */
  thresholds: { id: ZzzStatId; target: number; current: number }[];
}

export interface ZzzShowcase {
  uid: string;
  nickname: string;
  level: number;
  signature: string;
  profilePicture: string | null;
  agents: ZzzAgent[];
  fetchedAt: number;
}
