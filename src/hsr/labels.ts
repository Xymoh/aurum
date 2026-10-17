/** Formatting and colours for HSR stats, grades and elements. */

import type { HsrStatKey } from "./types";
import { isPercentStat } from "./parsing";
import { gradeTextClass } from "../lib/grade";

export function formatStat(key: HsrStatKey, value: number): string {
  return isPercentStat(key) ? `${value.toFixed(1)}%` : value.toFixed(0);
}

/**
 * Text colour class per grade band, from the ramp shared with the Genshin
 * side (src/lib/grade.ts). "SSS" and "SS" resolve to different bands, and so
 * do "AEON" and "A": the band lookup strips only a trailing plus.
 */
export function gradeColor(grade: string | null): string {
  return grade ? gradeTextClass(grade) : "text-hsr-muted";
}

/**
 * Per-element accent, used for the panel highlight and the share card. Kept
 * here rather than in the panel so the card cannot drift from the page it is
 * a picture of.
 */
const ELEMENT_TINT: Record<string, string> = {
  Physical: "#d4d4d8",
  Fire: "#fb7185",
  Ice: "#7dd3fc",
  Thunder: "#c084fc",
  Wind: "#5eead4",
  Quantum: "#818cf8",
  Imaginary: "#fde047",
};

/** The element accent, or the neutral border tone for an unknown element. */
export function elementTint(element: string): string {
  return ELEMENT_TINT[element] ?? "#7d86a3";
}
