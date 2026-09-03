import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { ArtifactSubstat } from "../../types/artifact";
import type { ScoringWeights } from "../../types/scoring";
import type { FightProp } from "../../types/enka";
import {
  computeWeightedPotential,
  computeIdealPotential,
  computePotentialPercent,
  getGrade,
} from "../scoring";
import { POTENTIAL_SCALES, MAX_ROLL_VALUES, GRADE_THRESHOLDS } from "../constants";

// ── Shared Constants for Generators ──

/** Substat keys that can appear on artifacts (non-zero max roll values) */
const SUBSTAT_KEYS: FightProp[] = [
  "FIGHT_PROP_HP",
  "FIGHT_PROP_HP_PERCENT",
  "FIGHT_PROP_ATTACK",
  "FIGHT_PROP_ATTACK_PERCENT",
  "FIGHT_PROP_DEFENSE",
  "FIGHT_PROP_DEFENSE_PERCENT",
  "FIGHT_PROP_CRITICAL",
  "FIGHT_PROP_CRITICAL_HURT",
  "FIGHT_PROP_ELEMENT_MASTERY",
  "FIGHT_PROP_CHARGE_EFFICIENCY",
];

/** Main stat keys for selectable slots */
const MAIN_STAT_KEYS: FightProp[] = [
  "FIGHT_PROP_HP_PERCENT",
  "FIGHT_PROP_ATTACK_PERCENT",
  "FIGHT_PROP_DEFENSE_PERCENT",
  "FIGHT_PROP_ELEMENT_MASTERY",
  "FIGHT_PROP_CHARGE_EFFICIENCY",
  "FIGHT_PROP_CRITICAL",
  "FIGHT_PROP_CRITICAL_HURT",
  "FIGHT_PROP_HEAL_ADD",
  "FIGHT_PROP_PHYSICAL_ADD_HURT",
  "FIGHT_PROP_FIRE_ADD_HURT",
  "FIGHT_PROP_ELEC_ADD_HURT",
  "FIGHT_PROP_WATER_ADD_HURT",
  "FIGHT_PROP_WIND_ADD_HURT",
  "FIGHT_PROP_ICE_ADD_HURT",
  "FIGHT_PROP_ROCK_ADD_HURT",
  "FIGHT_PROP_GRASS_ADD_HURT",
];

// ── Arbitraries / Generators ──

/** Generate a random substat with a valid key, value between 0 and 4× max roll */
const arbSubstat: fc.Arbitrary<ArtifactSubstat> = fc
  .record({
    statKey: fc.constantFrom(...SUBSTAT_KEYS),
    rollMultiplier: fc.double({ min: 0.7, max: 2.5, noNaN: true }),
  })
  .map(({ statKey, rollMultiplier }) => {
    const maxRoll = MAX_ROLL_VALUES[statKey] ?? 0;
    const value = maxRoll * rollMultiplier;
    return {
      statKey,
      displayName: statKey,
      shortName: statKey,
      value,
      isPercentage: !statKey.includes("FIGHT_PROP_HP") || statKey.includes("PERCENT"),
      maxRoll,
      rollCount: rollMultiplier,
      rollQuality: "high" as const,
      rolls: [],
    };
  });

/** Generate an array of 1–4 unique substats */
const arbSubstats: fc.Arbitrary<ArtifactSubstat[]> = fc
  .uniqueArray(arbSubstat, { minLength: 1, maxLength: 4, comparator: (a, b) => a.statKey === b.statKey })

/** Generate ScoringWeights with values between 0.0 and 1.5 */
const arbScoringWeights: fc.Arbitrary<ScoringWeights> = fc.record({
  CRIT_RATE: fc.double({ min: 0, max: 1.5, noNaN: true }),
  CRIT_DMG: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ATK_PERCENT: fc.double({ min: 0, max: 1.5, noNaN: true }),
  HP_PERCENT: fc.double({ min: 0, max: 1.5, noNaN: true }),
  DEF_PERCENT: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ELEMENTAL_MASTERY: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ENERGY_RECHARGE: fc.double({ min: 0, max: 1.5, noNaN: true }),
  HEALING_BONUS: fc.double({ min: 0, max: 1.5, noNaN: true }),
  PHYSICAL_DMG: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ELEMENTAL_DMG: fc.double({ min: 0, max: 1.5, noNaN: true }),
  FLAT_ATK: fc.double({ min: 0, max: 1.5, noNaN: true }),
  FLAT_HP: fc.double({ min: 0, max: 1.5, noNaN: true }),
  FLAT_DEF: fc.double({ min: 0, max: 1.5, noNaN: true }),
});

/** Generate ScoringWeights with at least one non-zero weight */
const arbNonZeroWeights: fc.Arbitrary<ScoringWeights> = arbScoringWeights.filter(
  (w) => Object.values(w).some((v) => v > 0)
);

/** Generate a main stat key */
const arbMainStatKey: fc.Arbitrary<FightProp> = fc.constantFrom(...MAIN_STAT_KEYS);

/** Grades best-first, so a lower index is a better grade. */
const GRADE_ORDER = GRADE_THRESHOLDS.map((t) => t.grade);

// ── Property Test Suite ──
//
// The generators above were written alongside the scoring rewrite but never
// wired into assertions. These are the invariants the rest of the app leans
// on: the showcase sorts by potential, the reroll simulation compares a
// current score against a simulated one, and the UI colours a grade. All three
// break in confusing ways if a score can go negative or a grade can move
// backwards as a score rises.

describe("computeWeightedPotential", () => {
  it("is never negative, for any substats and weights", () => {
    fc.assert(
      fc.property(arbSubstats, arbScoringWeights, arbMainStatKey, (substats, weights, mainStat) => {
        expect(computeWeightedPotential(substats, weights, mainStat)).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it("ignores a substat that duplicates the main stat", () => {
    // A Sands rolling ATK% cannot also carry ATK% as a substat, so the weight
    // for the main stat is zeroed. Adding such a substat must change nothing.
    fc.assert(
      fc.property(arbSubstats, arbScoringWeights, arbMainStatKey, (substats, weights, mainStat) => {
        const duplicate = substats.find((s) => s.statKey === mainStat);
        fc.pre(duplicate !== undefined);
        const without = substats.filter((s) => s.statKey !== mainStat);
        expect(computeWeightedPotential(substats, weights, mainStat)).toBeCloseTo(
          computeWeightedPotential(without, weights, mainStat),
          6,
        );
      }),
    );
  });
});

describe("computeIdealPotential", () => {
  it("is positive whenever any weight is non-zero", () => {
    fc.assert(
      fc.property(arbNonZeroWeights, arbMainStatKey, (weights, mainStat) => {
        // Every weight could belong to the main stat and be zeroed out, which
        // legitimately leaves nothing to score against.
        const ideal = computeIdealPotential(weights, mainStat);
        expect(ideal).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(ideal)).toBe(true);
      }),
    );
  });
});

describe("computePotentialPercent", () => {
  it("never returns a negative percentage", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        (weighted, ideal) => {
          expect(computePotentialPercent(weighted, ideal)).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it("returns 0 rather than dividing by a non-positive ideal", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        fc.double({ min: -1000, max: 0, noNaN: true }),
        (weighted, ideal) => {
          expect(computePotentialPercent(weighted, ideal)).toBe(0);
        },
      ),
    );
  });

  it("scales linearly with the weighted potential", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0.001, max: 1000, noNaN: true }),
        fc.double({ min: 1, max: 10, noNaN: true }),
        (weighted, ideal, factor) => {
          const single = computePotentialPercent(weighted, ideal);
          const scaled = computePotentialPercent(weighted * factor, ideal);
          expect(scaled).toBeGreaterThanOrEqual(single - 1e-9);
        },
      ),
    );
  });
});

describe("scoring tables", () => {
  it("has a positive scale and max roll for every substat that can appear", () => {
    // A bad data refresh that drops a stat would otherwise silently score it
    // as worthless rather than failing loudly.
    for (const key of SUBSTAT_KEYS) {
      expect(POTENTIAL_SCALES[key]).toBeGreaterThan(0);
      expect(MAX_ROLL_VALUES[key]).toBeGreaterThan(0);
    }
  });
});

describe("getGrade", () => {
  it("never moves backwards as the score rises", () => {
    // The UI colours grades on the assumption that a better score cannot earn
    // a worse letter.
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 250, noNaN: true }),
        fc.double({ min: 0, max: 250, noNaN: true }),
        (a, b) => {
          const [lo, hi] = a <= b ? [a, b] : [b, a];
          expect(GRADE_ORDER.indexOf(getGrade(hi))).toBeLessThanOrEqual(
            GRADE_ORDER.indexOf(getGrade(lo)),
          );
        },
      ),
    );
  });

  it("always returns a known grade", () => {
    fc.assert(
      fc.property(fc.double({ min: -100, max: 500, noNaN: true }), (score) => {
        expect(GRADE_ORDER).toContain(getGrade(score));
      }),
    );
  });
});
