import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { splitEmphasis } from "../../src/lib/buildTarget/guideText";
import { guideSource } from "../../src/lib/buildTarget/guideSource";
import { parseTravelerBuildId } from "../../src/lib/travelerBuilds";
import type { GuideFile, GuidePicksFile, GuideText, SetBonusFile } from "../../src/lib/buildTarget/guide";
import genshinCharacters from "../../src/data/characters.json";
import genshinWeapons from "../../src/data/weapon-ids.json";
import genshinSets from "../../src/data/artifacts.json";
import hsrCharacters from "../../src/hsr/data/characters.json";
import hsrLightCones from "../../src/hsr/data/light-cones.json";
import hsrSets from "../../src/hsr/data/sets.json";
import zzzAgents from "../../src/zzz/data/agents.json";
import zzzWeapons from "../../src/zzz/data/weapons.json";
import zzzSets from "../../src/zzz/data/sets.json";

describe("splitEmphasis", () => {
  it("alternates plain and highlighted runs", () => {
    expect(splitEmphasis("Deals **120%** of ATK")).toEqual([
      { text: "Deals ", strong: false },
      { text: "120%", strong: true },
      { text: " of ATK", strong: false },
    ]);
  });

  it("keeps line breaks inside runs for the view to lay out", () => {
    expect(splitEmphasis("**Charged Attack**\nLunges forward")).toEqual([
      { text: "Charged Attack", strong: true },
      { text: "\nLunges forward", strong: false },
    ]);
  });

  it("emphasises to the end after an unpaired marker instead of dropping text", () => {
    const runs = splitEmphasis("a **b");
    expect(runs.map((r) => r.text).join("")).toBe("a b");
    expect(runs.at(-1)).toEqual({ text: "b", strong: true });
  });

  it("returns nothing for empty text", () => {
    expect(splitEmphasis("")).toEqual([]);
  });
});

describe("guideSource", () => {
  const file = { role: "Main DPS", materials: [] } as unknown as GuideFile;
  const source = guideSource(
    "genshin",
    { "../../data/guides/10000046.json": async () => file },
    {},
  );

  it("finds a guide by the id in its file name", async () => {
    await expect(source.load("10000046")).resolves.toBe(file);
  });

  it("points an icon the site ships at the deployed base, and leaves full URLs alone", async () => {
    const item = (id: string, iconUrl: string) => ({ id, name: id, iconUrl, rarity: 3, count: 1 });
    const shipped = {
      role: null,
      materials: [{ id: "skills", items: [item("10", "zzz/items/IconCoin.webp"), item("202", "https://gi.yatta.moe/assets/UI/UI_ItemIcon_202.png")] }],
    } as unknown as GuideFile;
    const zzz = guideSource("zzz", { "./data/guides/1191.json": async () => shipped }, {});
    const loaded = await zzz.load("1191");
    expect(loaded?.materials[0].items.map((i) => i.iconUrl)).toEqual([
      `${import.meta.env.BASE_URL}zzz/items/IconCoin.webp`,
      "https://gi.yatta.moe/assets/UI/UI_ItemIcon_202.png",
    ]);
  });

  it("resolves a character with no file to null rather than failing", async () => {
    await expect(source.load("10000999")).resolves.toBeNull();
  });

  it("treats a missing set-bonus file as an empty table", async () => {
    await expect(source.loadSetBonuses()).resolves.toEqual({});
  });
});

/**
 * The generated files, checked against the contract. The build scripts
 * assert the same things as they write; this catches a hand edit or a
 * script change that dropped its own check.
 */
const GAMES = [
  {
    game: "genshin",
    guides: import.meta.glob<GuideFile>("../../src/data/guides/*.json", { eager: true, import: "default" }),
    bonuses: import.meta.glob<SetBonusFile>("../../src/data/set-bonuses.json", { eager: true, import: "default" }),
    picks: import.meta.glob<GuidePicksFile>("../../src/data/guide-picks.json", { eager: true, import: "default" }),
    characters: genshinCharacters as Record<string, unknown>,
    weapons: genshinWeapons as Record<string, unknown>,
    sets: genshinSets as Record<string, unknown>,
  },
  {
    game: "hsr",
    guides: import.meta.glob<GuideFile>("../../src/hsr/data/guides/*.json", { eager: true, import: "default" }),
    bonuses: import.meta.glob<SetBonusFile>("../../src/hsr/data/set-bonuses.json", { eager: true, import: "default" }),
    picks: import.meta.glob<GuidePicksFile>("../../src/hsr/data/guide-picks.json", { eager: true, import: "default" }),
    characters: hsrCharacters as Record<string, unknown>,
    weapons: hsrLightCones as Record<string, unknown>,
    sets: hsrSets as Record<string, unknown>,
  },
  {
    game: "zzz",
    guides: import.meta.glob<GuideFile>("../../src/zzz/data/guides/*.json", { eager: true, import: "default" }),
    bonuses: import.meta.glob<SetBonusFile>("../../src/zzz/data/set-bonuses.json", { eager: true, import: "default" }),
    picks: import.meta.glob<GuidePicksFile>("../../src/zzz/data/guide-picks.json", { eager: true, import: "default" }),
    characters: zzzAgents as Record<string, unknown>,
    weapons: zzzWeapons as Record<string, unknown>,
    sets: zzzSets as Record<string, unknown>,
  },
];

/** Why a piece of GuideText is not display-ready, or null when it is. */
function textProblem(text: GuideText): string | null {
  if (/<\/?[a-z][^>]*>/i.test(text)) return "markup";
  if (/\{[^}]*\}/.test(text)) return "placeholder";
  if (/#\d+\[/.test(text)) return "unresolved parameter";
  if ((text.match(/\*\*/g) ?? []).length % 2 !== 0) return "unbalanced **";
  return null;
}

function allTexts(guide: GuideFile): GuideText[] {
  return [
    ...guide.weapons.flatMap((w) => (w.passive ? [w.passive.text] : [])),
    ...guide.kit.flatMap((g) => g.entries.map((e) => e.text)),
  ];
}

const idOf = (path: string) => path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");

/** Whether the game's table knows an id, reading one of the Traveler's per-element pages as their avatar id. */
const knows = (table: Record<string, unknown>, id: string) => id in table || String(parseTravelerBuildId(id)?.avatarId) in table;

describe.each(GAMES)("$game guide files", ({ guides, bonuses, picks, characters, weapons, sets }) => {
  const entries = Object.entries(guides);

  it.skipIf(entries.length === 0)("are keyed by ids the game's own tables know", () => {
    for (const [path] of entries) expect(knows(characters, idOf(path)), path).toBe(true);
  });

  it.skipIf(entries.length === 0)("carry every field the contract names", () => {
    const keys = ["role", "weapons", "teams", "synergies", "substatLine", "endgameStats", "skillPriority", "tracePriority", "source", "baseStats", "bonusStats", "kit", "materials", "kitChangedAt", "kitHash"];
    for (const [path, guide] of entries) {
      for (const key of keys) expect(guide, `${path} ${key}`).toHaveProperty([key]);
    }
  });

  it.skipIf(entries.length === 0)("hold display-ready text only", () => {
    const problems: string[] = [];
    for (const [path, guide] of entries) {
      for (const text of allTexts(guide)) {
        const problem = textProblem(text);
        if (problem) problems.push(`${idOf(path)}: ${problem} in "${text.slice(0, 60)}"`);
      }
    }
    expect(problems).toEqual([]);
  });

  it.skipIf(entries.length === 0)("recommend weapons and teammates the game's tables know", () => {
    for (const [path, guide] of entries) {
      for (const weapon of guide.weapons) expect(weapons, `${path} weapon`).toHaveProperty([weapon.id]);
      for (const team of guide.teams) {
        for (const member of team.members) expect(knows(characters, member), `${path} team ${member}`).toBe(true);
        if (team.alternates) {
          // One list per slot, never repeating someone already in the team.
          expect(team.alternates, `${path} alternates`).toHaveLength(team.members.length);
          for (const alt of team.alternates.flat()) {
            expect(knows(characters, alt), `${path} alternate ${alt}`).toBe(true);
            expect(team.members, `${path} alternate ${alt}`).not.toContain(alt);
          }
        }
      }
      for (const id of guide.synergies) expect(knows(characters, id), `${path} synergy ${id}`).toBe(true);
    }
  });

  it.skipIf(Object.keys(bonuses).length === 0)("describe sets the sets table knows, in display-ready text", () => {
    const table = Object.values(bonuses)[0];
    for (const [id, entry] of Object.entries(table)) {
      expect(sets, id).toHaveProperty([id]);
      for (const bonus of entry.bonuses) expect(textProblem(bonus.text), `${id} ${bonus.pieces}pc`).toBeNull();
    }
  });

  it.skipIf(Object.keys(picks).length === 0)("have picks keyed by character id", () => {
    const file = Object.values(picks)[0];
    for (const id of Object.keys(file.characters)) expect(knows(characters, id), id).toBe(true);
  });

  it.skipIf(entries.length === 0)("give each material icon as a full URL or a file the site ships", () => {
    for (const [file, guide] of entries) {
      for (const item of guide.materials.flatMap((group) => group.items)) {
        if (item.iconUrl === null || item.iconUrl.startsWith("https://")) continue;
        // A path under public/, which the loader resolves against the deployed base.
        expect(item.iconUrl, `${file} ${item.name}`).toMatch(/^[a-z]+\/[a-z]+\/[\w-]+\.webp$/);
        expect(existsSync(path.join(process.cwd(), "public", item.iconUrl)), `${file} ${item.iconUrl}`).toBe(true);
      }
    }
  });

  it.skipIf(entries.length === 0)("date a guide only with a real calendar day", () => {
    for (const [path, guide] of entries) {
      for (const day of [guide.source?.updated, guide.kitChangedAt]) {
        if (day != null) expect(day, path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
