/**
 * One grade colour system for both games.
 *
 * Grades are text like "S+" or "SSS"; colour is decided per band, so "S" and
 * "S+" share a hue and the plus is left to the label. The values themselves
 * live in CSS variables (see index.css) so that light mode can swap the whole
 * ramp without any component knowing about themes.
 */

export type GradeBand = "f" | "d" | "c" | "b" | "a" | "s" | "ss" | "sss" | "wtf" | "aeon";

const BANDS: GradeBand[] = ["aeon", "wtf", "sss", "ss", "s", "a", "b", "c", "d", "f"];

/** "SSS+" -> "sss", "A" -> "a". Unknown grades fall to the bottom band. */
export function gradeBand(grade: string): GradeBand {
  const key = grade.replace(/\+$/, "").toLowerCase();
  return BANDS.find((b) => b === key) ?? "f";
}

/** The CSS variable for a grade's colour, ready for an inline style. */
export function gradeVar(grade: string): string {
  return `var(--grade-${gradeBand(grade)})`;
}

/** Tailwind text utility for a grade, for class-based call sites. */
export function gradeTextClass(grade: string): string {
  return `text-grade-${gradeBand(grade)}`;
}

/**
 * A translucent wash of any CSS colour, including `var()` references.
 * Replaces the old `${hex}22` trick, which only worked on literal hex values.
 */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

/** Inline style for a coloured badge: tinted background, solid text. */
export function gradeStyle(grade: string, washPercent = 16): { color: string; backgroundColor: string } {
  const color = gradeVar(grade);
  return { color, backgroundColor: tint(color, washPercent) };
}
