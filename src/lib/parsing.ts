import type {
  EnkaResponse,
  EnkaAvatarInfo,
  EnkaEquip,
  FightProp,
  EquipType,
  EnkaSubstat,
  EnkaShowAvatarInfo,
  EnkaPlayerInfo,
} from "../types/enka";
import type { Artifact, ArtifactSlot, ArtifactMainStat, ArtifactSubstat } from "../types/artifact";
import type { CharacterData, CharacterWeapon, CharacterStats, ShowcaseData, GenshinElement } from "../types/character";
import { SLOT_MAP, SLOT_ORDER } from "./constants";
import statKeysData from "../data/stat-keys.json";
import charactersData from "../data/characters.json";
import artifactsData from "../data/artifacts.json";
import weaponsData from "../data/weapons.json";
import weaponIdsData from "../data/weapon-ids.json";
import enkaLocaleData from "../data/enka-locale.json";
import profilePicturesData from "../data/profile-pictures.json";
import { computeRollQuality, getMaxRoll } from "./scoring";

// ── Lookup tables ──

const STAT_KEYS = statKeysData as Record<string, { displayName: string; shortName: string; isPercentage: boolean }>;
const CHARACTERS = charactersData as Record<string, { name: string; element: string; weapon: string; icon: string }>;
const ARTIFACTS = artifactsData as Record<string, { name: string; pieces: number }>;
const WEAPONS = weaponsData as Record<string, string>;
const WEAPON_IDS = weaponIdsData as Record<string, string>;
const ENKA_LOCALE = enkaLocaleData as Record<string, string>;
const PROFILE_PICTURES = profilePicturesData as Record<string, string>;

// ── Weapon name lookup (itemId-based with hash and icon fallbacks) ──
// Weapon name resolution strategy:
// 1. weaponId lookup from weapon-ids.json (authoritative, covers 258+ weapons)
// 2. nameTextMapHash lookup from Enka loc.json (works for some weapons)
// 3. nameTextMapHash +512 offset lookup (Enka API hashes are often 512 less than loc.json hashes)
// 4. Icon suffix from weapons.json (fallback)

function resolveWeaponName(flat: EnkaEquip["flat"], itemId?: number): string {
  // Primary: weapon ID → name (most reliable, built from game data + locale)
  if (itemId && WEAPON_IDS[String(itemId)]) {
    return WEAPON_IDS[String(itemId)];
  }

  // Secondary: hash-based lookup from Enka locale data
  if (flat.nameTextMapHash) {
    const hashName = ENKA_LOCALE[flat.nameTextMapHash];
    if (hashName && hashName !== "TBD") return hashName;

    // Try +512 offset (Enka API often returns hash that is 512 less than loc.json hash)
    const offsetHash = String(Number(flat.nameTextMapHash) + 512);
    const offsetName = ENKA_LOCALE[offsetHash];
    if (offsetName && offsetName !== "TBD") return offsetName;
  }

  // Tertiary: icon suffix from curated weapons.json
  const match = flat.icon.match(/UI_EquipIcon_(.+)/);
  if (match) {
    let iconSuffix = match[1];
    iconSuffix = iconSuffix.replace(/_Awaken$/, "");
    if (WEAPONS[iconSuffix]) {
      return WEAPONS[iconSuffix];
    }
    return iconSuffix.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  return "Unknown Weapon";
}

// ── Artifact set name lookup (hash-based) ──
// Uses `flat.setNameTextMapHash` from Enka API for reliable set name resolution.
function resolveSetName(flat: EnkaEquip["flat"]): string {
  // Primary: hash-based lookup from Enka locale data
  if (flat.setNameTextMapHash) {
    const hashName = ENKA_LOCALE[flat.setNameTextMapHash];
    if (hashName) return hashName;
  }
  // Fallback: use artifacts.json via set ID
  const setId = extractSetId(flat);
  return ARTIFACTS[setId]?.name ?? "";
}

/**
 * Map Enka equipType enum string → our ArtifactSlot.
 */
function mapSlot(equipType: string): ArtifactSlot {
  return (SLOT_MAP[equipType] as ArtifactSlot) ?? "FLOWER";
}

function getSlotIndex(slot: ArtifactSlot): number {
  return SLOT_ORDER.indexOf(slot);
}

/**
 * Resolve a FIGHT_PROP_… string to its display metadata.
 */
function resolveStatName(propId: string): { displayName: string; shortName: string; isPercentage: boolean } {
  return STAT_KEYS[propId] ?? { displayName: propId, shortName: propId, isPercentage: false };
}

// ── FightProp numeric ID mapping (Enka API uses numeric string keys) ──

const FIGHT_PROP_IDS: Record<string, string> = {
  "1": "FIGHT_PROP_BASE_HP",
  "2": "FIGHT_PROP_HP",
  "3": "FIGHT_PROP_HP_PERCENT",
  "4": "FIGHT_PROP_BASE_ATTACK",
  "5": "FIGHT_PROP_ATTACK",
  "6": "FIGHT_PROP_ATTACK_PERCENT",
  "7": "FIGHT_PROP_BASE_DEFENSE",
  "8": "FIGHT_PROP_DEFENSE",
  "9": "FIGHT_PROP_DEFENSE_PERCENT",
  "20": "FIGHT_PROP_CRITICAL",
  "22": "FIGHT_PROP_CRITICAL_HURT",
  "23": "FIGHT_PROP_ELEMENT_MASTERY",
  "26": "FIGHT_PROP_CHARGE_EFFICIENCY",
  "28": "FIGHT_PROP_HEAL_ADD",
  "29": "FIGHT_PROP_HEALED_ADD",
  "31": "FIGHT_PROP_PHYSICAL_ADD_HURT",
  "41": "FIGHT_PROP_FIRE_ADD_HURT",
  "42": "FIGHT_PROP_ELEC_ADD_HURT",
  "43": "FIGHT_PROP_WATER_ADD_HURT",
  "44": "FIGHT_PROP_GRASS_ADD_HURT",
  "45": "FIGHT_PROP_WIND_ADD_HURT",
  "46": "FIGHT_PROP_ROCK_ADD_HURT",
  "47": "FIGHT_PROP_ICE_ADD_HURT",
};

/** Try both numeric and FIGHT_PROP_ string keys from the fightPropMap */
function fpVal(fp: Record<string, number>, numKey: string, strKey: string): number {
  return fp[numKey] ?? fp[strKey] ?? 0;
}

/** Elemental DMG prop IDs → element mapping */
const DMG_BONUS_PROP_IDS: Record<string, GenshinElement> = {
  "41": "Pyro",
  "42": "Electro",
  "43": "Hydro",
  "45": "Anemo",
  "47": "Cryo",
  "46": "Geo",
  "44": "Dendro",
};

function detectElement(fightPropMap: Record<string, number> | undefined, fallback: GenshinElement = "Pyro"): GenshinElement {
  if (!fightPropMap) return fallback;
  for (const [propId, element] of Object.entries(DMG_BONUS_PROP_IDS)) {
    if ((fightPropMap[propId] ?? 0) > 0) return element;
  }
  return fallback;
}

// The Traveler's avatarId never changes when the player switches Vision - Enka
// doesn't expose the active element as a clean enum on this API version, so
// characters.json can only store one static "Anemo" guess. Unlike every other
// character, that static value is wrong 6 times out of 7. Detect the live
// element from the character's own elemental DMG% stat instead (reliable
// whenever any equipped piece grants an elemental DMG bonus - the common case
// for an on-field Traveler build; falls back to Anemo, the base/default
// Vision, when no elemental DMG% is present at all, e.g. a pure ATK%/EM build).
const TRAVELER_AVATAR_IDS = new Set([10000005, 10000007]);

/** Map a numeric/string prop ID to its FIGHT_PROP name, or return as-is */
function resolvePropId(rawId: string): string {
  return FIGHT_PROP_IDS[rawId] ?? rawId;
}

// ── Substat building ──

/**
 * Decode appendPropIdList to count how many times each stat was rolled.
 * The IDs have format: 5XXYYZ where XX encodes stat type and Z encodes tier.
 * Specifically: stat type is derived from floor(id / 10) % 100 (the tens/hundreds digit group).
 *
 * Stat code mapping (the 2-digit code before the tier digit):
 *   01 = flat HP, 02 = flat HP (alt), 03 = HP%, 04 = HP% (alt),
 *   05 = flat ATK, 06 = ATK%, 07 = flat DEF (alt), 08 = flat DEF, 09 = DEF%,
 *   20 = CRIT Rate, 22 = CRIT DMG, 23 = Energy Recharge, 24 = Elemental Mastery
 */
const APPEND_PROP_STAT_MAP: Record<number, string> = {
  1: "FIGHT_PROP_HP",
  2: "FIGHT_PROP_HP",
  3: "FIGHT_PROP_HP_PERCENT",
  4: "FIGHT_PROP_HP_PERCENT",
  5: "FIGHT_PROP_ATTACK",
  6: "FIGHT_PROP_ATTACK_PERCENT",
  7: "FIGHT_PROP_DEFENSE",
  8: "FIGHT_PROP_DEFENSE",
  9: "FIGHT_PROP_DEFENSE_PERCENT",
  20: "FIGHT_PROP_CRITICAL",
  22: "FIGHT_PROP_CRITICAL_HURT",
  23: "FIGHT_PROP_CHARGE_EFFICIENCY",
  24: "FIGHT_PROP_ELEMENT_MASTERY",
};

/**
 * Count the number of enhancements (upgrades) for each substat using appendPropIdList.
 * Returns a map of FIGHT_PROP_* → enhancement count (0-5).
 *
 * Logic: the appendPropIdList contains ALL rolls (initial substats + enhancements).
 * For a +20 5-star artifact:
 *   - Started with 4 substats: list has 9 entries (4 initial + 5 enhancements)
 *   - Started with 3 substats: list has 8 entries (3 initial + 5 enhancements)
 *
 * Enhancement count per stat = total occurrences - 1 (for the initial roll).
 * Exception: if the artifact started with 3 substats, the 4th stat that appeared
 * at +4 has ALL its occurrences as enhancements (first appearance IS an enhancement).
 */
function countEnhancementsFromAppendList(appendPropIdList: number[]): Map<string, number> {
  // Count total occurrences of each stat
  const statCounts = new Map<string, number>();

  for (const id of appendPropIdList) {
    // Extract stat code: remove the last digit (tier) and take the stat identifier
    // ID format example: 501221 → 50122 + tier 1 → stat code = 22
    const withoutTier = Math.floor(id / 10);
    const statCode = withoutTier % 100;
    const statKey = APPEND_PROP_STAT_MAP[statCode];
    if (statKey) {
      statCounts.set(statKey, (statCounts.get(statKey) ?? 0) + 1);
    }
  }

  // Determine if artifact started with 3 or 4 substats
  // 5-star +20 artifacts: 9 entries = 4 initial, 8 entries = 3 initial
  const numInitialStats = appendPropIdList.length >= 9 ? 4 : 3;
  const numDistinctStats = statCounts.size;

  // Calculate enhancements per stat
  const enhancements = new Map<string, number>();

  if (numInitialStats === 4 || numDistinctStats <= numInitialStats) {
    // All stats were present at +0: enhancements = total - 1
    for (const [stat, count] of statCounts) {
      enhancements.set(stat, Math.max(0, count - 1));
    }
  } else {
    // 3 initial substats: one stat appeared as enhancement at +4
    // The stat with the fewest occurrences that appeared after position 3
    // is likely the one that was added. But we can't be 100% sure just from counts.
    // Heuristic: the stat with the fewest total rolls that's not in the first 3 IDs
    // was the added stat (all its rolls are enhancements).

    // Get the stats from the first 3 entries (initial substats)
    const initialStats = new Set<string>();
    for (let i = 0; i < Math.min(3, appendPropIdList.length); i++) {
      const withoutTier = Math.floor(appendPropIdList[i] / 10);
      const statCode = withoutTier % 100;
      const statKey = APPEND_PROP_STAT_MAP[statCode];
      if (statKey) initialStats.add(statKey);
    }

    for (const [stat, count] of statCounts) {
      if (initialStats.has(stat)) {
        // Was an initial stat: enhancements = total - 1
        enhancements.set(stat, Math.max(0, count - 1));
      } else {
        // Was added during enhancement: all occurrences are enhancements
        enhancements.set(stat, count);
      }
    }
  }

  return enhancements;
}

function buildSubstats(raw: EnkaSubstat[] | undefined, appendPropIdList?: number[]): ArtifactSubstat[] {
  if (!raw || raw.length === 0) return [];

  // If appendPropIdList is available, use exact roll counting
  const enhancementCounts = appendPropIdList && appendPropIdList.length > 0
    ? countEnhancementsFromAppendList(appendPropIdList)
    : null;

  return raw.map((s) => {
    const statKey = s.appendPropId as FightProp;
    const meta = resolveStatName(statKey);
    const maxRoll = getMaxRoll(statKey);

    // Roll count: number of enhancements (upgrades) for this stat
    let rollCount: number;
    if (enhancementCounts) {
      // Exact count from appendPropIdList
      rollCount = enhancementCounts.get(statKey) ?? 0;
    } else {
      // Fallback: estimate from value using average roll
      const avgRoll = maxRoll * 0.85;
      const totalRolls = avgRoll > 0 ? Math.round(s.statValue / avgRoll) : 0;
      rollCount = Math.max(0, totalRolls - 1);
    }

    const quality = computeRollQuality(s.statValue, maxRoll);

    return {
      statKey,
      displayName: meta.displayName,
      shortName: meta.shortName,
      value: s.statValue,
      isPercentage: meta.isPercentage,
      maxRoll,
      rollCount,
      rollQuality: quality,
    };
  });
}

// ── Main stat ──

function buildMainStat(flat: EnkaEquip["flat"]): ArtifactMainStat | null {
  const main = flat.reliquaryMainstat;
  if (!main) return null;

  const meta = resolveStatName(main.mainPropId);
  return {
    statKey: main.mainPropId as FightProp,
    displayName: meta.displayName,
    value: main.statValue,
    isPercentage: meta.isPercentage,
    isCorrect: false,
    isRecommended: false,
  };
}

// ── Set ID extraction ──
// The Enka API returns flat.setId directly, or the icon URL follows a
// "UI_RelicIcon_XXXXX_Y" pattern where XXXXX is the real game SetId
// (this is also the ID used as the key in src/data/artifacts.json).

function extractSetId(flat: EnkaEquip["flat"]): string {
  if (flat.setId) return flat.setId;
  const match = flat.icon.match(/UI_RelicIcon_(\d+)_/);
  return match ? match[1] : "0";
}

// ── Artifact check ──

function isArtifact(flat: EnkaEquip["flat"]): boolean {
  return flat.itemType === "ITEM_RELIQUARY";
}

// ── Character name extraction ──
// NOTE: characters.json is the authoritative source for in-game character names.
// The Genshin Optimizer (GO) repo uses pre-release codenames (e.g. "Varka" for what
// became "Lohen" in-game). If character names appear wrong, re-run
// `node scripts/fetch-go-data.js` to refresh the GO processed data, and verify
// that characters.json has the correct avatar_id → name mappings.

function getCharacterName(avatarId: number): string {
  const entry = CHARACTERS[String(avatarId)];
  if (entry) return entry.name;
  console.warn(`[ArtScore] Unknown avatarId: ${avatarId} - name not found in characters.json`);
  return `Character #${avatarId}`;
}

function getCharacterElement(avatarId: number, fightPropMap?: Record<string, number>): GenshinElement {
  if (TRAVELER_AVATAR_IDS.has(avatarId)) {
    return detectElement(fightPropMap, "Anemo");
  }
  const char = CHARACTERS[String(avatarId)];
  if (char) return char.element as GenshinElement;
  console.warn(`[ArtScore] Unknown avatarId: ${avatarId} - detecting element from fightPropMap`);
  return detectElement(fightPropMap);
}

function isTraveler(avatarId: number): boolean {
  return TRAVELER_AVATAR_IDS.has(avatarId);
}

/**
 * Resolve the player's chosen profile picture to an Enka icon name.
 *
 * `profilePicture.id` is a ProfilePicture id, not a character id - costume and
 * event-only pictures have no character behind them, so it can only be resolved
 * through the game's ProfilePicture table (see profile-pictures.json, refreshed
 * by scripts/fetch-profile-pictures.js). Older Enka responses instead sent
 * `avatarId`, which we can map straight through characters.json.
 */
function resolveProfileIcon(profilePicture: EnkaPlayerInfo["profilePicture"]): string {
  if (!profilePicture) return "";

  if (profilePicture.id != null) {
    const icon = PROFILE_PICTURES[String(profilePicture.id)];
    if (icon) return icon;
    // A picture added in a patch newer than our bundled table. The id encodes a
    // release-order index that can't be mapped to a character or icon name by
    // any formula, so this is genuinely unresolvable until the upstream game
    // data catches up - re-run `npm run fetch-pfps` once it does.
    console.warn(
      `[ArtScore] Unknown profile picture id: ${profilePicture.id} - ` +
        `run \`npm run fetch-pfps\` to refresh src/data/profile-pictures.json`,
    );
  }

  if (profilePicture.avatarId != null) {
    const icon = getCharacterIcon(profilePicture.avatarId);
    if (icon) return icon;
  }

  return "";
}

function getCharacterWeaponType(avatarId: number): string {
  return CHARACTERS[String(avatarId)]?.weapon ?? "Unknown";
}

function getCharacterIcon(avatarId: number): string {
  return CHARACTERS[String(avatarId)]?.icon ?? "";
}

/** Extract the icon suffix from avatar icon (e.g. "UI_AvatarIcon_Zibai" → "Zibai") */
function getTalentIconSuffix(avatarId: number): string {
  const icon = getCharacterIcon(avatarId);
  const match = icon.match(/UI_AvatarIcon_(.+)/);
  return match ? match[1] : String(avatarId);
}

// ── Character catalog check ──

function isCharacterKnown(avatarId: number): boolean {
  return CHARACTERS[String(avatarId)] !== undefined;
}

// ── Fight prop stat extraction ──
// Enka fightPropMap uses numeric string keys ("1","20") OR FIGHT_PROP_ strings.
//
// HP/ATK/DEF: stored as COMPONENTS (base + percent + flat).
//   Keys 1/4/7 = base, 2/5/8 = flat added, 3/6/9 = % bonus (decimal, e.g. 0.466 = 46.6%)
//   Formula: final = base * (1 + percent) + flat
//
// CRIT / ER / Elemental DMG: stored as FINAL values already including character base.
//   Keys 20/22/26 = final decimals (NO base added). e.g. 0.592 = 59.2% CRIT Rate (includes base 5%).
//   Key 23 = Elemental Mastery (flat integer).

/**
 * Compute total EM from artifact substats when fightPropMap lacks it.
 */
function computeEMFromArtifacts(artifacts: Artifact[]): number {
  let em = 0;
  for (const art of artifacts) {
    for (const sub of art.substats) {
      if (sub.statKey === "FIGHT_PROP_ELEMENT_MASTERY") {
        em += sub.value;
      }
    }
  }
  return Math.round(em);
}

function computeStats(fightPropMap: Record<string, number> | undefined, artifacts?: Artifact[]): CharacterStats {
  const fp = fightPropMap ?? {};

  // ── HP: component formula ──
  const baseHp = fpVal(fp, "1", "FIGHT_PROP_BASE_HP");
  const flatHp = fpVal(fp, "2", "FIGHT_PROP_HP");
  // HP% may be split across multiple keys (base HP% + set bonus HP%).
  // Try: key 3 (standard HP%), key 10 (alternate HP% source), key 0 (total HP%).
  const hpPercent = fpVal(fp, "3", "FIGHT_PROP_HP_PERCENT")
    || fpVal(fp, "10", "FIGHT_PROP_HP_PERCENT");
  const maxHp = Math.round(baseHp * (1 + hpPercent) + flatHp);

  // ── ATK: component formula ──
  const baseAtk = fpVal(fp, "4", "FIGHT_PROP_BASE_ATTACK");
  const flatAtk = fpVal(fp, "5", "FIGHT_PROP_ATTACK");
  const atkPercent = fpVal(fp, "6", "FIGHT_PROP_ATTACK_PERCENT");
  const atk = Math.round(baseAtk * (1 + atkPercent) + flatAtk);

  // ── DEF: component formula ──
  const baseDef = fpVal(fp, "7", "FIGHT_PROP_BASE_DEFENSE");
  const flatDef = fpVal(fp, "8", "FIGHT_PROP_DEFENSE");
  const defPercent = fpVal(fp, "9", "FIGHT_PROP_DEFENSE_PERCENT");
  const def = Math.round(baseDef * (1 + defPercent) + flatDef);

  // ── CRIT Rate/DMG: FINAL values (no base added) ──
  const critRate = parseFloat((fpVal(fp, "20", "FIGHT_PROP_CRITICAL") * 100).toFixed(1));
  const critDmg = parseFloat((fpVal(fp, "22", "FIGHT_PROP_CRITICAL_HURT") * 100).toFixed(1));

  // ── Elemental Mastery / Energy Recharge ──
  // In some Enka responses, EM and ER keys are swapped:
  //   key "23" may hold ER (decimal ~1-3) and EM is in key "28".
  // We detect by value range: EM is 0-1000 (integer-like), ER is 1.0-3.0 (decimal).
  const raw23 = fpVal(fp, "23", "FIGHT_PROP_ELEMENT_MASTERY");
  const raw26 = fpVal(fp, "26", "FIGHT_PROP_CHARGE_EFFICIENCY");
  const raw28 = fpVal(fp, "28", "FIGHT_PROP_ELEMENT_MASTERY");

  let em: number;
  let erRaw: number;

  if (raw23 > 0.9 && raw23 < 10) {
    // raw23 is actually ER (decimal 1.0–3.0), EM is in key 28 or 0
    em = Math.round(raw28);
    erRaw = raw23;
  } else {
    // Standard mapping: raw23 is EM, raw26 is ER
    em = Math.round(raw23);
    erRaw = raw26;
  }

  // EM artifact fallback
  if (em < 10 && artifacts && artifacts.length > 0) {
    const fromArts = computeEMFromArtifacts(artifacts);
    if (fromArts > 10) em = fromArts;
  }

  const er = parseFloat((erRaw * 100).toFixed(1));

  // ── Elemental DMG Bonus ──
  const dmgKeys = [
    { n: "31", s: "FIGHT_PROP_PHYSICAL_ADD_HURT" },
    { n: "41", s: "FIGHT_PROP_FIRE_ADD_HURT" },
    { n: "42", s: "FIGHT_PROP_ELEC_ADD_HURT" },
    { n: "43", s: "FIGHT_PROP_WATER_ADD_HURT" },
    { n: "44", s: "FIGHT_PROP_GRASS_ADD_HURT" },
    { n: "45", s: "FIGHT_PROP_WIND_ADD_HURT" },
    { n: "46", s: "FIGHT_PROP_ROCK_ADD_HURT" },
    { n: "47", s: "FIGHT_PROP_ICE_ADD_HURT" },
  ];
  let elementalDmg = 0;
  for (const { n, s } of dmgKeys) {
    const v = fpVal(fp, n, s);
    if (v > 0) { elementalDmg = parseFloat((v * 100).toFixed(1)); break; }
  }

  return { maxHp, atk, def, elementalMastery: em, critRate, critDmg, energyRecharge: er, elementalDmg, raw: fp };
}

// ── Weapon extraction ──

function extractWeapon(equips: EnkaEquip[]): CharacterWeapon | null {
  for (const equip of equips) {
    if (equip.flat.itemType !== "ITEM_WEAPON") continue;
    const { flat, weapon } = equip;
    const icon = flat.icon || "";

    // Main stat (base ATK) - flat value, no multiplication needed
    const mainStatValue = flat.weaponStats?.find(
      (s) => s.appendPropId === "FIGHT_PROP_BASE_ATTACK",
    );
    const mainStatName = "ATK";
    const mainStatDisplay = mainStatValue ? String(Math.round(mainStatValue.statValue)) : "?";

    // Substat (second stat, typically ATK%, CRIT, etc.)
    // Weapon stat values from Enka are already in display format (e.g. 33.1 for 33.1% CRIT Rate)
    const substats = flat.weaponStats ?? [];
    const substat = substats.find((s) => s.appendPropId !== "FIGHT_PROP_BASE_ATTACK");
    const substatMeta = substat ? STAT_KEYS[substat.appendPropId] : null;
    const substatName = substatMeta?.displayName ?? (substat?.appendPropId ?? "-");
    const substatDisplay = substat
      ? substatMeta?.isPercentage
        ? `${substat.statValue.toFixed(1)}%`
        : String(Math.round(substat.statValue))
      : "-";

    // affixMap values are 0-indexed (0 = R1, 4 = R5)
    const refinement = weapon?.affixMap
      ? (Object.values(weapon.affixMap)[0] ?? 0) + 1
      : 1;

    return {
      name: resolveWeaponName(flat, equip.itemId),
      icon,
      level: weapon?.level ?? 1,
      refinement,
      rarity: flat.rankLevel,
      mainStat: { name: mainStatName, value: mainStatDisplay },
      substat: { name: substatName, value: substatDisplay },
    };
  }
  return null;
}

// ═══════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════

export function parseShowcaseData(raw: EnkaResponse): ShowcaseData {
  const avatars = raw.avatarInfoList ?? [];
  const showInfoList = raw.playerInfo?.showAvatarInfoList ?? [];

  // Build a lookup map: avatarId → EnkaShowAvatarInfo (contains level, energyType)
  const showInfoMap = new Map<number, EnkaShowAvatarInfo>();
  for (const info of showInfoList) {
    showInfoMap.set(info.avatarId, info);
  }

  // Only show characters that are in the player's showcase profile
  const showcaseIds = new Set(showInfoList.map((i) => i.avatarId));

  const characters: CharacterData[] = avatars
    .filter((avatar) => showcaseIds.has(avatar.avatarId))
    .map((avatar) => parseCharacter(avatar, showInfoMap.get(avatar.avatarId)))
    .filter((c): c is CharacterData => c !== null)
    .sort((a, b) => b.buildScore.total - a.buildScore.total);

  return {
    playerInfo: {
      nickname: raw.playerInfo?.nickname ?? "Unknown",
      level: raw.playerInfo?.level ?? 0,
      worldLevel: raw.playerInfo?.worldLevel ?? 0,
      avatarIcon: resolveProfileIcon(raw.playerInfo?.profilePicture),
      signature: raw.playerInfo?.signature ?? "",
    },
    characters,
    lastUpdated: Date.now(),
  };
}

function parseCharacter(
  avatar: EnkaAvatarInfo,
  showInfo: EnkaShowAvatarInfo | undefined,
): CharacterData | null {
  const { avatarId } = avatar;

  const equips = avatar.equipList ?? [];
  const artifacts: Artifact[] = [];
  let weapon: CharacterWeapon | null = null;

  for (const equip of equips) {
    if (isArtifact(equip.flat)) {
      const artifact = parseArtifact(equip);
      if (artifact) {
        artifacts.push(artifact);
      }
    } else if (equip.flat.itemType === "ITEM_WEAPON") {
      weapon = extractWeapon([equip]);
    }
  }

  // Skip characters with no artifacts (nothing to score)
  if (artifacts.length === 0) return null;

  artifacts.sort((a, b) => a.slotIndex - b.slotIndex);

  // Constellation count: prefer constIdList, fallback to talentIdList
  // (some Enka responses put constellation talent IDs in talentIdList)
  const constIdList = avatar.constIdList ?? [];
  let constellation = constIdList.length;
  if (constellation === 0 && avatar.talentIdList && avatar.talentIdList.length > 0) {
    // talentIdList may contain constellation talent IDs (not talent levels)
    // Talent levels come from inherentProudSkillList, so if that exists,
    // talentIdList likely holds constellation data instead
    if (avatar.inherentProudSkillList && avatar.inherentProudSkillList.length > 0) {
      constellation = avatar.talentIdList.length;
    }
  }

  // Level comes from showAvatarInfoList (player-controlled), fallback to avatar prop
  const charLevel = showInfo?.level ?? avatar.level ?? 0;

  // Talents: prefer skillLevelMap (gives actual combat talent levels 1-15),
  // fallback to inherentProudSkillList, then talentIdList
  // skillLevelMap keys are skill depot derived IDs; the 3 combat talents
  // are typically the first 3 sorted entries
  let talents: number[] = [];
  if (avatar.skillLevelMap) {
    const levels = Object.values(avatar.skillLevelMap)
      .slice(0, 3)
      .map((v) => Math.round(v));
    if (levels.length > 0) {
      talents = levels;
    }
  }
  if (talents.length === 0) {
    // Fallback: inherentProudSkillList may contain raw IDs,
    // extract last 1-2 digits as talent level
    const raw = avatar.inherentProudSkillList ?? avatar.talentIdList ?? [];
    talents = raw.slice(0, 3).map((id) => {
      // IDs like 892101 → level 01 (last 2 digits), or just last digit
      const str = String(id);
      if (str.length >= 2) {
        const lastTwo = str.slice(-2);
        const parsed = parseInt(lastTwo, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const lastOne = str.slice(-1);
      return parseInt(lastOne, 10) || 0;
    });
  }

  // Compute active set bonuses
  const setCounts = new Map<string, number>();
  for (const art of artifacts) {
    setCounts.set(art.setId, (setCounts.get(art.setId) ?? 0) + 1);
  }
  const activeSetBonuses: string[] = [];
  for (const [setId, count] of setCounts) {
    if (count >= 2) activeSetBonuses.push(setId);
  }

  return {
    id: String(avatarId),
    avatarId,
    name: getCharacterName(avatarId),
    element: getCharacterElement(avatarId, avatar.fightPropMap),
    weaponType: getCharacterWeaponType(avatarId),
    level: charLevel,
    constellation,
    talents,
    talentIconSuffix: getTalentIconSuffix(avatarId),
    icon: getCharacterIcon(avatarId),
    weapon,
    artifacts,
    stats: computeStats(avatar.fightPropMap, artifacts),
    buildScore: { total: 0, grade: "F", artifactCount: artifacts.length, correctMainStats: 0, totalSelectableSlots: 0, setBonus: { activeSets: [], matchStatus: "no_recommendation" } },
    activeSetBonuses,
    usesGenericWeights: isTraveler(avatarId),
  };
}

function parseArtifact(equip: EnkaEquip): Artifact | null {
  const { flat, reliquary } = equip;

  const mainStat = buildMainStat(flat);
  if (!mainStat) return null;

  const slot = mapSlot(flat.equipType as EquipType);
  const setId = extractSetId(flat);
  const setName = resolveSetName(flat);

  // Use flat.reliquarySubstats directly (string appendPropId values)
  // Pass appendPropIdList for exact roll counting
  const substats = buildSubstats(flat.reliquarySubstats, reliquary?.appendPropIdList);

  // Clamp artifact level to valid range [0, 20]
  const rawLevel = reliquary?.level ?? flat.rankLevel ?? 0;
  const clampedLevel = Math.min(Math.max(rawLevel, 0), 20);

  return {
    id: `${equip.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    setId,
    setName,
    slot,
    slotIndex: getSlotIndex(slot),
    level: clampedLevel,
    rarity: flat.rankLevel,
    icon: flat.icon,
    mainStat,
    substats,
    score: {
      potentialPercent: 0,
      weightedPotential: 0,
      idealPotential: 0,
      mainStatCorrect: true,
      rv: 0,
      cv: 0,
      cvNormalized: 0,
      wse: 0,
      mainStatMultiplier: 1.0,
      setBonusMultiplier: 1.0,
      total: 0,
      grade: "F",
      reroll: {
        eligible: false,
        action: "none",
        priority: null,
        improveChance: 0,
        expectedReshapes: Infinity,
        expectedDust: Infinity,
        dustCost: 0,
        currentPercent: 0,
        medianGain: 0,
        realisticCeiling: 0,
        targetStats: [],
        reason: "",
      },
    },
  };
}
