/**
 * Reroll advice for Honkai: Star Rail relics.
 *
 * Star Rail's Variable Dice, added in 3.0, does what Genshin's Dust of
 * Enlightenment reshape does: it redistributes the enhancement attempts already
 * spent on a Lv15 5-star relic across its existing substats. So this asks the
 * same question ../lib/reroll.ts asks - is this piece worth spending on, or
 * should you farm a replacement - and answers it the same way, by simulating
 * the redistribution rather than quoting an average.
 *
 * Three things differ from the Genshin engine, and all three make this simpler:
 *
 *  1. Roll counts are stated by Enka rather than inferred, so the starting
 *     point is exact.
 *  2. Rolls come in three tiers, not four, and the floor is 80% of the best
 *     roll rather than 70% (Speed alone sits at ~77%).
 *  3. A die shows you the result and lets you keep the old rolls, so a reroll
 *     has no downside. There is nothing here matching Genshin's ER guard,
 *     because there is no way to lose what you had.
 */

import type { HsrRelic, HsrStatKey } from "./types";
import { WASTE_THRESHOLD, weightOf, type HsrWeights } from "./weights";

/** Substat tiers, as a share of the best possible roll. */
const DEFAULT_TIERS = [0.8, 0.9, 1.0];
/** Speed is the one substat whose lowest roll is not 80% of its best. */
const SPEED_TIERS = [0.7692, 0.8846, 1.0];

function tiersFor(key: HsrStatKey): number[] {
  return key === "SpeedDelta" ? SPEED_TIERS : DEFAULT_TIERS;
}

/**
 * Every relic ends at four substats, so four of its rolls are the substats
 * themselves and the rest are upgrades that a die can move.
 */
const BASE_SUBSTATS = 4;

const TRIALS = 1500;
/** Percentage points of potential a reroll must add to count as worthwhile. */
const MEANINGFUL_GAIN = 5;
/** Below this, even a lucky redistribution leaves the piece not worth using. */
const WORTH_INVESTING_IN = 90;

export interface RerollTierDef {
  id: "high" | "medium" | "low";
  label: string;
  /** Upper bound, inclusive, on expected dice spent to reach a real gain. */
  maxExpectedDice: number;
  blurb: string;
}

/** Cheapest-first; the first tier whose budget covers the estimate wins. */
export const REROLL_TIERS: RerollTierDef[] = [
  {
    id: "high",
    label: "Reroll now",
    maxExpectedDice: 3,
    blurb: "Among the best value per die on this account.",
  },
  {
    id: "medium",
    label: "Worth rerolling",
    maxExpectedDice: 8,
    blurb: "Decent odds, but budget for a few dice.",
  },
  {
    id: "low",
    label: "Low priority",
    maxExpectedDice: 16,
    blurb: "Dice go further on other pieces first.",
  },
];

export function getRerollTier(expectedDice: number): RerollTierDef | null {
  for (const tier of REROLL_TIERS) if (expectedDice <= tier.maxExpectedDice) return tier;
  return null;
}

export interface RerollAdvice {
  /** False for anything a die cannot be used on. */
  eligible: boolean;
  action: "reroll" | "replace" | "none";
  priority: "high" | "medium" | "low" | null;
  label: string;
  reason: string;
  /** Chance one die produces a meaningful gain. */
  improveChance: number;
  /** Dice needed on average to land one, rounded for display. */
  expectedDice: number;
  /** Where a good outcome lands, as a potential percentage. */
  realisticCeiling: number;
  /** Median gain across the rerolls that did improve the piece. */
  medianGain: number;
  /** The two stats worth the most on this piece, as a hint for what to hope for. */
  targetStats: HsrStatKey[];
}

const NO_ADVICE: RerollAdvice = {
  eligible: false,
  action: "none",
  priority: null,
  label: "",
  reason: "",
  improveChance: 0,
  expectedDice: Infinity,
  realisticCeiling: 0,
  medianGain: 0,
  targetStats: [],
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Advice for one relic.
 *
 * Only +15 five-star relics can take a die, and a piece with fewer upgrades
 * than substats has nothing to redistribute.
 */
export function adviseReroll(relic: HsrRelic, weights: HsrWeights): RerollAdvice {
  const movable = relic.totalRolls - BASE_SUBSTATS;
  if (relic.rarity < 5 || relic.level < 15 || relic.substats.length < 4 || movable <= 0) {
    return NO_ADVICE;
  }

  const maxWeight = Math.max(...Object.values(weights), 0.0001);
  const ideal = relic.totalRolls * maxWeight;
  const currentPercent = relic.score.potentialPercent;

  // What one roll on each substat is worth, and the value already banked by
  // the four rolls that simply define which substats the piece has.
  const perRoll = relic.substats.map((s) => weightOf(weights, s.key));
  const baseWeighted = relic.substats.reduce(
    (acc, s, i) => acc + perRoll[i] * (s.quality > 0 ? s.quality : 1),
    0,
  );

  const ranked = relic.substats
    .map((s, i) => ({ key: s.key, weight: perRoll[i] }))
    .sort((a, b) => b.weight - a.weight);
  const targetStats = ranked.filter((r) => r.weight >= WASTE_THRESHOLD).slice(0, 2).map((r) => r.key);

  // Seeded from the relic's content, never a generated id, so the verdict is
  // stable across page loads instead of flickering on borderline pieces.
  const fingerprint = `${relic.tid}/${relic.mainStat.key}/${relic.substats
    .map((s) => `${s.key}:${s.rolls}:${s.quality.toFixed(3)}`)
    .join("|")}`;
  const rand = mulberry32(hashString(fingerprint));

  const outcomes: number[] = [];
  const improved: number[] = [];
  const gainThreshold = currentPercent + MEANINGFUL_GAIN;
  const subTiers = relic.substats.map((s) => tiersFor(s.key));

  for (let t = 0; t < TRIALS; t++) {
    let weighted = baseWeighted;
    for (let r = 0; r < movable; r++) {
      const target = Math.floor(rand() * 4);
      const tiers = subTiers[target];
      weighted += perRoll[target] * tiers[Math.floor(rand() * tiers.length)];
    }
    const percent = (weighted / ideal) * 200;
    outcomes.push(percent);
    if (percent >= gainThreshold) improved.push(percent);
  }

  outcomes.sort((a, b) => a - b);
  improved.sort((a, b) => a - b);

  const realisticCeiling = outcomes[Math.floor(outcomes.length * 0.9)];
  // Median over the rerolls that actually worked: "if this pays off, by how
  // much?". Taking it over all outcomes reports zero exactly when most
  // attempts fail, which is when the number matters most.
  const medianGain =
    improved.length > 0
      ? Math.max(0, improved[Math.floor(improved.length * 0.5)] - currentPercent)
      : 0;

  const improveChance = improved.length / TRIALS;
  const expectedDice = improveChance > 0 ? 1 / improveChance : Infinity;

  const base = {
    eligible: true,
    improveChance,
    expectedDice,
    realisticCeiling,
    medianGain,
    targetStats,
  };

  // Only call a piece finished if it is both weak now and incapable of getting
  // good. A well-rolled relic often has a ceiling below its current score,
  // which means leave it alone, not throw it away.
  if (realisticCeiling < WORTH_INVESTING_IN && currentPercent < WORTH_INVESTING_IN) {
    return {
      ...NO_ADVICE,
      ...base,
      action: "replace",
      priority: null,
      label: "Farm a replacement",
      reason: `Weak now, and even a lucky die tops out near ${realisticCeiling.toFixed(0)}%. Farm a better piece instead.`,
    };
  }

  const tier = getRerollTier(expectedDice);
  if (!tier) {
    return {
      ...NO_ADVICE,
      ...base,
      action: "none",
      priority: null,
      label: "Well rolled",
      reason: "Its upgrades already sit on the right stats, so there is little left to gain.",
    };
  }

  return {
    ...base,
    action: "reroll",
    priority: tier.id,
    label: tier.label,
    reason: tier.blurb,
  };
}
