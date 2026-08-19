import { describe, it, expect } from "vitest";
import { evaluateSetBonus } from "../../src/lib/scoring";
import type { Artifact } from "../../src/types/artifact";

/** Helper to create a minimal artifact with only the fields needed for set bonus evaluation */
function makeArtifact(setId: string, setName: string): Artifact {
  return {
    id: `art-${Math.random().toString(36).slice(2, 8)}`,
    setId,
    setName,
    slot: "FLOWER",
    slotIndex: 0,
    level: 20,
    rarity: 5,
    icon: "",
    mainStat: {
      statKey: "FIGHT_PROP_HP",
      displayName: "HP",
      value: 4780,
      isPercentage: false,
      isCorrect: true,
      isRecommended: true,
    },
    substats: [],
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
  };
}

describe("evaluateSetBonus", () => {
  describe("counting equipped artifacts per set ID", () => {
    it("correctly counts artifacts from the same set", () => {
      const artifacts = [
        makeArtifact("set_a", "Gladiator's Finale"),
        makeArtifact("set_a", "Gladiator's Finale"),
        makeArtifact("set_b", "Wanderer's Troupe"),
        makeArtifact("set_b", "Wanderer's Troupe"),
        makeArtifact("set_b", "Wanderer's Troupe"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      // set_a has 2 → 2pc bonus, set_b has 3 → 2pc bonus
      expect(result.activeSets).toHaveLength(2);
      expect(result.activeSets).toContainEqual({ setId: "set_a", setName: "Gladiator's Finale", pieces: 2 });
      expect(result.activeSets).toContainEqual({ setId: "set_b", setName: "Wanderer's Troupe", pieces: 2 });
    });

    it("returns no active sets when all artifacts are from different sets", () => {
      const artifacts = [
        makeArtifact("set_a", "Set A"),
        makeArtifact("set_b", "Set B"),
        makeArtifact("set_c", "Set C"),
        makeArtifact("set_d", "Set D"),
        makeArtifact("set_e", "Set E"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      expect(result.activeSets).toHaveLength(0);
    });

    it("returns empty activeSets for empty artifacts array", () => {
      const result = evaluateSetBonus([], []);
      expect(result.activeSets).toHaveLength(0);
    });
  });

  describe("active bonus determination (2-piece and 4-piece)", () => {
    it("recognizes a 4-piece bonus when count ≥ 4", () => {
      const artifacts = [
        makeArtifact("set_a", "Crimson Witch"),
        makeArtifact("set_a", "Crimson Witch"),
        makeArtifact("set_a", "Crimson Witch"),
        makeArtifact("set_a", "Crimson Witch"),
        makeArtifact("set_b", "Wanderer's Troupe"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      expect(result.activeSets).toContainEqual({ setId: "set_a", setName: "Crimson Witch", pieces: 4 });
      // set_b has only 1 piece, no bonus
      expect(result.activeSets).not.toContainEqual(expect.objectContaining({ setId: "set_b" }));
    });

    it("recognizes a 2-piece bonus when count ≥ 2 but < 4", () => {
      const artifacts = [
        makeArtifact("set_a", "Gladiator's Finale"),
        makeArtifact("set_a", "Gladiator's Finale"),
        makeArtifact("set_a", "Gladiator's Finale"),
        makeArtifact("set_b", "Wanderer's Troupe"),
        makeArtifact("set_b", "Wanderer's Troupe"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      expect(result.activeSets).toContainEqual({ setId: "set_a", setName: "Gladiator's Finale", pieces: 2 });
      expect(result.activeSets).toContainEqual({ setId: "set_b", setName: "Wanderer's Troupe", pieces: 2 });
    });

    it("reports 4-piece when exactly 5 artifacts from same set", () => {
      const artifacts = [
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      expect(result.activeSets).toHaveLength(1);
      expect(result.activeSets[0]).toEqual({ setId: "set_a", setName: "Emblem", pieces: 4 });
    });
  });

  describe("match status against recommended_sets", () => {
    it("returns 'full_match' when 4-piece matches recommended set", () => {
      const artifacts = [
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_b", "Wanderer's Troupe"),
      ];

      const result = evaluateSetBonus(artifacts, ["set_a"]);
      expect(result.matchStatus).toBe("full_match");
    });

    it("returns 'partial_match' when 2-piece matches but no 4-piece match", () => {
      const artifacts = [
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_b", "Noblesse"),
        makeArtifact("set_b", "Noblesse"),
        makeArtifact("set_c", "Other"),
      ];

      const result = evaluateSetBonus(artifacts, ["set_a"]);
      expect(result.matchStatus).toBe("partial_match");
    });

    it("returns 'no_match' when no active set matches recommended sets", () => {
      const artifacts = [
        makeArtifact("set_b", "Noblesse"),
        makeArtifact("set_b", "Noblesse"),
        makeArtifact("set_c", "Heart of Depth"),
        makeArtifact("set_c", "Heart of Depth"),
        makeArtifact("set_d", "Other"),
      ];

      const result = evaluateSetBonus(artifacts, ["set_a"]);
      expect(result.matchStatus).toBe("no_match");
    });

    it("returns 'no_recommendation' when recommendedSets is empty", () => {
      const artifacts = [
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_b", "Other"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      expect(result.matchStatus).toBe("no_recommendation");
    });

    it("returns 'no_recommendation' when recommendedSets is undefined-like (empty array)", () => {
      const artifacts = [makeArtifact("set_a", "Test"), makeArtifact("set_a", "Test")];
      const result = evaluateSetBonus(artifacts, []);
      expect(result.matchStatus).toBe("no_recommendation");
    });

    it("supports multiple recommended sets — partial match with second set", () => {
      const artifacts = [
        makeArtifact("set_b", "Noblesse"),
        makeArtifact("set_b", "Noblesse"),
        makeArtifact("set_c", "Other"),
        makeArtifact("set_c", "Other"),
        makeArtifact("set_d", "Random"),
      ];

      const result = evaluateSetBonus(artifacts, ["set_a", "set_b"]);
      expect(result.matchStatus).toBe("partial_match");
    });
  });

  describe("maximum 3 distinct active set bonuses", () => {
    it("at most 3 active sets from 5 artifact slots (2+2+1)", () => {
      // With 5 slots, the maximum distinct 2+ piece sets is 2 (e.g., 2+2+1 or 3+2 or 4+1)
      // Actually 3 distinct sets can't all have 2+ pieces from 5 slots (2+2+2=6 > 5)
      // So max is 2 distinct active set bonuses (2+2+1 or 4+1 or 3+2)
      const artifacts = [
        makeArtifact("set_a", "A"),
        makeArtifact("set_a", "A"),
        makeArtifact("set_b", "B"),
        makeArtifact("set_b", "B"),
        makeArtifact("set_c", "C"),
      ];

      const result = evaluateSetBonus(artifacts, []);
      // Only 2 sets qualify for 2-piece bonus (set_a and set_b)
      expect(result.activeSets.length).toBeLessThanOrEqual(3);
      expect(result.activeSets).toHaveLength(2);
    });
  });

  describe("does NOT apply any multiplier (informational only)", () => {
    it("returns only activeSets and matchStatus without any score modifier", () => {
      const artifacts = [
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_a", "Emblem"),
        makeArtifact("set_b", "Other"),
      ];

      const result = evaluateSetBonus(artifacts, ["set_a"]);
      // The result should only have activeSets and matchStatus — no multiplier field
      expect(Object.keys(result)).toEqual(expect.arrayContaining(["activeSets", "matchStatus"]));
      expect(result).not.toHaveProperty("multiplier");
      expect(result).not.toHaveProperty("scoreModifier");
    });
  });
});
