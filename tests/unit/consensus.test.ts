import { describe, expect, it } from "vitest";
// prettier-ignore
// @ts-expect-error - plain ESM script, no type declarations
import { consensusPicks, medianTarget, priorityLine, rankedVote, voteMainStats, voteSubstats } from "../../scripts/consensus.mjs";

const entry = (fields: Record<string, unknown>) => ({
  name: "Test",
  url: "",
  updated: null,
  role: null,
  weapons: [],
  teams: [],
  synergies: [],
  mainStats: null,
  substats: null,
  endgameStats: [],
  skillPriority: null,
  tracePriority: null,
  erTarget: null,
  sets: [],
  ...fields,
});

const items = (ranked: Array<{ item: unknown }>) => ranked.map((r) => r.item);

describe("rankedVote", () => {
  it("lets the heavier source lead but not override two lighter ones that agree", () => {
    const ranked = rankedVote([
      { weight: 3, items: ["A", "B", "C"] },
      { weight: 2, items: ["B", "A", "D"] },
      { weight: 1, items: ["B", "D"] },
    ]);
    // A: 3 + 1 = 4; B: 1.5 + 2 + 1 = 4.5; D: 0.67 + 0.5; C: 1.
    expect(items(ranked)).toEqual(["B", "A", "D", "C"]);
  });

  it("breaks a tie for the heavier source", () => {
    expect(
      items(
        rankedVote([
          { weight: 1, items: ["X"] },
          { weight: 2, items: ["Y", "X"] },
        ]),
      ),
    ).toEqual(["Y", "X"]);
  });

  it("counts the same pick from two sites once, keeping the heavier site's copy", () => {
    const ranked = rankedVote(
      [
        { weight: 2, items: [{ id: "1", refinement: 5 }] },
        { weight: 3, items: [{ id: "1", refinement: 1 }] },
      ],
      (w: { id: string }) => w.id,
    );
    expect(items(ranked)).toEqual([{ id: "1", refinement: 1 }]);
  });
});

describe("voteMainStats", () => {
  it("keeps an alternative only when other sources back it", () => {
    const stats = voteMainStats([
      {
        weight: 3,
        entry: entry({
          mainStats: { SANDS: ["ATK_PERCENT", "ELEMENTAL_MASTERY"], GOBLET: ["PYRO_DMG"] },
        }),
      },
      {
        weight: 2,
        entry: entry({
          mainStats: { SANDS: ["ATK_PERCENT"], GOBLET: ["PYRO_DMG", "ATK_PERCENT"] },
        }),
      },
      { weight: 1, entry: entry({ mainStats: { SANDS: ["ELEMENTAL_MASTERY"] } }) },
    ]);
    // Sands: ATK% 5, EM 1.5 + 1 = 2.5 (half the top): kept. Goblet: ATK% 1 of 5: dropped.
    expect(stats).toEqual({ SANDS: ["ATK_PERCENT", "ELEMENTAL_MASTERY"], GOBLET: ["PYRO_DMG"] });
  });

  it("is null when no source names any", () => {
    expect(voteMainStats([{ weight: 3, entry: entry({}) }])).toBeNull();
  });
});

describe("voteSubstats", () => {
  it("averages each source's tier weights by trust and snaps them onto the scale", () => {
    const weights = voteSubstats([
      { weight: 3, entry: entry({ substats: [["20103", "21103"], ["12102"], ["23203"]] }) },
      { weight: 2, entry: entry({ substats: [["20103", "21103"], ["23203"], ["12102"]] }) },
    ]);
    // ATK%: (3 * 0.75 + 2 * 0.5) / 5 = 0.65 -> 0.75; PEN: (3 * 0.5 + 2 * 0.75) / 5 = 0.6 -> 0.5.
    expect(weights).toEqual({ 20103: 1, 21103: 1, 12102: 0.75, 23203: 0.5 });
  });

  it("drops a stat only a light source mentions low down", () => {
    const weights = voteSubstats([
      { weight: 3, entry: entry({ substats: [["20103"]] }) },
      { weight: 1, entry: entry({ substats: [["20103"], ["12102"], ["12103"], ["13103"]] }) },
    ]);
    expect(weights).toEqual({ 20103: 1, 12102: 0.25 });
  });

  it("counts a stat a site names twice once", () => {
    expect(
      voteSubstats([{ weight: 3, entry: entry({ substats: [["20103"], ["12103", "12103"]] }) }]),
    ).toEqual({ 20103: 1, 12103: 0.75 });
  });

  it("writes the weights back as a priority line", () => {
    expect(priorityLine({ 20103: 1, 21103: 1, 12102: 0.75, 23203: 0.5 })).toBe(
      "CRIT Rate = CRIT DMG > ATK% > PEN",
    );
  });
});

describe("medianTarget", () => {
  it("takes the median of the stated targets to the nearest 5", () => {
    expect(medianTarget([160, 180, 200])).toBe(180);
    expect(medianTarget([130, 142])).toBe(135);
    expect(medianTarget([null, undefined])).toBeNull();
  });
});

describe("consensusPicks", () => {
  const picks = consensusPicks([
    {
      weight: 3,
      entry: entry({
        updated: "2026-09-01",
        role: "Main DPS",
        teams: [{ name: "Site label", members: ["1", "2", "3", "4"] }],
        skillPriority: "Burst > Skill",
        endgameStats: [{ label: "CRIT Rate", value: "70%+" }],
      }),
    },
    {
      weight: 2,
      entry: entry({
        updated: "2026-10-01",
        role: "DPS",
        teams: [{ name: "Other label", members: ["4", "3", "2", "1"] }],
        endgameStats: [
          { label: "Crit rate", value: "60%" },
          { label: "Energy Recharge", value: "130%" },
        ],
      }),
    },
  ]);

  it("records how many guides agree and the newest date among them", () => {
    expect(picks.sources).toBe(2);
    expect(picks.updated).toBe("2026-10-01");
  });

  it("publishes no site's own wording", () => {
    expect(picks.teams).toEqual([{ name: null, members: ["1", "2", "3", "4"] }]);
    expect(picks.substatLine).toBeNull();
  });

  it("takes single answers and figures from the heaviest source that gives them", () => {
    expect(picks.role).toBe("Main DPS");
    expect(picks.skillPriority).toBe("Burst > Skill");
    expect(picks.endgameStats).toEqual([
      { label: "CRIT Rate", value: "70%+" },
      { label: "Energy Recharge", value: "130%" },
    ]);
  });
});
