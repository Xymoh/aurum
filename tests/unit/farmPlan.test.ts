import { describe, expect, it } from "vitest";
import fixture from "../fixtures/genshin-showcase.json";
import artifacts from "../../src/data/artifacts.json";
import type { EnkaResponse } from "../../src/types/enka";
import type { CharacterData } from "../../src/types/character";
import { buildShowcase } from "../../src/lib/showcase";
import { DOMAIN_PAIRS, farmPlan } from "../../src/lib/farmPlan";
import { getSetRecommendations } from "../../src/lib/scoring";

const showcase = buildShowcase(fixture as unknown as EnkaResponse);
const SETS = artifacts as Record<string, { name: string }>;

describe("domain pairs", () => {
  it("names real sets, each in one pair only", () => {
    const ids = DOMAIN_PAIRS.flat();
    for (const id of ids) expect(SETS[id], id).toBeDefined();
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("farm plan", () => {
  it("ranks targets by how many weak slots they fix, and stays within the limit", () => {
    const plan = farmPlan(showcase.characters);
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i - 1].pieces.length).toBeGreaterThanOrEqual(plan[i].pieces.length);
    }
    for (const target of plan) {
      expect(target.characterCount).toBe(new Set(target.pieces.map((p) => p.characterId)).size);
    }
  });

  it("credits an empty slot to the character's recommended domain, once", () => {
    const base = showcase.characters.find((c) => getSetRecommendations(c.avatarId, c.element)[0]);
    expect(base).toBeDefined();
    const character: CharacterData = {
      ...base!,
      id: "test",
      // Only a Goblet left, and it is fine: the other four slots are empty.
      artifacts: base!.artifacts
        .filter((a) => a.slot === "GOBLET")
        .map((a) => ({
          ...a,
          mainStat: { ...a.mainStat, isCorrect: true },
          score: { ...a.score, reroll: { ...a.score.reroll, action: "none" as const } },
        })),
    };
    const [top] = farmPlan([character]);
    const wanted = getSetRecommendations(character.avatarId, character.element)[0][0].setId;
    expect(top.setIds).toContain(wanted);
    expect(top.pieces.map((p) => p.slot).sort()).toEqual(["CIRCLET", "FLOWER", "PLUME", "SANDS"]);
    expect(top.pieces.every((p) => p.reason === "empty")).toBe(true);
  });
});
