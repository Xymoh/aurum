/**
 * fetch-hsr-data.js
 * ------------------------------------------------------------------
 * Builds the Honkai: Star Rail lookup tables the scorer needs.
 *
 * HSR is far kinder than Genshin here. Enka states roll counts and roll
 * tiers on every substat (`cnt` and `step`), so nothing has to be inferred
 * from the displayed value - but turning those into numbers needs the game's
 * affix tables, and turning a relic id into a slot/set needs the relic index.
 *
 * Two sources, in priority order:
 *   1. Enka's store (honker_meta.json, honker_relics.json) - authoritative
 *      for affix maths, but its relic index lags a patch or two behind.
 *   2. Mar-7th/StarRailRes - fills in relics, sets, characters and light
 *      cones Enka has not indexed yet, and supplies display names.
 *
 * Usage: node scripts/fetch-hsr-data.js
 * Output: src/hsr/data/affixes.json      main/sub affix value tables
 *         src/hsr/data/relics.json       relic id -> slot, set, affix groups
 *         src/hsr/data/sets.json         set id -> name
 *         src/hsr/data/characters.json   avatar id -> name, path, element
 *         src/hsr/data/light-cones.json  light cone id -> name, path
 * ------------------------------------------------------------------
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const ENKA = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/hsr";
const SRR = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/en";
const OUT = path.resolve("src/hsr/data");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "ArtScore/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`${res.statusCode} for ${url}`));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

function write(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 0) + "\n", "utf8");
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${name.padEnd(20)} ${String(Object.keys(data).length).padStart(5)} entries  ${kb} kB`);
}

const main = async () => {
  console.log("fetching HSR data...");
  const [meta, enkaRelics, srrRelics, srrSets, srrChars, srrCones] = await Promise.all([
    get(`${ENKA}/honker_meta.json`),
    get(`${ENKA}/honker_relics.json`),
    get(`${SRR}/relics.json`),
    get(`${SRR}/relic_sets.json`),
    get(`${SRR}/characters.json`),
    get(`${SRR}/light_cones.json`),
  ]);

  // ── Affix value tables ──
  // A substat's value is cnt*BaseValue + step*StepValue, so both numbers are
  // load-bearing. Keep every rarity: 4-star relics show up on new accounts.
  write("affixes.json", {
    main: meta.relic.mainAffix,
    sub: meta.relic.subAffix,
  });

  // ── Relic index ──
  // Enka first (it is the same source the payload comes from), StarRailRes for
  // anything Enka has not indexed. Without the fallback a relic released this
  // patch throws instead of scoring.
  const relics = {};
  for (const [id, r] of Object.entries(srrRelics)) {
    relics[id] = {
      type: r.type,
      set: Number(r.set_id),
      main: Number(r.main_affix_id),
      sub: Number(r.sub_affix_id),
      rarity: r.rarity,
      // Relative to the StarRailRes CDN root. Stored rather than derived: the
      // slot-to-index mapping differs between 4-piece and Planar sets.
      icon: r.icon,
    };
  }
  let fromEnka = 0;
  for (const [id, r] of Object.entries(enkaRelics)) {
    relics[id] = {
      ...relics[id],
      type: r.Type === "HAND" ? "HAND" : r.Type,
      set: r.SetID,
      main: r.MainAffixGroup,
      sub: r.SubAffixGroup,
      rarity: r.Rarity,
    };
    fromEnka++;
  }
  write("relics.json", relics);
  console.log(`    (${fromEnka} from Enka, ${Object.keys(relics).length - fromEnka} only in StarRailRes)`);

  // ── Names ──
  const sets = {};
  for (const [id, s] of Object.entries(srrSets)) sets[id] = s.name;
  write("sets.json", sets);

  const chars = {};
  for (const [id, c] of Object.entries(srrChars)) {
    chars[id] = { name: c.name, path: c.path, element: c.element, rarity: c.rarity };
  }
  write("characters.json", chars);

  const cones = {};
  for (const [id, l] of Object.entries(srrCones)) {
    cones[id] = { name: l.name, path: l.path, rarity: l.rarity };
  }
  write("light-cones.json", cones);

  console.log("done.");
};

main().catch((err) => {
  console.error("failed:", err.message);
  process.exit(1);
});
