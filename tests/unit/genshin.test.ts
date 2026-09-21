/**
 * The Genshin engine end to end, driven by a real showcase.
 *
 * tests/fixtures/genshin-showcase.json is Enka's response for UID 707019355
 * (the README's example account) as fetched on 2026-09-21. Every number
 * pinned here was worked out by hand from the artifact's own substats and
 * the curated weight table, then checked against the engine.
 */
import { describe, expect, it } from "vitest";
import fixture from "../fixtures/genshin-showcase.json";
import type { EnkaResponse } from "../../src/types/enka";
import type { ArtifactSubstat } from "../../src/types/artifact";
import { buildShowcase } from "../../src/lib/showcase";
import { computeStats } from "../../src/lib/parsing";
import {
  computeIdealPotential,
  deriveWeightsFromScaling,
  getBuildConfig,
  getMaxRoll,
  scoringWeightsFor,
} from "../../src/lib/scoring";
import { baseValueOf } from "../../src/lib/reroll";

const raw = fixture as unknown as EnkaResponse;
const showcase = buildShowcase(raw);
const byId = (avatarId: number) => {
  const c = showcase.characters.find((ch) => ch.avatarId === avatarId);
  if (!c) throw new Error(`character ${avatarId} missing from fixture`);
  return c;
};

const ARLECCHINO = 10000096;
const KOKOMI = 10000054;
const SANDRONE = 10000133;

describe("showcase parsing against a live payload", () => {
  it("scores every character the player put on display", () => {
    expect(showcase.characters).toHaveLength(12);
    expect(showcase.playerInfo.nickname).toBe("Scarakurac");
  });

  it("reads the artifact level with Enka's +1 offset removed", () => {
    // Every maxed piece on this account arrives as reliquary.level 21.
    const arle = byId(ARLECCHINO);
    expect(arle.artifacts.map((a) => a.level)).toEqual([20, 20, 20, 20, 20]);
    // One flower is still at +19 (reliquary.level 20) and must not be
    // handed reshape advice it cannot use yet.
    const unfinished = showcase.characters.flatMap((c) => c.artifacts).filter((a) => a.level < 20);
    expect(unfinished).toHaveLength(1);
    expect(unfinished[0].level).toBe(19);
    expect(unfinished[0].score.reroll.action).toBe("level_up");
  });

  it("counts initial substats from the level, not from a +20 shortcut", () => {
    // The +19 flower carries 7 roll ids: 4 upgrades (one every four levels)
    // on top of 3 initial substats.
    const flower = showcase.characters.flatMap((c) => c.artifacts).find((a) => a.level === 19)!;
    const rolls = flower.substats.reduce((n, s) => n + s.rolls.length, 0);
    const upgrades = flower.substats.reduce((n, s) => n + s.rollCount, 0);
    expect(rolls).toBe(7);
    expect(upgrades).toBe(4);
  });

  it("reads elemental DMG from the character's own element key", () => {
    // Enka numbers the bonuses 40..46 in the game's element order; Pyro is
    // 40, and this Arlecchino wears a 46.6% Pyro goblet.
    expect(byId(ARLECCHINO).stats.elementalDmg).toBe(46.6);
    expect(byId(10000123).stats.elementalDmg).toBe(46.6); // Durin, Pyro
    expect(byId(10000087).stats.elementalDmg).toBe(46.6); // Neuvillette, Hydro (key 42)
  });

  it("does not let an all-element weapon bonus win over the character's own goblet", () => {
    const fp = { "40": 0.12, "41": 0.12, "42": 0.586, "43": 0.12 };
    expect(computeStats(fp, [], "Hydro").elementalDmg).toBe(58.6);
    // A Physical build has no elemental bonus; the largest of the rest stands in.
    expect(computeStats({ "30": 0.583, "46": 0 }, [], "Cryo").elementalDmg).toBe(58.3);
  });
});

describe("ideal potential counts only stats a substat can roll", () => {
  it("pins Kokomi's HP% sands to 19.037", () => {
    // Weights after main-stat exclusion: ER 0.7, flat HP 0.4 (derived from
    // HP% 1.0), EM 0.3. Healing Bonus 0.8 is a circlet main, never a roll.
    // 7.77 x (0.7 + 0.4 + 0.3 + 5 x 0.7) / 2 = 19.0365
    const weights = getBuildConfig(KOKOMI)!.substat_weights;
    expect(computeIdealPotential(weights, "FIGHT_PROP_HP_PERCENT")).toBeCloseTo(19.037, 3);
  });

  it("pins Sandrone's flower to 32.634", () => {
    // CR 1, CD 1, ATK% 1, EM 0.4, flat ATK 0.4, ER 0.3; Elemental DMG 1.0 is
    // a goblet main. Top four = 3.4, best = 1: 7.77 x (3.4 + 5) / 2.
    const weights = getBuildConfig(SANDRONE)!.substat_weights;
    expect(computeIdealPotential(weights, "FIGHT_PROP_HP")).toBeCloseTo(32.634, 3);
  });

  it("scores Arlecchino's Pyro goblet at 112.5% S+", () => {
    // Weighted: CR 9.7 x 1 x 7.77/3.89 + ATK% 4.7 x 0.8 x 7.77/5.83 + CD 13.2
    //         = 19.375 + 5.011 + 13.2 = 37.586
    // Ideal:    7.77 x (1 + 1 + 0.8 + 0.8 + 5) / 2 = 33.411
    const goblet = byId(ARLECCHINO).artifacts.find((a) => a.slot === "GOBLET")!;
    expect(goblet.score.idealPotential).toBeCloseTo(33.411, 3);
    expect(goblet.score.weightedPotential).toBeCloseTo(37.586, 2);
    expect(goblet.score.potentialPercent).toBeCloseTo(112.5, 1);
    expect(goblet.score.grade).toBe("S+");
  });

  it("shows the build page the same weights the scorer uses", () => {
    const shown = scoringWeightsFor(KOKOMI);
    expect(shown).not.toHaveProperty("HEALING_BONUS");
    expect(shown.FLAT_HP).toBeCloseTo(0.4, 6);
    expect(shown.HP_PERCENT).toBe(1);
  });
});

describe("grades follow the number that is displayed", () => {
  it("never shows a whole percent on one side of a band with a grade from the other", () => {
    for (const a of showcase.characters.flatMap((c) => c.artifacts)) {
      const shown = Math.round(a.score.potentialPercent);
      const floor = { S: 100, "A+": 90, A: 80, "B+": 70, B: 60 }[a.score.grade as string];
      if (floor !== undefined) expect(shown).toBeGreaterThanOrEqual(floor);
    }
  });
});

describe("rarity and scaling fallbacks", () => {
  it("scales max rolls down for 4-star artifacts", () => {
    expect(getMaxRoll("FIGHT_PROP_CRITICAL", 4)).toBeCloseTo(3.112, 3);
    expect(getMaxRoll("FIGHT_PROP_CRITICAL")).toBeCloseTo(3.89, 3);
  });

  it("matches the pipeline's HP_ / DEF_ spelling of an ascension stat", () => {
    const entry = { scaling_stat: "HP_" } as Parameters<typeof deriveWeightsFromScaling>[0];
    expect(deriveWeightsFromScaling(entry).HP_PERCENT).toBeGreaterThan(0);
    const def = { scaling_stat: "DEF_" } as Parameters<typeof deriveWeightsFromScaling>[0];
    expect(deriveWeightsFromScaling(def).DEF_PERCENT).toBeGreaterThan(0);
  });
});

describe("reshape floor uses the exact roll tiers", () => {
  const sub = (rolls: number[], rollCount: number, value: number): ArtifactSubstat => ({
    statKey: "FIGHT_PROP_CRITICAL",
    displayName: "CRIT Rate",
    shortName: "CR",
    value,
    isPercentage: true,
    maxRoll: 3.89,
    rollCount,
    rollQuality: "high",
    rolls,
  });

  it("keeps only the roll that created the substat", () => {
    expect(baseValueOf(sub([0.9, 1.0, 0.7], 2, 10.1))).toBeCloseTo(3.89 * 0.9, 6);
  });

  it("leaves nothing fixed for a stat that only appeared through an upgrade", () => {
    expect(baseValueOf(sub([0.8], 1, 3.1))).toBe(0);
  });

  it("falls back to the average-tier estimate without a roll list", () => {
    expect(baseValueOf(sub([], 2, 10.1))).toBeCloseTo(10.1 - 2 * 0.85 * 3.89, 6);
  });
});
