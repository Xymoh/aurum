import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { characterIndex, erFromFigures, kqmEntry, memberName, parseKqmGuide, substatTiers, talentOrder } from "../../scripts/fetch-kqm-guides.mjs";

const html = fs.readFileSync(path.join(__dirname, "../fixtures/kqm-furina.html"), "utf8");
const report = () => ({ weapons: new Set<string>(), sets: new Set<string>(), members: new Set<string>(), stats: new Set<string>() });

describe("KQM quick guide", () => {
  it("reads Furina's page into a source entry", () => {
    const seen = report();
    // Every weapon row carries KQM's tooltip id, so no name index is needed.
    const entry = kqmEntry(parseKqmGuide(html), { id: "10000089", url: "https://keqingmains.com/q/furina-quickguide/", weaponByName: new Map(), characterId: characterIndex(), report: seen });
    expect(entry).toEqual({
      name: "Furina",
      url: "https://keqingmains.com/q/furina-quickguide/",
      updated: "2026-02-01",
      role: "Off-Field DPS + Support",
      weapons: ["11513", "11514", "11505", "11511"].map((id) => ({ id, refinement: null })),
      teams: [
        { name: "Hypercarry & Mono Element", members: ["10000089", "10000087", "10000047", "10000103"], alternates: [[], [], [], ["10000030", "10000005-pyro"]] },
        { name: "Hypercarry & Mono Element", members: ["10000089", "10000054", "10000047", "10000025"], alternates: [[], [], [], ["10000060"]] },
        { name: "Vaporize", members: ["10000089", "10000046", "10000060", "10000103"], alternates: [[], [], [], ["10000093", "10000003"]] },
        { name: "Vaporize", members: ["10000089", "10000032", "10000023", "10000025"] },
      ],
      synergies: [],
      mainStats: { SANDS: ["HP_PERCENT", "ENERGY_RECHARGE"], GOBLET: ["HP_PERCENT", "HYDRO_DMG"], CIRCLET: ["CRIT_RATE", "CRIT_DMG"] },
      substats: [["ENERGY_RECHARGE"], ["CRIT_DMG", "CRIT_RATE"], ["HP_PERCENT"]],
      endgameStats: [],
      skillPriority: "Elemental Burst > Elemental Skill",
      tracePriority: null,
      erTarget: 150,
      sets: [[{ setId: "15032", pieces: 4 }], [{ setId: "15017", pieces: 4 }], [{ setId: "15037", pieces: 4 }], [{ setId: "15042", pieces: 4 }]],
      relicSets: [],
      ornamentSets: [],
    });
    // Reported, not guessed: a weapon class, a mixed-set row and team templates.
    expect([...seen.weapons]).toEqual(["CRIT Swords"]);
    expect([...seen.sets]).toEqual(["2pc Mixed Sets"]);
    // A template stops at its first role, so "Flex" is never looked up.
    expect([...seen.members]).toEqual(["Healer", "Pyro"]);
  });

  it("reads a slot's name past its constellation, archetype and footnote", () => {
    expect(["C6 Faruzan", "(C6) Xingqiu", "Bennett C6", "Freeze: Chongyun", "Kazuha *See Raiden guide for more details."].map(memberName)).toEqual(["Faruzan", "Xingqiu", "Bennett", "Chongyun", "Kazuha"]);
  });

  it("leaves the Limited Roster teams out", () => {
    const teams = parseKqmGuide(html).teams.map((t) => t.members.map((slot) => slot[0]).join(" "));
    expect(teams).not.toContain("Furina Barbara Lynette Xingqiu");
  });
});

describe("KQM stat lines", () => {
  it("rank substats, numbered or not, and rank each stat once", () => {
    expect(substatTiers("1. EM to ~100 2. CRIT 3. EM to 200-300 4. HP% 5. ATK% 6. Flat HP = Flat ATK 7. ER")).toEqual([
      ["ELEMENTAL_MASTERY"],
      ["CRIT_RATE", "CRIT_DMG"],
      ["HP_PERCENT"],
      ["ATK_PERCENT"],
      ["FLAT_HP", "FLAT_ATK"],
      ["ENERGY_RECHARGE"],
    ]);
    const unmapped = new Set<string>();
    expect(substatTiers("ER (until requirement) > EM ≥ Dendro DMG% ≥ CRIT", unmapped)).toEqual([["ENERGY_RECHARGE"], ["ELEMENTAL_MASTERY"], ["CRIT_RATE", "CRIT_DMG"]]);
    expect([...unmapped]).toEqual(["Dendro DMG%"]);
  });

  it("read talents in order, ignoring levels", () => {
    expect(talentOrder("(Character Level) > Burst >= Skill >>> Normal Attack")).toBe("Elemental Burst > Elemental Skill > Normal Attack");
    expect(talentOrder("Skill > Character Level = Burst")).toBe("Elemental Skill > Elemental Burst");
    expect(talentOrder("Level 90 = Elemental Skill ≥ Elemental Burst > Normal Attack")).toBe("Elemental Skill > Elemental Burst > Normal Attack");
    expect(talentOrder("Character Level > Skill")).toBeNull();
  });

  it("take the middle of the stated ER requirements, and none when nothing is needed", () => {
    expect(erFromFigures(["200-220%", "130-190%"])).toBe(165);
    expect(erFromFigures(["100%", "100%", "105–140% w/ 1 Fav proc"])).toBeNull();
    expect(erFromFigures([])).toBeNull();
  });
});
