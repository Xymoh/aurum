/**
 * Scoring for Honkai: Star Rail relics.
 *
 * Two layers, and the second is the point of the tool:
 *
 *  1. Per-piece potential, the relic score from the Fribbels HSR Optimizer
 *     reimplemented step for step (see substat normalisation, the optimal
 *     relic and the grade ladder below), so a grade here agrees with the
 *     grade a player already sees there.
 *  2. Build diagnostics, which answer the question a per-piece grade
 *     structurally cannot: "my six relics are all graded S, so why is my
 *     damage mediocre". The usual answer is that a quarter of the upgrades
 *     landed on stats the character does not use, which is invisible piece by
 *     piece and obvious in aggregate.
 */

import type {
  BuildDiagnostics,
  HsrCharacter,
  HsrRelic,
  HsrRelicScore,
  HsrSlot,
  HsrStatKey,
} from "./types";
import type { ParsedCharacter, ParsedRelic } from "./parsing";
import {
  getScoringMeta,
  PERCENT_TO_FLAT,
  SELECTABLE_SLOTS,
  WASTE_THRESHOLD,
  weightOf,
  type ScoringMeta,
  type SelectableSlot,
} from "./weights";
import { adviseReroll } from "./reroll";
import { gradeFor } from "../lib/gradeLadder";
import { computeStats } from "./stats";
import affixes from "./data/affixes.json";

/**
 * Upgrades in a realistic strong build: 6 relics that mostly started with 4
 * substats. Fribbels' 100% benchmark uses 48, and its 200% ceiling uses 54,
 * so measuring against 48 puts our efficiency figure on the same footing as
 * the DPS score people are used to seeing.
 */
export const BENCHMARK_ROLLS = 48;
/** Six relics at 9 upgrades each: the most a build can physically hold. */
export const MAX_ROLLS = 54;

// ── Substat normalisation ───────────────────────────────────────────

/** The twelve stats a relic can roll as substats. */
export const SUBSTATS: HsrStatKey[] = [
  "HPDelta",
  "AttackDelta",
  "DefenceDelta",
  "HPAddedRatio",
  "AttackAddedRatio",
  "DefenceAddedRatio",
  "SpeedDelta",
  "CriticalChanceBase",
  "CriticalDamageBase",
  "StatusProbabilityBase",
  "StatusResistanceBase",
  "BreakDamageAddedRatioBase",
];

const SUB_5 = (affixes as { sub: Record<string, Record<string, { Property: string; BaseValue: number; StepValue?: number }>> }).sub["5"];

/**
 * Best single roll of each substat on a 5-star relic, in display units:
 * CRIT DMG 6.48, CRIT Rate 3.24, SPD 2.6 and so on. Read from the same affix
 * table the parser uses, so the two can never disagree.
 */
export const HIGH_ROLL: Record<HsrStatKey, number> = Object.fromEntries(
  Object.values(SUB_5).map((spec) => {
    const key = spec.Property as HsrStatKey;
    const raw = spec.BaseValue + 2 * (spec.StepValue ?? 0);
    return [key, key.endsWith("Delta") ? raw : raw * 100];
  }),
) as Record<HsrStatKey, number>;

/** CRIT DMG's best roll, the unit every other substat is expressed in. */
const CD_HIGH = HIGH_ROLL.CriticalDamageBase;

/**
 * How many CRIT DMG points one point of a stat is worth: 6.48 / its best
 * roll. One max roll of any substat then counts for exactly 6.48 units, so
 * stats with equal weight contribute equally per roll.
 */
export function substatScale(key: HsrStatKey): number {
  const high = HIGH_ROLL[key];
  return high ? CD_HIGH / high : 0;
}

// ── Main stats ──────────────────────────────────────────────────────

/** What each selectable slot can roll as its main stat. */
export const PARTS_MAIN_STATS: Record<SelectableSlot, HsrStatKey[]> = {
  BODY: [
    "HPAddedRatio",
    "AttackAddedRatio",
    "DefenceAddedRatio",
    "CriticalChanceBase",
    "CriticalDamageBase",
    "HealRatioBase",
    "StatusProbabilityBase",
  ],
  FOOT: ["HPAddedRatio", "AttackAddedRatio", "DefenceAddedRatio", "SpeedDelta"],
  NECK: [
    "HPAddedRatio",
    "AttackAddedRatio",
    "DefenceAddedRatio",
    "PhysicalAddedRatio",
    "FireAddedRatio",
    "IceAddedRatio",
    "ThunderAddedRatio",
    "WindAddedRatio",
    "QuantumAddedRatio",
    "ImaginaryAddedRatio",
  ],
  OBJECT: ["HPAddedRatio", "AttackAddedRatio", "DefenceAddedRatio", "BreakDamageAddedRatioBase", "SPRatioBase"],
};

function isSelectable(slot: HsrSlot): slot is SelectableSlot {
  return (SELECTABLE_SLOTS as HsrSlot[]).includes(slot);
}

/** Ideal main stats for a slot; an empty list in the metadata means all of them. */
function idealMainStats(slot: SelectableSlot, meta: ScoringMeta): HsrStatKey[] {
  const listed = meta.parts[slot];
  return listed.length > 0 ? listed : PARTS_MAIN_STATS[slot];
}

/**
 * How acceptable a main stat is: 1 for an ideal one, otherwise its weight as
 * a substat (an ATK% body on a character who wants ATK% substats is fine),
 * otherwise 0. Head and Hands cannot be wrong.
 */
export function mainStatWeight(slot: HsrSlot, mainKey: HsrStatKey, meta: ScoringMeta): number {
  if (!isSelectable(slot)) return 1;
  if (idealMainStats(slot, meta).includes(mainKey)) return 1;
  return weightOf(meta.stats, mainKey);
}

// ── Contributions ───────────────────────────────────────────────────

/**
 * Value of one point of a substat on a relic with this main stat, in CRIT DMG
 * units: weight x scale. The one twist is flatMainstatBoost, where a flat
 * substat borrows its percent stat's weight on a relic whose main stat is that
 * percent stat.
 */
export function contributionFor(meta: ScoringMeta, mainKey: HsrStatKey): (key: HsrStatKey) => number {
  const boosted = PERCENT_TO_FLAT[mainKey];
  const boostWeight = boosted && meta.flatMainstatBoost === boosted ? weightOf(meta.stats, mainKey) : 0;
  return (key) => {
    const weight = boosted && key === boosted && boostWeight > 0 ? boostWeight : weightOf(meta.stats, key);
    return weight * substatScale(key);
  };
}

// ── The optimal relic ───────────────────────────────────────────────

const SORTED_CACHE = new WeakMap<ScoringMeta, [HsrStatKey, number][]>();

function sortedSubstats(meta: ScoringMeta): [HsrStatKey, number][] {
  let sorted = SORTED_CACHE.get(meta);
  if (!sorted) {
    sorted = SUBSTATS.map((key) => [key, weightOf(meta.stats, key)] as [HsrStatKey, number]).sort(
      (a, b) => b[1] - a[1],
    );
    SORTED_CACHE.set(meta, sorted);
  }
  return sorted;
}

/**
 * Which main stat the optimal relic for this slot would carry, so that stat
 * can be removed from the substat pool. If the actual main stat is ideal, or
 * carries full weight, it is kept. Otherwise the best-weighted main stat the
 * slot can roll is chosen, preferring ideal ones and ones that cannot also be
 * substats (choosing those does not shrink the pool). Same tiebreaks as
 * Fribbels' resolveOptimalMainstat.
 */
function resolveOptimalMainStat(slot: HsrSlot, mainKey: HsrStatKey, meta: ScoringMeta): HsrStatKey {
  if (!isSelectable(slot)) return mainKey;
  const ideal = idealMainStats(slot, meta);
  if (ideal.includes(mainKey) || weightOf(meta.stats, mainKey) === 1) return mainKey;

  const candidates = PARTS_MAIN_STATS[slot]
    .map((key) => [key, ideal.includes(key) || weightOf(meta.stats, key) === 1 ? 1 : weightOf(meta.stats, key)] as const)
    .sort((a, b) => b[1] - a[1]);

  const topWeight = candidates[0][1];
  let chosen = candidates[0][0];
  let chosenIdeal = ideal.includes(chosen);
  let chosenIsSubstat = SUBSTATS.includes(chosen);
  for (const [key, weight] of candidates) {
    if (weight !== topWeight) break;
    const isIdeal = ideal.includes(key);
    const isSubstat = SUBSTATS.includes(key);
    if (chosenIdeal && !isIdeal) continue;
    if (!chosenIsSubstat && isSubstat) continue;
    if (chosenIdeal === isIdeal && chosenIsSubstat === isSubstat) continue;
    chosen = key;
    chosenIdeal = isIdeal;
    chosenIsSubstat = isSubstat;
  }
  return chosen;
}

/**
 * The best a relic in this slot could score, in the same units as the raw
 * score. A relic holds four distinct substats and nine rolls, so the ceiling
 * is one max roll on each of the four best stats plus the five upgrades all
 * on the best of them: 6 x best + second + third + fourth. The main stat is
 * excluded from the pool, since a stat cannot be both.
 *
 * Two special cases follow Fribbels: a character with a single weighted stat
 * can only ever put six rolls on it, and a character whose only two stats
 * are a flat/percent pair (HP and HP%) is treated the same way.
 * Returns Infinity when no relic could score anything.
 */
export function optimalScore(slot: HsrSlot, mainKey: HsrStatKey, meta: ScoringMeta): number {
  const sorted = sortedSubstats(meta);
  if (sorted[0][1] === 0) return Infinity;

  const high = (key: HsrStatKey, contribution: (k: HsrStatKey) => number) => contribution(key) * HIGH_ROLL[key];

  const pair = (a: HsrStatKey, b: HsrStatKey) =>
    (sorted[0][0] === a && sorted[1][0] === b) || (sorted[0][0] === b && sorted[1][0] === a);
  const flatPercentPair =
    sorted[2][1] === 0 &&
    sorted[1][1] > 0 &&
    (pair("HPDelta", "HPAddedRatio") || pair("AttackDelta", "AttackAddedRatio") || pair("DefenceDelta", "DefenceAddedRatio"));

  if (sorted[1][1] === 0) {
    // Single weighted stat.
    const only = sorted[0][0];
    if (only === mainKey) return Infinity;
    return 6 * high(only, contributionFor(meta, mainKey));
  }

  if (flatPercentPair) {
    const contribution = contributionFor(meta, mainKey);
    const [first, second] = [sorted[0][0], sorted[1][0]];
    const firstBlocked = first === mainKey;
    const secondBlocked = second === mainKey;
    if (firstBlocked && secondBlocked) return Infinity;
    if (firstBlocked) return 6 * high(second, contribution);
    if (secondBlocked) return 6 * high(first, contribution);
    return 6 * high(first, contribution) + high(second, contribution);
  }

  const optimalMain = resolveOptimalMainStat(slot, mainKey, meta);
  const contribution = contributionFor(meta, optimalMain);
  const effective = sorted
    .filter(([key]) => key !== optimalMain)
    .map(([key]) => high(key, contribution))
    .sort((a, b) => b - a);
  return 6 * effective[0] + effective[1] + effective[2] + effective[3];
}

// ── Grades ──────────────────────────────────────────────────────────

/**
 * Grade bands on our 0 to 200 scale, where 200 is the optimal relic. This is
 * Fribbels' ladder (one band per 5% of perfection) doubled, which also makes
 * it the ladder the Genshin side uses: S at 100, SS at 120, SSS at 140.
 * Fribbels' AEON band above WTF+ is reserved for relics it has verified
 * in-game, which a showcase cannot do, so WTF+ is the top here as it is
 * there for unverified relics.
 */
export { gradeFor, GRADE_LADDER } from "../lib/gradeLadder";

// ── Per-piece score ─────────────────────────────────────────────────

/**
 * Per-piece potential.
 *
 * Raw score is the sum of every substat's value times its contribution,
 * measured against the optimal relic for the slot. 200 is that optimum
 * exactly, 100 is half of it. A relic whose main stat the character cannot
 * use keeps its percent but gets no letter grade, as on Fribbels: the number
 * still tells you how the substats rolled, the missing grade tells you the
 * piece is not a candidate.
 */
export function scoreRelic(relic: ParsedRelic, meta: ScoringMeta): HsrRelicScore {
  const contribution = contributionFor(meta, relic.mainStat.key);

  let weighted = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;
  for (const sub of relic.substats) {
    weighted += sub.value * contribution(sub.key);
    if (weightOf(meta.stats, sub.key) >= WASTE_THRESHOLD) effectiveRolls += sub.rolls;
    else wastedRolls += sub.rolls;
  }

  const ideal = optimalScore(relic.slot, relic.mainStat.key, meta);
  const potentialPercent = Number.isFinite(ideal) && ideal > 0 ? (weighted / ideal) * 200 : 0;
  const mainStatOk = mainStatWeight(relic.slot, relic.mainStat.key, meta) > 0;
  const gradable = relic.rarity === 5 && mainStatOk && potentialPercent > 0;

  return {
    potentialPercent: Math.round(potentialPercent * 10) / 10,
    grade: gradable ? gradeFor(potentialPercent) : null,
    mainStatOk,
    weighted,
    ideal,
    effectiveRolls,
    wastedRolls,
  };
}

// ── Build diagnostics ───────────────────────────────────────────────

/** CRIT DMG per point of CRIT Rate. Roughly 2.0 is the balanced target. */
function critRatio(totals: Map<HsrStatKey, { rolls: number; value: number }>): number | null {
  const cr = totals.get("CriticalChanceBase")?.value ?? 0;
  const cd = totals.get("CriticalDamageBase")?.value ?? 0;
  if (cr <= 0) return null;
  return cd / cr;
}

const SLOT_COUNT = 6;

function buildDiagnostics(relics: HsrRelic[], meta: ScoringMeta): BuildDiagnostics {
  const totals = new Map<HsrStatKey, { rolls: number; value: number }>();
  const waste: { slot: HsrSlot; key: HsrStatKey; rolls: number }[] = [];
  const setCounts = new Map<number, { name: string; pieces: number }>();

  let totalRolls = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;
  let percentSum = 0;

  for (const relic of relics) {
    totalRolls += relic.totalRolls;
    effectiveRolls += relic.score.effectiveRolls;
    wastedRolls += relic.score.wastedRolls;
    percentSum += relic.score.potentialPercent;

    const set = setCounts.get(relic.setId) ?? { name: relic.setName, pieces: 0 };
    set.pieces += 1;
    setCounts.set(relic.setId, set);

    for (const sub of relic.substats) {
      const entry = totals.get(sub.key) ?? { rolls: 0, value: 0 };
      entry.rolls += sub.rolls;
      entry.value += sub.value;
      totals.set(sub.key, entry);
      if (weightOf(meta.stats, sub.key) < WASTE_THRESHOLD) {
        waste.push({ slot: relic.slot, key: sub.key, rolls: sub.rolls });
      }
    }
  }

  waste.sort((a, b) => b.rolls - a.rolls);

  // The build score is the mean of the six slots, an empty slot counting as
  // zero. That is Fribbels' character score, so a 131% build here is the same
  // kind of number as a 131% relic and as the figure on their showcase.
  const score = percentSum / SLOT_COUNT;

  return {
    score: Math.round(score * 10) / 10,
    grade: gradeFor(score),
    totalRolls,
    effectiveRolls,
    wastedRolls,
    efficiency: Math.round((effectiveRolls / BENCHMARK_ROLLS) * 1000) / 10,
    waste,
    totals: [...totals.entries()]
      .map(([key, v]) => ({ key, rolls: v.rolls, value: Math.round(v.value * 10) / 10 }))
      .sort((a, b) => b.rolls - a.rolls),
    critRatio: critRatio(totals),
    sets: [...setCounts.entries()]
      .map(([setId, v]) => ({ setId, name: v.name, pieces: v.pieces }))
      .filter((s) => s.pieces >= 2)
      .sort((a, b) => b.pieces - a.pieces),
  };
}

/** Scores every relic on a character, then derives the aggregate view. */
export function scoreCharacter(parsed: ParsedCharacter): HsrCharacter {
  const meta = getScoringMeta(parsed.avatarId);
  const relics: HsrRelic[] = parsed.relics.map((r) => {
    const score = scoreRelic(r, meta);
    const scored = { ...r, score } as HsrRelic;
    scored.reroll = adviseReroll(scored, meta, {
      contribution: contributionFor(meta, r.mainStat.key),
      ideal: score.ideal,
    });
    return scored;
  });

  const diagnostics = buildDiagnostics(relics, meta);
  return {
    ...parsed,
    relics,
    stats: computeStats({
      avatarId: parsed.avatarId,
      element: parsed.element,
      level: parsed.level,
      promotion: parsed.promotion,
      traceNodes: parsed.traceNodes,
      lightCone: parsed.lightCone,
      relics,
      sets: diagnostics.sets,
    }),
    diagnostics,
  };
}
