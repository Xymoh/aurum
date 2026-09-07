/**
 * The shape a shareable card is drawn from.
 *
 * One model for all three games: the renderer knows nothing about artifacts,
 * relics or discs, only about a portrait, a score and a row of pieces. Each
 * game supplies an adapter that flattens its own character into this, which
 * keeps the canvas code from growing a branch per game.
 *
 * Everything here is display-ready. The adapters run inside components, so
 * they hold `t` and do the formatting and translating; the renderer never
 * needs the dictionary and stays usable from a plain function.
 */

import type { useI18n } from "../../i18n";

export type ShareGame = "genshin" | "hsr" | "zzz";

/**
 * The translator, as the adapters receive it. They run inside components and
 * hold the live dictionary, which is what keeps every label on the card in
 * the reader's language without the renderer knowing i18n exists.
 */
export type Translate = ReturnType<typeof useI18n>["t"];

/** Context every adapter needs beyond the character itself. */
export interface ShareContext {
  uid: string;
  playerName: string;
  t: Translate;
}

export interface SharePiece {
  iconUrl: string | null;
  /** Short slot name: "Circlet", "Body", "Disc 4". */
  slot: string;
  /** The piece's own score on the 0-200 scale. */
  score: number;
  /** Null when the piece cannot be graded: wrong main stat, or under-rarity. */
  grade: string | null;
}

export interface ShareStat {
  label: string;
  value: string;
}

export interface ShareCardModel {
  game: ShareGame;
  /** Where the showcase came from, drawn small in the footer. */
  uid: string;
  playerName: string;

  name: string;
  /** Pre-formatted, so each game keeps its own convention: "Lv90". */
  level: string;
  /** Constellation, Eidolon or Mindscape, already labelled: "C2", "E1", "M0". */
  rank: string;
  /** Element, path or profession - short words drawn as chips under the name. */
  tags: string[];
  portraitUrl: string | null;
  /**
   * Where to anchor the portrait crop, as CSS `object-position` fractions.
   * The three games frame their art differently - Zenless ships full-body
   * renders with the head in the top twentieth, Star Rail centres the bust -
   * so a single crop beheads somebody. Adapters pass their game's value.
   */
  portraitFocus: { x: number; y: number };
  /** Character accent, usually the element colour. Drives the rule and glow. */
  accent: string;

  /** Weapon, Light Cone or W-Engine. */
  gear: { name: string; iconUrl: string | null; refine: string } | null;

  score: {
    value: number;
    grade: string;
    /** False when slots are empty, in which case `note` replaces the number. */
    complete: boolean;
    /** Localized "3/5 pieces", drawn instead of a score on a partial build. */
    note: string;
  };
  /** A localized one-liner under the score: roll efficiency, or main stats. */
  footnote: string;
  stats: ShareStat[];
  pieces: SharePiece[];
}
