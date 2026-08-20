import { describe, it, expect } from "vitest";
import { computeRV, computeCV, computeWSE, getGrade, computeIdealPotential } from "../../src/lib/scoring";
import { computeRerollAdvice, chanceWithin, formatChance } from "../../src/lib/reroll";
import { POTENTIAL_SCALES } from "../../src/lib/constants";
import type { Artifact, ArtifactSubstat } from "../../src/types/artifact";
import type { ScoringWeights } from "../../src/types/scoring";

function makeSubstat(
  key: string,
  value: number,
  maxRoll: number,
  rollCount?: number,
): ArtifactSubstat {
  return {
    statKey: key as ArtifactSubstat["statKey"],
    displayName: key,
    shortName: key,
    value,
    isPercentage: true,
    maxRoll,
    rollCount:
      rollCount ?? (maxRoll > 0 ? Math.max(0, Math.round(value / (maxRoll * 0.85)) - 1) : 0),
    rollQuality: "high",
  };
}

describe("computeRV", () => {
  it("returns 100 for a perfect artifact", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2.25, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2.25, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83 * 2.25, 5.83),
      makeSubstat("FIGHT_PROP_CHARGE_EFFICIENCY", 6.48 * 2.25, 6.48),
    ];
    // Each stat = 2.25 rolls, total = 9.0, RV = 9/9 * 100
    const rv = computeRV(substats);
    expect(rv).toBeCloseTo(100, 0);
  });

  it("returns ~65 for the example in the spec", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 7.8, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 15.5, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.3, 5.83),
      makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.0, 23.31),
    ];
    const rv = computeRV(substats);
    // Rolls: 7.8/3.89≈2.0 + 15.5/7.77≈1.99 + 5.3/5.83≈0.91 + 23/23.31≈0.99 = 5.89
    // RV = 5.89/9*100 ≈ 65.4
    expect(rv).toBeCloseTo(65.5, 1);
  });

  it("returns 0 for empty substats", () => {
    expect(computeRV([])).toBe(0);
  });
});

describe("computeCV", () => {
  it("computes CV = CR*2 + CDMG", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 10.0, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 20.0, 7.77),
    ];
    expect(computeCV(substats)).toBeCloseTo(40.0, 1);
  });

  it("returns 0 for no crit substats", () => {
    const substats = [makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 10.0, 5.83)];
    expect(computeCV(substats)).toBe(0);
  });
});

describe("computeWSE", () => {
  it("returns high score for Diluc with perfect crit substats", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2.25, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2.25, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83 * 2.25, 5.83),
      makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.31 * 2.25, 23.31),
    ];
    const wse = computeWSE(substats, 10000016); // Diluc
    // Diluc weights: CR=1.0, CD=1.0, ATK%=0.7, EM=0.5
    // Max possible ≈ 2.25*(1.0+1.0+0.7+0.5) = 2.25*3.2 = 7.2
    // Actual ≈ 2.25*1.0 + 2.25*1.0 + 2.25*0.7 + 2.25*0.5 = 2.25*3.2 = 7.2
    // WSE = 100%
    expect(wse).toBeCloseTo(100, 0);
  });

  it("returns low score for Sucrose with crit substats", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83, 5.83),
      makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.31, 23.31),
    ];
    const wse = computeWSE(substats, 10000043); // Sucrose (only cares about EM)
    // WSE should be very low since CR=0 weight, CD=0 weight, ATK%=0, EM=1.0
    expect(wse).toBeLessThan(50);
  });

  it("uses default weights for unknown character", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83, 5.83),
      makeSubstat("FIGHT_PROP_HP_PERCENT", 10.0, 5.83),
    ];
    // Unknown character: generic weights (CR=1, CD=1, ATK%=0.5, HP%=0)
    const wse = computeWSE(substats, 99999999);
    expect(wse).toBeGreaterThan(0);
    expect(wse).toBeLessThan(100);
  });
});

describe("computeRerollAdvice", () => {
  const CRIT_WEIGHTS: ScoringWeights = {
    CRIT_RATE: 1.0,
    CRIT_DMG: 1.0,
    ATK_PERCENT: 0.7,
    HP_PERCENT: 0,
    DEF_PERCENT: 0,
    ELEMENTAL_MASTERY: 0.5,
    ENERGY_RECHARGE: 0,
    HEALING_BONUS: 0,
    PHYSICAL_DMG: 0,
    ELEMENTAL_DMG: 0,
    FLAT_ATK: 0.1,
    FLAT_HP: 0,
    FLAT_DEF: 0,
  };

  const KEY_MAP: Record<string, keyof ScoringWeights> = {
    FIGHT_PROP_CRITICAL: "CRIT_RATE",
    FIGHT_PROP_CRITICAL_HURT: "CRIT_DMG",
    FIGHT_PROP_ELEMENT_MASTERY: "ELEMENTAL_MASTERY",
    FIGHT_PROP_CHARGE_EFFICIENCY: "ENERGY_RECHARGE",
    FIGHT_PROP_HP_PERCENT: "HP_PERCENT",
    FIGHT_PROP_DEFENSE_PERCENT: "DEF_PERCENT",
    FIGHT_PROP_HP: "FLAT_HP",
    FIGHT_PROP_DEFENSE: "FLAT_DEF",
  };

  const resolveWeight = (statKey: string, w: ScoringWeights): number => {
    const key = KEY_MAP[statKey];
    return key ? (w[key] ?? 0) : 0;
  };
  const scaleOf = (statKey: string): number => POTENTIAL_SCALES[statKey] ?? 0;

  /** Mirror of the production weighted-potential sum, for building test inputs. */
  function weightedOf(subs: ArtifactSubstat[]): number {
    return subs.reduce(
      (sum, s) => sum + resolveWeight(s.statKey, CRIT_WEIGHTS) * scaleOf(s.statKey) * s.value,
      0,
    );
  }

  /** A roll's average value, matching the model's AVG_ROLL_TIER. */
  const roll = (max: number, n: number) => max * 0.85 * n;

  // Four substats that all matter to a crit DPS - but every upgrade landed on
  // the one stat the character doesn't want (ER), leaving real headroom.
  const wastedRolls = [
    makeSubstat("FIGHT_PROP_CRITICAL", roll(3.89, 1), 3.89, 0),
    makeSubstat("FIGHT_PROP_CRITICAL_HURT", roll(7.77, 1), 7.77, 0),
    makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", roll(23.31, 1), 23.31, 0),
    makeSubstat("FIGHT_PROP_CHARGE_EFFICIENCY", roll(6.48, 6), 6.48, 5),
  ];

  // Same stats, but the upgrades already piled into CRIT DMG.
  const alreadyGood = [
    makeSubstat("FIGHT_PROP_CRITICAL", roll(3.89, 1), 3.89, 0),
    makeSubstat("FIGHT_PROP_CRITICAL_HURT", roll(7.77, 6), 7.77, 5),
    makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", roll(23.31, 1), 23.31, 0),
    makeSubstat("FIGHT_PROP_CHARGE_EFFICIENCY", roll(6.48, 1), 6.48, 0),
  ];

  // Nothing here helps a crit DPS at all.
  const junk = [
    makeSubstat("FIGHT_PROP_HP_PERCENT", roll(5.83, 3), 5.83, 2),
    makeSubstat("FIGHT_PROP_DEFENSE_PERCENT", roll(7.29, 3), 7.29, 2),
    makeSubstat("FIGHT_PROP_HP", roll(298.75, 2), 298.75, 1),
    makeSubstat("FIGHT_PROP_DEFENSE", roll(23.15, 1), 23.15, 0),
  ];

  function makeArtifact(substats: ArtifactSubstat[], overrides: Partial<Artifact> = {}): Artifact {
    return {
      id: "test-artifact",
      setId: "1",
      setName: "Test Set",
      slot: "SANDS",
      slotIndex: 2,
      level: 20,
      rarity: 5,
      icon: "",
      mainStat: {
        statKey: "FIGHT_PROP_ATTACK_PERCENT",
        displayName: "ATK%",
        value: 46.6,
        isPercentage: true,
        isCorrect: true,
        isRecommended: true,
      },
      substats,
      score: {
        potentialPercent: 0,
        weightedPotential: 0,
        idealPotential: 0,
        mainStatCorrect: true,
        mainStatMultiplier: 1.0,
        setBonusMultiplier: 1.0,
        rv: 0,
        cv: 0,
        cvNormalized: 0,
        wse: 0,
        total: 0,
        grade: "F",
        reroll: {
          eligible: false,
          action: "none",
          priority: null,
          improveChance: 0,
          expectedReshapes: Infinity,
          expectedDust: Infinity,
          dustCost: 0,
          currentPercent: 0,
          medianGain: 0,
          realisticCeiling: 0,
          targetStats: [],
          reason: "",
        },
      },
      ...overrides,
    };
  }

  const IDEAL = computeIdealPotential(CRIT_WEIGHTS, "FIGHT_PROP_ATTACK_PERCENT");

  function advise(substats: ArtifactSubstat[], overrides: Partial<Artifact> = {}) {
    const artifact = makeArtifact(substats, overrides);
    return computeRerollAdvice(
      artifact,
      CRIT_WEIGHTS,
      resolveWeight,
      scaleOf,
      weightedOf(substats),
      IDEAL,
    );
  }

  it("tells you to level a sub-+20 artifact before it can be reshaped", () => {
    const result = advise(wastedRolls, { level: 16 });
    expect(result.eligible).toBe(false);
    expect(result.action).toBe("level_up");
  });

  it("is not eligible below 5-star rarity", () => {
    const result = advise(wastedRolls, { rarity: 4 });
    expect(result.eligible).toBe(false);
    expect(result.action).toBe("none");
  });

  it("recommends replacing a piece whose substats are worthless to the character", () => {
    const result = advise(junk);
    expect(result.action).toBe("replace");
    // The old ceiling model rated this as huge "upside"; it must not suggest dust.
    expect(result.priority).toBeNull();
  });

  it("prioritises a piece with good substats whose upgrades were wasted", () => {
    const result = advise(wastedRolls);
    expect(result.action).toBe("reroll");
    expect(result.improveChance).toBeGreaterThan(0.5);
    // Both crit stats carry equal value per roll once normalised, so either
    // ordering is correct - what matters is that ER is not nominated.
    expect([...result.targetStats].sort()).toEqual([
      "FIGHT_PROP_CRITICAL",
      "FIGHT_PROP_CRITICAL_HURT",
    ]);
  });

  it("does not push a reroll when the upgrades already landed on the best stat", () => {
    const wasted = advise(wastedRolls);
    const good = advise(alreadyGood);
    expect(good.improveChance).toBeLessThan(wasted.improveChance);
  });

  it("charges half as much dust for a Flower as for a Sands", () => {
    const sands = advise(wastedRolls, { slot: "SANDS" });
    const flower = advise(wastedRolls, { slot: "FLOWER" });
    expect(sands.dustCost).toBe(2);
    expect(flower.dustCost).toBe(1);
    expect(flower.expectedDust).toBeLessThan(sands.expectedDust);
  });

  it("is deterministic across repeated calls", () => {
    expect(advise(wastedRolls).improveChance).toBe(advise(wastedRolls).improveChance);
  });

  it("reports the gain from successful reshapes, not a median dragged to zero by failures", () => {
    // Whenever any reshape can improve the piece, the advice must say how much
    // it gains when it does - that is exactly when the number matters, and a
    // median taken over all outcomes would read 0 for the low-odds cases.
    for (const subs of [wastedRolls, alreadyGood, junk]) {
      const result = advise(subs);
      if (result.improveChance > 0) {
        expect(result.medianGain).toBeGreaterThan(0);
      }
    }
  });
});

describe("chanceWithin", () => {
  it("matches the per-reshape odds for a single try", () => {
    expect(chanceWithin(0.4, 1)).toBeCloseTo(0.4, 10);
  });

  it("compounds across independent tries", () => {
    // Two tries at 50% each miss only 25% of the time.
    expect(chanceWithin(0.5, 2)).toBeCloseTo(0.75, 10);
  });

  it("stays at zero when no reshape can improve the piece", () => {
    expect(chanceWithin(0, 5)).toBe(0);
  });

  it("approaches but never exceeds certainty", () => {
    const result = chanceWithin(0.3, 50);
    expect(result).toBeLessThan(1);
    expect(result).toBeGreaterThan(0.99);
  });
});

describe("formatChance", () => {
  it("never claims a sampled estimate is a certainty", () => {
    expect(formatChance(1)).toBe("99%+");
    expect(formatChance(0.999)).toBe("99%+");
  });

  it("keeps a vanishing chance visible rather than rounding it to zero", () => {
    expect(formatChance(0.001)).toBe("<1%");
    expect(formatChance(0)).toBe("0%");
  });

  it("rounds ordinary odds to whole percent", () => {
    expect(formatChance(0.375)).toBe("38%");
  });
});

describe("getGrade", () => {
  it("returns correct grades", () => {
    expect(getGrade(180)).toBe("WTF+");
    expect(getGrade(165)).toBe("WTF");
    expect(getGrade(155)).toBe("SSS+");
    expect(getGrade(145)).toBe("SSS");
    expect(getGrade(135)).toBe("SS+");
    expect(getGrade(125)).toBe("SS");
    expect(getGrade(115)).toBe("S+");
    expect(getGrade(105)).toBe("S");
    expect(getGrade(95)).toBe("A+");
    expect(getGrade(85)).toBe("A");
    expect(getGrade(75)).toBe("B+");
    expect(getGrade(65)).toBe("B");
    expect(getGrade(55)).toBe("C+");
    expect(getGrade(45)).toBe("C");
    expect(getGrade(35)).toBe("D+");
    expect(getGrade(25)).toBe("D");
    expect(getGrade(15)).toBe("F+");
    expect(getGrade(5)).toBe("F");
  });

  it("handles boundary values", () => {
    expect(getGrade(170)).toBe("WTF+");
    expect(getGrade(160)).toBe("WTF");
    expect(getGrade(150)).toBe("SSS+");
    expect(getGrade(140)).toBe("SSS");
    expect(getGrade(130)).toBe("SS+");
    expect(getGrade(120)).toBe("SS");
    expect(getGrade(110)).toBe("S+");
    expect(getGrade(100)).toBe("S");
    expect(getGrade(90)).toBe("A+");
    expect(getGrade(80)).toBe("A");
    expect(getGrade(70)).toBe("B+");
    expect(getGrade(60)).toBe("B");
    expect(getGrade(50)).toBe("C+");
    expect(getGrade(40)).toBe("C");
    expect(getGrade(30)).toBe("D+");
    expect(getGrade(20)).toBe("D");
    expect(getGrade(10)).toBe("F+");
    expect(getGrade(0)).toBe("F");
  });
});
