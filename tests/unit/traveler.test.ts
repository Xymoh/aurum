import { describe, expect, it } from "vitest";
import { checkMainStat } from "../../src/lib/scoring";
import { getCharacterElement } from "../../src/lib/parsing";
import { TRAVELER_MAIN_STATS } from "../../src/lib/travelerBuilds";

const TRAVELER_A = 10000005;
const TRAVELER_B = 10000007;
const INEFFA = 10000116;
const NAHIDA = 10000073;

/** No elemental DMG bonus anywhere: what an ATK% or EM goblet build looks like. */
const NO_ELEMENTAL_DMG = { "2000": 15000, "2001": 1500, "2002": 800 };

describe("Traveler element", () => {
  it("reads the element from skillDepotId rather than guessing", () => {
    const cases: Array<[number, string]> = [
      [502, "Pyro"],
      [503, "Hydro"],
      [504, "Anemo"],
      [505, "Cryo"],
      [506, "Geo"],
      [507, "Electro"],
      [508, "Dendro"],
    ];
    for (const [depot, element] of cases) {
      expect(getCharacterElement(TRAVELER_A, NO_ELEMENTAL_DMG, depot), `depot ${depot}`).toBe(element);
    }
  });

  it("reads the other Traveler's 7xx depots the same way", () => {
    expect(getCharacterElement(TRAVELER_B, NO_ELEMENTAL_DMG, 705)).toBe("Cryo");
    expect(getCharacterElement(TRAVELER_B, NO_ELEMENTAL_DMG, 708)).toBe("Dendro");
  });

  it("trusts the depot over the equipped goblet", () => {
    // A Cryo Traveler holding an off-element Pyro goblet still reads as Cryo.
    expect(getCharacterElement(TRAVELER_A, { "41": 0.466 }, 505)).toBe("Cryo");
  });

  it("falls back to sniffing the goblet when the depot is one shipped later", () => {
    expect(getCharacterElement(TRAVELER_A, { "47": 0.466 }, 599)).toBe("Cryo");
    expect(getCharacterElement(TRAVELER_A, NO_ELEMENTAL_DMG, 599)).toBe("Anemo");
  });

  it("leaves every other character on its static element", () => {
    expect(getCharacterElement(NAHIDA, NO_ELEMENTAL_DMG, 7301)).toBe("Dendro");
  });
});

describe("Traveler ideal main stats, per element", () => {
  // Each element wants different pieces, which one shared profile could not
  // express. These are the calls that used to accuse a correct build.
  it("wants ATK% in the Cryo Traveler's goblet, not a Cryo one only", () => {
    expect(checkMainStat("GOBLET", "FIGHT_PROP_ATTACK_PERCENT", TRAVELER_A, "Cryo").isCorrect).toBe(true);
    expect(checkMainStat("GOBLET", "FIGHT_PROP_ICE_ADD_HURT", TRAVELER_A, "Cryo").isCorrect).toBe(true);
  });

  it("wants Elemental Mastery on Dendro Traveler, in every slot", () => {
    expect(checkMainStat("SANDS", "FIGHT_PROP_ELEMENT_MASTERY", TRAVELER_A, "Dendro").isCorrect).toBe(true);
    expect(checkMainStat("GOBLET", "FIGHT_PROP_ELEMENT_MASTERY", TRAVELER_A, "Dendro").isCorrect).toBe(true);
    expect(checkMainStat("CIRCLET", "FIGHT_PROP_ELEMENT_MASTERY", TRAVELER_A, "Dendro").isCorrect).toBe(true);
  });

  it("wants Energy Recharge on Electro Traveler, which is built as a battery", () => {
    expect(checkMainStat("SANDS", "FIGHT_PROP_CHARGE_EFFICIENCY", TRAVELER_A, "Electro").isCorrect).toBe(true);
  });

  it("accepts the HP% sands guides give Hydro Traveler", () => {
    expect(checkMainStat("SANDS", "FIGHT_PROP_HP_PERCENT", TRAVELER_A, "Hydro").isCorrect).toBe(true);
    // and still rejects it where no guide asks for it
    expect(checkMainStat("SANDS", "FIGHT_PROP_HP_PERCENT", TRAVELER_A, "Cryo").isCorrect).toBe(false);
  });

  it("flags an off-element goblet, which the shared profile let through", () => {
    // A Pyro goblet on the Anemo Traveler is simply the wrong piece.
    expect(checkMainStat("GOBLET", "FIGHT_PROP_FIRE_ADD_HURT", TRAVELER_A, "Anemo").isCorrect).toBe(false);
    expect(checkMainStat("GOBLET", "FIGHT_PROP_WIND_ADD_HURT", TRAVELER_A, "Anemo").isCorrect).toBe(true);
  });

  it("covers every element, so no Traveler falls back to the shared profile", () => {
    const elements = ["Pyro", "Hydro", "Anemo", "Electro", "Dendro", "Cryo", "Geo"] as const;
    for (const element of elements) {
      const stats = TRAVELER_MAIN_STATS[element];
      expect(stats, element).toBeDefined();
      for (const slot of ["SANDS", "GOBLET", "CIRCLET"] as const) {
        expect(stats[slot].length, `${element} ${slot}`).toBeGreaterThan(0);
      }
      // A crit circlet is right for every one of them.
      expect(checkMainStat("CIRCLET", "FIGHT_PROP_CRITICAL", TRAVELER_A, element).isCorrect).toBe(true);
      // None of them wants a healing goblet.
      expect(checkMainStat("GOBLET", "FIGHT_PROP_HEAL_ADD", TRAVELER_A, element).isCorrect).toBe(false);
    }
  });

  it("applies to both Traveler avatarIds", () => {
    expect(checkMainStat("SANDS", "FIGHT_PROP_ELEMENT_MASTERY", TRAVELER_B, "Dendro").isCorrect).toBe(true);
  });
});

describe("Traveler fallback when the element is unknown", () => {
  // An ATK% goblet is the recommended main stat for Cryo Traveler, and was
  // flagged as wrong because the only ideal listed was elemental DMG.
  for (const id of [TRAVELER_A, TRAVELER_B]) {
    it(`accepts an ATK% goblet on ${id}`, () => {
      expect(checkMainStat("GOBLET", "FIGHT_PROP_ATTACK_PERCENT", id).isCorrect).toBe(true);
    });

    it(`accepts an EM goblet on ${id}, which Dendro Traveler wants`, () => {
      expect(checkMainStat("GOBLET", "FIGHT_PROP_ELEMENT_MASTERY", id).isCorrect).toBe(true);
    });

    it(`still accepts any elemental DMG goblet on ${id}`, () => {
      expect(checkMainStat("GOBLET", "FIGHT_PROP_ICE_ADD_HURT", id).isCorrect).toBe(true);
      expect(checkMainStat("GOBLET", "FIGHT_PROP_GRASS_ADD_HURT", id).isCorrect).toBe(true);
    });

    it(`still rejects a goblet no Traveler wants on ${id}`, () => {
      expect(checkMainStat("GOBLET", "FIGHT_PROP_HP_PERCENT", id).isCorrect).toBe(false);
      expect(checkMainStat("GOBLET", "FIGHT_PROP_DEFENSE_PERCENT", id).isCorrect).toBe(false);
    });
  }
});

describe("Ineffa main stats match Prydwen", () => {
  it("wants ATK% or EM in the sands and goblet, crit in the circlet", () => {
    expect(checkMainStat("SANDS", "FIGHT_PROP_ATTACK_PERCENT", INEFFA).isCorrect).toBe(true);
    expect(checkMainStat("SANDS", "FIGHT_PROP_ELEMENT_MASTERY", INEFFA).isCorrect).toBe(true);
    expect(checkMainStat("GOBLET", "FIGHT_PROP_ATTACK_PERCENT", INEFFA).isCorrect).toBe(true);
    expect(checkMainStat("GOBLET", "FIGHT_PROP_ELEMENT_MASTERY", INEFFA).isCorrect).toBe(true);
    expect(checkMainStat("CIRCLET", "FIGHT_PROP_CRITICAL", INEFFA).isCorrect).toBe(true);
    expect(checkMainStat("CIRCLET", "FIGHT_PROP_CRITICAL_HURT", INEFFA).isCorrect).toBe(true);
  });

  it("does not treat an Electro goblet as ideal, since it moves little of her damage", () => {
    expect(checkMainStat("GOBLET", "FIGHT_PROP_ELEC_ADD_HURT", INEFFA).isCorrect).toBe(false);
  });
});
