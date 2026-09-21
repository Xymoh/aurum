/**
 * Scoring for Zenless Zone Zero drive discs.
 *
 * The same construction as the Star Rail scorer, which is Fribbels' relic
 * score: every substat is normalised so one roll of anything is worth the
 * same, weighted for the agent, and measured against the optimal disc for
 * the slot. ZZZ makes it simpler still, because a roll is a fixed amount:
 * there is no roll quality, so the only luck in a disc is which stats the
 * rolls landed on.
 */

import type {
  ZzzAgent,
  ZzzBuildDiagnostics,
  ZzzDisc,
  ZzzDiscScore,
  ZzzSlot,
  ZzzStatId,
  ZzzStats,
  SelectableZzzSlot,
} from "./types";
import type { ParsedAgent, ParsedDiscInput } from "./parsing";
import { getScoringMeta, PERCENT_TO_FLAT, WASTE_THRESHOLD, weightOf, type ZzzScoringMeta } from "./weights";
import { gradeFor } from "../lib/gradeLadder";
import { computeZzzStats } from "./stats";

export { gradeFor, GRADE_LADDER } from "../lib/gradeLadder";

/** Six discs at nine rolls each: the most a build can physically hold. */
export const MAX_ROLLS = 54;
/** Rolls in a realistic strong build: six discs that mostly started with four substats. */
export const BENCHMARK_ROLLS = 48;

// ── Substats ────────────────────────────────────────────────────────

/**
 * The ten stats a disc can roll as substats, with the fixed value of one roll
 * in display units. Read off live Enka data (PropertyValue is constant for a
 * stat whatever the roll count) and matching the in-game values.
 */
export const ROLL_VALUE: Record<number, number> = {
  11102: 3.0, // HP%
  12102: 3.0, // ATK%
  13102: 4.8, // DEF%
  11103: 112, // HP
  12103: 19, // ATK
  13103: 15, // DEF
  20103: 2.4, // CRIT Rate
  21103: 4.8, // CRIT DMG
  23203: 9, // PEN
  31203: 9, // Anomaly Proficiency
};

export const SUBSTATS: ZzzStatId[] = Object.keys(ROLL_VALUE).map(Number);

/** CRIT DMG's roll, the unit every other substat is expressed in. */
const CD_ROLL = ROLL_VALUE[21103];

/** How many CRIT DMG points one point of a stat is worth, so one roll of anything scores 4.8. */
export function substatScale(id: ZzzStatId): number {
  const roll = ROLL_VALUE[id];
  return roll ? CD_ROLL / roll : 0;
}

// ── Main stats ──────────────────────────────────────────────────────

/**
 * What each selectable slot can roll as its main stat. Ids follow Enka's
 * convention of xx01 for a base value, xx02 for a percentage and xx03 for a
 * flat bonus, so the Impact main on disc 6 is 12202 (BreakStun as a percent),
 * not 12201, which is the agent's own base Impact.
 */
export const SLOT_MAIN_STATS: Record<SelectableZzzSlot, ZzzStatId[]> = {
  4: [11102, 12102, 13102, 20103, 21103, 31203],
  5: [11102, 12102, 13102, 23103, 31503, 31603, 31703, 31803, 31903, 32303],
  6: [11102, 12102, 13102, 31402, 12202, 30502],
};

/** Fixed mains: HP on disc 1, ATK on disc 2, DEF on disc 3. */
const FIXED_MAIN: Partial<Record<ZzzSlot, ZzzStatId>> = { 1: 11103, 2: 12103, 3: 13103 };

function isSelectable(slot: ZzzSlot): slot is SelectableZzzSlot {
  return slot >= 4;
}

function idealMainStats(slot: SelectableZzzSlot, meta: ZzzScoringMeta): ZzzStatId[] {
  const listed = meta.parts[slot];
  return listed.length > 0 ? listed : SLOT_MAIN_STATS[slot];
}

/**
 * How acceptable a main stat is: 1 for an ideal one, otherwise its weight as
 * a substat (an ATK% disc 6 on an agent who wants ATK% substats is fine),
 * otherwise 0. Discs 1 to 3 cannot be wrong.
 */
export function mainStatWeight(slot: ZzzSlot, mainId: ZzzStatId, meta: ZzzScoringMeta): number {
  if (!isSelectable(slot)) return 1;
  if (idealMainStats(slot, meta).includes(mainId)) return 1;
  return weightOf(meta.stats, mainId);
}

// ── Contributions and the optimal disc ──────────────────────────────

export function contributionFor(meta: ZzzScoringMeta): (id: ZzzStatId) => number {
  return (id) => weightOf(meta.stats, id) * substatScale(id);
}

const SORTED_CACHE = new WeakMap<ZzzScoringMeta, [ZzzStatId, number][]>();

function sortedSubstats(meta: ZzzScoringMeta): [ZzzStatId, number][] {
  let sorted = SORTED_CACHE.get(meta);
  if (!sorted) {
    sorted = SUBSTATS.map((id) => [id, weightOf(meta.stats, id)] as [ZzzStatId, number]).sort((a, b) => b[1] - a[1]);
    SORTED_CACHE.set(meta, sorted);
  }
  return sorted;
}

/**
 * Which main stat the optimal disc for this slot would carry, so that stat
 * can be removed from the substat pool. The actual main is kept when it is
 * ideal or carries full weight; otherwise the best-weighted main the slot
 * can roll, preferring ideal ones and ones that cannot also be substats.
 */
function resolveOptimalMain(slot: ZzzSlot, mainId: ZzzStatId, meta: ZzzScoringMeta): ZzzStatId {
  if (!isSelectable(slot)) return FIXED_MAIN[slot] ?? mainId;
  const ideal = idealMainStats(slot, meta);
  if (ideal.includes(mainId) || weightOf(meta.stats, mainId) === 1) return mainId;

  const candidates = SLOT_MAIN_STATS[slot]
    .map((id) => [id, ideal.includes(id) || weightOf(meta.stats, id) === 1 ? 1 : weightOf(meta.stats, id)] as const)
    .sort((a, b) => b[1] - a[1]);
  const topWeight = candidates[0][1];
  let chosen = candidates[0][0];
  let chosenIdeal = ideal.includes(chosen);
  let chosenIsSubstat = SUBSTATS.includes(chosen);
  for (const [id, weight] of candidates) {
    if (weight !== topWeight) break;
    const isIdeal = ideal.includes(id);
    const isSubstat = SUBSTATS.includes(id);
    if (chosenIdeal && !isIdeal) continue;
    if (!chosenIsSubstat && isSubstat) continue;
    if (chosenIdeal === isIdeal && chosenIsSubstat === isSubstat) continue;
    chosen = id;
    chosenIdeal = isIdeal;
    chosenIsSubstat = isSubstat;
  }
  return chosen;
}

/**
 * The best a disc in this slot could score. A disc holds four distinct
 * substats and nine rolls, so the ceiling is one roll on each of the four
 * best stats plus the five upgrades all on the best of them: 6 x best +
 * second + third + fourth, with the main stat removed from the pool.
 * Returns Infinity when no disc could score anything.
 */
export function optimalScore(slot: ZzzSlot, mainId: ZzzStatId, meta: ZzzScoringMeta): number {
  const sorted = sortedSubstats(meta);
  if (sorted[0][1] === 0) return Infinity;
  const contribution = contributionFor(meta);
  const roll = (id: ZzzStatId) => contribution(id) * ROLL_VALUE[id];

  const pair = (a: ZzzStatId, b: ZzzStatId) =>
    (sorted[0][0] === a && sorted[1][0] === b) || (sorted[0][0] === b && sorted[1][0] === a);
  const flatPercentPair =
    sorted[2][1] === 0 &&
    sorted[1][1] > 0 &&
    Object.entries(PERCENT_TO_FLAT).some(([pct, flat]) => pair(Number(pct), flat));

  if (sorted[1][1] === 0) {
    const only = sorted[0][0];
    return only === mainId ? Infinity : 6 * roll(only);
  }
  if (flatPercentPair) {
    const [first, second] = [sorted[0][0], sorted[1][0]];
    if (first === mainId && second === mainId) return Infinity;
    if (first === mainId) return 6 * roll(second);
    if (second === mainId) return 6 * roll(first);
    return 6 * roll(first) + roll(second);
  }

  const optimalMain = resolveOptimalMain(slot, mainId, meta);
  const effective = sorted
    .filter(([id]) => id !== optimalMain)
    .map(([id]) => roll(id))
    .sort((a, b) => b - a);
  return 6 * effective[0] + effective[1] + effective[2] + effective[3];
}

// ── Per-piece score ─────────────────────────────────────────────────

export function scoreDisc(disc: ParsedDiscInput, meta: ZzzScoringMeta): ZzzDiscScore {
  const contribution = contributionFor(meta);
  let weighted = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;
  for (const sub of disc.substats) {
    weighted += sub.value * contribution(sub.id);
    if (weightOf(meta.stats, sub.id) >= WASTE_THRESHOLD) effectiveRolls += sub.rolls;
    else wastedRolls += sub.rolls;
  }

  const ideal = optimalScore(disc.slot, disc.mainStat.id, meta);
  const potentialPercent = Number.isFinite(ideal) && ideal > 0 ? (weighted / ideal) * 200 : 0;
  const mainStatOk = mainStatWeight(disc.slot, disc.mainStat.id, meta) > 0;
  const gradable = mainStatOk && potentialPercent > 0;

  return {
    potentialPercent: Math.round(potentialPercent * 10) / 10,
    // Graded from the whole percent the card shows, so number and letter
    // cannot land on opposite sides of a band edge.
    grade: gradable ? gradeFor(Math.round(potentialPercent)) : null,
    mainStatOk,
    weighted,
    ideal,
    effectiveRolls,
    wastedRolls,
  };
}

// ── Build diagnostics ───────────────────────────────────────────────

export const SLOT_COUNT = 6;

/** Set pieces worn, largest set first, ignoring lone pieces. */
export function countSets(discs: ZzzDisc[]): ZzzBuildDiagnostics["sets"] {
  const setCounts = new Map<number, { name: string; pieces: number }>();
  for (const disc of discs) {
    const set = setCounts.get(disc.setId) ?? { name: disc.setName, pieces: 0 };
    set.pieces += 1;
    setCounts.set(disc.setId, set);
  }
  return [...setCounts.entries()]
    .map(([setId, v]) => ({ setId, name: v.name, pieces: v.pieces }))
    .filter((s) => s.pieces >= 2)
    .sort((a, b) => b.pieces - a.pieces);
}

/**
 * Which final stat a guide's "until N" cap is measured on. Prydwen states
 * caps as stat-screen figures (CRIT Rate 80%, ATK 3000), never as sums of
 * disc rolls, so the build's total is what gets compared.
 */
const THRESHOLD_STAT: Record<number, { key: keyof ZzzStats; percent: boolean }> = {
  11101: { key: "hp", percent: false },
  11102: { key: "hp", percent: false },
  11103: { key: "hp", percent: false },
  12101: { key: "atk", percent: false },
  12102: { key: "atk", percent: false },
  12103: { key: "atk", percent: false },
  13101: { key: "def", percent: false },
  13102: { key: "def", percent: false },
  13103: { key: "def", percent: false },
  20103: { key: "critRate", percent: true },
  21103: { key: "critDmg", percent: true },
  23103: { key: "penRatio", percent: true },
  23203: { key: "pen", percent: false },
  31203: { key: "anomalyProficiency", percent: false },
  31402: { key: "anomalyMastery", percent: false },
  12202: { key: "impact", percent: false },
  30502: { key: "energyRegen", percent: false },
};

function thresholdsAgainst(meta: ZzzScoringMeta, stats: ZzzStats): ZzzBuildDiagnostics["thresholds"] {
  const seen = new Set<keyof ZzzStats>();
  const out: ZzzBuildDiagnostics["thresholds"] = [];
  for (const [id, target] of Object.entries(meta.thresholds)) {
    const stat = THRESHOLD_STAT[Number(id)];
    if (!stat || seen.has(stat.key)) continue;
    seen.add(stat.key);
    out.push({
      id: Number(id),
      target,
      current: Math.round(stats[stat.key] * 10) / 10,
      percent: stat.percent,
    });
  }
  return out;
}

function buildDiagnostics(discs: ZzzDisc[], meta: ZzzScoringMeta, stats: ZzzStats): ZzzBuildDiagnostics {
  const totals = new Map<ZzzStatId, { rolls: number; value: number }>();
  const waste: ZzzBuildDiagnostics["waste"] = [];
  let totalRolls = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;
  let percentSum = 0;

  for (const disc of discs) {
    totalRolls += disc.totalRolls;
    effectiveRolls += disc.score.effectiveRolls;
    wastedRolls += disc.score.wastedRolls;
    percentSum += disc.score.potentialPercent;

    for (const sub of disc.substats) {
      const entry = totals.get(sub.id) ?? { rolls: 0, value: 0 };
      entry.rolls += sub.rolls;
      entry.value += sub.value;
      totals.set(sub.id, entry);
      if (weightOf(meta.stats, sub.id) < WASTE_THRESHOLD) waste.push({ slot: disc.slot, id: sub.id, rolls: sub.rolls });
    }
  }
  waste.sort((a, b) => b.rolls - a.rolls);

  const score = percentSum / SLOT_COUNT;

  return {
    score: Math.round(score * 10) / 10,
    grade: gradeFor(Math.round(score)),
    complete: discs.length === SLOT_COUNT,
    totalRolls,
    effectiveRolls,
    wastedRolls,
    waste,
    totals: [...totals.entries()]
      .map(([id, v]) => ({ id, rolls: v.rolls, value: Math.round(v.value * 10) / 10 }))
      .sort((a, b) => b.rolls - a.rolls),
    // The build's real ratio, from the stat screen rather than the rolls
    // alone: a CRIT Rate disc 4 or a crit W-Engine is exactly what a player
    // balances their substats against.
    critRatio: stats.critRate > 0 ? stats.critDmg / stats.critRate : null,
    sets: countSets(discs),
    thresholds: thresholdsAgainst(meta, stats),
  };
}

/** Scores every disc on an agent, then derives the aggregate view. */
export function scoreAgent(parsed: ParsedAgent): ZzzAgent {
  const meta = getScoringMeta(parsed.id);
  const discs: ZzzDisc[] = parsed.discs.map((d) => ({ ...d, score: scoreDisc(d, meta) }));
  const stats = computeZzzStats({
    agentId: parsed.id,
    element: parsed.element,
    level: parsed.level,
    promotion: parsed.promotion,
    coreSkill: parsed.coreSkill,
    engine: parsed.engine
      ? { id: parsed.engine.id, level: parsed.engine.level, rank: parsed.engine.breakLevel }
      : null,
    discs,
    sets: countSets(discs),
  });
  return {
    ...parsed,
    discs,
    stats,
    diagnostics: buildDiagnostics(discs, meta, stats),
  };
}
