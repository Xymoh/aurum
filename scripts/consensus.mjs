/**
 * consensus.mjs
 * ──────────────────────────────────────────────────────────────────
 * Turns what every guide importer read (.sources/, see scripts/sources.mjs)
 * into the picks the site publishes. No single site's ranking is copied:
 * each list is a weighted vote across every source that covers the
 * character, so a weapon two sites rank second can beat one that only one
 * site ranks first.
 *
 *   Ranked lists (weapons, sets, teams, partners, main stats) score
 *   weight / (rank + 1) per source and are summed. Ties go to the item the
 *   heaviest source ranked higher, then to the order it was first seen.
 *   Single answers (role, skill order, trace order) come from the heaviest
 *   source that gives one. Figures (endgame stats) are merged by label, the
 *   heaviest source's figure winning. Energy Recharge targets take the
 *   median. Zenless substat weights average each source's tier weights.
 *
 * Writes, per game, the files the guide builders and the scorer read:
 *
 *   genshin  src/data/guide-picks.json, src/data/set-recommendations.json
 *   hsr      src/hsr/data/guide-picks.json, src/hsr/data/set-recommendations.json
 *   zzz      src/zzz/data/guide-picks.json, src/zzz/data/set-recommendations.json,
 *            src/zzz/data/scoring-metadata.json
 *
 * Star Rail also counts Fribbels' set lists (MIT, already in
 * src/hsr/data/scoring-metadata.json) as a source.
 *
 * A game with no source files, or missing one of the sites it expects, is
 * left as it is, so a machine that has not run every importer yet cannot
 * quietly republish a vote with a site missing.
 *
 * Usage: node scripts/consensus.mjs [genshin|hsr|zzz] [--allow-missing]
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readSources, SOURCE_WEIGHTS } from "./sources.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, data) =>
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2) + "\n");

/** How many of each list a page shows. */
const CAPS = { weapons: 8, sets: 3, teams: 4, synergies: 6, endgameStats: 6 };

/** Zenless' discrete weight scale, best tier first (scripts/fetch-zzz-weights.mjs). */
const TIER_WEIGHTS = [1, 0.75, 0.5, 0.25];

// ── Voting ───────────────────────────────────────────────────────────

/**
 * Ranked lists -> one ranked list. `ballots` is [{ weight, items }], items
 * best first; `key` names an item so the same pick from two sites counts
 * once. Returns the winning items (the first ballot's copy of each), best
 * first, with their scores.
 */
export function rankedVote(ballots, key = (x) => x) {
  const tally = new Map();
  let seen = 0;
  for (const { weight, items } of ballots) {
    items.forEach((item, rank) => {
      const k = key(item);
      const t = tally.get(k) ?? { item, score: 0, best: 0, bestRank: Infinity, first: seen++ };
      t.score += weight / (rank + 1);
      // The copy kept is the heaviest source's, so its details (a refinement, alternates) win.
      if (weight > t.best || (weight === t.best && rank < t.bestRank)) {
        t.best = weight;
        t.bestRank = rank;
        t.item = item;
      }
      tally.set(k, t);
    });
  }
  return [...tally.values()].sort(
    (a, b) => b.score - a.score || b.best - a.best || a.bestRank - b.bestRank || a.first - b.first,
  );
}

/** The heaviest source's non-empty answer. */
export function heaviest(entries, pick) {
  for (const { entry } of entries) {
    const value = pick(entry);
    if (value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0))
      return value;
  }
  return null;
}

/**
 * Main stats per slot: ranked vote, keeping every stat within 40% of the
 * slot's best, so a stat one site lists as an alternative survives only
 * when others back it.
 */
export function voteMainStats(entries, field = "mainStats") {
  const slots = new Set(entries.flatMap(({ entry }) => Object.keys(entry[field] ?? {})));
  if (slots.size === 0) return null;
  const out = {};
  for (const slot of slots) {
    const ranked = rankedVote(
      entries
        .filter(({ entry }) => entry[field]?.[slot]?.length)
        .map(({ weight, entry }) => ({ weight, items: entry[field][slot] })),
    );
    const top = ranked[0]?.score ?? 0;
    out[slot] = ranked.filter((r) => r.score >= top * 0.4).map((r) => r.item);
  }
  return out;
}

/** Endgame figures merged by label; the heaviest source's figure and order win. */
export function mergeFigures(entries) {
  const out = new Map();
  for (const { entry } of entries) {
    for (const stat of entry.endgameStats ?? []) {
      const k = stat.label.toLowerCase().replace(/[^a-z%]/g, "");
      if (!out.has(k)) out.set(k, stat);
    }
  }
  return [...out.values()].slice(0, CAPS.endgameStats);
}

/** The median of the stated targets, to the nearest 5%. */
export function medianTarget(values) {
  const sorted = values.filter((v) => typeof v === "number" && v > 0).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(median / 5) * 5;
}

/**
 * Substat tiers from every source -> weights on the 1 / 0.75 / 0.5 / 0.25
 * scale. Each source's tier gives the stat that tier's weight (0 when the
 * source leaves it out); the sources are averaged by trust and the result
 * snapped back onto the scale.
 */
export function voteSubstats(entries) {
  const voters = entries.filter(({ entry }) => entry.substats?.length);
  if (!voters.length) return null;
  const total = voters.reduce((sum, v) => sum + v.weight, 0);
  const sums = new Map();
  for (const { weight, entry } of voters) {
    // A stat a site names twice counts once, at its best tier.
    const own = new Map();
    entry.substats.forEach((tier, i) => {
      for (const stat of tier)
        if (!own.has(stat)) own.set(stat, TIER_WEIGHTS[Math.min(i, TIER_WEIGHTS.length - 1)]);
    });
    for (const [stat, w] of own) sums.set(stat, (sums.get(stat) ?? 0) + weight * w);
  }
  const weights = {};
  for (const [stat, sum] of sums) {
    const avg = sum / total;
    // Halfway to the lowest step: one light source naming it near the bottom is not enough.
    if (avg <= 0.125) continue;
    weights[stat] = TIER_WEIGHTS.reduce((best, w) =>
      Math.abs(w - avg) < Math.abs(best - avg) ? w : best,
    );
  }
  return weights;
}

// ── One character ────────────────────────────────────────────────────

const setKey = (parts) =>
  parts
    .map((p) => `${p.setId}:${p.pieces}`)
    .sort()
    .join("+");

const voteSets = (entries, field) =>
  rankedVote(
    entries
      .filter(({ entry }) => entry[field]?.length)
      .map(({ weight, entry }) => ({ weight, items: entry[field] })),
    setKey,
  )
    .slice(0, CAPS.sets)
    .map((r) => r.item);

/** Every source's entry for one character, heaviest first. */
function entriesFor(sources, id) {
  return Object.entries(sources)
    .filter(([, file]) => file.characters?.[id])
    .map(([source, file]) => ({
      source,
      weight: SOURCE_WEIGHTS[source] ?? 1,
      entry: file.characters[id],
    }))
    .sort((a, b) => b.weight - a.weight);
}

/** The published picks for one character, in GuidePicks' shape (src/lib/buildTarget/guide.ts). */
export function consensusPicks(entries, { name, mainStats = false } = {}) {
  const lists = (field) =>
    entries
      .filter(({ entry }) => entry[field]?.length)
      .map(({ weight, entry }) => ({ weight, items: entry[field] }));
  const dates = entries
    .map(({ entry }) => entry.updated)
    .filter(Boolean)
    .sort();
  return {
    name: name ?? entries[0].entry.name,
    sources: entries.length,
    // The newest of the pages behind these picks: a kit change after it is
    // a buff none of them has caught up with.
    updated: dates.at(-1) ?? null,
    mainStats: mainStats ? voteMainStats(entries) : null,
    role: heaviest(entries, (e) => e.role),
    weapons: rankedVote(lists("weapons"), (w) => w.id)
      .slice(0, CAPS.weapons)
      .map((r) => r.item),
    teams: rankedVote(lists("teams"), (t) => [...t.members].sort().join(","))
      .slice(0, CAPS.teams)
      // Team names are the sites' own labels; the members say what the team is.
      .map(({ item }) => ({
        name: null,
        members: item.members,
        ...(item.alternates ? { alternates: item.alternates } : {}),
      })),
    synergies: rankedVote(lists("synergies"))
      .slice(0, CAPS.synergies)
      .map((r) => r.item),
    // A site's substat line is its own wording; the page shows the weights instead.
    substatLine: null,
    endgameStats: mergeFigures(entries),
    skillPriority: heaviest(entries, (e) => e.skillPriority),
    tracePriority: heaviest(entries, (e) => e.tracePriority),
  };
}

// ── Games ────────────────────────────────────────────────────────────

const byId = (obj) =>
  Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => parseInt(a) - parseInt(b) || a.localeCompare(b)),
  );
const allIds = (sources) => [
  ...new Set(Object.values(sources).flatMap((file) => Object.keys(file.characters ?? {}))),
];

function genshin(sources) {
  const picks = {};
  const sets = {};
  for (const id of allIds(sources)) {
    const entries = entriesFor(sources, id);
    const p = consensusPicks(entries, { mainStats: true });
    picks[id] = p;
    const ranked = voteSets(entries, "sets");
    const erTarget = medianTarget(entries.map(({ entry }) => entry.erTarget));
    if (ranked.length) {
      sets[id] = {
        name: p.name,
        sets: ranked,
        ...(p.mainStats ? { mainStats: p.mainStats } : {}),
        ...(erTarget ? { erTarget } : {}),
      };
    }
  }
  return {
    "src/data/guide-picks.json": { fetchedAt: new Date().toISOString(), characters: byId(picks) },
    "src/data/set-recommendations.json": {
      fetchedAt: new Date().toISOString(),
      characters: byId(sets),
    },
  };
}

/** Fribbels' set lists as a source: names mapped to Star Rail set ids. */
function fribbelsSource() {
  const meta = read("src/hsr/data/scoring-metadata.json").characters;
  const setIds = new Map(
    Object.entries(read("src/hsr/data/sets.json")).map(([id, name]) => [name.toLowerCase(), id]),
  );
  const characters = {};
  for (const [id, c] of Object.entries(meta)) {
    // A pair of names is a 2 + 2; the same name twice is a 4-piece.
    const relicSets = (c.relicSets ?? [])
      .map((pair) =>
        pair[0] === pair[1]
          ? [{ setId: setIds.get(pair[0].toLowerCase()), pieces: 4 }]
          : pair.map((n) => ({ setId: setIds.get(n.toLowerCase()), pieces: 2 })),
      )
      .filter((parts) => parts.every((p) => p.setId));
    const ornamentSets = (c.ornamentSets ?? [])
      .map((n) => [{ setId: setIds.get(n.toLowerCase()), pieces: 2 }])
      .filter((parts) => parts[0].setId);
    if (relicSets.length || ornamentSets.length)
      characters[id] = { name: c.name, updated: null, relicSets, ornamentSets };
  }
  return { characters };
}

function hsr(sources) {
  const all = { ...sources, fribbels: fribbelsSource() };
  const picks = {};
  const sets = {};
  // Fribbels alone is the scorer's own source, not a guide: it only adds weight.
  for (const id of allIds(sources)) {
    const entries = entriesFor(all, id);
    const guideEntries = entries.filter((e) => e.source !== "fribbels");
    picks[id] = consensusPicks(guideEntries);
    const relicSets = voteSets(entries, "relicSets");
    const ornamentSets = voteSets(entries, "ornamentSets");
    if (relicSets.length || ornamentSets.length)
      sets[id] = { name: picks[id].name, relicSets, ornamentSets };
  }
  return {
    "src/hsr/data/guide-picks.json": {
      fetchedAt: new Date().toISOString(),
      characters: byId(picks),
    },
    "src/hsr/data/set-recommendations.json": {
      fetchedAt: new Date().toISOString(),
      characters: byId(sets),
    },
  };
}

/** Zenless stat ids to the short labels the generated priority line uses. */
const ZZZ_LABELS = {
  11102: "HP%",
  11103: "HP",
  12102: "ATK%",
  12103: "ATK",
  13102: "DEF%",
  13103: "DEF",
  12202: "Impact",
  20103: "CRIT Rate",
  21103: "CRIT DMG",
  23103: "PEN Ratio",
  23203: "PEN",
  30502: "Energy Regen",
  31203: "Anomaly Proficiency",
  31402: "Anomaly Mastery",
};

/**
 * Weights a kit fixes, laid over the vote. Claret's crits use Laceration DMG
 * instead of CRIT DMG, and each 1% CRIT DMG becomes 0.35% CRIT Rate, so a
 * CRIT DMG roll (4.8%) is 1.68% CRIT Rate: 0.7 of a CRIT Rate roll.
 */
export const ZZZ_KIT_WEIGHTS = {
  1611: { 21103: 0.7 },
};

/** "CRIT Rate = CRIT DMG > ATK%", from the consensus weights. */
export function priorityLine(weights, labels = ZZZ_LABELS) {
  const tiers = new Map();
  for (const [stat, w] of Object.entries(weights))
    tiers.set(w, [...(tiers.get(w) ?? []), labels[stat] ?? stat]);
  return [...tiers.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, names]) => names.join(" = "))
    .join(" > ");
}

function zzz(sources) {
  const picks = {};
  const sets = {};
  const previous = read("src/zzz/data/scoring-metadata.json");
  // Agents no source covers this run keep their weights, minus the page they were once read from.
  const scoring = Object.fromEntries(
    Object.entries(previous.characters).map(([id, { source, ...rest }]) => [id, rest]),
  );
  for (const id of allIds(sources)) {
    const entries = entriesFor(sources, id);
    picks[id] = consensusPicks(entries);
    const ranked = voteSets(entries, "sets");
    if (ranked.length) sets[id] = { name: picks[id].name, sets: ranked };

    const voted = voteSubstats(entries);
    const stats = voted && { ...voted, ...ZZZ_KIT_WEIGHTS[id] };
    if (stats && Object.keys(stats).length) {
      // Disc 4-6 main stats arrive as slot -> ids; the scorer keys them by number.
      const parts = voteMainStats(entries) ?? scoring[id]?.parts ?? { 4: [], 5: [], 6: [] };
      const thresholds = heaviest(entries, (e) =>
        e.thresholds && Object.keys(e.thresholds).length ? e.thresholds : null,
      );
      scoring[id] = {
        name: picks[id].name,
        stats,
        parts: Object.fromEntries(
          Object.entries(parts).map(([slot, ids]) => [slot, ids.map(Number)]),
        ),
        ...(thresholds ? { thresholds } : {}),
        priority: priorityLine(stats),
      };
    }
  }
  return {
    "src/zzz/data/guide-picks.json": {
      fetchedAt: new Date().toISOString(),
      characters: byId(picks),
    },
    "src/zzz/data/set-recommendations.json": {
      fetchedAt: new Date().toISOString(),
      characters: byId(sets),
    },
    "src/zzz/data/scoring-metadata.json": {
      method:
        "Consensus of community guides' substat priorities on a 1 / 0.75 / 0.5 / 0.25 scale; see scripts/consensus.mjs",
      fetchedAt: new Date().toISOString(),
      characters: byId(scoring),
    },
  };
}

const GAMES = { genshin, hsr, zzz };

/** The sites each game's vote expects; one missing would quietly shift every pick. */
const EXPECTED = {
  genshin: ["game8", "genshin-gg", "kqm"],
  hsr: ["prydwen", "game8"],
  zzz: ["prydwen", "game8"],
};
const STALE_DAYS = 30;

function main() {
  const args = process.argv.slice(2);
  const wanted = args.filter((a) => a in GAMES);
  const allowMissing = args.includes("--allow-missing");
  for (const game of wanted.length ? wanted : Object.keys(GAMES)) {
    const sources = readSources(game);
    if (!Object.keys(sources).length) {
      console.log(`  ${game}: no source files in .sources/${game}/ - left as published`);
      continue;
    }
    // The cache is per machine: a fresh clone, or a site that failed, leaves a gap.
    const missing = EXPECTED[game].filter((s) => !sources[s]);
    if (missing.length && !allowMissing) {
      console.log(
        `  ✖ ${game}: no ${missing.join(", ")} data in .sources/${game}/ - left as published. Run its importer, or pass --allow-missing.`,
      );
      process.exitCode = 1;
      continue;
    }
    for (const [source, file] of Object.entries(sources)) {
      const age = (Date.now() - Date.parse(file.fetchedAt ?? 0)) / 86_400_000;
      if (age > STALE_DAYS)
        console.log(`  ⚠ ${game}: ${source} was last read ${Math.floor(age)} days ago`);
    }
    const files = GAMES[game](sources);
    for (const [rel, data] of Object.entries(files)) write(rel, data);
    const picks = Object.values(Object.values(files)[0].characters);
    const single = picks.filter((p) => p.sources === 1).map((p) => p.name);
    console.log(
      `  ${game}: ${picks.length} characters from ${Object.keys(sources).join(", ")}` +
        (single.length
          ? `\n    ⚠ one source only (that site's picks until another covers them): ${single.join(", ")}`
          : ""),
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
