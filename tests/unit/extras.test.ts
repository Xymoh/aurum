/**
 * The percentile model, the visit-to-visit diff and the GOOD export, driven
 * by the live Genshin fixture.
 */
import { describe, expect, it } from "vitest";
import fixture from "../fixtures/genshin-showcase.json";
import type { EnkaResponse } from "../../src/types/enka";
import { buildShowcase } from "../../src/lib/showcase";
import { SAMPLES, scoreDistribution, scorePercentile } from "../../src/lib/percentile";
import { diffShowcase, snapshotOf } from "../../src/lib/history";
import { exportGood, goodKey } from "../../src/lib/export/good";

const showcase = buildShowcase(fixture as unknown as EnkaResponse);
const ARLECCHINO = 10000096;

describe("score percentile", () => {
  it("simulates a fixed-size, sorted distribution and caches it", () => {
    const a = scoreDistribution(ARLECCHINO, "FIGHT_PROP_FIRE_ADD_HURT");
    const b = scoreDistribution(ARLECCHINO, "FIGHT_PROP_FIRE_ADD_HURT");
    expect(a).toBe(b);
    expect(a.length).toBe(SAMPLES);
    for (let i = 1; i < a.length; i++) expect(a[i]).toBeGreaterThanOrEqual(a[i - 1]);
  });

  it("puts a perfect piece at the top and an empty one at the bottom", () => {
    expect(scorePercentile(ARLECCHINO, "FIGHT_PROP_FIRE_ADD_HURT", 200)).toBe(1);
    expect(scorePercentile(ARLECCHINO, "FIGHT_PROP_FIRE_ADD_HURT", 0)).toBe(0);
  });

  it("is monotone in the score", () => {
    const p = (s: number) => scorePercentile(ARLECCHINO, "FIGHT_PROP_ATTACK_PERCENT", s);
    expect(p(60)).toBeLessThanOrEqual(p(90));
    expect(p(90)).toBeLessThanOrEqual(p(120));
  });

  it("rates a real S+ goblet as clearly above average for its slot", () => {
    const arle = showcase.characters.find((c) => c.avatarId === ARLECCHINO)!;
    const goblet = arle.artifacts.find((a) => a.slot === "GOBLET")!;
    expect(scorePercentile(ARLECCHINO, goblet.mainStat.statKey, goblet.score.potentialPercent)).toBeGreaterThan(0.6);
  });
});

describe("visit-to-visit diff", () => {
  it("reports nothing without an earlier snapshot", () => {
    expect(diffShowcase(null, showcase).size).toBe(0);
  });

  it("reports a build's change and flags newly displayed characters", () => {
    const prev = snapshotOf(showcase);
    const first = showcase.characters[0];
    prev.characters[first.id].total -= 5;
    delete prev.characters[showcase.characters[1].id];
    const deltas = diffShowcase(prev, showcase);
    expect(deltas.get(first.id)?.build).toBeCloseTo(5, 6);
    expect(deltas.get(showcase.characters[1].id)?.isNew).toBe(true);
  });
});

describe("GOOD export", () => {
  it("builds keys the way Genshin Optimizer spells them", () => {
    expect(goodKey("Kamisato Ayaka")).toBe("KamisatoAyaka");
    expect(goodKey("Crimson Witch of Flames")).toBe("CrimsonWitchOfFlames");
    expect(goodKey("Wolf's Gravestone")).toBe("WolfSGravestone");
  });

  it("writes every displayed character, weapon and artifact with valid stat keys", () => {
    const file = exportGood(showcase);
    expect(file.format).toBe("GOOD");
    expect(file.characters).toHaveLength(showcase.characters.length);
    expect(file.artifacts.length).toBe(showcase.characters.reduce((n, c) => n + c.artifacts.length, 0));
    const valid = /^(hp|hp_|atk|atk_|def|def_|eleMas|enerRech_|heal_|critRate_|critDMG_|[a-z]+_dmg_)$/;
    for (const a of file.artifacts) {
      expect(a.mainStatKey).toMatch(valid);
      for (const s of a.substats) expect(s.key).toMatch(valid);
      expect(file.characters.some((c) => c.key === a.location)).toBe(true);
    }
    const arle = file.characters.find((c) => c.key === "Arlecchino")!;
    expect(arle.level).toBe(90);
    expect(arle.ascension).toBe(6);
  });
});
