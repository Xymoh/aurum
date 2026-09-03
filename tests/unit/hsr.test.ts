import { describe, expect, it } from "vitest";
import fixture from "../fixtures/hsr-showcase.json";
import {
  parseHsrShowcase,
  isPercentStat,
  type RawHsrResponse,
  type ParsedCharacter,
} from "../../src/hsr/parsing";
import type { HsrStatKey } from "../../src/hsr/types";
import {
  BENCHMARK_ROLLS,
  MAX_ROLLS,
  HIGH_ROLL,
  scoreCharacter,
  gradeFor,
  GRADE_LADDER,
  optimalScore,
  mainStatWeight,
  substatScale,
} from "../../src/hsr/scoring";
import { gradeColor } from "../../src/hsr/labels";
import {
  getWeights,
  getScoringMeta,
  WASTE_THRESHOLD,
  weightOf,
  CHARACTER_OVERRIDES,
  getCharacterInfo,
} from "../../src/hsr/weights";

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

describe("Fribbels parity", () => {
  it("reads the best roll of each substat from the affix table", () => {
    // The normalisation unit. Every other stat is expressed in CRIT DMG points.
    expect(HIGH_ROLL.CriticalDamageBase).toBeCloseTo(6.48, 2);
    expect(HIGH_ROLL.CriticalChanceBase).toBeCloseTo(3.24, 2);
    expect(HIGH_ROLL.SpeedDelta).toBeCloseTo(2.6, 2);
    expect(HIGH_ROLL.AttackAddedRatio).toBeCloseTo(4.32, 2);
    expect(substatScale("CriticalChanceBase")).toBeCloseTo(2, 3);
    expect(substatScale("SpeedDelta")).toBeCloseTo(2.49, 2);
  });

  it("scores the fixture's relics at what fribbels.github.io shows for the same UID", () => {
    // Fribbels' showcase for 700600838 reports Saber's pieces as 63.1, 63.4,
    // 58.4 and 80.6 on its 0-100 scale. Ours is that scale doubled.
    const bySlot = Object.fromEntries(saber.relics.map((r) => [r.slot, r.score.potentialPercent]));
    expect(bySlot.HEAD).toBeCloseTo(126.2, 0);
    expect(bySlot.HAND).toBeCloseTo(126.8, 0);
    expect(bySlot.BODY).toBeCloseTo(116.8, 0);
    expect(bySlot.FOOT).toBeCloseTo(161.2, 0);
  });

  it("takes per-character weights from the imported table", () => {
    // Sparkle: SPD and CRIT DMG only, a little Effect RES, no CRIT Rate. The
    // old Harmony profile credited ATK%, Break Effect and CRIT Rate rolls.
    const sparkle = getScoringMeta(1306);
    expect(sparkle.source).toBe("fribbels");
    expect(weightOf(sparkle.stats, "SpeedDelta")).toBe(1);
    expect(weightOf(sparkle.stats, "CriticalDamageBase")).toBe(1);
    expect(weightOf(sparkle.stats, "StatusResistanceBase")).toBe(0.25);
    expect(weightOf(sparkle.stats, "CriticalChanceBase")).toBe(0);
    expect(weightOf(sparkle.stats, "AttackAddedRatio")).toBe(0);
  });

  it("weights flat stats at 40% of their percent stat, whatever the table says", () => {
    const meta = getScoringMeta(1014);
    expect(weightOf(meta.stats, "AttackDelta")).toBeCloseTo(0.4 * weightOf(meta.stats, "AttackAddedRatio"), 5);
  });

  it("lets the even Trailblazer id borrow the odd one's weights", () => {
    expect(getScoringMeta(8002).source).toBe("fribbels");
    expect(getScoringMeta(8002).stats).toEqual(getScoringMeta(8001).stats);
  });
});

describe("main stats", () => {
  const meta = getScoringMeta(1014);

  it("excludes the main stat from the substat pool when computing the ceiling", () => {
    // A CRIT DMG body can never roll CRIT DMG as a substat, so its ceiling is
    // lower than a Head's, whose fixed HP main blocks nothing Saber wants.
    const body = optimalScore("BODY", "CriticalDamageBase", meta);
    const head = optimalScore("HEAD", "HPDelta", meta);
    expect(body).toBeLessThan(head);
    // CRIT Rate and CRIT DMG both carry full weight, so either main leaves
    // the same pool behind.
    expect(optimalScore("BODY", "CriticalChanceBase", meta)).toBeCloseTo(body, 6);
  });

  it("accepts an ideal main stat, tolerates a weighted one, rejects a useless one", () => {
    expect(mainStatWeight("BODY", "CriticalDamageBase", meta)).toBe(1);
    expect(mainStatWeight("BODY", "HPAddedRatio", meta)).toBe(0);
    expect(mainStatWeight("HEAD", "HPDelta", meta)).toBe(1);
    // Sparkle has no use for an ATK% body; its weight as a substat is 0 too.
    expect(mainStatWeight("BODY", "AttackAddedRatio", getScoringMeta(1306))).toBe(0);
  });

  it("withholds the letter grade from a relic whose main stat the character cannot use", () => {
    const sparkle = parsed.characters.find((c) => c.avatarId === 1306)!;
    const body = sparkle.relics.find((r) => r.slot === "BODY")!;
    const wrong: ParsedCharacter = {
      ...sparkle,
      relics: [{ ...body, mainStat: { key: "AttackAddedRatio", value: 43.2 } }],
    };
    const scored = scoreCharacter(wrong);
    expect(scored.relics[0].score.mainStatOk).toBe(false);
    expect(scored.relics[0].score.grade).toBeNull();
    // The substats are still measured, so the number stays informative.
    expect(scored.relics[0].score.potentialPercent).toBeGreaterThan(0);
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

  it("scores the build as the mean of its six slots", () => {
    const mean = saber.relics.reduce((n, r) => n + r.score.potentialPercent, 0) / 6;
    expect(d.score).toBeCloseTo(mean, 0);
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
    const meta = getScoringMeta(999999);
    expect(meta.source).toBe("path");
    expect(Object.keys(meta.stats).length).toBeGreaterThan(0);
  });
});

describe("grade ladder", () => {
  it("is Fribbels' ladder doubled, one band per 10 points", () => {
    // Fribbels awards S at 50% of the optimal relic and steps every 5%; on
    // our 0-200 scale that is S at 100 and a band every 10. The same ladder
    // the Genshin side uses, so a grade means one thing across the site.
    expect(gradeFor(175)).toBe("WTF+");
    expect(gradeFor(160)).toBe("WTF");
    expect(gradeFor(150)).toBe("SSS+");
    expect(gradeFor(140)).toBe("SSS");
    expect(gradeFor(130)).toBe("SS+");
    expect(gradeFor(120)).toBe("SS");
    expect(gradeFor(110)).toBe("S+");
    expect(gradeFor(100)).toBe("S");
    expect(gradeFor(99.9)).toBe("A+");
    expect(gradeFor(80)).toBe("A");
    expect(gradeFor(60)).toBe("B");
    expect(gradeFor(40)).toBe("C");
    expect(gradeFor(20)).toBe("D");
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
    // Prefix matching used to collapse SSS into SS.
    expect(gradeColor("SSS")).not.toBe(gradeColor("SS"));
    expect(gradeColor(null)).toBe("text-hsr-muted");
    expect(colors.every((c) => c.startsWith("text-"))).toBe(true);
  });
});

describe("character overrides", () => {
  it("targets characters that actually exist", () => {
    // An override keyed to the wrong avatarId silently rescores a different
    // character, which is exactly what happened when Silver Wolf LV.999's
    // support profile was pinned to Archer's id.
    for (const id of Object.keys(CHARACTER_OVERRIDES)) {
      expect(getCharacterInfo(Number(id))).not.toBeNull();
    }
  });

  it("keeps a damage dealer on a damage profile", () => {
    // Archer is a Hunt damage dealer and must not inherit a support profile.
    const archer = getWeights(1015);
    expect(weightOf(archer, "CriticalDamageBase")).toBeGreaterThan(0.9);
    expect(weightOf(archer, "HPAddedRatio")).toBeLessThan(WASTE_THRESHOLD);
  });
});

describe("reroll advice", () => {
  const weights = getWeights(1014);
  const advised = saber.relics.map((r) => ({ slot: r.slot, a: r.reroll }));

  it("offers a verdict on every eligible +15 relic", () => {
    for (const { a } of advised) {
      expect(a.eligible).toBe(true);
      expect(["reroll", "replace", "none"]).toContain(a.action);
      expect(a.label).not.toBe("");
    }
  });

  it("keeps odds and expected dice consistent with each other", () => {
    for (const { a } of advised) {
      expect(a.improveChance).toBeGreaterThanOrEqual(0);
      expect(a.improveChance).toBeLessThanOrEqual(1);
      if (a.improveChance > 0) {
        expect(a.expectedDice).toBeCloseTo(1 / a.improveChance, 5);
      } else {
        expect(a.expectedDice).toBe(Infinity);
      }
    }
  });

  it("is deterministic, so a verdict cannot flip between page loads", () => {
    const again = scoreCharacter(parsed.characters.find((c) => c.avatarId === 1014)!);
    for (let i = 0; i < saber.relics.length; i++) {
      expect(again.relics[i].reroll.improveChance).toBe(saber.relics[i].reroll.improveChance);
      expect(again.relics[i].reroll.action).toBe(saber.relics[i].reroll.action);
    }
  });

  it("only nominates stats this character actually uses", () => {
    for (const { a } of advised) {
      for (const key of a.targetStats) {
        expect(weightOf(weights, key)).toBeGreaterThanOrEqual(WASTE_THRESHOLD);
      }
      expect(a.targetStats.length).toBeLessThanOrEqual(2);
    }
  });

  it("never tells you to bin a piece that could still become good", () => {
    // "Replace" has to mean weak now AND incapable of improving, otherwise it
    // would throw away well-rolled pieces whose ceiling sits below their score.
    for (const { a } of advised) {
      if (a.action === "replace") {
        expect(a.realisticCeiling).toBeLessThan(90);
      }
    }
  });
});

describe("score ceiling", () => {
  /** A relic that is the best this character could possibly be handed. */
  function perfectRelicFor(avatarId: number, totalRolls: number): ParsedCharacter {
    const weights = getWeights(avatarId);
    const ranked = (Object.entries(weights) as [HsrStatKey, number][])
      .filter(([key, w]) => w > 0 && key !== "HPDelta")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    // Top stat soaks every upgrade; the other three fill the remaining slots.
    const substats = ranked.map(([key], i) => {
      const rolls = i === 0 ? totalRolls - 3 : 1;
      return { key, value: rolls * HIGH_ROLL[key], rolls, quality: 1 };
    });
    return {
      avatarId,
      name: "test",
      path: "",
      element: "",
      rarity: 5,
      level: 80,
      eidolon: 0,
      lightCone: null,
      traces: null,
      relics: [
        {
          id: `perfect-${avatarId}`,
          tid: 61191,
          slot: "HEAD",
          setId: 119,
          setName: "test",
          rarity: 5,
          level: 15,
          mainStat: { key: "HPDelta", value: 705 },
          substats,
          totalRolls,
        },
      ],
    };
  }

  it("scores a theoretically perfect 9-roll relic at 200 for a damage dealer", () => {
    const scored = scoreCharacter(perfectRelicFor(1014, 9));
    expect(scored.relics[0].score.potentialPercent).toBeCloseTo(200, 1);
    expect(scored.relics[0].score.grade).toBe("WTF+");
  });

  it("scores it at 200 for a support too, whose weights fall away after the top stat", () => {
    // Silver Wolf LV.999 runs 1.0 / 1.0 / 1.0 and Sparkle 1.0 / 1.0 / 0.25;
    // the ceiling is built from the character's own top four, so both reach it.
    for (const id of [1506, 1306]) {
      const scored = scoreCharacter(perfectRelicFor(id, 9));
      expect(scored.relics[0].score.potentialPercent).toBeCloseTo(200, 1);
    }
  });

  it("keeps an 8-roll relic short of the ceiling, as Fribbels does", () => {
    // The optimal relic always has nine rolls. A piece that started with
    // three substats has one fewer, and that is a real deficit.
    const scored = scoreCharacter(perfectRelicFor(1014, 8));
    expect(scored.relics[0].score.potentialPercent).toBeLessThan(200);
    expect(scored.relics[0].score.potentialPercent).toBeGreaterThan(175);
  });
});
