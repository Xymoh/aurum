import type { ArtifactSlot } from "../types/artifact";
import type { CharacterData } from "../types/character";
import { SLOT_ORDER } from "./constants";
import { getSetRecommendations } from "./scoring";

/**
 * Domains that drop each pair of sets. Since Archaic Petra (15014) the game
 * has added domain sets in consecutive-id pairs; the four older pairs are
 * listed by hand. Sets newer than 15044 are left out until their pairing is
 * confirmed, and a set with no entry is planned on its own.
 */
export const DOMAIN_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["14001", "15016"], // Blizzard Strayer, Heart of Depth
  ["14002", "15005"], // Thundersoother, Thundering Fury
  ["14003", "15006"], // Lavawalker, Crimson Witch of Flames
  ["14004", "15002"], // Maiden Beloved, Viridescent Venerer
  ["15007", "15008"], // Noblesse Oblige, Bloodstained Chivalry
  ["15014", "15015"],
  ["15017", "15018"],
  ["15019", "15020"],
  ["15021", "15022"],
  ["15023", "15024"],
  ["15025", "15026"],
  ["15027", "15028"],
  ["15029", "15030"],
  ["15031", "15032"],
  ["15033", "15034"],
  ["15035", "15036"],
  ["15037", "15038"],
  ["15039", "15040"],
  ["15041", "15042"],
  ["15043", "15044"],
];

const PARTNER = new Map<string, string>(
  DOMAIN_PAIRS.flatMap(([a, b]) => [
    [a, b],
    [b, a],
  ]),
);

export type FarmReason = "replace" | "mainStat" | "empty";

export interface FarmPiece {
  characterId: string;
  characterName: string;
  slot: ArtifactSlot;
  reason: FarmReason;
}

export interface FarmTarget {
  /** One set, or the two a domain drops together, lower id first. */
  setIds: string[];
  pieces: FarmPiece[];
  characterCount: number;
}

/** Why a slot needs a new piece, or null when the one there is fine. */
function reasonFor(character: CharacterData, slot: ArtifactSlot): FarmReason | null {
  const piece = character.artifacts.find((a) => a.slot === slot);
  if (!piece) return "empty";
  if (piece.score.reroll.action === "replace") return "replace";
  if (piece.mainStat.isCorrect === false) return "mainStat";
  return null;
}

/**
 * Where to spend resin: the domains (or single sets) whose drops would fix
 * the most weak slots across the showcase. A slot counts when its piece is
 * flagged for replacement, wears the wrong main stat, or is empty, and it is
 * credited to every set in the character's top recommended loadout.
 */
export function farmPlan(characters: CharacterData[], limit = 3): FarmTarget[] {
  const byKey = new Map<string, FarmTarget>();
  for (const character of characters) {
    const loadout = getSetRecommendations(character.avatarId, character.element)[0] ?? [];
    const setIds = [...new Set(loadout.map((p) => p.setId))];
    if (setIds.length === 0) continue;
    for (const slot of SLOT_ORDER) {
      const reason = reasonFor(character, slot);
      if (!reason) continue;
      const piece = { characterId: character.id, characterName: character.name, slot, reason };
      // A 2+2 loadout's two sets often share a domain; count the slot there once.
      const keys = new Set(setIds.map((id) => domainKey(id)));
      for (const key of keys) {
        const target = byKey.get(key) ?? { setIds: key.split("+"), pieces: [], characterCount: 0 };
        target.pieces.push(piece);
        byKey.set(key, target);
      }
    }
  }
  for (const target of byKey.values()) {
    target.characterCount = new Set(target.pieces.map((p) => p.characterId)).size;
  }
  return [...byKey.values()]
    .sort(
      (a, b) =>
        b.pieces.length - a.pieces.length ||
        b.characterCount - a.characterCount ||
        a.setIds[0].localeCompare(b.setIds[0]),
    )
    .slice(0, limit);
}

function domainKey(setId: string): string {
  const partner = PARTNER.get(setId);
  return partner ? [setId, partner].sort().join("+") : setId;
}
