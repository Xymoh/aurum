import type { FightProp } from "./enka";

export type ArtifactSlot = "FLOWER" | "PLUME" | "SANDS" | "GOBLET" | "CIRCLET";

export interface ArtifactSubstat {
  statKey: FightProp;
  displayName: string;
  shortName: string;
  value: number;
  isPercentage: boolean;
  maxRoll: number;
  rollCount: number;
  rollQuality: "high" | "medium" | "low";
}

export interface Artifact {
  id: string;
  setId: string;
  setName: string;
  slot: ArtifactSlot;
  slotIndex: number;
  level: number;
  rarity: number;
  icon: string;
  mainStat: ArtifactMainStat;
  substats: ArtifactSubstat[];
  score: ArtifactScore;
}

export interface ArtifactMainStat {
  statKey: FightProp;
  displayName: string;
  value: number;
  isPercentage: boolean;
  isCorrect: boolean;
  isRecommended: boolean;
}

export interface ArtifactScore {
  // New primary score
  potentialPercent: number;  // 0–200%, Fribbels-style score (100% = solid, 200% = theoretically perfect)
  weightedPotential: number; // raw weighted potential sum
  idealPotential: number;    // theoretical max for this slot/mainstat/character

  // Main stat evaluation
  mainStatCorrect: boolean;
  mainStatMultiplier: number; // kept for backward compat (1.0 if correct)

  // Set bonus (informational)
  setBonusMultiplier: number; // kept at 1.0

  // Legacy fields (populated for backward compat)
  rv: number;        // Roll Value (0-100)
  cv: number;        // Crit Value (absolute)
  cvNormalized: number; // CV normalized to 0-1
  wse: number;       // Weighted Substat Efficiency (0-100)

  // Output
  total: number;     // = potentialPercent (unified score)
  grade: ScoreGrade;

  // Reroll advice via Dust of Enlightenment (5.7+)
  reroll: RerollAdvice;
}

/** What, if anything, the player should do with this artifact. */
export type RerollAction =
  /** Spend dust reshaping it - see `priority` for how urgent. */
  | "reroll"
  /** Its substats can't be salvaged by redistributing rolls; farm a new one. */
  | "replace"
  /** Not +20 yet, so it can't be reshaped at all. */
  | "level_up"
  /** Nothing to do - already well rolled, or not applicable. */
  | "none";

/**
 * Dust-of-Enlightenment advice for one artifact, derived by simulating the
 * reshape - see computeRerollAdvice in lib/reroll.ts for the model and the
 * reasoning behind it.
 */
export interface RerollAdvice {
  /** True once the piece is a +20 5★ with 4 substats (the in-game requirement). */
  eligible: boolean;
  action: RerollAction;
  priority: "high" | "medium" | "low" | null;
  /** Probability a single reshape yields a meaningfully better result. */
  improveChance: number;
  /** Expected reshapes before a meaningful gain (1 / improveChance). */
  expectedReshapes: number;
  /** Expected dust spent before a meaningful gain, accounting for slot cost. */
  expectedDust: number;
  /** Dust per reshape for this slot: 1 for Flower/Plume, 2 otherwise. */
  dustCost: number;
  currentPercent: number;
  /** Typical Potential % gained when a reshape does improve the piece. */
  medianGain: number;
  /** 90th-percentile outcome - a realistic good result, not a fantasy ceiling. */
  realisticCeiling: number;
  /** The two substats to nominate in-game, highest value-per-roll first. */
  targetStats: string[];
  /**
   * True when this piece's Energy Recharge is load-bearing enough to warn about.
   *
   * Reported alongside the odds rather than folded into them: ER requirements
   * are one curated number per character and vary with the team, so this is a
   * caution for the player to weigh, never a veto on the recommendation.
   */
  erRisk: boolean;
  /** Share of simulated reshapes that would drop the character under their ER requirement. */
  erBreachChance: number;
  /** The character's ER requirement, so the UI can name the number at stake. */
  erThreshold: number;
  /**
   * Untranslated diagnostic note. User-facing copy is rendered from `action`
   * in the UI so it can be localized - this is for logging and tests.
   */
  reason: string;
}

export type ScoreGrade =
  | "F" | "F+"
  | "D" | "D+"
  | "C" | "C+"
  | "B" | "B+"
  | "A" | "A+"
  | "S" | "S+"
  | "SS" | "SS+"
  | "SSS" | "SSS+"
  | "WTF" | "WTF+";

// Grade colours live in src/lib/grade.ts, backed by CSS variables so the
// light theme can swap the whole ramp.
