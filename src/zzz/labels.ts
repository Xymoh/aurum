/** Display names and formatting for Zenless Zone Zero stats and slots. */

import type { ZzzSlot, ZzzStatId } from "./types";
import properties from "./data/properties.json";

const PROPERTIES = properties as Record<string, { name: string; format: string }>;

/** Player-facing names for the stats a disc can carry. Falls back to Enka's internal name. */
const STAT_LABELS: Record<number, string> = {
  11101: "HP",
  11102: "HP%",
  11103: "HP",
  12101: "ATK",
  12102: "ATK%",
  12103: "ATK",
  12201: "Impact",
  13101: "DEF",
  13102: "DEF%",
  13103: "DEF",
  20103: "CRIT Rate",
  21103: "CRIT DMG",
  23103: "PEN Ratio",
  23203: "PEN",
  30502: "Energy Regen",
  31203: "Anomaly Proficiency",
  31402: "Anomaly Mastery",
  31503: "Physical DMG",
  31603: "Fire DMG",
  31703: "Ice DMG",
  31803: "Electric DMG",
  31903: "Ether DMG",
  32003: "Auric Ether DMG",
  32303: "Wind DMG",
};

/** Chip-sized labels for the substat pool. */
export const STAT_SHORT: Record<number, string> = {
  11102: "HP%",
  12102: "ATK%",
  13102: "DEF%",
  11103: "HP",
  12103: "ATK",
  13103: "DEF",
  20103: "CR",
  21103: "CD",
  23203: "PEN",
  31203: "AP",
};

export function statLabel(id: ZzzStatId): string {
  return STAT_LABELS[id] ?? PROPERTIES[String(id)]?.name ?? String(id);
}

export function isPercentStat(id: ZzzStatId): boolean {
  return PROPERTIES[String(id)]?.format.includes("%") ?? false;
}

/** Enka stores percentages x100 (300 is 3.0%) and flats raw. */
export function displayValue(id: ZzzStatId, raw: number): number {
  return isPercentStat(id) ? raw / 100 : raw;
}

export function formatStat(id: ZzzStatId, value: number): string {
  return isPercentStat(id) ? `${value.toFixed(1)}%` : String(Math.round(value));
}

export const SLOT_LABELS: Record<ZzzSlot, string> = {
  1: "Disc 1",
  2: "Disc 2",
  3: "Disc 3",
  4: "Disc 4",
  5: "Disc 5",
  6: "Disc 6",
};

export const PROFESSION_LABELS: Record<string, string> = {
  Attack: "Attack",
  Stun: "Stun",
  Anomaly: "Anomaly",
  Support: "Support",
  Defense: "Defense",
  Rupture: "Rupture",
};

export const ELEMENT_LABELS: Record<string, string> = {
  Physics: "Physical",
  Fire: "Fire",
  Ice: "Ice",
  Elec: "Electric",
  Ether: "Ether",
  Wind: "Wind",
  AuricEther: "Auric Ether",
  FireFrost: "Frost",
  Lumen: "Lumen",
  ZhenZhenAssault: "Assault",
};
