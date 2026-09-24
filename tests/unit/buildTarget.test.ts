import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/locales/en";
import { format } from "../../src/i18n";
import type { Translate } from "../../src/lib/buildTarget/model";
import { genshinBuildId, getGenshinBuild, listGenshinBuilds, movedGenshinBuild } from "../../src/lib/buildTarget/genshin";
import { checkMainStat } from "../../src/lib/scoring";
import { getHsrBuild, listHsrBuilds, sameHsrBuild } from "../../src/hsr/buildTarget";
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
    // Game8 states no Energy Recharge figure for her, so there is no target.
    expect(target.energyTarget).toBeNull();
    // Crit leads the priority for a crit-scaling DPS.
    expect(target.substats[0].weight).toBe(1);
  });

  it("collapses the two spellings of an elemental goblet into one label", () => {
    // The data carries both CRYO_DMG and ICE_ADD_HURT for the same stat.
    const ayaka = getGenshinBuild("10000002", t)!;
    const goblet = ayaka.slots.find((s) => s.slot === "Goblet")!;
    expect(goblet.stats).toEqual(["Cryo DMG"]);
  });

  it("leaves the Miliastra Wonderland avatars out of the picker", () => {
    const list = listGenshinBuilds(t);
    // Manekin and Manekina exist only in that mode, with no build, art or icon.
    expect(list.some((l) => l.name.startsWith("Manekin"))).toBe(false);
    expect(list.length).toBeGreaterThan(110);
  });

  it("returns null for an id that is not a character", () => {
    expect(getGenshinBuild("999999", t)).toBeNull();
  });

  it("accepts the guide's main stats alongside the curated ones, the guide's first", () => {
    // The hand-kept build says an EM circlet; Game8 now leads with CRIT for
    // her Stellar Swirl build. A player following either is not marked wrong.
    expect(checkMainStat("CIRCLET", "FIGHT_PROP_CRITICAL", 10000109).isCorrect).toBe(true);
    expect(checkMainStat("CIRCLET", "FIGHT_PROP_ELEMENT_MASTERY", 10000109).isCorrect).toBe(true);
    expect(checkMainStat("CIRCLET", "FIGHT_PROP_ATTACK_PERCENT", 10000109).isCorrect).toBe(false);
    const circlet = getGenshinBuild("10000109", t)!.slots.find((s) => s.slot === "Circlet")!;
    expect(circlet.stats[0]).toBe("CRIT Rate");
    expect(circlet.stats).toContain("Elemental Mastery");
  });

  it("takes an Energy Recharge target only where the guide states one", () => {
    // Bennett's page says "200 ~ 250%": the low end is enough.
    expect(getGenshinBuild("10000032", t)!.energyTarget).toBe(200);
    // Mizuki's hand-kept 160% predated her buff; Game8 gives no figure.
    expect(getGenshinBuild("10000109", t)!.energyTarget).toBeNull();
  });

  it("gives the Traveler a page per element on each body, and lists each element once", () => {
    const travelers = listGenshinBuilds(t).filter((l) => /^1000000[57]\b/.test(l.id));
    expect(travelers.map((l) => l.id)).not.toContain("10000005");
    expect(travelers).toHaveLength(14);
    const listed = travelers.filter((l) => !l.unlisted);
    expect(listed.map((l) => l.name).sort()).toEqual([
      "Traveler (Anemo)", "Traveler (Cryo)", "Traveler (Dendro)", "Traveler (Electro)", "Traveler (Geo)", "Traveler (Hydro)", "Traveler (Pyro)",
    ]);
    // The element is the build, so it is drawn on the face every team shows.
    for (const l of travelers) expect(l.badge?.label, l.id).toBe(l.tags[0]);
  });

  it("builds a Traveler page from that element's guide, shared by both bodies", () => {
    const aether = getGenshinBuild("10000005-cryo", t)!;
    const lumine = getGenshinBuild("10000007-cryo", t)!;
    expect(lumine.name).toBe("Traveler (Cryo)");
    expect(lumine.tags[0]).toBe("Cryo");
    expect(lumine.sets).toEqual(aether.sets);
    expect(lumine.setsSource).toEqual(aether.setsSource);
    expect(lumine.setsSource).not.toEqual(getGenshinBuild("10000005-dendro", t)!.setsSource);
  });

  it("opens a Traveler's own element from the showcase, and moves the old per-body pages", () => {
    expect(genshinBuildId(10000007, "Cryo")).toBe("10000007-cryo");
    expect(genshinBuildId(10000109, "Anemo")).toBe("10000109");
    expect(getGenshinBuild("10000007", t)).toBeNull();
    expect(movedGenshinBuild("10000007")).toBe("10000007-anemo");
    expect(movedGenshinBuild("10000109")).toBeNull();
  });

  it("carries the guide's own label for a set rank", () => {
    const sets = getGenshinBuild("10000109", t)!.sets;
    expect(sets.map((r) => r.parts[0].name)).toEqual(["Gilded Dreams", "Viridescent Venerer", "Scarlet Proof"]);
    expect(sets.map((r) => r.label)).toEqual(["Best for Stellar", "Best in General", "Alt. for Stellar"]);
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

  it("names each Trailblazer page by its Path, never the game's {NICKNAME} placeholder", () => {
    const list = listHsrBuilds(t);
    expect(list.some((l) => l.name.includes("{NICKNAME}"))).toBe(false);
    const trailblazers = list.filter((l) => l.name.startsWith("Trailblazer"));
    expect(trailblazers.length).toBeGreaterThanOrEqual(10);
    for (const l of trailblazers) {
      expect(l.name, l.id).toBe(`Trailblazer (${l.tags[0]})`);
      expect(l.badge?.iconUrl, l.id).toMatch(/\/icon\/path\/\w+\.png$/);
    }
    // One row per Path in the index: Caelus's, with Stelle's the same build.
    const listed = trailblazers.filter((l) => !l.unlisted);
    expect(listed).toHaveLength(trailblazers.length / 2);
    expect(new Set(listed.map((l) => l.name)).size).toBe(listed.length);
  });

  it("matches a player's Trailblazer to the page for their Path, whichever body", () => {
    expect(sameHsrBuild(8006, "8005")).toBe(true);
    expect(sameHsrBuild(8005, "8005")).toBe(true);
    expect(sameHsrBuild(8006, "8007")).toBe(false);
    expect(sameHsrBuild(1308, "1308")).toBe(true);
    expect(sameHsrBuild(1308, "8005")).toBe(false);
  });

  it("has a curated entry for all but the newest releases", () => {
    // Fribbels covers the roster, but a character can ship a patch or two
    // before their entry lands, and the Path fallback carries them until
    // then. More than a couple uncovered means the metadata has gone stale.
    const list = listHsrBuilds(t);
    expect(list.length).toBeGreaterThan(90);
    const generic = list.filter((l) => l.generic).map((l) => l.name);
    expect(generic.length, `uncovered: ${generic.join(", ")}`).toBeLessThanOrEqual(2);
  });
});

describe("Zenless build targets", () => {
  it("has a guide entry for all but the newest releases", () => {
    // Prydwen lists a new agent before it publishes their build tab (Roxy,
    // at the time of writing), and the profession fallback carries them
    // until it does. More than a couple uncovered means the weights are stale.
    const list = listZzzBuilds(t);
    expect(list.length).toBeGreaterThan(50);
    const generic = list.filter((l) => l.generic).map((l) => l.name);
    expect(generic.length, `uncovered: ${generic.join(", ")}`).toBeLessThanOrEqual(2);
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
