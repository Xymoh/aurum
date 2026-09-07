/**
 * What a character's gear is supposed to look like, before you own any of it.
 *
 * The showcase pages answer "how good is what I have"; this answers "what am
 * I aiming for", which is the question someone has before they have a
 * showcase worth reading. Same approach as the share card: one model, one set
 * of components, and a thin adapter per game that flattens its own scoring
 * metadata into this.
 *
 * The numbers are the ones the scorer already grades against, not a second
 * opinion written by hand. If the page and the score ever disagreed, one of
 * them would be lying.
 */

import type { ShareGame, Translate } from "../shareCard/model";

export type { Translate };

export interface TargetSlot {
  /** Localized slot name. */
  slot: string;
  /**
   * Ideal main stats, localized, best first. Empty means the guide accepts
   * anything the slot can roll, which is a real answer and not a gap.
   */
  stats: string[];
}

export interface TargetStat {
  label: string;
  /** Relative value to this character, 0 to 1. */
  weight: number;
}

/** One set within a recommendation, with the piece count it is run at. */
export interface SetPart {
  name: string;
  pieces: number;
  /** The set's own artwork - a plume for Genshin, the set icon elsewhere. */
  iconUrl: string | null;
}

/** One recommended loadout: a 4-piece, a 2+2, or a lone planar 2-piece. */
export interface SetRecommendation {
  parts: SetPart[];
}

/** One row of the character picker. Cheap enough to build for every character. */
export interface BuildListing {
  id: string;
  name: string;
  iconUrl: string | null;
  /** Element, path or role - localized, and what the filters run on. */
  tags: string[];
  rarity: number;
  /** True when this character has no curated entry and falls back to a profile. */
  generic: boolean;
}

export interface BuildTarget extends BuildListing {
  game: ShareGame;
  portraitUrl: string | null;
  accent: string;
  slots: TargetSlot[];
  /** Substat priority, most valuable first. */
  substats: TargetStat[];
  /**
   * Recommended sets, best first. Genshin's come from genshin.gg, Star
   * Rail's from Fribbels with Prydwen filling in the supports it does not
   * simulate, Zenless's from Prydwen. Empty only when no source lists any.
   */
  sets: SetRecommendation[];
  /** The guide's own phrasing, when it published one worth quoting. */
  priority: string | null;
  /** Caps a guide states, e.g. CRIT Rate until 80%. */
  thresholds: Array<{ label: string; target: number }>;
  /** An energy requirement the scorer honours, when the character has one. */
  energyTarget: number | null;
  source: { label: string; url: string | null };
  /** Where the sets came from, when that is not the same place as the weights. */
  setsSource: { label: string; url: string | null } | null;
}

/** Highest weight first, dropping stats the character has no use for. */
export function rankSubstats(entries: TargetStat[]): TargetStat[] {
  return entries.filter((s) => s.weight > 0).sort((a, b) => b.weight - a.weight);
}
