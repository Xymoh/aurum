/**
 * The long-form half of a build page: everything a guide site covers beyond
 * the stat targets the scorer grades against. Weapons, teams, the kit,
 * constellations and the materials to farm, so a visitor can plan a
 * character without a second tab.
 *
 * Two kinds of data meet here, and they are kept apart on purpose:
 *
 *   Picks - which weapons, which teams, what order to level skills in. These
 *   are the guide sites' recommendations (Game8 for Genshin, genshin.gg for
 *   a character Game8 has no page for, Prydwen for Star Rail and Zenless),
 *   imported as facts: names, ranks and stat targets, never their prose.
 *   Written by the scrapers to guide-picks.json.
 *
 *   Game data - skill text, constellations, materials, weapon passives, set
 *   bonuses. HoYoverse's own text, from the same game-data mirrors the rest
 *   of the site already uses (Project Amber, StarRailRes, Dimbreath).
 *
 * A build script per game merges the two into one JSON file per character,
 * which the page loads on its own. The kit text for a whole roster is a few
 * megabytes; nobody reading one character should download all of it.
 *
 *   src/data/guides/<id>.json        Genshin    scripts/build-genshin-guides.mjs
 *   src/hsr/data/guides/<id>.json    Star Rail  scripts/build-hsr-guides.mjs
 *   src/zzz/data/guides/<id>.json    Zenless    scripts/build-zzz-guides.mjs
 *
 * Set bonus text is shared by every character, so it is one file per game:
 *
 *   src/data/set-bonuses.json, src/hsr/data/set-bonuses.json,
 *   src/zzz/data/set-bonuses.json
 */

/**
 * Game text, flattened for display. Plain text with "\n" for line breaks and
 * "**" around the spans the game highlights (skill names, key figures).
 * Never HTML: the page renders it as text, so a stray tag in the source data
 * shows up as a typo rather than as markup.
 */
export type GuideText = string;

/** One labelled figure: "Base ATK" / "608", "CRIT Rate" / "80-90%+". */
export interface GuideStat {
  label: string;
  value: string;
}

/** A recommended weapon, Light Cone or W-Engine, with what the game says it does. */
export interface GuideWeapon {
  id: string;
  name: string;
  iconUrl: string | null;
  /**
   * The game's own rarity number, as each game's tables store it: Genshin
   * 1-5, Star Rail 3-5, Zenless 2 (B), 3 (A), 4 (S).
   */
  rarity: number;
  /**
   * The superimposition or refinement the guide ranked it at (S1, S5), when
   * it says. A 4-star at S5 and a 5-star at S1 are not the same ask.
   */
  refinement: number | null;
  /** At max level: base ATK (or HP/ATK/DEF for a Light Cone) and the secondary stat. */
  stats: GuideStat[];
  /**
   * The passive, with every figure that changes by refinement written as
   * "a/b/c/d/e" inside "**", the way the game's own tooltips read.
   */
  passive: { name: string; text: GuideText } | null;
}

export interface GuideTeam {
  /** The guide's label for the team ("Hu Tao Vaporize"), when it gives one. */
  name: string | null;
  /** Character ids in the same game, including the page's own character. */
  members: string[];
  /**
   * In step with `members`: for each slot, the characters the guide names as
   * substitutes for that pick, ids, best first. Absent when it names none.
   */
  alternates?: string[][];
}

/** One ability, passive or constellation, as the game describes it. */
export interface KitEntry {
  /** What the game calls the slot: "Normal Attack", "A2", "C1", "Core Passive". */
  kind: string;
  name: string;
  text: GuideText;
  iconUrl: string | null;
  /** The level the figures in `text` are quoted at, when they depend on one. */
  level?: number | null;
  /** Short facts the game shows beside the name, e.g. "Single Target", "Energy 30". */
  tags?: string[];
  /**
   * The multiplier table, when the game publishes one with labelled rows.
   * `values[i]` is the row's figure at `levels[i]`.
   */
  scaling?: { levels: number[]; rows: Array<{ label: string; values: string[] }> } | null;
}

/**
 * A block of the kit. The id names what it is so the page can title it in
 * the reader's language; the entries keep the game's own order.
 *
 *   skills          Genshin talents, Star Rail skills, Zenless skills
 *   passives        Genshin ascension and utility passives
 *   traces          Star Rail major traces (A2, A4, A6)
 *   core            Zenless core passive and additional ability
 *   constellations  Genshin C1-C6
 *   eidolons        Star Rail E1-E6
 *   mindscapes      Zenless M1-M6
 */
export type KitGroupId = "skills" | "passives" | "traces" | "core" | "constellations" | "eidolons" | "mindscapes";

export interface KitGroup {
  id: KitGroupId;
  entries: KitEntry[];
}

export interface GuideMaterial {
  id: string;
  name: string;
  /**
   * A full URL, or in a guide file a path under the site root for an icon
   * the site ships itself ("zzz/items/IconCoin.webp"); the loader resolves
   * those against the deployed base, so a loaded guide always has a URL.
   */
  iconUrl: string | null;
  /** The game's own rarity number for the item, 1-5. */
  rarity: number;
  count: number;
}

/**
 * What it costs to finish one part of the character, as totals.
 *
 *   ascension  every ascension, level 1 to max (Genshin 90, Star Rail 80, Zenless 60)
 *   talents    Genshin: all three combat talents, 1 to 10
 *   traces     Star Rail: every skill to its max and every trace node
 *   skills     Zenless: all five skills to max
 *   core       Zenless: core skill, locked to F
 *
 * Currency (Mora, Credits, Dennies) is an item like any other, listed first.
 */
export type MaterialGroupId = "ascension" | "talents" | "traces" | "skills" | "core";

export interface MaterialGroup {
  id: MaterialGroupId;
  items: GuideMaterial[];
}

/** One character's guide file. Every array may be empty; nothing is optional. */
export interface GuideFile {
  /** The guide's role label ("Main DPS"), when it prints one. */
  role: string | null;
  /** Recommended weapons, best first. */
  weapons: GuideWeapon[];
  /** Recommended teams, best first. */
  teams: GuideTeam[];
  /** Characters the guide names as strong partners, ids, best first. */
  synergies: string[];
  /** The guide's own substat line, verbatim ("CRIT Rate = CRIT DMG > ATK%"). */
  substatLine: string | null;
  /** Stat targets for endgame, as the guide states them. */
  endgameStats: GuideStat[];
  /** The order to level skills in, as the guide writes it ("Ultimate > Skill = Talent > Basic"). */
  skillPriority: string | null;
  /** Star Rail only: the order to unlock major traces. */
  tracePriority: string | null;
  /**
   * Where the picks came from, and the date that page says it was last
   * updated (YYYY-MM-DD), which is the guide's own and not when we read it.
   * Null when no guide covers this character.
   */
  source: { label: string; url: string; updated: string | null } | null;
  /**
   * When a refresh first saw the kit text as it is now (YYYY-MM-DD), if it
   * had seen a different one before. Null when the kit has not changed since
   * tracking began. A kit that changed after the guide's `updated` date is a
   * buff or rework the guide may not account for yet.
   */
  kitChangedAt: string | null;
  /** Fingerprint of the kit text, so the next build can tell whether it changed. */
  kitHash: string;

  /** Stats at max level before gear. */
  baseStats: GuideStat[];
  /**
   * Stats the character gains on top: Genshin's ascension stat, Star Rail's
   * minor traces in total, Zenless's core skill bonuses in total.
   */
  bonusStats: GuideStat[];
  kit: KitGroup[];
  materials: MaterialGroup[];
}

/**
 * Whether the guide predates the kit it is paired with: the game changed the
 * character after the guide site last updated the page, so its picks may
 * describe the old kit. A guide with no date counts as older, since nothing
 * says it has caught up. The build scripts and the refresh summary apply the
 * same rule (scripts/guide-kit.mjs).
 */
export function guideBehindKit(guide: Pick<GuideFile, "kitChangedAt" | "source">): boolean {
  if (!guide.kitChangedAt || !guide.source) return false;
  return !guide.source.updated || guide.source.updated < guide.kitChangedAt;
}

/** One set's bonuses, keyed by the same set id the recommendations use. */
export interface SetBonusEntry {
  name: string;
  bonuses: Array<{ pieces: number; text: GuideText }>;
}

export type SetBonusFile = Record<string, SetBonusEntry>;

/**
 * guide-picks.json, the scrapers' output and the build scripts' input. Kept
 * separate from the guide files because the scrapers are slow (Prydwen needs
 * a real browser) and the game data is not: a patch that only changes
 * skill text should not mean re-reading every guide.
 *
 *   src/data/guide-picks.json       scripts/fetch-genshin-sets.mjs
 *   src/hsr/data/guide-picks.json   scripts/fetch-prydwen-sets.mjs
 *   src/zzz/data/guide-picks.json   scripts/fetch-prydwen-sets.mjs
 */
export interface GuidePicksFile {
  source: string;
  fetchedAt: string;
  characters: Record<string, GuidePicks>;
}

export interface GuidePicks {
  name: string;
  /** The guide page these picks were read from. */
  source: string;
  /** The site's name as the page credits it: "Game8", "genshin.gg", "Prydwen". */
  sourceLabel: string;
  /** The date the page says it was last updated (YYYY-MM-DD), or null when it prints none. */
  sourceUpdated: string | null;
  /**
   * Main stats per slot as the guide ranks them, in the scorer's own stat
   * keys (Genshin: SANDS / GOBLET / CIRCLET -> "ELEMENTAL_MASTERY",
   * "CRIT_RATE", "PYRO_DMG"...), best first. Null where the source was not
   * read for them. Used to check the hand-kept scoring setup, not shown.
   */
  mainStats: Record<string, string[]> | null;
  role: string | null;
  /** Ranked, best first. Ids in the game's own weapon table. */
  weapons: Array<{ id: string; refinement: number | null }>;
  teams: GuideTeam[];
  synergies: string[];
  substatLine: string | null;
  endgameStats: GuideStat[];
  skillPriority: string | null;
  tracePriority: string | null;
}
