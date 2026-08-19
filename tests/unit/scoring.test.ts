import { describe, it, expect } from "vitest";
import { computeRV, computeCV, computeWSE, getGrade, computeRerollPotential } from "../../src/lib/scoring";
import type { Artifact, ArtifactSubstat } from "../../src/types/artifact";
import type { ScoringWeights } from "../../src/types/scoring";

function makeSubstat(
  key: string,
  value: number,
  maxRoll: number,
): ArtifactSubstat {
  return {
    statKey: key as ArtifactSubstat["statKey"],
    displayName: key,
    shortName: key,
    value,
    isPercentage: true,
    maxRoll,
    rollCount: maxRoll > 0 ? Math.max(0, Math.round(value / (maxRoll * 0.85)) - 1) : 0,
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

describe("computeRerollPotential", () => {
  const DILUC_WEIGHTS: ScoringWeights = {
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

  function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
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
      substats: [
        makeSubstat("FIGHT_PROP_CRITICAL", 3.89, 3.89),
        makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77, 7.77),
        makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.31, 23.31),
        makeSubstat("FIGHT_PROP_CHARGE_EFFICIENCY", 6.48, 6.48),
      ],
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
        reroll: { eligible: false, currentPercent: 0, ceilingPercent: 0, upsidePercent: 0, bestStatDisplayName: null },
      },
      ...overrides,
    };
  }

  it("is not eligible below level 20", () => {
    const result = computeRerollPotential(makeArtifact({ level: 16 }), DILUC_WEIGHTS, 31.86, 80);
    expect(result.eligible).toBe(false);
  });

  it("is not eligible below 5-star rarity", () => {
    const result = computeRerollPotential(makeArtifact({ rarity: 4 }), DILUC_WEIGHTS, 31.86, 80);
    expect(result.eligible).toBe(false);
  });

  it("picks the artifact's highest-weighted substat as the reroll target and computes a ceiling above the current score", () => {
    const idealPotential = 31.86; // a plausible ideal potential for the DILUC_WEIGHTS profile
    const result = computeRerollPotential(makeArtifact(), DILUC_WEIGHTS, idealPotential, 80);
    expect(result.eligible).toBe(true);
    // CRIT_RATE and CRIT_DMG are tied for the highest weight (1.0) — CRIT_RATE appears first in the substat list.
    expect(result.bestStatDisplayName).toBe("FIGHT_PROP_CRITICAL");
    expect(result.ceilingPercent).toBeGreaterThan(result.currentPercent);
    expect(result.upsidePercent).toBeCloseTo(result.ceilingPercent - 80, 5);
  });

  it("clamps upside at 0 when the current score already exceeds the estimated ceiling", () => {
    const idealPotential = 31.86;
    const result = computeRerollPotential(makeArtifact(), DILUC_WEIGHTS, idealPotential, 999);
    expect(result.upsidePercent).toBe(0);
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
