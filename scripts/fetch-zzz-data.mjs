/**
 * fetch-zzz-data.mjs
 * ──────────────────────────────────────────────────────────────────
 * Pulls the Zenless Zone Zero game tables the scorer needs from Enka's
 * published store (github.com/EnkaNetwork/API-docs/store/zzz) and writes
 * compact versions to src/zzz/data/.
 *
 *   agents.json      id -> name, rarity, profession, element, images, accent
 *   sets.json        suitId -> name, icon, and itemId -> suitId lookup
 *   weapons.json     W-Engine id -> name, image, rarity
 *   properties.json  PropertyId -> stat name and display format
 *
 * Names are resolved from Enka's English locale. Run after a patch; the
 * refresh script calls this as its "zzz" step.
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src", "zzz", "data");
const STORE = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/zzz";

async function getJSON(name) {
  const res = await fetch(`${STORE}/${name}.json`, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}.json`);
  return res.json();
}

function write(name, data) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(data) + "\n", "utf8");
  console.log(`  ${name.padEnd(18)} ${String(Object.keys(data).length).padStart(4)} entries  ${(fs.statSync(file).size / 1024).toFixed(1)} kB`);
}

async function main() {
  console.log("fetching ZZZ data from Enka's store…");
  fs.mkdirSync(OUT, { recursive: true });
  const [avatars, equipments, weapons, locs, property, pfps] = await Promise.all([
    getJSON("avatars"),
    getJSON("equipments"),
    getJSON("weapons"),
    getJSON("locs"),
    getJSON("property"),
    getJSON("pfps"),
  ]);
  const en = locs.en;
  const t = (key) => en[key] ?? key;

  const agents = {};
  for (const [id, a] of Object.entries(avatars)) {
    agents[id] = {
      name: t(a.Name),
      rarity: a.Rarity,
      profession: a.ProfessionType,
      element: a.ElementTypes?.[0] ?? "",
      image: a.Image,
      circleIcon: a.CircleIcon,
      accent: a.Colors?.Accent ?? "#d4ff00",
    };
  }

  const sets = { suits: {}, items: {} };
  for (const [id, s] of Object.entries(equipments.Suits)) {
    sets.suits[id] = { name: t(s.Name), icon: s.Icon };
  }
  for (const [id, item] of Object.entries(equipments.Items)) {
    sets.items[id] = { suit: item.SuitId, rarity: item.Rarity };
  }

  const engines = {};
  for (const [id, w] of Object.entries(weapons)) {
    engines[id] = { name: t(w.ItemName), rarity: w.Rarity, image: w.ImagePath, profession: w.ProfessionType };
  }

  const properties = {};
  for (const [id, p] of Object.entries(property)) {
    if (p.Name) properties[id] = { name: p.Name, format: p.Format };
  }

  const pictures = {};
  for (const [id, p] of Object.entries(pfps)) pictures[id] = p.Icon;

  write("agents.json", agents);
  write("sets.json", sets.suits);
  write("set-items.json", sets.items);
  write("weapons.json", engines);
  write("properties.json", properties);
  write("pfps.json", pictures);
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
