import type { Artifact } from "../types/artifact";
import type { CharacterData } from "../types/character";

export interface RankedArtifact {
  artifact: Artifact;
  characterId: string;
  characterName: string;
  characterIcon: string;
}

/**
 * Flatten every equipped artifact across the account and rank the
 * lowest-scoring pieces first — a concrete "farm/upgrade these next" list,
 * since per-character scores alone don't surface the account's worst pieces
 * when a player has 10+ characters built.
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

  return all
    .sort((a, b) => a.artifact.score.potentialPercent - b.artifact.score.potentialPercent)
    .slice(0, limit);
}
