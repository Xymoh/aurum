/** Display names and formatting for HSR stats and slots. */

import type { HsrSlot, HsrStatKey } from "./types";
import { isPercentStat } from "./parsing";

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

export function formatStat(key: HsrStatKey, value: number): string {
  return isPercentStat(key) ? `${value.toFixed(1)}%` : value.toFixed(0);
}

/**
 * Colour per grade band.
 *
 * Keyed exactly rather than by prefix: "SSS" and "SS" both start with "SS",
 * and "AEON" starts with "A", so prefix matching silently collapsed bands the
 * ladder deliberately separates.
 */
const GRADE_COLORS: Record<string, string> = {
  AEON: "text-fuchsia-300",
  "WTF+": "text-emerald-300",
  WTF: "text-emerald-400",
  "SSS+": "text-rose-400",
  SSS: "text-orange-400",
  "SS+": "text-orange-300",
  SS: "text-amber-300",
  "S+": "text-hsr-gold",
  S: "text-yellow-300",
  "A+": "text-violet-300",
  A: "text-violet-400",
  "B+": "text-sky-300",
  B: "text-sky-400",
  "C+": "text-emerald-400",
  C: "text-emerald-500",
  "D+": "text-hsr-muted",
  D: "text-hsr-muted",
  "F+": "text-rose-500/80",
  F: "text-rose-500/80",
};

export function gradeColor(grade: string): string {
  return GRADE_COLORS[grade] ?? "text-hsr-muted";
}
