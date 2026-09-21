/**
 * Turns Enka's ZZZ payload into the domain models the scorer uses.
 *
 * Every substat comes with `PropertyLevel` (rolls, including the roll that
 * created it) and `PropertyValue`, which turns out to be the fixed value of
 * ONE roll: it is identical whatever the level. Checked across a live
 * profile: ATK% is 300 at one roll and 300 at four. So the stat's value is
 * simply rolls x perRoll, and there is no roll quality to reason about.
 */

import type {
  ZzzAgent,
  ZzzDisc,
  ZzzEngine,
  ZzzShowcase,
  ZzzSlot,
  ZzzSubstat,
} from "./types";
import { displayValue } from "./labels";
import { getAgentInfo } from "./weights";
import sets from "./data/sets.json";
import setItems from "./data/set-items.json";
import weapons from "./data/weapons.json";
import { engineImage, profilePicture } from "./images";

const SETS = sets as Record<string, { name: string; nameZh?: string; icon: string }>;
const SET_ITEMS = setItems as Record<string, { suit: number; rarity: number }>;
const WEAPONS = weapons as Record<string, { name: string; nameZh?: string; rarity: number; image: string }>;

/** Raw Enka shapes, only the fields we read. */
interface RawProperty {
  PropertyId: number;
  PropertyLevel: number;
  PropertyValue: number;
}
interface RawEquipment {
  Id: number;
  Level: number;
  MainPropertyList: RawProperty[];
  RandomPropertyList?: RawProperty[];
}
interface RawAvatar {
  Id: number;
  Level: number;
  PromotionLevel?: number;
  TalentLevel?: number;
  CoreSkillEnhancement?: number;
  SkillLevelList?: { Level: number; Index: number }[];
  EquippedList?: { Slot: number; Equipment: RawEquipment }[];
  Weapon?: { Id: number; Level?: number; UpgradeLevel?: number; BreakLevel?: number } | null;
}
export interface RawZzzResponse {
  ttl?: number;
  uid?: number | string;
  PlayerInfo?: {
    ShowcaseDetail?: { AvatarList?: RawAvatar[] };
    SocialDetail?: {
      Desc?: string;
      ProfileDetail?: { Nickname?: string; Level?: number; ProfileId?: number; Uid?: number };
    };
  };
}

/**
 * A disc's main stat reaches four times its base at that rarity's level cap:
 * S-rank (rarity 4) gains 20% of base per level to +15, A-rank 25% to +12,
 * B-rank a third to +9. A 550 HP main at +0 is 2200 at +15 on an S-rank and
 * 2200 at +12 on an A-rank. Substats do not scale with disc level at all.
 */
const MAIN_GROWTH_PER_LEVEL: Record<number, number> = { 4: 0.2, 3: 0.25, 2: 1 / 3 };
const MAX_DISC_LEVEL: Record<number, number> = { 4: 15, 3: 12, 2: 9 };

export function mainStatAtLevel(base: number, level: number, rarity: number = 4): number {
  return base * (1 + (MAIN_GROWTH_PER_LEVEL[rarity] ?? 0.2) * level);
}

/** The highest level a disc of this rarity can reach. */
export function discMaxLevel(rarity: number): number {
  return MAX_DISC_LEVEL[rarity] ?? 15;
}

function parseDisc(slot: number, raw: RawEquipment, lang: ZzzLang): Omit<ZzzDisc, "score"> | null {
  const main = raw.MainPropertyList?.[0];
  if (!main || slot < 1 || slot > 6) return null;
  const item = SET_ITEMS[String(raw.Id)];
  // Item ids encode the set: 31641 belongs to suit 31600.
  const setId = item?.suit ?? Math.floor(raw.Id / 100) * 100;

  const substats: ZzzSubstat[] = [];
  let totalRolls = 0;
  for (const s of raw.RandomPropertyList ?? []) {
    const rolls = s.PropertyLevel ?? 1;
    const perRoll = displayValue(s.PropertyId, s.PropertyValue);
    substats.push({ id: s.PropertyId, rolls, perRoll, value: perRoll * rolls });
    totalRolls += rolls;
  }

  const rarity = item?.rarity ?? 4;
  return {
    id: `${raw.Id}-${main.PropertyId}-${substats.map((s) => `${s.id}x${s.rolls}`).join(".")}`,
    itemId: raw.Id,
    slot: slot as ZzzSlot,
    setId,
    setName: pickName(SETS[String(setId)], lang, `Set ${setId}`),
    rarity,
    level: raw.Level,
    mainStat: { id: main.PropertyId, value: displayValue(main.PropertyId, mainStatAtLevel(main.PropertyValue, raw.Level, rarity)) },
    substats,
    totalRolls,
  };
}

function parseEngine(raw: RawAvatar["Weapon"], lang: ZzzLang): ZzzEngine | null {
  if (!raw?.Id) return null;
  const meta = WEAPONS[String(raw.Id)];
  return {
    id: raw.Id,
    name: pickName(meta, lang, `W-Engine ${raw.Id}`),
    level: raw.Level ?? 1,
    rank: raw.UpgradeLevel ?? 1,
    breakLevel: raw.BreakLevel ?? 0,
    rarity: meta?.rarity ?? 3,
    image: engineImage(raw.Id) ?? "",
  };
}

/**
 * Skill indices as Enka reports them: 0 basic, 1 special, 2 dodge, 3 chain,
 * 5 assist. Index 6 is the core passive, already carried by
 * CoreSkillEnhancement, and 4 is unused.
 */
function parseSkills(list: RawAvatar["SkillLevelList"]) {
  const at = (i: number) => list?.find((s) => s.Index === i)?.Level ?? 0;
  return { basic: at(0), special: at(1), dodge: at(2), chain: at(3), assist: at(5) };
}

/** A disc before scoring. */
export type ParsedDiscInput = Omit<ZzzDisc, "score">;
/** An agent before scoring: shape only, no judgement applied yet. */
export type ParsedAgent = Omit<ZzzAgent, "discs" | "diagnostics" | "stats"> & {
  discs: ParsedDiscInput[];
};
export type ParsedZzzShowcase = Omit<ZzzShowcase, "agents"> & { agents: ParsedAgent[] };

/**
 * Enka publishes each name in every language it ships, and the fetch script
 * emits the English and Simplified Chinese pair. Reading the right one here
 * means the rest of the app keeps working with a single `name` field.
 */
type ZzzLang = "en" | "zh";

function pickName(entry: { name: string; nameZh?: string } | undefined, lang: ZzzLang, fallback: string): string {
  if (!entry) return fallback;
  return (lang === "zh" ? entry.nameZh : undefined) ?? entry.name;
}

export function parseZzzShowcase(raw: RawZzzResponse, lang: ZzzLang = "en"): ParsedZzzShowcase {
  const info = raw.PlayerInfo;
  if (!info) throw new Error("Malformed response: no PlayerInfo.");
  const profile = info.SocialDetail?.ProfileDetail;

  const agents: ParsedAgent[] = (info.ShowcaseDetail?.AvatarList ?? []).map((a) => {
    const meta = getAgentInfo(a.Id);
    return {
      id: a.Id,
      name: pickName(meta, lang, `Agent ${a.Id}`),
      rarity: meta?.rarity ?? 4,
      profession: meta?.profession ?? "",
      element: meta?.element ?? "",
      level: a.Level,
      promotion: a.PromotionLevel ?? 0,
      mindscape: a.TalentLevel ?? 0,
      coreSkill: a.CoreSkillEnhancement ?? 0,
      skills: parseSkills(a.SkillLevelList),
      engine: parseEngine(a.Weapon, lang),
      discs: (a.EquippedList ?? [])
        .map((e) => parseDisc(e.Slot, e.Equipment, lang))
        .filter((d): d is Omit<ZzzDisc, "score"> => d !== null)
        .sort((x, y) => x.slot - y.slot),
    };
  });

  return {
    ttl: raw.ttl ?? 60,
    uid: String(raw.uid ?? profile?.Uid ?? ""),
    nickname: profile?.Nickname ?? "Unknown",
    level: profile?.Level ?? 0,
    signature: info.SocialDetail?.Desc ?? "",
    profilePicture: profile?.ProfileId ? profilePicture(profile.ProfileId) : null,
    fetchedAt: Date.now(),
    agents,
  };
}
