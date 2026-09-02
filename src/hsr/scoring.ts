/**
 * Scoring for Honkai: Star Rail relics.
 *
 * Two layers, and the second is the point of the tool:
 *
 *  1. Per-piece potential, the same Fribbels-style weighted score the Genshin
 *     side uses. Answers "did this piece roll well for this character".
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
import { FIXED_MAIN_SLOTS } from "./types";
import type { ParsedCharacter, ParsedRelic } from "./parsing";
import { getMainStatIdeals, getWeights, WASTE_THRESHOLD, weightOf, type HsrWeights } from "./weights";

/**
 * Upgrades in a realistic strong build: 6 relics that mostly started with 4
 * substats. Fribbels' 100% benchmark uses 48, and its 200% ceiling uses 54,
 * so measuring against 48 puts our efficiency figure on the same footing as
 * the DPS score people are used to seeing.
 */
export const BENCHMARK_ROLLS = 48;
/** Six relics at 9 upgrades each: the most a build can physically hold. */
export const MAX_ROLLS = 54;

/** Grade bands over the 0-200 potential scale, mirroring the Genshin ladder. */
const GRADES: [number, string][] = [
  [180, "SS"],
  [160, "S+"],
  [140, "S"],
  [120, "A+"],
  [100, "A"],
  [80, "B+"],
  [60, "B"],
  [40, "C"],
  [0, "D"],
];

export function gradeFor(percent: number): string {
  for (const [floor, label] of GRADES) if (percent >= floor) return label;
  return "D";
}

/**
 * Per-piece potential.
 *
 * Unlike Genshin, roll counts are stated rather than inferred, so the score is
 * built directly from (rolls x weight x quality). A piece scores 100 when its
 * upgrades all landed on fully-weighted stats at average quality, and 200 when
 * they all landed on max-weight stats at max quality.
 */
function scoreRelic(relic: ParsedRelic, weights: HsrWeights, avatarId: number): HsrRelicScore {
  // Weighted value of this piece's rolls, kept on the score so the build
  // total is the same arithmetic aggregated rather than an average of
  // averages (which would weight an 8-roll piece like a 9-roll one).
  let weighted = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;

  for (const sub of relic.substats) {
    const w = weightOf(weights, sub.key);
    weighted += sub.rolls * w * sub.quality;
    if (w >= WASTE_THRESHOLD) effectiveRolls += sub.rolls;
    else wastedRolls += sub.rolls;
  }

  // Ideal: every upgrade on the best-weighted stat, at max quality.
  const maxWeight = Math.max(...Object.values(weights), 0.0001);
  const ideal = relic.totalRolls * maxWeight;
  const potentialPercent = ideal > 0 ? (weighted / ideal) * 200 : 0;

  const ideals = getMainStatIdeals(avatarId, relic.slot);
  const mainStatFits =
    FIXED_MAIN_SLOTS.includes(relic.slot) || !ideals || ideals.includes(relic.mainStat.key);

  return {
    potentialPercent: Math.round(potentialPercent * 10) / 10,
    grade: gradeFor(potentialPercent),
    weighted,
    effectiveRolls,
    wastedRolls,
    mainStatFits,
  };
}

/** CRIT DMG per point of CRIT Rate. Roughly 2.0 is the balanced target. */
function critRatio(totals: Map<HsrStatKey, { rolls: number; value: number }>): number | null {
  const cr = totals.get("CriticalChanceBase")?.value ?? 0;
  const cd = totals.get("CriticalDamageBase")?.value ?? 0;
  if (cr <= 0) return null;
  return cd / cr;
}

function buildDiagnostics(relics: HsrRelic[], weights: HsrWeights): BuildDiagnostics {
  const totals = new Map<HsrStatKey, { rolls: number; value: number }>();
  const waste: { slot: HsrSlot; key: HsrStatKey; rolls: number }[] = [];
  const setCounts = new Map<number, { name: string; pieces: number }>();

  let totalRolls = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;
  let weighted = 0;
  const mainStatMisses: HsrSlot[] = [];

  for (const relic of relics) {
    totalRolls += relic.totalRolls;
    effectiveRolls += relic.score.effectiveRolls;
    wastedRolls += relic.score.wastedRolls;
    weighted += relic.score.weighted;
    if (!relic.score.mainStatFits) mainStatMisses.push(relic.slot);

    const set = setCounts.get(relic.setId) ?? { name: relic.setName, pieces: 0 };
    set.pieces += 1;
    setCounts.set(relic.setId, set);

    for (const sub of relic.substats) {
      const entry = totals.get(sub.key) ?? { rolls: 0, value: 0 };
      entry.rolls += sub.rolls;
      entry.value += sub.value;
      totals.set(sub.key, entry);
      if (weightOf(weights, sub.key) < WASTE_THRESHOLD) {
        waste.push({ slot: relic.slot, key: sub.key, rolls: sub.rolls });
      }
    }
  }

  waste.sort((a, b) => b.rolls - a.rolls);

  // Same construction as the per-piece score, applied to every roll on the
  // build: 100 is a solid build, 200 is every upgrade on the best stat at max
  // quality. Keeping one scale across the page means a 147% relic and a 131%
  // build mean the same kind of thing.
  const maxWeight = Math.max(...Object.values(weights), 0.0001);
  const score = totalRolls > 0 ? (weighted / (totalRolls * maxWeight)) * 200 : 0;

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
    mainStatMisses,
    sets: [...setCounts.entries()]
      .map(([setId, v]) => ({ setId, name: v.name, pieces: v.pieces }))
      .filter((s) => s.pieces >= 2)
      .sort((a, b) => b.pieces - a.pieces),
  };
}

/** Scores every relic on a character, then derives the aggregate view. */
export function scoreCharacter(parsed: ParsedCharacter): HsrCharacter {
  const weights = getWeights(parsed.avatarId);
  const relics: HsrRelic[] = parsed.relics.map((r) => ({
    ...r,
    score: scoreRelic(r, weights, parsed.avatarId),
  }));

  return {
    ...parsed,
    relics,
    diagnostics: buildDiagnostics(relics, weights),
  };
}
