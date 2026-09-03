/**
 * Final agent stats for Zenless Zone Zero.
 *
 * The figures the game's own agent screen shows, and the ones Enka prints:
 * the agent's base curve, plus the W-Engine, plus every disc main stat and
 * substat, plus disc set bonuses.
 *
 * Conditional effects are left out, the same way they are on the Star Rail
 * side: a W-Engine's "when the wearer launches an EX Special Attack" clause
 * cannot be read from a showcase, so including it would put our numbers at
 * odds with both the game and every other showcase site.
 */

import type { ZzzDisc, ZzzStatId, ZzzStats } from "./types";
import agents from "./data/agents.json";
import weapons from "./data/weapons.json";
import curves from "./data/weapon-curves.json";
import sets from "./data/sets.json";

interface AgentCurve {
  rarity: number;
  base: Record<string, number>;
  growth: Record<string, number>;
  promotion: Record<string, number>[];
  core: Record<string, number>[];
}
interface EngineDef {
  rarity: number;
  mainStat: { PropertyId: number; PropertyValue: number } | null;
  secondaryStat: { PropertyId: number; PropertyValue: number } | null;
}
const AGENTS = agents as unknown as Record<string, AgentCurve>;
const ENGINES = weapons as unknown as Record<string, EngineDef>;
const CURVES = curves as { level: Record<string, number>; star: Record<string, { star: number; rand: number }> };
const SETS = sets as Record<string, { name: string; setBonus?: Record<string, number> }>;

// ── Property ids ────────────────────────────────────────────────────
// Base stats end in 101, percentage bonuses in 102, flat bonuses in 103.
const HP = 11101, HP_P = 11102, HP_F = 11103;
const ATK = 12101, ATK_P = 12102, ATK_F = 12103;
const DEF = 13101, DEF_P = 13102, DEF_F = 13103;
const IMPACT = 12201, IMPACT_P = 12202;
const CR = 20101, CR_B = 20103;
const CD = 21101, CD_B = 21103;
const AM = 31401, AM_P = 31402;
const AP = 31201, AP_F = 31203;
const ER = 30501, ER_P = 30502;
const PEN_RATIO = 32001, PEN_RATIO_B = 23103, PEN_F = 23203;

/** Elemental damage bonus ids, one per element. */
const ELEMENT_DMG: Record<string, number> = {
  Physics: 31503,
  Fire: 31603,
  Ice: 31703,
  Elec: 31803,
  Ether: 31903,
  Wind: 32303,
  AuricEther: 32003,
  FireFrost: 31703,
  Lumen: 31903,
  ZhenZhenAssault: 31503,
};

export interface ZzzStatInput {
  agentId: number;
  element: string;
  level: number;
  /** Promotion rank, indexing the agent's promotion table. */
  promotion: number;
  /** Core skill enhancement, indexing the agent's core table. */
  coreSkill: number;
  engine: { id: number; level: number; rank: number } | null;
  discs: ZzzDisc[];
  sets: { setId: number; pieces: number }[];
}

/**
 * A W-Engine's stats at its level and breakthrough. The main stat grows with
 * both; the secondary stat grows on its own curve. Both multipliers are game
 * config scaled by 10000.
 */
export function engineStats(id: number, level: number, rank: number) {
  const def = ENGINES[String(id)];
  if (!def) return { main: null, secondary: null };
  const rarity = def.rarity;
  const levelRate = CURVES.level[`${rarity}-${level}`] ?? 0;
  const star = CURVES.star[`${rarity}-${rank}`] ?? { star: 0, rand: 0 };
  return {
    main: def.mainStat
      ? {
          id: def.mainStat.PropertyId,
          value: Math.floor(def.mainStat.PropertyValue * (1 + levelRate / 10000 + star.star / 10000)),
        }
      : null,
    secondary: def.secondaryStat
      ? {
          id: def.secondaryStat.PropertyId,
          value: def.secondaryStat.PropertyValue * (1 + star.rand / 10000),
        }
      : null,
  };
}

export function computeZzzStats(input: ZzzStatInput): ZzzStats {
  const agent = AGENTS[String(input.agentId)];
  const base = new Map<number, number>();
  if (agent) {
    for (const [id, value] of Object.entries(agent.base)) base.set(Number(id), value);
    // Growth is per level beyond the first, scaled by 10000.
    for (const [id, g] of Object.entries(agent.growth)) {
      base.set(Number(id), (base.get(Number(id)) ?? 0) + (g * (input.level - 1)) / 10000);
    }
    // Enka reports a fully ascended agent as promotion 6, while the table it
    // publishes has six rows indexed 0 to 5, so the top rank has to clamp or
    // the whole promotion bonus silently vanishes.
    const step = (table: Record<string, number>[], rank: number) =>
      table[Math.min(rank, table.length - 1)] ?? {};
    for (const [id, v] of Object.entries(step(agent.promotion, input.promotion))) {
      base.set(Number(id), (base.get(Number(id)) ?? 0) + v);
    }
    for (const [id, v] of Object.entries(step(agent.core, input.coreSkill))) {
      base.set(Number(id), (base.get(Number(id)) ?? 0) + v);
    }
  }

  // Everything added on top, in Enka's raw units.
  const bonus = new Map<number, number>();
  const add = (id: number, value: number) => bonus.set(id, (bonus.get(id) ?? 0) + value);

  const engine = input.engine ? engineStats(input.engine.id, input.engine.level, input.engine.rank) : null;
  if (engine?.secondary) add(engine.secondary.id, engine.secondary.value);

  for (const disc of input.discs) {
    // Disc values are held for display; the pool works in Enka's raw units.
    add(disc.mainStat.id, rawOf(disc.mainStat.id, disc.mainStat.value));
    for (const sub of disc.substats) add(sub.id, rawOf(sub.id, sub.value));
  }

  for (const set of input.sets) {
    if (set.pieces < 2) continue;
    for (const [id, v] of Object.entries(SETS[String(set.setId)]?.setBonus ?? {})) add(Number(id), v);
  }

  const b = (id: number) => bonus.get(id) ?? 0;
  const baseOf = (id: number) => base.get(id) ?? 0;
  // Percentages are stored x100 of a percent, so a raw 300 is 3% is 0.03.
  const ratio = (id: number) => b(id) / 10000;

  // The game carries HP, ATK and DEF as integers, so the base is floored
  // before any percentage applies to it. Skipping that leaves totals a point
  // or two above what the agent screen shows.
  const baseAtk = Math.floor(baseOf(ATK)) + (engine?.main?.id === ATK ? engine.main.value : 0);
  const baseHp = Math.floor(baseOf(HP)) + (engine?.main?.id === HP ? engine.main.value : 0);
  const baseDef = Math.floor(baseOf(DEF)) + (engine?.main?.id === DEF ? engine.main.value : 0);
  const elementId = ELEMENT_DMG[input.element];

  return {
    hp: baseHp * (1 + ratio(HP_P)) + b(HP_F),
    atk: baseAtk * (1 + ratio(ATK_P)) + b(ATK_F),
    def: baseDef * (1 + ratio(DEF_P)) + b(DEF_F),
    impact: baseOf(IMPACT) * (1 + ratio(IMPACT_P)),
    critRate: (baseOf(CR) + b(CR_B)) / 100,
    critDmg: (baseOf(CD) + b(CD_B)) / 100,
    anomalyMastery: baseOf(AM) * (1 + ratio(AM_P)),
    anomalyProficiency: baseOf(AP) + b(AP_F),
    energyRegen: (baseOf(ER) * (1 + ratio(ER_P))) / 100,
    penRatio: (baseOf(PEN_RATIO) + b(PEN_RATIO_B)) / 100,
    pen: b(PEN_F),
    elementalDmg: elementId ? b(elementId) / 100 : 0,
  };
}

/** Display units back to Enka's raw units, the inverse of labels.displayValue. */
function rawOf(id: ZzzStatId, value: number): number {
  return PERCENT_IDS.has(id) ? value * 100 : value;
}

/**
 * Ids whose display value is a percentage. Kept here rather than read from
 * properties.json so the conversion cannot drift from displayValue's.
 */
const PERCENT_IDS = new Set<number>([
  HP_P, ATK_P, DEF_P, IMPACT_P, CR_B, CD_B, AM_P, ER_P, PEN_RATIO_B,
  31503, 31603, 31703, 31803, 31903, 32003, 32303,
]);

/** The stats worth showing in a summary row, in the order the game lists them. */
export const ZZZ_STAT_ROW: Array<{ key: keyof ZzzStats; label: string; percent: boolean; hideWhenZero?: boolean }> = [
  { key: "hp", label: "HP", percent: false },
  { key: "atk", label: "ATK", percent: false },
  { key: "def", label: "DEF", percent: false },
  { key: "impact", label: "Impact", percent: false },
  { key: "critRate", label: "CRIT Rate", percent: true },
  { key: "critDmg", label: "CRIT DMG", percent: true },
  { key: "anomalyProficiency", label: "AP", percent: false },
  { key: "anomalyMastery", label: "AM", percent: false },
  { key: "penRatio", label: "PEN Ratio", percent: true, hideWhenZero: true },
  { key: "pen", label: "PEN", percent: false, hideWhenZero: true },
  { key: "elementalDmg", label: "DMG", percent: true, hideWhenZero: true },
];

export function zzzStatRow(stats: ZzzStats): Array<{ label: string; value: string }> {
  return ZZZ_STAT_ROW.filter((s) => !s.hideWhenZero || stats[s.key] > 0).map((s) => ({
    label: s.label,
    value: s.percent ? `${stats[s.key].toFixed(1)}%` : Math.round(stats[s.key]).toLocaleString(),
  }));
}
