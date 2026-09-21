/**
 * What a score means for this slot.
 *
 * "87%" says how far a piece is from its ceiling, not how lucky it was. The
 * question players actually ask is "is that good for a goblet?", and the
 * honest answer is a percentile: the share of artifacts the game would hand
 * out, rolled to +20 with this main stat, that score lower for this character.
 *
 * The distribution is simulated from the game's own generation model rather
 * than measured from users, so there is nothing to collect and no backend:
 * the substat pool weights (HP, ATK and DEF flats at 6, the percents, EM and
 * ER at 4, CRIT at 3), a one-in-five chance of four starting lines, one
 * upgrade every four levels, and a tier drawn uniformly from 70% to 100% of
 * the max roll. Each (character, main stat) pair is sampled once per session
 * and cached; the seed is fixed so the same piece always reads the same.
 */

import type { FightProp } from "../types/enka";
import type { ArtifactSubstat } from "../types/artifact";
import { MAX_ROLL_VALUES } from "./constants";
import { computeIdealPotential, computePotentialPercent, computeWeightedPotential, getBuildConfig } from "./scoring";
import type { ScoringWeights } from "../types/scoring";

/** How often each stat is drawn as a substat, from the game's drop tables. */
const POOL: Array<[FightProp, number]> = [
  ["FIGHT_PROP_HP", 6],
  ["FIGHT_PROP_ATTACK", 6],
  ["FIGHT_PROP_DEFENSE", 6],
  ["FIGHT_PROP_HP_PERCENT", 4],
  ["FIGHT_PROP_ATTACK_PERCENT", 4],
  ["FIGHT_PROP_DEFENSE_PERCENT", 4],
  ["FIGHT_PROP_ELEMENT_MASTERY", 4],
  ["FIGHT_PROP_CHARGE_EFFICIENCY", 4],
  ["FIGHT_PROP_CRITICAL", 3],
  ["FIGHT_PROP_CRITICAL_HURT", 3],
];

const TIERS = [0.7, 0.8, 0.9, 1.0];
const FOUR_LINE_CHANCE = 0.2;
const UPGRADES = 5;
export const SAMPLES = 1500;

const DEFAULT_WEIGHTS: ScoringWeights = {
  CRIT_RATE: 1,
  CRIT_DMG: 1,
  ATK_PERCENT: 0.5,
  HP_PERCENT: 0,
  DEF_PERCENT: 0,
  ELEMENTAL_MASTERY: 0,
  ENERGY_RECHARGE: 0,
  HEALING_BONUS: 0,
  PHYSICAL_DMG: 0,
  ELEMENTAL_DMG: 0,
  FLAT_ATK: 0.1,
  FLAT_HP: 0,
  FLAT_DEF: 0,
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

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Draws one stat from the pool by weight, excluding those already taken. */
function draw(rand: () => number, taken: Set<FightProp>, mainStat: string): FightProp {
  const candidates = POOL.filter(([key]) => key !== mainStat && !taken.has(key));
  const total = candidates.reduce((n, [, w]) => n + w, 0);
  let r = rand() * total;
  for (const [key, w] of candidates) {
    r -= w;
    if (r <= 0) return key;
  }
  return candidates[candidates.length - 1][0];
}

/** One random +20 five-star artifact with the given main stat, as scored substats. */
function sampleSubstats(rand: () => number, mainStat: string): ArtifactSubstat[] {
  const taken = new Set<FightProp>();
  const rolls = new Map<FightProp, number>();
  const initial = rand() < FOUR_LINE_CHANCE ? 4 : 3;
  for (let i = 0; i < initial; i++) {
    const key = draw(rand, taken, mainStat);
    taken.add(key);
    rolls.set(key, TIERS[Math.floor(rand() * 4)]);
  }
  let upgrades = UPGRADES;
  if (initial === 3) {
    // The first upgrade on a three-liner creates the fourth substat.
    const key = draw(rand, taken, mainStat);
    taken.add(key);
    rolls.set(key, TIERS[Math.floor(rand() * 4)]);
    upgrades -= 1;
  }
  const keys = [...taken];
  for (let i = 0; i < upgrades; i++) {
    const key = keys[Math.floor(rand() * keys.length)];
    rolls.set(key, (rolls.get(key) ?? 0) + TIERS[Math.floor(rand() * 4)]);
  }
  return keys.map((statKey) => ({
    statKey,
    displayName: statKey,
    shortName: statKey,
    value: (MAX_ROLL_VALUES[statKey] ?? 0) * (rolls.get(statKey) ?? 0),
    isPercentage: true,
    maxRoll: MAX_ROLL_VALUES[statKey] ?? 0,
    rollCount: 0,
    rollQuality: "medium",
    rolls: [],
  }));
}

const cache = new Map<string, Float64Array>();

/** Sorted scores of SAMPLES random pieces for this character and main stat. */
export function scoreDistribution(avatarId: number, mainStatKey: string): Float64Array {
  const key = `${avatarId}|${mainStatKey}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const weights = getBuildConfig(avatarId)?.substat_weights ?? DEFAULT_WEIGHTS;
  const ideal = computeIdealPotential(weights, mainStatKey);
  const rand = mulberry32(hash(key));
  const scores = new Float64Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const subs = sampleSubstats(rand, mainStatKey);
    scores[i] = ideal > 0 ? computePotentialPercent(computeWeightedPotential(subs, weights, mainStatKey), ideal) : 0;
  }
  scores.sort();
  cache.set(key, scores);
  return scores;
}

/**
 * The share of random pieces this score beats, 0 to 1. A piece at the 0.88
 * mark is better than 88% of what the game would drop for this slot.
 */
export function scorePercentile(avatarId: number, mainStatKey: string, percent: number): number {
  const scores = scoreDistribution(avatarId, mainStatKey);
  // Binary search for the first sample at or above the score.
  let lo = 0;
  let hi = scores.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (scores[mid] < percent) lo = mid + 1;
    else hi = mid;
  }
  return lo / scores.length;
}
