/**
 * sync-genshin-tables.mjs
 * ──────────────────────────────────────────────────────────────────
 * Keeps the two hand-kept Genshin tables in step with the game:
 *
 *   src/data/characters.json   avatar id -> name, element, weapon, icon
 *   src/data/artifacts.json    set id -> name, pieces
 *
 * Star Rail and Zenless regenerate their equivalents on every refresh.
 * These two were typed in by hand, so a new character or set reached the
 * site only when someone remembered to add it: until then a new character
 * had no build page, and a new set was unknown to the genshin.gg import,
 * which drops any recommendation it cannot resolve. On patch day that is
 * usually the new best-in-slot set.
 *
 * Project Amber (gi.yatta.moe) lists every character and set under the
 * game's own ids within a day of release. Whatever it has that a table
 * lacks is added. Entries that already exist are never rewritten: the
 * tables hold choices of their own (both Travelers are Anemo here, and two
 * unreleased sets Amber does not list), so a disagreement is reported for a
 * person to look at rather than overwritten. Avatars with no element are
 * the Miliastra Wonderland ones, not characters anyone builds, and are
 * skipped.
 *
 * The site never reads a set's `pieces`; a new set gets its highest rarity,
 * which is what most existing entries hold.
 *
 * Runs first in scripts/refresh.mjs, before anything reads the tables.
 *
 * Usage: node scripts/sync-genshin-tables.mjs           add what is missing
 *        node scripts/sync-genshin-tables.mjs --check   report only, write nothing
 *        --report=<file>   also write what was added and what disagrees as
 *                          JSON, which refresh.mjs repeats in its summary
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AMBER = "https://gi.yatta.moe/api/v2/en";
const CHARACTERS_FILE = path.join(ROOT, "src", "data", "characters.json");
const SETS_FILE = path.join(ROOT, "src", "data", "artifacts.json");
const CHECK = process.argv.includes("--check");
const REPORT = process.argv.find((a) => a.startsWith("--report="))?.slice("--report=".length) ?? null;

/** Amber uses the game's internal element and weapon names. */
const ELEMENTS = { Fire: "Pyro", Water: "Hydro", Wind: "Anemo", Electric: "Electro", Grass: "Dendro", Ice: "Cryo", Rock: "Geo" };
const WEAPONS = {
  WEAPON_SWORD_ONE_HAND: "Sword",
  WEAPON_CLAYMORE: "Claymore",
  WEAPON_POLE: "Polearm",
  WEAPON_BOW: "Bow",
  WEAPON_CATALYST: "Catalyst",
};

async function amberList(kind) {
  const res = await fetch(`${AMBER}/${kind}`, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${AMBER}/${kind}`);
  const items = Object.values((await res.json()).data?.items ?? {});
  // An empty list is an outage, not a game with no characters in it.
  if (items.length === 0) throw new Error(`Amber returned no ${kind} entries`);
  return items;
}

/** Whether each file ended in a newline, so a rewrite keeps it that way. */
const trailingNewline = new Map();

function readJSON(file) {
  const raw = fs.readFileSync(file, "utf8");
  trailingNewline.set(file, raw.endsWith("\n"));
  return JSON.parse(raw);
}

/** The shape the files already have, so an addition is the only thing a diff shows. */
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + (trailingNewline.get(file) ? "\n" : ""), "utf8");
}

function syncCharacters(avatars, table, problems) {
  const added = [];
  for (const avatar of avatars) {
    const id = String(avatar.id);
    // The Travelers come once per element ("10000005-anemo"); the site keeps
    // one entry per body and works the element out itself.
    if (id.includes("-")) continue;
    // Every character you fight with has an element. Amber also lists the
    // Miliastra Wonderland avatars, Manekin and Manekina, which have none and
    // exist only in that mode, so they are neither added nor checked.
    if (!avatar.element) continue;

    const entry = {
      name: avatar.name,
      element: ELEMENTS[avatar.element],
      weapon: WEAPONS[avatar.weaponType],
      icon: avatar.icon,
    };
    const ours = table[id];
    if (!ours) {
      if (!entry.element || !entry.weapon) {
        problems.push(`character ${id} ${avatar.name}: element "${avatar.element}" or weapon "${avatar.weaponType}" is new to this script, not added`);
        continue;
      }
      table[id] = entry;
      added.push(`${avatar.name} (${id})`);
      continue;
    }
    // Fields Amber leaves blank (a placeholder with no element) are not a disagreement.
    const diffs = Object.entries(entry)
      .filter(([key, value]) => value && ours[key] !== value)
      .map(([key, value]) => `${key} "${ours[key]}", Amber says "${value}"`);
    if (diffs.length) problems.push(`character ${id} ${ours.name}: ${diffs.join("; ")}`);
  }
  return added;
}

function syncSets(sets, table, problems) {
  const added = [];
  for (const set of sets) {
    const id = String(set.id);
    const ours = table[id];
    if (!ours) {
      table[id] = { name: set.name, pieces: Math.max(...(set.levelList ?? [5])) };
      added.push(`${set.name} (${id})`);
    } else if (ours.name !== set.name) {
      problems.push(`set ${id}: name "${ours.name}", Amber says "${set.name}"`);
    }
  }
  return added;
}

async function main() {
  console.log(`Syncing Genshin tables with Project Amber${CHECK ? " (check only)" : ""}…`);
  const [avatars, sets] = await Promise.all([amberList("avatar"), amberList("reliquary")]);
  const characters = readJSON(CHARACTERS_FILE);
  const artifacts = readJSON(SETS_FILE);
  const problems = [];

  const newCharacters = syncCharacters(avatars, characters, problems);
  const newSets = syncSets(sets, artifacts, problems);

  // Written only when something was added, so a run with nothing new
  // cannot disturb a hand edit in progress.
  if (!CHECK && newCharacters.length) writeJSON(CHARACTERS_FILE, characters);
  if (!CHECK && newSets.length) writeJSON(SETS_FILE, artifacts);

  const verb = CHECK ? "would add" : "added";
  console.log(`  characters.json  ${Object.keys(characters).length} entries, ${verb} ${newCharacters.length}${newCharacters.length ? `: ${newCharacters.join(", ")}` : ""}`);
  console.log(`  artifacts.json   ${Object.keys(artifacts).length} entries, ${verb} ${newSets.length}${newSets.length ? `: ${newSets.join(", ")}` : ""}`);
  for (const problem of problems) console.log(`  ⚠ ${problem}`);

  if (REPORT) {
    fs.writeFileSync(REPORT, JSON.stringify({ characters: newCharacters, sets: newSets, problems }), "utf8");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
