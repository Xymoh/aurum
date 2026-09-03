import { describe, expect, it } from "vitest";
import fixture from "../fixtures/zzz-showcase.json";
import { parseZzzShowcase, mainStatAtLevel, type RawZzzResponse } from "../../src/zzz/parsing";
import {
  BENCHMARK_ROLLS,
  MAX_ROLLS,
  ROLL_VALUE,
  SLOT_MAIN_STATS,
  SUBSTATS,
  gradeFor,
  mainStatWeight,
  optimalScore,
  scoreAgent,
  substatScale,
} from "../../src/zzz/scoring";
import { getScoringMeta, WASTE_THRESHOLD, weightOf } from "../../src/zzz/weights";
import { isValidZzzUid } from "../../src/zzz/useZzzShowcase";
import { displayValue, isPercentStat, statLabel } from "../../src/zzz/labels";

const parsed = parseZzzShowcase(fixture as RawZzzResponse);
const first = scoreAgent(parsed.agents[0]);

describe("ZZZ parsing", () => {
  it("resolves the player and agents", () => {
    expect(parsed.uid).toBe("1300064261");
    expect(parsed.agents.length).toBe(6);
    expect(first.name).toBe("Burnice");
    expect(first.profession).toBe("Anomaly");
    expect(first.level).toBe(60);
  });

  it("parses six discs in slot order with set names", () => {
    expect(first.discs.map((d) => d.slot)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const d of first.discs) expect(d.setName).not.toMatch(/^Set \d+$/);
  });

  it("reads roll counts as stated and values as rolls x a fixed amount", () => {
    // The finding the scorer is built on: PropertyValue is the same at one
    // roll as at four, so there is no roll quality in this game.
    for (const d of first.discs) {
      expect(d.totalRolls).toBeGreaterThanOrEqual(8);
      expect(d.totalRolls).toBeLessThanOrEqual(9);
      for (const s of d.substats) {
        expect(s.perRoll).toBeCloseTo(ROLL_VALUE[s.id], 5);
        expect(s.value).toBeCloseTo(s.rolls * s.perRoll, 5);
      }
    }
  });

  it("scales percentages and grows main stats with disc level", () => {
    expect(isPercentStat(12102)).toBe(true);
    expect(isPercentStat(12103)).toBe(false);
    expect(displayValue(12102, 300)).toBe(3);
    // 550 HP at +0 is 2200 at +15, 6% CRIT Rate is 24%.
    expect(mainStatAtLevel(550, 15)).toBe(2200);
    expect(displayValue(20103, mainStatAtLevel(600, 15))).toBe(24);
    const disc1 = first.discs.find((d) => d.slot === 1)!;
    expect(disc1.mainStat.id).toBe(11103);
    expect(disc1.mainStat.value).toBe(2200);
  });

  it("accepts nine and ten digit UIDs", () => {
    expect(isValidZzzUid("1300064261")).toBe(true);
    expect(isValidZzzUid("130006426")).toBe(true);
    expect(isValidZzzUid("0300064261")).toBe(false);
    expect(isValidZzzUid("13000642611")).toBe(false);
  });

  it("labels every substat", () => {
    for (const id of SUBSTATS) expect(statLabel(id)).not.toMatch(/^\d+$/);
  });
});

describe("normalisation", () => {
  it("makes one roll of any substat worth one CRIT DMG roll", () => {
    for (const id of SUBSTATS) expect(substatScale(id) * ROLL_VALUE[id]).toBeCloseTo(4.8, 5);
    expect(substatScale(20103)).toBeCloseTo(2, 5);
  });

  it("weights flat stats at 40% of their percent stat", () => {
    const meta = getScoringMeta(first.id);
    expect(weightOf(meta.stats, 12103)).toBeCloseTo(0.4 * weightOf(meta.stats, 12102), 5);
  });
});

describe("main stats", () => {
  const meta = getScoringMeta(1091); // Miyabi: an Attack agent whatever the source.

  it("cannot be wrong on discs 1 to 3", () => {
    expect(mainStatWeight(1, 11103, meta)).toBe(1);
    expect(mainStatWeight(3, 13103, meta)).toBe(1);
  });

  it("excludes the main stat from the ceiling's substat pool", () => {
    // A disc 4 whose main is the agent's best substat can never roll that
    // stat as a substat, so its ceiling sits below a disc 1's, whose fixed
    // HP main blocks nothing an attacker wants.
    const best = SLOT_MAIN_STATS[4]
      .filter((id) => SUBSTATS.includes(id))
      .sort((a, b) => weightOf(meta.stats, b) - weightOf(meta.stats, a))[0];
    expect(weightOf(meta.stats, best)).toBeGreaterThan(0);
    expect(optimalScore(4, best, meta)).toBeLessThan(optimalScore(1, 11103, meta));
  });

  it("withholds the letter grade from a disc with a useless main stat", () => {
    // Whichever disc 4 main this agent has no use for; an attacker always has one.
    const useless = SLOT_MAIN_STATS[4].find((id) => mainStatWeight(4, id, meta) === 0);
    expect(useless).toBeDefined();
    const agent = parsed.agents[0];
    const disc4 = agent.discs.find((d) => d.slot === 4)!;
    const scored = scoreAgent({ ...agent, id: 1091, discs: [{ ...disc4, mainStat: { id: useless!, value: 30 } }] });
    expect(scored.discs[0].score.mainStatOk).toBe(false);
    expect(scored.discs[0].score.grade).toBeNull();
    // The substats are still measured, so the number stays informative.
    expect(scored.discs[0].score.potentialPercent).toBeGreaterThan(0);
  });
});

describe("build diagnostics", () => {
  const d = first.diagnostics;

  it("counts every roll and splits useful from wasted", () => {
    expect(d.totalRolls).toBe(first.discs.reduce((n, x) => n + x.totalRolls, 0));
    expect(d.totalRolls).toBeLessThanOrEqual(MAX_ROLLS);
    expect(d.effectiveRolls + d.wastedRolls).toBe(d.totalRolls);
    expect(BENCHMARK_ROLLS).toBeLessThan(MAX_ROLLS);
  });

  it("scores the build as the mean of six slots", () => {
    const mean = first.discs.reduce((n, x) => n + x.score.potentialPercent, 0) / 6;
    expect(d.score).toBeCloseTo(mean, 0);
    expect(d.grade).toBe(gradeFor(d.score));
  });

  it("attributes waste to stats below the threshold", () => {
    const meta = getScoringMeta(first.id);
    for (const w of d.waste) expect(weightOf(meta.stats, w.id)).toBeLessThan(WASTE_THRESHOLD);
  });

  it("detects set pieces", () => {
    expect(d.sets.length).toBeGreaterThan(0);
    for (const s of d.sets) expect(s.pieces).toBeGreaterThanOrEqual(2);
  });
});

describe("score ceiling", () => {
  it("scores a perfect nine-roll disc at 200", () => {
    const meta = getScoringMeta(1091);
    const ranked = SUBSTATS.map((id) => [id, weightOf(meta.stats, id)] as const)
      .filter(([id, w]) => w > 0 && id !== 11103)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const substats = ranked.map(([id], i) => {
      const rolls = i === 0 ? 6 : 1;
      return { id, rolls, perRoll: ROLL_VALUE[id], value: rolls * ROLL_VALUE[id] };
    });
    const agent = {
      ...parsed.agents[0],
      id: 1091,
      discs: [{ ...parsed.agents[0].discs[0], slot: 1 as const, mainStat: { id: 11103, value: 2200 }, substats, totalRolls: 9 }],
    };
    const scored = scoreAgent(agent);
    expect(scored.discs[0].score.potentialPercent).toBeCloseTo(200, 1);
    expect(scored.discs[0].score.grade).toBe("WTF+");
  });
});
