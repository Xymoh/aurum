/**
 * The account-wide "what to work on next" list. A mistake here doesn't crash
 * anything - the panel just gives plausible-looking but worse advice - so the
 * ranking rules are pinned down one by one.
 */
import { describe, expect, it } from "vitest";
import { getWeakestArtifacts, type RankedArtifact } from "../../src/lib/insights";
import type { Artifact, RerollAction, RerollAdvice } from "../../src/types/artifact";
import type { CharacterData } from "../../src/types/character";

/** Only the fields the ranking reads; the rest of an Artifact plays no part. */
function piece(
  id: string,
  action: RerollAction,
  priority: RerollAdvice["priority"] = null,
  { dust = 10, percent = 50 }: { dust?: number; percent?: number } = {},
): Artifact {
  return {
    id,
    score: { potentialPercent: percent, reroll: { action, priority, expectedDust: dust } },
  } as unknown as Artifact;
}

function character(id: string, artifacts: Artifact[]): CharacterData {
  return { id, name: `Name ${id}`, icon: `icon-${id}`, artifacts } as unknown as CharacterData;
}

const ids = (ranked: RankedArtifact[]) => ranked.map((r) => r.artifact.id);

describe("getWeakestArtifacts", () => {
  it("puts high-priority rerolls first, then medium, then replacements, then low", () => {
    const ranked = getWeakestArtifacts([
      character("a", [piece("low", "reroll", "low")]),
      character("b", [piece("replace", "replace")]),
      character("c", [piece("medium", "reroll", "medium")]),
      character("d", [piece("high", "reroll", "high")]),
    ]);
    expect(ids(ranked)).toEqual(["high", "medium", "replace", "low"]);
    expect(ranked[0]).toMatchObject({ characterId: "d", characterName: "Name d", characterIcon: "icon-d" });
  });

  it("orders rerolls in the same tier by expected dust, cheapest first", () => {
    const ranked = getWeakestArtifacts([
      character("a", [piece("dust30", "reroll", "high", { dust: 30 })]),
      character("b", [piece("dust5", "reroll", "high", { dust: 5 })]),
      character("c", [piece("dust12", "reroll", "high", { dust: 12 })]),
    ]);
    expect(ids(ranked)).toEqual(["dust5", "dust12", "dust30"]);
  });

  it("orders replacements by score, weakest first, ignoring dust", () => {
    // Dust runs the opposite way to the score, so sorting by the wrong field fails.
    const ranked = getWeakestArtifacts([
      character("a", [piece("p70", "replace", null, { percent: 70, dust: 1 })]),
      character("b", [piece("p20", "replace", null, { percent: 20, dust: 3 })]),
      character("c", [piece("p45", "replace", null, { percent: 45, dust: 2 })]),
    ]);
    expect(ids(ranked)).toEqual(["p20", "p45", "p70"]);
  });

  it("leaves out pieces there is nothing to do with, however weak", () => {
    const ranked = getWeakestArtifacts([
      character("a", [piece("done", "none", null, { percent: 5 }), piece("unleveled", "level_up", null, { percent: 1 })]),
      character("b", [piece("replace", "replace", null, { percent: 90 })]),
    ]);
    expect(ids(ranked)).toEqual(["replace"]);
  });

  it("takes at most two pieces from one character, making room for others", () => {
    const ranked = getWeakestArtifacts([
      character("a", [1, 2, 3, 4, 5].map((n) => piece(`a${n}`, "reroll", "high", { dust: n }))),
      character("b", [piece("b-replace", "replace")]),
    ]);
    expect(ids(ranked)).toEqual(["a1", "a2", "b-replace"]);
  });

  it("stops at the limit, six by default", () => {
    const characters = ["a", "b", "c", "d"].map((id, i) =>
      character(id, [
        piece(`${id}1`, "reroll", "high", { dust: i + 1 }),
        piece(`${id}2`, "reroll", "high", { dust: i + 10 }),
      ]),
    );
    expect(getWeakestArtifacts(characters)).toHaveLength(6);
    expect(ids(getWeakestArtifacts(characters, 3))).toEqual(["a1", "b1", "c1"]);
  });
});
