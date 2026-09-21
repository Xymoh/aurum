/**
 * Turns a raw Enka payload into a scored Genshin showcase.
 *
 * The hook used to do this inline, which left the one path every number on
 * the site travels through untestable without React. Keeping it here means
 * a fixture can drive the exact code a visitor runs.
 */
import type { EnkaResponse } from "../types/enka";
import type { ShowcaseData } from "../types/character";
import { parseShowcaseData } from "./parsing";
import { scoreArtifact, scoreBuild } from "./scoring";

export function buildShowcase(raw: EnkaResponse): ShowcaseData {
  const parsed = parseShowcaseData(raw);

  for (const character of parsed.characters) {
    character.artifacts = character.artifacts.map((art) =>
      // The character's live ER lets reroll advice respect their rotation
      // requirement rather than trading it away for crit. The element only
      // matters for the Traveler, whose seven variants share one avatarId.
      scoreArtifact(art, character.avatarId, character.stats.energyRecharge, character.element),
    );
    character.buildScore = scoreBuild(character);
  }

  parsed.characters.sort((a, b) => b.buildScore.total - a.buildScore.total);
  return parsed;
}
