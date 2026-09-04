import { describe, expect, it } from "vitest";
import { ROLL_FLOOR, rollTier } from "../../src/lib/rollTier";

describe("roll tier banding", () => {
  it("puts Genshin's four roll tiers on the four bands, as it always did", () => {
    expect(rollTier(0.7, ROLL_FLOOR.genshin)).toBe("low");
    expect(rollTier(0.8, ROLL_FLOOR.genshin)).toBe("mid");
    expect(rollTier(0.9, ROLL_FLOOR.genshin)).toBe("high");
    expect(rollTier(1.0, ROLL_FLOOR.genshin)).toBe("max");
  });

  it("defaults to Genshin's floor, so existing callers are unaffected", () => {
    expect(rollTier(0.7)).toBe("low");
    expect(rollTier(1.0)).toBe("max");
  });

  it("lets a Star Rail stat that rolled all minimums read as bad", () => {
    // The whole point of the floor: against Genshin's scale 0.8 was "mid",
    // so the worst rolls Star Rail can give drew the third of four colours.
    expect(rollTier(0.8, ROLL_FLOOR.hsr)).toBe("low");
    expect(rollTier(0.8, ROLL_FLOOR.genshin)).toBe("mid");
  });

  it("spreads Star Rail's range across every band", () => {
    const bands = [0.8, 0.87, 0.94, 1.0].map((q) => rollTier(q, ROLL_FLOOR.hsr));
    expect(bands).toEqual(["low", "mid", "high", "max"]);
  });

  it("clamps rather than inventing a band outside the range", () => {
    expect(rollTier(0.5, ROLL_FLOOR.hsr)).toBe("low");
    expect(rollTier(1.4, ROLL_FLOOR.hsr)).toBe("max");
  });
});
