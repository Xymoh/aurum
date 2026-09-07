import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/locales/en";
import { format } from "../../src/i18n";
import type { Translate } from "../../src/lib/buildTarget/model";
import { getGenshinBuild, listGenshinBuilds } from "../../src/lib/buildTarget/genshin";
import { getHsrBuild, listHsrBuilds } from "../../src/hsr/buildTarget";
import { getZzzBuild, listZzzBuilds } from "../../src/zzz/buildTarget";

const t = ((section: string, key: string, vars?: Record<string, string | number>) =>
  format((en as unknown as Record<string, Record<string, string>>)[section][key], vars)) as Translate;

/** A dictionary key that leaked instead of a label looks exactly like this. */
const RAW_KEY = /^(FIGHT_PROP_|CRIT_|ATK_|HP_|DEF_|FLAT_|ELEMENTAL_|ENERGY_|HEALING_|PHYSICAL_|\d{5}$|[A-Z][a-z]+AddedRatio$)/;

describe("Genshin build targets", () => {
  it("lists every character, sorted by name", () => {
    const list = listGenshinBuilds(t);
    expect(list.length).toBeGreaterThan(100);
    expect([...list].sort((a, b) => a.name.localeCompare(b.name))).toEqual(list);
  });

  it("reads Hu Tao's curated build the way the scorer does", () => {
    const target = getGenshinBuild("10000046", t)!;

    expect(target.name).toBe("Hu Tao");
    expect(target.generic).toBe(false);
    // HP% sands and a Pyro goblet are the whole point of the character.
    expect(target.slots.find((s) => s.slot === "Sands")?.stats).toContain("HP%");
    expect(target.slots.find((s) => s.slot === "Goblet")?.stats).toContain("Pyro DMG");
    expect(target.sets.flatMap((r) => r.parts.map((p) => p.name))).toContain("Crimson Witch of Flames");
    expect(target.energyTarget).toBeGreaterThan(0);
    // Crit leads the priority for a crit-scaling DPS.
    expect(target.substats[0].weight).toBe(1);
  });

  it("collapses the two spellings of an elemental goblet into one label", () => {
    // The data carries both CRYO_DMG and ICE_ADD_HURT for the same stat.
    const ayaka = getGenshinBuild("10000002", t)!;
    const goblet = ayaka.slots.find((s) => s.slot === "Goblet")!;
    expect(goblet.stats).toEqual(["Cryo DMG"]);
  });

  it("leaves unreleased placeholders out of the picker", () => {
    const list = listGenshinBuilds(t);
    // Manekin and Manekina exist in Enka's table with no build, art or icon.
    expect(list.some((l) => l.name.startsWith("Manekin"))).toBe(false);
    expect(list.length).toBeGreaterThan(110);
  });

  it("returns null for an id that is not a character", () => {
    expect(getGenshinBuild("999999", t)).toBeNull();
  });
});

describe("Star Rail build targets", () => {
  it("advises only the four slots whose main stat is a choice", () => {
    const target = getHsrBuild("1006", t)!;
    expect(target.name).toBe("Silver Wolf");
    expect(target.slots.map((s) => s.slot)).toEqual(["Body", "Boots", "Sphere", "Rope"]);
  });

  it("reads relic and ornament sets out of the Fribbels simulation block", () => {
    const parts = (id: string) => getHsrBuild(id, t)!.sets.flatMap((r) => r.parts);
    expect(parts("1310")).toContainEqual(expect.objectContaining({ name: "Iron Cavalry Against the Scourge", pieces: 4 }));
    expect(parts("1310")).toContainEqual(expect.objectContaining({ name: "Forge of the Kalpagni Lantern", pieces: 2 }));
    // An escaped apostrophe in the upstream source must survive the parse.
    expect(parts("1407").map((p) => p.name)).toContain("Bone Collection's Serene Demesne");
  });

  it("gives every set an icon, resolved through the sets table", () => {
    for (const id of ["1310", "1407"]) {
      for (const part of getHsrBuild(id, t)!.sets.flatMap((r) => r.parts)) {
        expect(part.iconUrl).toMatch(/\/icon\/relic\/\d+\.png$/);
      }
    }
  });

  it("names the Trailblazer instead of the game's {NICKNAME} placeholder", () => {
    const list = listHsrBuilds(t);
    expect(list.some((l) => l.name.includes("{NICKNAME}"))).toBe(false);
    expect(list.filter((l) => l.name.startsWith("Trailblazer (Caelus)")).length).toBe(5);
    expect(list.filter((l) => l.name.startsWith("Trailblazer (Stelle)")).length).toBe(5);
  });

  it("has a curated entry for the whole roster", () => {
    // Fribbels covers every released character, so nothing here should fall
    // back to a Path default. A generic entry appearing means the metadata
    // has gone stale against a new patch.
    const list = listHsrBuilds(t);
    expect(list.length).toBeGreaterThan(90);
    expect(list.filter((l) => l.generic).map((l) => l.name)).toEqual([]);
  });
});

describe("Zenless build targets", () => {
  it("has a Prydwen entry for every agent", () => {
    const list = listZzzBuilds(t);
    expect(list.length).toBeGreaterThan(50);
    expect(list.filter((l) => l.generic).map((l) => l.name)).toEqual([]);
  });

  it("advises only discs 4 to 6 and quotes the guide", () => {
    const target = getZzzBuild("1011", t)!;
    expect(target.name).toBe("Anby");
    expect(target.slots.map((s) => s.slot)).toEqual(["Disc 4", "Disc 5", "Disc 6"]);
    expect(target.priority).toContain("CRIT");
    expect(target.source.url).toContain("prydwen.gg");
  });
});

describe("every target is display-ready", () => {
  const targets = [
    getGenshinBuild("10000046", t)!,
    getHsrBuild("1006", t)!,
    getZzzBuild("1011", t)!,
  ];

  it("resolves every stat and slot to a label, never a raw key", () => {
    for (const target of targets) {
      for (const slot of target.slots) {
        expect(slot.slot).not.toMatch(RAW_KEY);
        for (const stat of slot.stats) expect(stat).not.toMatch(RAW_KEY);
      }
      for (const stat of target.substats) expect(stat.label).not.toMatch(RAW_KEY);
    }
  });

  it("ranks substats by descending weight and drops the useless ones", () => {
    for (const target of targets) {
      const weights = target.substats.map((s) => s.weight);
      expect(weights).toEqual([...weights].sort((a, b) => b - a));
      expect(weights.every((w) => w > 0)).toBe(true);
    }
  });
});
