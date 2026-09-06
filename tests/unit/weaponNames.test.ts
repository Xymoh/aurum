import { describe, expect, it } from "vitest";
import weaponIds from "../../src/data/weapon-ids.json";
import weapons from "../../src/data/weapons.json";

const IDS = weaponIds as Record<string, string>;
const ICONS = weapons as Record<string, string>;

describe("weapon names", () => {
  // Enka's loc.json carries no weapon names and the excel mirror lags, so a
  // newly released weapon used to fall through to a prettified icon file
  // name. Exaiphanes Blade rendered as "Sword Weapon Quest Snezhnaya".
  it("names Exaiphanes Blade rather than its icon file", () => {
    expect(IDS["11521"]).toBe("Exaiphanes Blade");
    expect(ICONS["Sword_WeaponQuestSnezhnaya"]).toBe("Exaiphanes Blade");
  });

  it("never stores a name that is just the icon path turned into words", () => {
    // These read as internal identifiers, not weapons anyone can name.
    const looksInternal = Object.entries(IDS).filter(
      ([, name]) =>
        /^(Sword|Claymore|Pole|Bow|Catalyst)\s/.test(name) &&
        /\b(Quest|Weapon|Blunt|Test)\b/.test(name),
    );
    expect(looksInternal).toEqual([]);
  });

  it("covers the weapons the live source lists", () => {
    // Guards the merge silently dropping back to the smaller mirror.
    expect(Object.keys(IDS).length).toBeGreaterThanOrEqual(290);
  });
});
