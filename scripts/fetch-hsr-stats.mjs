/**
 * fetch-hsr-stats.mjs
 * ──────────────────────────────────────────────────────────────────
 * Pulls the tables needed to compute a Star Rail character's final stats
 * from StarRailRes (the same source fetch-hsr-data.js already uses) and
 * writes src/hsr/data/stats.json.
 *
 *   characters   id -> per-ascension { hp, atk, def, spd, crit_rate, crit_dmg }
 *                as { base, step }; the value at a level is base + step*(lv-1)
 *   lightCones   id -> per-ascension { hp, atk, def } in the same shape
 *   traces       skill-tree node id -> the stat bonuses that node grants
 *   coneRanks    light cone id -> the unconditional stat bonus per
 *                superimposition, which the game and Enka both apply
 *   sets         relic set id -> [2-piece bonuses, 4-piece bonuses]
 *
 * Only nodes and sets that actually grant a stat are kept, so the file
 * stays small: the skill nodes that merely level an ability carry no
 * properties and are dropped.
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src", "hsr", "data", "stats.json");
const BASE = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/en";

async function getJSON(name) {
  const res = await fetch(`${BASE}/${name}.json`, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}.json`);
  return res.json();
}

/** Trim floats so the bundled file does not carry 15 digits of noise. */
const r = (n) => Math.round(n * 1e6) / 1e6;

function promotions(entry, keys) {
  return entry.values.map((v) => {
    const out = {};
    for (const k of keys) {
      if (v[k]) out[k] = { base: r(v[k].base), step: r(v[k].step ?? 0) };
    }
    return out;
  });
}

async function main() {
  console.log("fetching HSR stat tables from StarRailRes…");
  const [charPromo, lcPromo, trees, sets, lcRanks] = await Promise.all([
    getJSON("character_promotions"),
    getJSON("light_cone_promotions"),
    getJSON("character_skill_trees"),
    getJSON("relic_sets"),
    getJSON("light_cone_ranks"),
  ]);

  const characters = {};
  const CHAR_KEYS = ["hp", "atk", "def", "spd", "crit_rate", "crit_dmg"];
  for (const [id, entry] of Object.entries(charPromo)) characters[id] = promotions(entry, CHAR_KEYS);

  const lightCones = {};
  for (const [id, entry] of Object.entries(lcPromo)) lightCones[id] = promotions(entry, ["hp", "atk", "def"]);

  // A trace node's stat bonus is binary: it is either taken or not, so only
  // the properties of its highest level matter.
  const traces = {};
  for (const [id, node] of Object.entries(trees)) {
    const withProps = (node.levels ?? []).filter((l) => l.properties?.length);
    if (!withProps.length) continue;
    traces[id] = withProps[withProps.length - 1].properties.map((p) => ({ type: p.type, value: r(p.value) }));
  }

  // A light cone's passive carries an unconditional stat bonus per
  // superimposition (Saber's gives 36% CRIT DMG at S1). StarRailRes keeps
  // those separate from the conditional half of the text, so they can be
  // applied verbatim.
  const coneRanks = {};
  for (const [id, cone] of Object.entries(lcRanks)) {
    const ranks = (cone.properties ?? []).map((rank) => (rank ?? []).map((p) => ({ type: p.type, value: r(p.value) })));
    if (ranks.some((t) => t.length)) coneRanks[id] = ranks;
  }

  const setBonuses = {};
  for (const [id, set] of Object.entries(sets)) {
    const props = (set.properties ?? []).map((tier) => (tier ?? []).map((p) => ({ type: p.type, value: r(p.value) })));
    if (props.some((t) => t.length)) setBonuses[id] = props;
  }

  const output = {
    source: "https://github.com/Mar-7th/StarRailRes",
    fetchedAt: new Date().toISOString(),
    characters,
    lightCones,
    coneRanks,
    traces,
    sets: setBonuses,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output) + "\n");
  console.log(
    `  ✔ ${Object.keys(characters).length} characters, ${Object.keys(lightCones).length} light cones, ` +
      `${Object.keys(traces).length} trace nodes, ${Object.keys(coneRanks).length} cone passives, ` +
      `${Object.keys(setBonuses).length} sets ` +
      `(${(fs.statSync(OUT).size / 1024).toFixed(1)} kB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
