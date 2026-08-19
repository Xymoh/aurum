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

  // Reroll potential via Dust of Enlightenment (5.7+)
  reroll: RerollPotential;
}

/**
 * Best-case score ceiling reachable by using Dust of Enlightenment to reshape
 * a fully-leveled 5★ artifact's upgrade rolls. Only meaningful when `eligible`
 * is true (level 20, 5★, 4 substats) — see computeRerollPotential in scoring.ts.
 */
export interface RerollPotential {
  eligible: boolean;
  currentPercent: number;
  ceilingPercent: number;
  upsidePercent: number;
  bestStatDisplayName: string | null;
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

export const GRADE_COLORS: Record<ScoreGrade, string> = {
  "F":    "#4b5563",
  "F+":   "#6b7280",
  "D":    "#6b7280",
  "D+":   "#9ca3af",
  "C":    "#22c55e",
  "C+":   "#4ade80",
  "B":    "#3b82f6",
  "B+":   "#60a5fa",
  "A":    "#a855f7",
  "A+":   "#c084fc",
  "S":    "#ffd700",
  "S+":   "#ffe44d",
  "SS":   "#ffbd59",
  "SS+":  "#ff8c00",
  "SSS":  "#ff8c00",
  "SSS+": "#de3a35",
  "WTF":  "#1fe03f",
  "WTF+": "#39ff5e",
};
