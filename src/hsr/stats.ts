/**
 * Final character stats for Honkai: Star Rail.
 *
 * The same arithmetic the game shows on a character's detail screen, and the
 * same figures Enka prints on its showcase: base values from the character's
 * ascension curve plus the light cone's, then every additive bonus from
 * traces, relic main stats, relic substats and set bonuses applied on top.
 *
 * Conditional effects are deliberately left out. A light cone's passive, a
 * set's "when the wearer attacks" clause and anything else that depends on
 * combat state cannot be read from a showcase, and Enka omits them too, so
 * including them would make our numbers disagree with both the game's
 * character screen and every other showcase site.
 */

import type { HsrCharacter, HsrRelic, HsrStatKey, HsrStats } from "./types";
import statsData from "./data/stats.json";

interface Curve {
  base: number;
  step: number;
}
interface StatTables {
  characters: Record<string, Record<string, Curve>[]>;
  lightCones: Record<string, Record<string, Curve>[]>;
  coneRanks: Record<string, { type: string; value: number }[][]>;
  traces: Record<string, { type: string; value: number }[]>;
  sets: Record<string, { type: string; value: number }[][]>;
}
const TABLES = statsData as unknown as StatTables;


/** A stat's value at a level: the ascension's base plus one step per level above 1. */
function atLevel(curve: Curve | undefined, level: number): number {
  if (!curve) return 0;
  return curve.base + curve.step * (level - 1);
}

const ELEMENT_DMG_KEY: Record<string, string> = {
  Physical: "PhysicalAddedRatio",
  Fire: "FireAddedRatio",
  Ice: "IceAddedRatio",
  Thunder: "ThunderAddedRatio",
  Wind: "WindAddedRatio",
  Quantum: "QuantumAddedRatio",
  Imaginary: "ImaginaryAddedRatio",
};

/**
 * Everything a build adds on top of its base values, keyed by the property
 * names Enka and StarRailRes share, so traces, relics and set bonuses all
 * accumulate into one pool.
 */
function collectBonuses(
  relics: HsrRelic[],
  traceNodes: number[],
  sets: { setId: number; pieces: number }[],
  lightCone: StatInput["lightCone"],
): Map<string, number> {
  const pool = new Map<string, number>();
  const add = (type: string, value: number) => pool.set(type, (pool.get(type) ?? 0) + value);

  // The light cone's own passive. Only its unconditional half is listed, so
  // there is nothing here that depends on combat state.
  if (lightCone) {
    const ranks = TABLES.coneRanks[String(lightCone.id)];
    for (const p of ranks?.[lightCone.superimposition - 1] ?? []) add(p.type, p.value);
  }

  for (const node of traceNodes) {
    for (const p of TABLES.traces[String(node)] ?? []) add(p.type, p.value);
  }

  for (const relic of relics) {
    // Relic values are stored for display (percentages as percents), while the
    // bonus pool works in ratios, so percentages come back down by 100.
    const scale = (key: HsrStatKey, value: number) => (key.endsWith("Delta") ? value : value / 100);
    add(relic.mainStat.key, scale(relic.mainStat.key, relic.mainStat.value));
    for (const sub of relic.substats) add(sub.key, scale(sub.key, sub.value));
  }

  for (const set of sets) {
    const tiers = TABLES.sets[String(set.setId)];
    if (!tiers) continue;
    // A four-piece set grants its two-piece bonus as well.
    if (set.pieces >= 2) for (const p of tiers[0] ?? []) add(p.type, p.value);
    if (set.pieces >= 4) for (const p of tiers[1] ?? []) add(p.type, p.value);
  }

  return pool;
}

export interface StatInput {
  avatarId: number;
  element: string;
  level: number;
  promotion: number;
  traceNodes: number[];
  lightCone: { id: number; level: number; promotion: number; superimposition: number } | null;
  relics: HsrRelic[];
  sets: { setId: number; pieces: number }[];
}

export function computeStats(input: StatInput): HsrStats {
  const charCurves = TABLES.characters[String(input.avatarId)]?.[input.promotion] ?? {};
  const lcCurves = input.lightCone
    ? (TABLES.lightCones[String(input.lightCone.id)]?.[input.lightCone.promotion] ?? {})
    : {};
  const lcLevel = input.lightCone?.level ?? 1;

  const baseHp = atLevel(charCurves.hp, input.level) + atLevel(lcCurves.hp, lcLevel);
  const baseAtk = atLevel(charCurves.atk, input.level) + atLevel(lcCurves.atk, lcLevel);
  const baseDef = atLevel(charCurves.def, input.level) + atLevel(lcCurves.def, lcLevel);
  // Speed, crit rate and crit damage are flat per ascension, so the step is
  // zero and the level does not move them.
  const baseSpd = atLevel(charCurves.spd, input.level);
  const baseCritRate = charCurves.crit_rate?.base ?? 0.05;
  const baseCritDmg = charCurves.crit_dmg?.base ?? 0.5;

  const b = collectBonuses(input.relics, input.traceNodes, input.sets, input.lightCone);
  const get = (key: string) => b.get(key) ?? 0;

  const elementKey = ELEMENT_DMG_KEY[input.element];

  return {
    hp: baseHp * (1 + get("HPAddedRatio")) + get("HPDelta"),
    atk: baseAtk * (1 + get("AttackAddedRatio")) + get("AttackDelta"),
    def: baseDef * (1 + get("DefenceAddedRatio")) + get("DefenceDelta"),
    spd: baseSpd * (1 + get("SpeedAddedRatio")) + get("SpeedDelta"),
    critRate: (baseCritRate + get("CriticalChanceBase")) * 100,
    critDmg: (baseCritDmg + get("CriticalDamageBase")) * 100,
    breakEffect: get("BreakDamageAddedRatioBase") * 100,
    energyRegen: (1 + get("SPRatioBase")) * 100,
    effectHitRate: get("StatusProbabilityBase") * 100,
    effectRes: get("StatusResistanceBase") * 100,
    healRatio: get("HealRatioBase") * 100,
    elementalDmg: elementKey ? get(elementKey) * 100 : 0,
  };
}

/** The stats worth showing in a summary row, in the order the game lists them. */
export const STAT_ROW: Array<{ key: keyof HsrStats; label: string; percent: boolean }> = [
  { key: "hp", label: "HP", percent: false },
  { key: "atk", label: "ATK", percent: false },
  { key: "def", label: "DEF", percent: false },
  { key: "spd", label: "SPD", percent: false },
  { key: "critRate", label: "CRIT Rate", percent: true },
  { key: "critDmg", label: "CRIT DMG", percent: true },
  { key: "breakEffect", label: "Break", percent: true },
  { key: "energyRegen", label: "Energy", percent: true },
  { key: "effectHitRate", label: "EHR", percent: true },
  { key: "effectRes", label: "RES", percent: true },
  { key: "elementalDmg", label: "DMG", percent: true },
];

export function formatStatValue(stats: HsrStats, key: keyof HsrStats, percent: boolean): string {
  const v = stats[key];
  return percent ? `${v.toFixed(1)}%` : Math.round(v).toLocaleString();
}

/** Convenience for the panels: the row entries that are worth rendering. */
export function statRowFor(character: HsrCharacter): Array<{ label: string; value: string }> {
  return STAT_ROW.filter(
    // Effect Hit Rate, Break Effect and healing are noise on a build that has
    // none of them, so they only appear once something actually grants them.
    (s) => !["breakEffect", "effectHitRate", "effectRes", "elementalDmg"].includes(s.key) || character.stats[s.key] > 0,
  ).map((s) => ({ label: s.label, value: formatStatValue(character.stats, s.key, s.percent) }));
}
