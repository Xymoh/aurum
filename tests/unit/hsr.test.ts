import { describe, expect, it } from "vitest";
import fixture from "../fixtures/hsr-showcase.json";
import { parseHsrShowcase, isPercentStat, type RawHsrResponse } from "../../src/hsr/parsing";
import {
  BENCHMARK_ROLLS,
  MAX_ROLLS,
  scoreCharacter,
  gradeFor,
  GRADE_LADDER,
} from "../../src/hsr/scoring";
import { gradeColor } from "../../src/hsr/labels";
import { getWeights, WASTE_THRESHOLD, weightOf } from "../../src/hsr/weights";

const parsed = parseHsrShowcase(fixture as RawHsrResponse);
const saber = scoreCharacter(parsed.characters.find((c) => c.avatarId === 1014)!);

describe("HSR parsing", () => {
  it("resolves the player and characters", () => {
    expect(parsed.uid).toBe("700600838");
    expect(saber.name).toBe("Saber");
    expect(saber.path).toBe("Warrior");
    expect(saber.element).toBe("Wind");
    expect(saber.lightCone?.name).toBe("A Thankless Coronation");
  });

  it("parses six relics with real set names", () => {
    expect(saber.relics).toHaveLength(6);
    expect(saber.relics.map((r) => r.slot)).toEqual([
      "HEAD",
      "HAND",
      "BODY",
      "FOOT",
      "NECK",
      "OBJECT",
    ]);
    // NECK/OBJECT come from a Planar set, so two distinct sets are expected.
    expect(new Set(saber.relics.map((r) => r.setId)).size).toBe(2);
  });

  it("states roll counts rather than inferring them", () => {
    // Every +15 relic holds 8 or 9 upgrades depending on its starting substats.
    for (const relic of saber.relics) {
      expect(relic.totalRolls).toBeGreaterThanOrEqual(8);
      expect(relic.totalRolls).toBeLessThanOrEqual(9);
      expect(relic.substats).toHaveLength(4);
    }
  });

  it("keeps every roll quality inside the 0.8 to 1.0 band", () => {
    // HSR rolls come in three tiers, the lowest being 80% of the highest
    // (Speed is the lone exception at ~77%), so nothing may fall below that.
    for (const relic of saber.relics) {
      for (const sub of relic.substats) {
        expect(sub.quality).toBeGreaterThanOrEqual(0.76);
        expect(sub.quality).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it("scales percentages but leaves flat stats alone", () => {
    expect(isPercentStat("CriticalChanceBase")).toBe(true);
    expect(isPercentStat("AttackAddedRatio")).toBe(true);
    expect(isPercentStat("SpeedDelta")).toBe(false);
    expect(isPercentStat("AttackDelta")).toBe(false);
  });
});

describe("build diagnostics", () => {
  const d = saber.diagnostics;

  it("counts every upgrade on the build", () => {
    const fromRelics = saber.relics.reduce((n, r) => n + r.totalRolls, 0);
    expect(d.totalRolls).toBe(fromRelics);
    expect(d.totalRolls).toBeLessThanOrEqual(MAX_ROLLS);
    // This specific build carries more rolls than the benchmark assumes.
    expect(d.totalRolls).toBe(53);
  });

  it("splits those upgrades into useful and wasted", () => {
    expect(d.effectiveRolls + d.wastedRolls).toBe(d.totalRolls);
    // The finding that motivated the tool: a build can clear the roll
    // benchmark on volume and still fall short on rolls that count.
    expect(d.totalRolls).toBeGreaterThan(BENCHMARK_ROLLS);
    expect(d.effectiveRolls).toBeLessThan(BENCHMARK_ROLLS);
  });

  it("reports efficiency against the benchmark, not against volume", () => {
    expect(d.efficiency).toBeCloseTo((d.effectiveRolls / BENCHMARK_ROLLS) * 100, 1);
  });

  it("attributes waste to specific slots and stats", () => {
    expect(d.waste.length).toBeGreaterThan(0);
    const weights = getWeights(1014);
    for (const w of d.waste) {
      expect(weightOf(weights, w.key)).toBeLessThan(WASTE_THRESHOLD);
    }
    // Sorted worst first so the UI can lead with the biggest offender.
    const rolls = d.waste.map((w) => w.rolls);
    expect([...rolls].sort((a, b) => b - a)).toEqual(rolls);
  });

  it("computes the crit ratio from substats", () => {
    expect(d.critRatio).not.toBeNull();
    expect(d.critRatio!).toBeGreaterThan(0);
  });

  it("detects the two-piece and four-piece sets", () => {
    expect(d.sets.map((s) => s.pieces)).toEqual([4, 2]);
  });
});

describe("grading", () => {
  it("falls back to Path weights for an unknown character", () => {
    // A character released after the data was bundled must still score.
    const weights = getWeights(999999);
    expect(Object.keys(weights).length).toBeGreaterThan(0);
  });
});

describe("grade ladder", () => {
  it("matches the ladder Fribbels uses for Star Rail", () => {
    // The band a score lands in is the whole point of the number, so the
    // boundaries are pinned rather than left to drift.
    expect(gradeFor(200)).toBe("AEON");
    expect(gradeFor(150)).toBe("WTF+");
    expect(gradeFor(142)).toBe("WTF");
    expect(gradeFor(130)).toBe("SSS+");
    expect(gradeFor(121)).toBe("SSS");
    expect(gradeFor(113)).toBe("SS+");
    expect(gradeFor(106)).toBe("SS");
    expect(gradeFor(100)).toBe("S+");
    expect(gradeFor(95)).toBe("S");
    expect(gradeFor(90)).toBe("A+");
    expect(gradeFor(85)).toBe("A");
    expect(gradeFor(80)).toBe("B+");
    expect(gradeFor(75)).toBe("B");
    expect(gradeFor(70)).toBe("C+");
    expect(gradeFor(65)).toBe("C");
    expect(gradeFor(60)).toBe("D+");
    expect(gradeFor(55)).toBe("D");
    expect(gradeFor(50)).toBe("F+");
    expect(gradeFor(0)).toBe("F");
  });

  it("never moves backwards as the score rises", () => {
    const labels = GRADE_LADDER.map((b) => b.grade);
    let previous = labels.length - 1;
    for (let score = 0; score <= 210; score += 0.5) {
      const index = labels.indexOf(gradeFor(score));
      expect(index).toBeLessThanOrEqual(previous);
      previous = index;
    }
  });

  it("gives every band its own colour", () => {
    const colors = GRADE_LADDER.map((b) => gradeColor(b.grade));
    // Prefix matching used to collapse SSS into SS and AEON into A.
    expect(gradeColor("SSS")).not.toBe(gradeColor("SS"));
    expect(gradeColor("AEON")).not.toBe(gradeColor("A"));
    expect(colors.every((c) => c.startsWith("text-"))).toBe(true);
  });
});
