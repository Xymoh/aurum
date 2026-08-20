import type { Artifact } from "../types/artifact";
import type { CharacterData } from "../types/character";

export interface RankedArtifact {
  artifact: Artifact;
  characterId: string;
  characterName: string;
  characterIcon: string;
}

/**
 * Cap per character so one badly-geared unit can't fill the whole panel -
 * five weak pieces on the same character is one insight ("gear this unit"),
 * not five, and it crowds out every other character's worst piece.
 */
const MAX_PER_CHARACTER = 2;

/**
 * How useful it is to act on a piece, lowest first. Cheap, high-odds reshapes
 * come before expensive ones, and anything actionable with dust outranks
 * "go farm a replacement" - dust is a decision the player can act on today,
 * whereas replacing a piece is a long resin grind.
 */
function actionRank(entry: RankedArtifact): number {
  const { action, priority } = entry.artifact.score.reroll;
  if (action === "reroll") {
    if (priority === "high") return 0;
    if (priority === "medium") return 1;
    return 3;
  }
  if (action === "replace") return 2;
  return 4;
}

/**
 * Rank the pieces across the whole account that most deserve attention, and in
 * what order - the account-wide view a per-character card can't give once a
 * player has 10+ characters built.
 *
 * Ordering leads with the best uses of Dust of Enlightenment (cheapest expected
 * spend first), then the weakest pieces that need replacing outright. Ranking
 * purely by lowest score, as this once did, filled the list with junk that no
 * amount of rerolling can fix - technically "the worst", but useless as advice.
 */
export function getWeakestArtifacts(characters: CharacterData[], limit = 6): RankedArtifact[] {
  const all: RankedArtifact[] = [];
  for (const character of characters) {
    for (const artifact of character.artifacts) {
      all.push({
        artifact,
        characterId: character.id,
        characterName: character.name,
        characterIcon: character.icon,
      });
    }
  }

  all.sort((a, b) => {
    const rank = actionRank(a) - actionRank(b);
    if (rank !== 0) return rank;
    // Within reroll tiers, cheapest expected dust first; otherwise weakest first.
    if (a.artifact.score.reroll.action === "reroll") {
      return a.artifact.score.reroll.expectedDust - b.artifact.score.reroll.expectedDust;
    }
    return a.artifact.score.potentialPercent - b.artifact.score.potentialPercent;
  });

  const perCharacter = new Map<string, number>();
  const picked: RankedArtifact[] = [];
  for (const entry of all) {
    if (picked.length >= limit) break;
    if (actionRank(entry) === 4) continue; // nothing to do with this piece
    const used = perCharacter.get(entry.characterId) ?? 0;
    if (used >= MAX_PER_CHARACTER) continue;
    perCharacter.set(entry.characterId, used + 1);
    picked.push(entry);
  }

  return picked;
}
