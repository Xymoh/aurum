/**
 * Substat weights and ideal main stats for Zenless Zone Zero.
 *
 * Primary source: ./data/scoring-metadata.json, generated from Prydwen's
 * per-agent build guides by scripts/fetch-zzz-weights.mjs. ZZZ has no open
 * weight table of the kind Fribbels maintains for Star Rail, but Prydwen's
 * ZZZ guides list an ideal main stat per disc and a ranked substat priority
 * for every agent, which is the same information.
 *
 * Fallback: a profile per Profession, so an agent released after the last
 * import still scores sensibly the moment Enka knows their role.
 */

import type { SelectableZzzSlot, ZzzStatId } from "./types";
import agents from "./data/agents.json";
import scoringMetadata from "./data/scoring-metadata.json";

export type ZzzWeights = Record<number, number>;

export interface ZzzScoringMeta {
  /** Substat weights by PropertyId, 0 to 1, flats already scaled to 40% of their percent stat. */
  stats: ZzzWeights;
  /** Ideal main stats per selectable slot. Empty means any main stat the slot can roll. */
  parts: Record<SelectableZzzSlot, ZzzStatId[]>;
  /** Stats a guide caps, as "build this until X%": CRIT Rate until 80, for instance. */
  thresholds: Record<number, number>;
  /** The guide's own wording, for the UI to quote. */
  priority: string | null;
  source: "prydwen" | "profession";
}

const AGENTS = agents as Record<string, { name: string; profession: string; element: string; rarity: number; accent: string }>;

interface MetadataEntry {
  name: string;
  stats: Record<string, number>;
  parts: Record<string, number[]>;
  thresholds?: Record<string, number>;
  priority?: string;
}
const PRYDWEN = (scoringMetadata as { characters: Record<string, MetadataEntry> }).characters ?? {};

/** Below this, a roll is doing nothing useful and counts as waste. */
export const WASTE_THRESHOLD = 0.2;

/** Flat substats are worth 40% of their percent counterpart, as in the other two scorers. */
export const FLAT_STAT_SCALING = 0.4;

export const PERCENT_TO_FLAT: Record<number, number> = {
  11102: 11103,
  12102: 12103,
  13102: 13103,
};

function withFlatScaling(stats: ZzzWeights): ZzzWeights {
  const out: ZzzWeights = { ...stats };
  for (const [pct, flat] of Object.entries(PERCENT_TO_FLAT)) {
    const scaled = (out[Number(pct)] ?? 0) * FLAT_STAT_SCALING;
    if (scaled > 0) out[Number(flat)] = scaled;
    else delete out[Number(flat)];
  }
  return out;
}

// Stat ids, for readability below.
const HP_P = 11102;
const ATK_P = 12102;
const DEF_P = 13102;
const CR = 20103;
const CD = 21103;
const PEN = 23203;
const AP = 31203;

/**
 * Role profiles, used only when an agent has no guide entry. Written to the
 * same discrete scale as the imported weights.
 */
const PROFESSION_WEIGHTS: Record<string, ZzzWeights> = {
  Attack: { [CR]: 1, [CD]: 1, [ATK_P]: 0.75, [PEN]: 0.5 },
  Rupture: { [CR]: 1, [CD]: 1, [ATK_P]: 0.75, [PEN]: 0.5 },
  Anomaly: { [AP]: 1, [ATK_P]: 0.75, [PEN]: 0.5, [CR]: 0.25, [CD]: 0.25 },
  Stun: { [ATK_P]: 1, [CR]: 0.5, [CD]: 0.5, [PEN]: 0.25 },
  Support: { [ATK_P]: 0.75, [HP_P]: 0.5, [CR]: 0.5, [CD]: 0.5, [AP]: 0.25 },
  Defense: { [DEF_P]: 1, [HP_P]: 0.75, [CR]: 0.5, [CD]: 0.5 },
};

/** Disc 5 elemental DMG main stat for each element Enka reports. */
const ELEMENT_DMG: Record<string, ZzzStatId> = {
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

/**
 * Ideal main stats for an agent with no guide entry, derived from the role
 * profile: any disc 4 or 6 substat the role weights at 0.5 or more, the
 * element's DMG bonus and PEN Ratio on disc 5 for damage roles, and the
 * role's signature disc 6 stat (Anomaly Mastery, Impact, Energy Regen).
 */
function professionParts(profession: string, element: string, stats: ZzzWeights): Record<SelectableZzzSlot, ZzzStatId[]> {
  const wanted = (ids: ZzzStatId[]) => ids.filter((id) => (stats[id] ?? 0) >= 0.5);
  const dmg = ELEMENT_DMG[element];
  const damageRole = profession === "Attack" || profession === "Rupture" || profession === "Anomaly";
  const disc6: Record<string, ZzzStatId[]> = {
    Anomaly: [31402],
    Stun: [12201],
    Support: [30502],
    Defense: [13102, 11102],
  };
  return {
    4: wanted([HP_P, ATK_P, DEF_P, CR, CD, AP]),
    5: [...wanted([HP_P, ATK_P, DEF_P]), ...(damageRole && dmg ? [dmg, 23103] : [])],
    6: [...wanted([HP_P, ATK_P, DEF_P]), ...(disc6[profession] ?? [])],
  };
}

export function getAgentInfo(id: number) {
  return AGENTS[String(id)] ?? null;
}

/**
 * Everything the scorer needs to know about an agent. Falls through
 * Prydwen -> Profession -> Attack, so an unknown id still scores.
 */
export function getScoringMeta(agentId: number): ZzzScoringMeta {
  const entry = PRYDWEN[String(agentId)];
  if (entry) {
    const stats: ZzzWeights = {};
    for (const [id, w] of Object.entries(entry.stats)) stats[Number(id)] = w;
    const thresholds: Record<number, number> = {};
    for (const [id, t] of Object.entries(entry.thresholds ?? {})) thresholds[Number(id)] = t;
    return {
      stats: withFlatScaling(stats),
      parts: {
        4: entry.parts["4"] ?? [],
        5: entry.parts["5"] ?? [],
        6: entry.parts["6"] ?? [],
      },
      thresholds,
      priority: entry.priority ?? null,
      source: "prydwen",
    };
  }
  const info = getAgentInfo(agentId);
  const profile = (info && PROFESSION_WEIGHTS[info.profession]) || PROFESSION_WEIGHTS.Attack;
  return {
    stats: withFlatScaling(profile),
    parts: professionParts(info?.profession ?? "Attack", info?.element ?? "", profile),
    thresholds: {},
    priority: null,
    source: "profession",
  };
}

export function weightOf(weights: ZzzWeights, id: ZzzStatId): number {
  return weights[id] ?? 0;
}
