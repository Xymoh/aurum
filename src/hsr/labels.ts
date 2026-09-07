/** Display names and formatting for HSR stats and slots. */

import type { HsrSlot, HsrStatKey } from "./types";
import { isPercentStat } from "./parsing";
import { gradeTextClass } from "../lib/grade";

export const STAT_LABELS: Record<HsrStatKey, string> = {
  HPDelta: "HP",
  AttackDelta: "ATK",
  DefenceDelta: "DEF",
  HPAddedRatio: "HP%",
  AttackAddedRatio: "ATK%",
  DefenceAddedRatio: "DEF%",
  SpeedDelta: "SPD",
  CriticalChanceBase: "CRIT Rate",
  CriticalDamageBase: "CRIT DMG",
  StatusProbabilityBase: "Effect Hit Rate",
  StatusResistanceBase: "Effect RES",
  BreakDamageAddedRatioBase: "Break Effect",
  HealRatioBase: "Outgoing Healing",
  SPRatioBase: "Energy Regen",
  PhysicalAddedRatio: "Physical DMG",
  FireAddedRatio: "Fire DMG",
  IceAddedRatio: "Ice DMG",
  ThunderAddedRatio: "Lightning DMG",
  WindAddedRatio: "Wind DMG",
  QuantumAddedRatio: "Quantum DMG",
  ImaginaryAddedRatio: "Imaginary DMG",
};

export const SLOT_LABELS: Record<HsrSlot, string> = {
  HEAD: "Head",
  HAND: "Hands",
  BODY: "Body",
  FOOT: "Boots",
  NECK: "Sphere",
  OBJECT: "Rope",
};

export function statLabel(key: HsrStatKey): string {
  return STAT_LABELS[key] ?? key;
}

/** Chip-sized labels, for the summary row on a collapsed panel. */
export const STAT_SHORT: Partial<Record<HsrStatKey, string>> = {
  HPDelta: "HP",
  AttackDelta: "ATK",
  DefenceDelta: "DEF",
  HPAddedRatio: "HP%",
  AttackAddedRatio: "ATK%",
  DefenceAddedRatio: "DEF%",
  SpeedDelta: "SPD",
  CriticalChanceBase: "CR",
  CriticalDamageBase: "CD",
  StatusProbabilityBase: "EHR",
  StatusResistanceBase: "RES",
  BreakDamageAddedRatioBase: "BE",
};

export function statShort(key: HsrStatKey): string {
  return STAT_SHORT[key] ?? statLabel(key);
}

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
export const ELEMENT_TINT: Record<string, string> = {
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
