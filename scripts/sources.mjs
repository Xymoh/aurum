/**
 * sources.mjs
 * ──────────────────────────────────────────────────────────────────
 * Where each guide importer leaves what it read, and how much the consensus
 * step (scripts/consensus.mjs) trusts it.
 *
 * Every importer writes one file per game into `.sources/` at the repo root,
 * which git ignores: the repo publishes the consensus, never one site's
 * picks as that site ranked them. The cache lives on the machine that ran
 * the refresh, so a second computer starts empty and fills it on its first
 * `npm run refresh`.
 *
 *   .sources/<game>/<source>.json
 *   .sources/<game>/<source>.<part>.json
 *     game    genshin | hsr | zzz
 *     source  prydwen | game8 | kqm | genshin-gg
 *     part    when two importers read the same site (Prydwen's Zenless
 *             weights and its picks), each writes its own part and
 *             readSources() merges them field by field
 *
 * Each file:
 *
 *   {
 *     source: "game8",
 *     fetchedAt: ISO timestamp,
 *     characters: { [gameId]: SourceEntry }
 *   }
 *
 * SourceEntry, every field present (null or [] when the page has none):
 *
 *   name           character name, for logs
 *   url            the page it was read from (kept locally, never published)
 *   updated        YYYY-MM-DD the page says it was last updated, or null
 *   role           short role label ("Main DPS"), or null
 *   weapons        [{ id, refinement }] best first, ids in the game's table
 *   teams          [{ name, members: [ids], alternates? }] best first
 *   synergies      [ids] best first
 *   mainStats      { SLOT: [statKey] } best first, scorer keys, or null
 *   substats       [[statKey]] tiers best first (stats in one tier are
 *                  equal), scorer keys, or null
 *   endgameStats   [{ label, value }]
 *   skillPriority  "Ultimate > Skill > Talent > Basic", or null
 *   tracePriority  Star Rail only, or null
 *   erTarget       Genshin only: Energy Recharge target the page states, or null
 *   sets           Genshin / Zenless: [[{ setId, pieces }]] ranks best first
 *   relicSets      Star Rail: same shape
 *   ornamentSets   Star Rail: same shape
 *
 * Stat keys are each game's scorer keys: Genshin "CRIT_DMG", "PYRO_DMG";
 * Star Rail the keys of src/hsr/data/scoring-metadata.json; Zenless the
 * numeric property ids of src/zzz/data/scoring-metadata.json, as strings.
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, ".sources");

/**
 * How much each source's vote counts. Prydwen first and Game8 second for
 * every game they cover; the rest break ties and fill gaps.
 */
export const SOURCE_WEIGHTS = { prydwen: 3, game8: 2, kqm: 1, "genshin-gg": 1, fribbels: 1 };

function sourcePath(game, source, part = null) {
  return path.join(SOURCE_DIR, game, `${source}${part ? `.${part}` : ""}.json`);
}

/**
 * Writes one source's entries for a game. With `merge`, entries already in
 * the file survive unless this run read them again (an `--only` run).
 */
export function writeSource(game, source, characters, { merge = false, part = null } = {}) {
  const file = sourcePath(game, source, part);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const previous =
    merge && fs.existsSync(file)
      ? (JSON.parse(fs.readFileSync(file, "utf8")).characters ?? {})
      : {};
  const all = { ...previous, ...characters };
  fs.writeFileSync(
    file,
    JSON.stringify({ source, fetchedAt: new Date().toISOString(), characters: all }, null, 2) +
      "\n",
  );
  return file;
}

/** Every source for a game, its parts merged: { [source]: { characters } }. */
export function readSources(game) {
  const dir = path.join(SOURCE_DIR, game);
  if (!fs.existsSync(dir)) return {};
  const sources = {};
  for (const f of fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const source = f.split(".")[0];
    const { characters = {}, fetchedAt } = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const merged = (sources[source] ??= { fetchedAt, characters: {} });
    if (fetchedAt < merged.fetchedAt) merged.fetchedAt = fetchedAt;
    const into = merged.characters;
    for (const [id, entry] of Object.entries(characters)) into[id] = { ...into[id], ...entry };
  }
  return sources;
}

/** An entry with every field present, so importers only fill what they read. */
export function emptyEntry(name, url) {
  return {
    name,
    url,
    updated: null,
    role: null,
    weapons: [],
    teams: [],
    synergies: [],
    mainStats: null,
    substats: null,
    endgameStats: [],
    skillPriority: null,
    tracePriority: null,
    erTarget: null,
    sets: [],
    relicSets: [],
    ornamentSets: [],
  };
}

/**
 * A real, visible browser for the sites that turn scripts away (Prydwen).
 * Edge ships with Windows and Chrome is the usual one on a Mac, so the
 * refresh runs on either machine; `prefer` ("chrome" / "msedge") goes first.
 */
export async function launchBrowser({ prefer, headless = false } = {}) {
  const { chromium } = await import("playwright");
  const channels = [...new Set([prefer, "msedge", "chrome"].filter(Boolean))];
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel, headless });
    } catch {
      // Not installed here; try the next one.
    }
  }
  throw new Error(`No browser found (tried ${channels.join(", ")}). Install Chrome or Edge.`);
}
