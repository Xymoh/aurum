import { describe, expect, it } from "vitest";
import hsrFixture from "../fixtures/hsr-showcase.json";
import zzzFixture from "../fixtures/zzz-showcase.json";
import { parseHsrShowcase, type RawHsrResponse } from "../../src/hsr/parsing";
import { scoreCharacter } from "../../src/hsr/scoring";
import { hsrShareCard } from "../../src/hsr/shareCard";
import { parseZzzShowcase, type RawZzzResponse } from "../../src/zzz/parsing";
import { scoreAgent } from "../../src/zzz/scoring";
import { zzzShareCard } from "../../src/zzz/shareCard";
import { en } from "../../src/i18n/locales/en";
import { format } from "../../src/i18n";
import type { ShareContext, Translate } from "../../src/lib/shareCard/model";
import { shareCardFilename } from "../../src/lib/shareCard/render";

/**
 * The real dictionary, resolved the way useI18n does it. The adapters exist
 * to turn a character into display-ready text, so a stub translator would
 * test nothing: a missing key has to surface here the same way it would on
 * the page.
 */
const t = ((section: string, key: string, vars?: Record<string, string | number>) =>
  format((en as unknown as Record<string, Record<string, string>>)[section][key], vars)) as Translate;

const ctx: ShareContext = { uid: "700600838", playerName: "Saeki", t };

const hsr = parseHsrShowcase(hsrFixture as RawHsrResponse).characters.map(scoreCharacter);
const zzz = parseZzzShowcase(zzzFixture as RawZzzResponse).agents.map(scoreAgent);

describe("share card adapters", () => {
  it("flattens a Star Rail character into a drawable model", () => {
    const card = hsrShareCard(hsr[0], ctx);

    expect(card.game).toBe("hsr");
    expect(card.name).toBe(hsr[0].name);
    expect(card.level).toBe(`Lv${hsr[0].level}`);
    expect(card.rank).toBe(`E${hsr[0].eidolon}`);
    expect(card.pieces).toHaveLength(hsr[0].relics.length);
    // Six slots, each labelled rather than left as an enum key.
    expect(card.pieces.map((p) => p.slot)).toContain("Head");
    expect(card.portraitUrl).toMatch(/^https:\/\//);
  });

  it("flattens a Zenless agent into a drawable model", () => {
    const card = zzzShareCard(zzz[0], ctx);

    expect(card.game).toBe("zzz");
    expect(card.rank).toBe(`M${zzz[0].mindscape}`);
    expect(card.pieces).toHaveLength(zzz[0].discs.length);
    expect(card.gear?.refine).toMatch(/^P\d$/);
  });

  it("resolves every label, leaving no raw dictionary keys on the card", () => {
    for (const card of [hsrShareCard(hsr[0], ctx), zzzShareCard(zzz[0], ctx)]) {
      const text = [
        ...card.tags,
        ...card.stats.flatMap((s) => [s.label, s.value]),
        ...card.pieces.map((p) => p.slot),
        card.footnote,
        card.score.note,
      ];
      for (const value of text) {
        expect(value.length).toBeGreaterThan(0);
        // A missed lookup falls back to the key itself, which is always
        // camelCase with no space - real labels never look like that.
        expect(value).not.toMatch(/^(row|slot)[A-Z]\w*$/);
      }
    }
  });

  it("carries the account through to the card", () => {
    const card = hsrShareCard(hsr[0], ctx);
    expect(card.uid).toBe("700600838");
    expect(card.playerName).toBe("Saeki");
  });

  it("names the download after the character, not the slot it came from", () => {
    const card = hsrShareCard(hsr[0], ctx);
    expect(shareCardFilename(card)).toMatch(/^aurum-hsr-.+\.png$/);
    // No path separators or spaces, whatever the character is called.
    expect(shareCardFilename(card)).not.toMatch(/[\s/\\:]/);
  });

  it("substitutes the roll counts into the footnote", () => {
    const card = hsrShareCard(hsr[0], ctx);
    const d = hsr[0].diagnostics;
    expect(card.footnote).toContain(String(d.effectiveRolls));
    expect(card.footnote).toContain(String(d.totalRolls));
    expect(card.footnote).not.toContain("{");
  });
});
