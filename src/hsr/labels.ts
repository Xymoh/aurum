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

/** Tailwind text colour for a grade band. */
export function gradeColor(grade: string): string {
  if (grade.startsWith("SS")) return "text-hsr-accent";
  if (grade.startsWith("S")) return "text-hsr-gold";
  if (grade.startsWith("A")) return "text-violet-400";
  if (grade.startsWith("B")) return "text-sky-400";
  if (grade.startsWith("C")) return "text-emerald-400";
  return "text-hsr-muted";
}
