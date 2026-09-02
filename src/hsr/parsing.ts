/**
 * Turns Enka's HSR payload into the domain models the scorer uses.
 *
 * The pleasant surprise of HSR: every substat states how many upgrades landed
 * on it (`cnt`) and how good those upgrades were (`step`). Value is exactly
 *   cnt * BaseValue + step * StepValue
 * so roll counts never have to be reverse-engineered from a displayed number,
 * the way ../lib/parsing.ts has to for Genshin.
 */

import type {
  HsrCharacter,
  HsrTraces,
  HsrLightCone,
  HsrRelic,
  HsrShowcase,
  HsrSlot,
  HsrStatKey,
  HsrSubstat,
} from "./types";
import affixes from "./data/affixes.json";
import relicIndex from "./data/relics.json";
import setNames from "./data/sets.json";
import lightCones from "./data/light-cones.json";
import { getCharacterInfo } from "./weights";

interface AffixSpec {
  Property: string;
  BaseValue: number;
  StepValue?: number;
  LevelAdd?: number;
}

const MAIN = affixes.main as Record<string, Record<string, AffixSpec>>;
const SUB = affixes.sub as Record<string, Record<string, AffixSpec>>;
const RELICS = relicIndex as Record<
  string,
  { type: string; set: number; main: number; sub: number; rarity: number }
>;
const SETS = setNames as Record<string, string>;
const CONES = lightCones as Record<string, { name: string; path: string; rarity: number }>;

/** Raw Enka shapes, only the fields we read. */
interface RawSubAffix {
  affixId: number;
  cnt: number;
  step?: number;
}
interface RawRelic {
  tid: number;
  type: number;
  level: number;
  mainAffixId: number;
  subAffixList?: RawSubAffix[];
}
interface RawEquipment {
  tid?: number;
  level?: number;
  rank?: number;
}
interface RawSkillNode {
  pointId: number;
  level: number;
}
interface RawAvatar {
  avatarId: number;
  level: number;
  rank?: number;
  equipment?: RawEquipment;
  relicList?: RawRelic[];
  skillTreeList?: RawSkillNode[];
}
export interface RawHsrResponse {
  detailInfo?: {
    uid?: number;
    nickname?: string;
    level?: number;
    signature?: string;
    avatarDetailList?: RawAvatar[];
  };
}

/** Only the three Delta stats and Speed are flat; everything else is a ratio. */
export function isPercentStat(key: HsrStatKey): boolean {
  return !key.endsWith("Delta");
}

/** Enka names crit stats "...Base" in the meta but drops it elsewhere. */
function normalizeKey(prop: string): HsrStatKey {
  return prop as HsrStatKey;
}

function display(key: HsrStatKey, raw: number): number {
  return isPercentStat(key) ? raw * 100 : raw;
}

/**
 * Relic ids can outrun the bundled index when a patch ships a new set. Rather
 * than throw, fall back to the 5-star tables, which are correct for every
 * relic a showcase can display at endgame.
 */
const SLOT_BY_TYPE: Record<number, HsrSlot> = {
  1: "HEAD",
  2: "HAND",
  3: "BODY",
  4: "FOOT",
  5: "NECK",
  6: "OBJECT",
};

function relicInfo(raw: RawRelic) {
  const known = RELICS[String(raw.tid)];
  if (known) {
    return {
      slot: (known.type === "FOOT" ? "FOOT" : known.type) as HsrSlot,
      setId: known.set,
      mainGroup: String(known.main),
      subGroup: String(known.sub),
      rarity: known.rarity,
    };
  }
  const slot = SLOT_BY_TYPE[raw.type] ?? "HEAD";
  return {
    slot,
    setId: Math.floor(raw.tid / 10) % 1000,
    mainGroup: String(50 + raw.type),
    subGroup: "5",
    rarity: 5,
  };
}

function parseRelic(raw: RawRelic): Omit<HsrRelic, "score"> | null {
  const info = relicInfo(raw);
  const mainTable = MAIN[info.mainGroup];
  const subTable = SUB[info.subGroup];
  if (!mainTable || !subTable) return null;

  const mainSpec = mainTable[String(raw.mainAffixId)];
  if (!mainSpec) return null;
  const mainKey = normalizeKey(mainSpec.Property);
  const mainRaw = mainSpec.BaseValue + (mainSpec.LevelAdd ?? 0) * raw.level;

  const substats: HsrSubstat[] = [];
  let totalRolls = 0;
  for (const s of raw.subAffixList ?? []) {
    const spec = subTable[String(s.affixId)];
    if (!spec) continue;
    const step = s.step ?? 0;
    const stepValue = spec.StepValue ?? 0;
    const rawValue = s.cnt * spec.BaseValue + step * stepValue;
    // Best this many rolls could have been: every roll at the top tier.
    const best = s.cnt * (spec.BaseValue + 2 * stepValue);
    substats.push({
      key: normalizeKey(spec.Property),
      value: display(normalizeKey(spec.Property), rawValue),
      rolls: s.cnt,
      quality: best > 0 ? rawValue / best : 0,
    });
    totalRolls += s.cnt;
  }

  return {
    // Content-derived so a re-fetch produces the same id, which keeps the
    // reroll simulation's seed stable across page loads.
    id: `${raw.tid}-${raw.mainAffixId}-${substats.map((s) => `${s.key}${s.rolls}`).join(".")}`,
    tid: raw.tid,
    slot: info.slot,
    setId: info.setId,
    setName: SETS[String(info.setId)] ?? `Set ${info.setId}`,
    rarity: info.rarity,
    level: raw.level,
    mainStat: { key: mainKey, value: display(mainKey, mainRaw) },
    substats,
    totalRolls,
  };
}

/** Node ids end in a three-digit code identifying which trace they are. */
const TRACE_CODES: Record<number, keyof Omit<HsrTraces, "bonusTaken" | "bonusTotal">> = {
  1: "basic",
  2: "skill",
  3: "ultimate",
  4: "talent",
};

function parseTraces(nodes: RawSkillNode[] | undefined): HsrTraces | null {
  if (!nodes || nodes.length === 0) return null;
  const traces: HsrTraces = {
    basic: 0,
    skill: 0,
    ultimate: 0,
    talent: 0,
    bonusTaken: 0,
    bonusTotal: 0,
  };
  for (const node of nodes) {
    const code = node.pointId % 1000;
    const named = TRACE_CODES[code];
    if (named) {
      traces[named] = node.level;
    } else if (code >= 100) {
      // Bonus nodes are binary: present in the list means taken.
      traces.bonusTotal += 1;
      if (node.level > 0) traces.bonusTaken += 1;
    }
  }
  return traces;
}

function parseLightCone(eq: RawEquipment | undefined): HsrLightCone | null {
  if (!eq?.tid) return null;
  const meta = CONES[String(eq.tid)];
  return {
    id: eq.tid,
    name: meta?.name ?? `Light Cone ${eq.tid}`,
    path: meta?.path ?? "",
    level: eq.level ?? 1,
    superimposition: eq.rank ?? 1,
  };
}

/** A relic before scoring: shape only, no judgement applied yet. */
export type ParsedRelic = Omit<HsrRelic, "score">;
/** A character before scoring and diagnostics. */
export type ParsedCharacter = Omit<HsrCharacter, "relics" | "diagnostics"> & {
  relics: ParsedRelic[];
};
export type ParsedShowcase = Omit<HsrShowcase, "characters"> & {
  characters: ParsedCharacter[];
};

/**
 * Parses a showcase. Scoring is applied separately so this stays a pure
 * shape transformation with no opinions in it.
 */
export function parseHsrShowcase(raw: RawHsrResponse): ParsedShowcase {
  const info = raw.detailInfo;
  if (!info) throw new Error("Malformed response: no detailInfo.");

  const characters: ParsedCharacter[] = (info.avatarDetailList ?? []).map((a) => {
    const meta = getCharacterInfo(a.avatarId);
    return {
      avatarId: a.avatarId,
      name: meta?.name ?? `Character ${a.avatarId}`,
      path: meta?.path ?? "",
      element: meta?.element ?? "",
      rarity: meta?.rarity ?? 5,
      level: a.level,
      eidolon: a.rank ?? 0,
      lightCone: parseLightCone(a.equipment),
      traces: parseTraces(a.skillTreeList),
      relics: (a.relicList ?? []).map(parseRelic).filter((r): r is ParsedRelic => r !== null),
    };
  });

  return {
    uid: String(info.uid ?? ""),
    nickname: info.nickname ?? "Unknown",
    level: info.level ?? 0,
    signature: info.signature ?? "",
    fetchedAt: Date.now(),
    characters,
  };
}
