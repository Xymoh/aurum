/**
 * Colours for the shareable card.
 *
 * Cards always render in the dark palette, whatever theme the site is in. A
 * card is posted into Discord, Reddit and Twitter, where it lands on a dark
 * ground and is read by people who never saw the site's theme toggle; the
 * light palette there produced a washed-out image that read as broken.
 *
 * The values track the `:root` block in index.css. Canvas cannot resolve
 * `var(--grade-s)`, so the ramp is repeated here as literals rather than read
 * from computed style - which would also have picked up the wrong theme.
 */

import { gradeBand } from "../grade";
import type { ShareGame } from "./model";

export interface CardTheme {
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  /** Drawn in the footer, matching each game's own header. */
  wordmark: string;
}

export const CARD_THEME: Record<ShareGame, CardTheme> = {
  genshin: {
    bg: "#0f1117",
    panel: "#1a1d2e",
    border: "#2a2d3e",
    text: "#e4e4e7",
    muted: "#8b8fa3",
    accent: "#d4a853",
    wordmark: "Artifact Aurum",
  },
  hsr: {
    bg: "#080a12",
    panel: "#10131f",
    border: "#242a40",
    text: "#e8ecf8",
    muted: "#7d86a3",
    accent: "#5eead4",
    wordmark: "Relic Aurum",
  },
  zzz: {
    bg: "#0a0a0b",
    panel: "#131315",
    border: "#2a2a2f",
    text: "#f3f3ee",
    muted: "#9d9d97",
    accent: "#d4ff00",
    wordmark: "Disc Aurum",
  },
};

const GRADE_HEX: Record<string, string> = {
  f: "#6b7280",
  d: "#9ca3af",
  c: "#34d399",
  b: "#38bdf8",
  a: "#a78bfa",
  s: "#fbbf24",
  ss: "#fb923c",
  sss: "#fb7185",
  wtf: "#e879f9",
  aeon: "#f5d0fe",
};

/** A grade's literal colour; ungraded pieces fall back to the muted tone. */
export function gradeHex(grade: string | null, fallback: string): string {
  if (!grade) return fallback;
  return GRADE_HEX[gradeBand(grade)] ?? fallback;
}
