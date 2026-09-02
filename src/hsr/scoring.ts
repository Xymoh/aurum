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
import type { ParsedCharacter, ParsedRelic } from "./parsing";
import { getWeights, WASTE_THRESHOLD, weightOf, type HsrWeights } from "./weights";
import { adviseReroll } from "./reroll";

/**
 * Upgrades in a realistic strong build: 6 relics that mostly started with 4
 * substats. Fribbels' 100% benchmark uses 48, and its 200% ceiling uses 54,
 * so measuring against 48 puts our efficiency figure on the same footing as
 * the DPS score people are used to seeing.
 */
export const BENCHMARK_ROLLS = 48;
/** Six relics at 9 upgrades each: the most a build can physically hold. */
export const MAX_ROLLS = 54;

/**
 * Grade bands, matching the ladder Fribbels' optimizer uses for Star Rail.
 *
 * Deliberately not the Genshin ladder in ../lib/constants.ts: that one is
 * evenly spaced in tens, while this is dense between 45 and 130 and then opens
 * up, because that is where real builds actually land. Sharing our own numbers
 * would mean the same relic reads two grades apart depending on which tab you
 * opened, and Star Rail players already read builds on this scale.
 */
const GRADES: [number, string][] = [
  [200, "AEON"],
  [150, "WTF+"],
  [140, "WTF"],
  [130, "SSS+"],
  [121, "SSS"],
  [113, "SS+"],
  [106, "SS"],
  [100, "S+"],
  [95, "S"],
  [90, "A+"],
  [85, "A"],
  [80, "B+"],
  [75, "B"],
  [70, "C+"],
  [65, "C"],
  [60, "D+"],
  [55, "D"],
  [50, "F+"],
  [0, "F"],
];

export function gradeFor(percent: number): string {
  for (const [floor, label] of GRADES) if (percent >= floor) return label;
  return "F";
}

/** Every band, best first, for legends and colour maps. */
export const GRADE_LADDER = GRADES.map(([min, grade]) => ({ min, grade }));

/**
 * The best a relic of this size could realistically be for this character.
 *
 * A relic carries four DISTINCT substats, so the ceiling is not "every roll on
 * the single best stat" - that piece cannot exist. It is the four best-weighted
 * stats occupying the four slots, with every remaining upgrade landing on the
 * best of them.
 *
 * Using rolls x maxWeight instead, as this did originally, punishes characters
 * whose weights fall away after their top stat. A damage dealer with CRIT Rate
 * and CRIT DMG both at 1.0 sits near the ceiling on two stats; a support whose
 * profile runs 1.0 then 0.85 then 0.85 then 0.3 cannot approach it at all, and
 * scored 20 points lower for a build of the same quality.
 */
function idealFor(weights: HsrWeights, totalRolls: number): number {
  const sorted = Object.values(weights)
    .filter((w) => w > 0)
    .sort((a, b) => b - a);
  if (sorted.length === 0) return 0;

  // Four slots, padded when a character has fewer than four stats worth having.
  const topFour = [0, 1, 2, 3].map((i) => sorted[i] ?? 0);
  const sumTopFour = topFour.reduce((a, b) => a + b, 0);
  const maxWeight = topFour[0];
  return sumTopFour + Math.max(0, totalRolls - 4) * maxWeight;
}

/**
 * Per-piece potential.
 *
 * Roll counts are stated rather than inferred, so the score is built directly
 * from (rolls x weight x quality) against the reachable ideal above. 200 is
 * that ideal exactly; 100 is half of it, which is the Fribbels convention the
 * Genshin side also uses.
 */
function scoreRelic(relic: ParsedRelic, weights: HsrWeights): HsrRelicScore {
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

  const ideal = idealFor(weights, relic.totalRolls);
  const potentialPercent = ideal > 0 ? (weighted / ideal) * 200 : 0;

  return {
    potentialPercent: Math.round(potentialPercent * 10) / 10,
    grade: gradeFor(potentialPercent),
    weighted,
    ideal,
    effectiveRolls,
    wastedRolls,
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

  for (const relic of relics) {
    totalRolls += relic.totalRolls;
    effectiveRolls += relic.score.effectiveRolls;
    wastedRolls += relic.score.wastedRolls;
    weighted += relic.score.weighted;

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

  // Same construction as the per-piece score, summed: the build's ceiling is
  // the sum of what each of its six relics could reachably have been. Keeping
  // one scale across the page means a 147% relic and a 131% build mean the
  // same kind of thing.
  const idealTotal = relics.reduce((acc, r) => acc + r.score.ideal, 0);
  const score = idealTotal > 0 ? (weighted / idealTotal) * 200 : 0;

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
  const weights = getWeights(parsed.avatarId);
  const relics: HsrRelic[] = parsed.relics.map((r) => {
    const scored = { ...r, score: scoreRelic(r, weights) } as HsrRelic;
    scored.reroll = adviseReroll(scored, weights);
    return scored;
  });

  return {
    ...parsed,
    relics,
    diagnostics: buildDiagnostics(relics, weights),
  };
}
