import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lookups, parseGuidePage, substatTiers, toEntry } from "../../scripts/fetch-game8-guides.mjs";

/** Game8 pages as of October 2026, cut down to the sections the reader looks at. */
const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8");

function entryFor(file: string, game: "hsr" | "zzz") {
  const parsed = parseGuidePage(fixture(file), game);
  const look = lookups(game);
  const ids = look.idsFor(parsed.titleName);
  const report = { weapons: new Set(), sets: new Set(), members: new Set(), stats: new Set() };
  const entry = toEntry(parsed, { game, id: ids[0], ownIds: ids, name: look.characters[ids[0]].name, url: parsed.canonical, look }, report);
  return { ids, entry, report };
}

describe("Game8 Star Rail build page", () => {
  const { ids, entry, report } = entryFor("game8-hsr-firefly.html", "hsr");

  it("reads Firefly's picks as ids and scorer keys", () => {
    expect(ids).toEqual(["1310"]);
    expect(entry).toMatchObject({
      name: "Firefly",
      url: "https://game8.co/games/Honkai-Star-Rail/archives/437263",
      updated: "2026-06-19",
      role: "Break Effect",
      // The build's cone, then its numbered alternatives.
      weapons: ["23025", "24000", "21042", "21033", "23002", "21005"].map((id) => ({ id, refinement: null })),
      mainStats: { BODY: ["AttackAddedRatio"], FOOT: ["SpeedDelta"], NECK: ["AttackAddedRatio"], OBJECT: ["BreakDamageAddedRatioBase"] },
      // Equal stars are one tier.
      substats: [["BreakDamageAddedRatioBase", "AttackAddedRatio"], ["SpeedDelta"], ["AttackDelta"]],
      endgameStats: [
        { label: "Break Effect", value: "360%+" },
        { label: "ATK", value: "2600+" },
        { label: "Speed", value: "150 / 164 (with Ruan Mei) / 178-188 (with The Dahlia)" },
      ],
      skillPriority: "Ultimate > Skill = Talent > Basic Attack",
      tracePriority: "Module α: Antilag Outburst = Module β: Autoreactive Armor > Module γ: Core Overload",
      sets: [],
    });
  });

  it("splits ranked relics from ornaments, and reads 2+2 ranks", () => {
    expect(entry.relicSets).toEqual([
      [{ setId: "119", pieces: 4 }],
      [{ setId: "111", pieces: 4 }],
      [
        { setId: "111", pieces: 2 },
        { setId: "114", pieces: 2 },
      ],
    ]);
    expect(entry.ornamentSets).toEqual([[{ setId: "316", pieces: 2 }], [{ setId: "307", pieces: 2 }], [{ setId: "301", pieces: 2 }]]);
  });

  it("names teams without the character, and maps the bracketed Trailblazer to a Path", () => {
    expect(entry.teams).toEqual([
      { name: "F2P Team (Free to Play)", members: ["1310", "8005", "1009", "1110"] },
      { name: "Super Break Team", members: ["1310", "1225", "1321", "1222"] },
    ]);
    expect(entry.synergies.slice(0, 3)).toEqual(["1303", "8005", "1009"]);
    expect([...report.members, ...report.sets, ...report.weapons, ...report.stats]).toEqual([]);
  });
});

describe("Game8 Zenless build page", () => {
  const { ids, entry, report } = entryFor("game8-zzz-ellen.html", "zzz");

  it("reads Ellen's picks as ids and property ids", () => {
    expect(ids).toEqual(["1191"]);
    expect(entry).toMatchObject({
      name: "Ellen",
      updated: "2026-10-09",
      // Her Specialty, not the build's title ("Ellen Premium").
      role: "Attack",
      weapons: ["14119", "14104", "14001", "13001", "13004"].map((id) => ({ id, refinement: null })),
      mainStats: { "4": ["20103", "21103"], "5": ["31703"], "6": ["12102"] },
      substats: [["21103"], ["20103"], ["12102"]],
      skillPriority: "Core Skill = Basic Attack = Special Attack > Chain Attack > Dodge > Assist",
      tracePriority: null,
      sets: [
        [
          { setId: "32500", pieces: 4 },
          { setId: "31000", pieces: 2 },
        ],
        [
          { setId: "31100", pieces: 4 },
          { setId: "31000", pieces: 2 },
        ],
      ],
      relicSets: [],
      ornamentSets: [],
    });
  });

  it("leaves the Bangboo out of teams", () => {
    expect(entry.teams).toEqual([
      { name: "F2P Team", members: ["1191", "1011", "1131"] },
      { name: "Premium Team", members: ["1191", "1161", "1311"] },
    ]);
    expect(report.members.size).toBe(0);
  });
});

describe("substatTiers", () => {
  it("reads an ordered line, with = and / joining a tier", () => {
    const unknown = new Set<string>();
    expect(substatTiers("hsr", ["CRIT Rate = CRIT DMG > SPD / Break Effect > Flat ATK"], unknown)).toEqual([
      ["CriticalChanceBase", "CriticalDamageBase"],
      ["SpeedDelta", "BreakDamageAddedRatioBase"],
      ["AttackDelta"],
    ]);
    expect(unknown.size).toBe(0);
  });
});
