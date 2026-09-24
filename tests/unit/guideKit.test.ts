import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { guideBehindKit as scriptRule, kitHash, withKitTracking } from "../../scripts/guide-kit.mjs";
import { guideBehindKit } from "../../src/lib/buildTarget/guide";
import type { KitGroup } from "../../src/lib/buildTarget/guide";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aurum-kit-"));
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const kit = (text: string): KitGroup[] => [
  { id: "skills", entries: [{ kind: "Elemental Skill", name: "Aisa Utamakura Pilgrimage", text, iconUrl: null }] },
];

/** A guide file as a previous build left it. */
function previous(name: string, content: object | null): string {
  const file = path.join(dir, `${name}.json`);
  if (content) fs.writeFileSync(file, JSON.stringify(content));
  return file;
}

describe("kit change tracking", () => {
  it("records no change on a character's first build", () => {
    const g = withKitTracking({ kit: kit("Swirl DMG +30%") }, previous("first", null), "2026-09-24");
    expect(g.kitChangedAt).toBeNull();
    expect(g.kitHash).toBe(kitHash(kit("Swirl DMG +30%")));
  });

  it("records no change when the file predates tracking", () => {
    const file = previous("untracked", { kit: kit("old text") });
    expect(withKitTracking({ kit: kit("new text") }, file, "2026-09-24").kitChangedAt).toBeNull();
  });

  it("dates a kit whose text differs from the last build", () => {
    const file = previous("buffed", { kit: kit("Swirl DMG +30%"), kitHash: kitHash(kit("Swirl DMG +30%")), kitChangedAt: null });
    const g = withKitTracking({ kit: kit("Swirl and Stellar Swirl DMG +30%") }, file, "2026-09-24");
    expect(g.kitChangedAt).toBe("2026-09-24");
  });

  it("keeps the date of an earlier change while the kit stays the same", () => {
    const hash = kitHash(kit("Swirl DMG +30%"));
    const file = previous("steady", { kit: kit("Swirl DMG +30%"), kitHash: hash, kitChangedAt: "2026-09-10" });
    const g = withKitTracking({ kit: kit("Swirl DMG +30%") }, file, "2026-09-24");
    expect(g.kitChangedAt).toBe("2026-09-10");
  });

  it("counts a changed figure in a scaling table as a changed kit", () => {
    const withScaling = (value: string): KitGroup[] => [
      { id: "skills", entries: [{ kind: "Elemental Skill", name: "X", text: "same", iconUrl: null, scaling: { levels: [10], rows: [{ label: "DMG", values: [value] }] } }] },
    ];
    expect(kitHash(withScaling("120%"))).not.toBe(kitHash(withScaling("150%")));
  });
});

describe("guideBehindKit", () => {
  const source = (updated: string | null) => ({ label: "Game8", url: "https://game8.co/", updated });

  it("flags a guide last updated before the kit changed", () => {
    expect(guideBehindKit({ kitChangedAt: "2026-09-24", source: source("2026-09-17") })).toBe(true);
  });

  it("clears once the guide is updated on or after the change", () => {
    expect(guideBehindKit({ kitChangedAt: "2026-09-24", source: source("2026-09-24") })).toBe(false);
    expect(guideBehindKit({ kitChangedAt: "2026-09-24", source: source("2026-09-30") })).toBe(false);
  });

  it("flags an undated guide once the kit has changed, and nothing while it has not", () => {
    expect(guideBehindKit({ kitChangedAt: "2026-09-24", source: source(null) })).toBe(true);
    expect(guideBehindKit({ kitChangedAt: null, source: source("2026-01-01") })).toBe(false);
  });

  it("never flags a character no guide covers", () => {
    expect(guideBehindKit({ kitChangedAt: "2026-09-24", source: null })).toBe(false);
  });

  it("agrees with the copy the build scripts use", () => {
    const cases = [
      { kitChangedAt: "2026-09-24", source: source("2026-09-17") },
      { kitChangedAt: "2026-09-24", source: source("2026-09-24") },
      { kitChangedAt: "2026-09-24", source: source(null) },
      { kitChangedAt: null, source: source(null) },
      { kitChangedAt: "2026-09-24", source: null },
    ];
    for (const c of cases) expect(scriptRule(c)).toBe(guideBehindKit(c));
  });
});
