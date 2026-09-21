/**
 * Export a Genshin showcase in the GOOD format (Genshin Open Object
 * Description), the interchange file Genshin Optimizer and the scanners
 * share: https://frzyc.github.io/genshin-optimizer/#/doc
 *
 * Only what a showcase exposes is written: the displayed characters, their
 * weapons and their equipped artifacts. Everything else in the format is
 * optional and left out rather than guessed.
 */

import type { ShowcaseData, CharacterData } from "../../types/character";
import type { Artifact } from "../../types/artifact";
import charactersData from "../../data/characters.json";
import artifactsData from "../../data/artifacts.json";

const CHARACTERS = charactersData as Record<string, { name: string }>;
const SETS = artifactsData as Record<string, { name: string }>;

/** "Kamisato Ayaka" -> "KamisatoAyaka", "Crimson Witch of Flames" -> "CrimsonWitchOfFlames". */
export function goodKey(name: string): string {
  return name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

const STAT_KEY: Record<string, string> = {
  FIGHT_PROP_HP: "hp",
  FIGHT_PROP_HP_PERCENT: "hp_",
  FIGHT_PROP_ATTACK: "atk",
  FIGHT_PROP_ATTACK_PERCENT: "atk_",
  FIGHT_PROP_DEFENSE: "def",
  FIGHT_PROP_DEFENSE_PERCENT: "def_",
  FIGHT_PROP_ELEMENT_MASTERY: "eleMas",
  FIGHT_PROP_CHARGE_EFFICIENCY: "enerRech_",
  FIGHT_PROP_HEAL_ADD: "heal_",
  FIGHT_PROP_CRITICAL: "critRate_",
  FIGHT_PROP_CRITICAL_HURT: "critDMG_",
  FIGHT_PROP_PHYSICAL_ADD_HURT: "physical_dmg_",
  FIGHT_PROP_FIRE_ADD_HURT: "pyro_dmg_",
  FIGHT_PROP_ELEC_ADD_HURT: "electro_dmg_",
  FIGHT_PROP_WATER_ADD_HURT: "hydro_dmg_",
  FIGHT_PROP_WIND_ADD_HURT: "anemo_dmg_",
  FIGHT_PROP_ICE_ADD_HURT: "cryo_dmg_",
  FIGHT_PROP_ROCK_ADD_HURT: "geo_dmg_",
  FIGHT_PROP_GRASS_ADD_HURT: "dendro_dmg_",
};

const SLOT_KEY: Record<string, string> = {
  FLOWER: "flower",
  PLUME: "plume",
  SANDS: "sands",
  GOBLET: "goblet",
  CIRCLET: "circlet",
};

/** Ascension phase from level, the way the game gates it. */
function ascensionFor(level: number): number {
  if (level > 80) return 6;
  if (level > 70) return 5;
  if (level > 60) return 4;
  if (level > 50) return 3;
  if (level > 40) return 2;
  if (level > 20) return 1;
  return 0;
}

export interface GoodArtifact {
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  location: string;
  lock: boolean;
  substats: Array<{ key: string; value: number }>;
}

export interface GoodFile {
  format: "GOOD";
  version: 2;
  source: string;
  characters: Array<{
    key: string;
    level: number;
    constellation: number;
    ascension: number;
    talent: { auto: number; skill: number; burst: number };
  }>;
  weapons: Array<{
    key: string;
    level: number;
    ascension: number;
    refinement: number;
    location: string;
    lock: boolean;
  }>;
  artifacts: GoodArtifact[];
}

function characterKey(c: CharacterData): string {
  // The bundled table holds English names; the character's own `name`
  // may be localized.
  return goodKey(CHARACTERS[String(c.avatarId)]?.name ?? c.name);
}

function artifactOf(a: Artifact, owner: string): GoodArtifact | null {
  const mainStatKey = STAT_KEY[a.mainStat.statKey];
  if (!mainStatKey) return null;
  return {
    setKey: goodKey(SETS[a.setId]?.name ?? a.setName),
    slotKey: SLOT_KEY[a.slot] ?? a.slot.toLowerCase(),
    level: a.level,
    rarity: a.rarity,
    mainStatKey,
    location: owner,
    lock: false,
    substats: a.substats
      .filter((s) => STAT_KEY[s.statKey])
      .map((s) => ({ key: STAT_KEY[s.statKey], value: Math.round(s.value * 10) / 10 })),
  };
}

export function exportGood(data: ShowcaseData): GoodFile {
  const characters: GoodFile["characters"] = [];
  const weapons: GoodFile["weapons"] = [];
  const artifacts: GoodArtifact[] = [];

  for (const c of data.characters) {
    const key = characterKey(c);
    characters.push({
      key,
      level: c.level,
      constellation: c.constellation,
      ascension: ascensionFor(c.level),
      talent: { auto: c.talents[0] ?? 1, skill: c.talents[1] ?? 1, burst: c.talents[2] ?? 1 },
    });
    if (c.weapon) {
      weapons.push({
        key: goodKey(c.weapon.name),
        level: c.weapon.level,
        ascension: ascensionFor(c.weapon.level),
        refinement: c.weapon.refinement,
        location: key,
        lock: false,
      });
    }
    for (const a of c.artifacts) {
      const converted = artifactOf(a, key);
      if (converted) artifacts.push(converted);
    }
  }

  return { format: "GOOD", version: 2, source: "Aurum", characters, weapons, artifacts };
}

/** Hands the file to the browser as a download. */
export function downloadGood(data: ShowcaseData, uid: string): void {
  const blob = new Blob([JSON.stringify(exportGood(data), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aurum-${uid}.good.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
