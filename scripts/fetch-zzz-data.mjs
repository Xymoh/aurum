/**
 * fetch-zzz-data.mjs
 * ──────────────────────────────────────────────────────────────────
 * Pulls the Zenless Zone Zero game tables the scorer needs from Enka's
 * published store (github.com/EnkaNetwork/API-docs/store/zzz) and writes
 * compact versions to src/zzz/data/.
 *
 *   agents.json      id -> name, rarity, profession, element, images, accent,
 *                    and the stat curves: base, per-level growth, promotion
 *                    and core-skill steps
 *   weapon-curves    W-Engine level and breakthrough multipliers
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
/**
 * Enka publishes everything about an agent except how a W-Engine's stats
 * grow with its level and breakthrough. Those two tables are game config,
 * mirrored here because no first-party source publishes them.
 */
const WEAPON_CURVES = "https://raw.githubusercontent.com/yidhari-zs/Yidhari-ZS/master/assets/Filecfg";

async function getJSON(name, base = STORE) {
  const res = await fetch(`${base}/${name}.json`, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
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
  const [avatars, equipments, weapons, locs, property, pfps, wLevel, wStar] = await Promise.all([
    getJSON("avatars"),
    getJSON("equipments"),
    getJSON("weapons"),
    getJSON("locs"),
    getJSON("property"),
    getJSON("pfps"),
    getJSON("WeaponLevelTemplateTb", WEAPON_CURVES),
    getJSON("WeaponStarTemplateTb", WEAPON_CURVES),
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
      // Stat curves. Growth is scaled by 10000 per level; promotion and core
      // steps are flat additions indexed by the agent's rank in each.
      base: a.BaseProps ?? {},
      growth: a.GrowthProps ?? {},
      promotion: a.PromotionProps ?? [],
      core: a.CoreEnhancementProps ?? [],
    };
  }

  const sets = { suits: {}, items: {} };
  for (const [id, s] of Object.entries(equipments.Suits)) {
    sets.suits[id] = { name: t(s.Name), icon: s.Icon, setBonus: s.SetBonusProps ?? {} };
  }
  for (const [id, item] of Object.entries(equipments.Items)) {
    sets.items[id] = { suit: item.SuitId, rarity: item.Rarity };
  }

  const engines = {};
  for (const [id, w] of Object.entries(weapons)) {
    engines[id] = {
      name: t(w.ItemName),
      rarity: w.Rarity,
      image: w.ImagePath,
      profession: w.ProfessionType,
      mainStat: w.MainStat ?? null,
      secondaryStat: w.SecondaryStat ?? null,
    };
  }

  const properties = {};
  for (const [id, p] of Object.entries(property)) {
    if (p.Name) properties[id] = { name: p.Name, format: p.Format };
  }

  const pictures = {};
  for (const [id, p] of Object.entries(pfps)) pictures[id] = p.Icon;

  // Level and breakthrough multipliers, keyed "rarity-level" / "rarity-star",
  // both scaled by 10000.
  const curves = { level: {}, star: {} };
  for (const row of wLevel.data ?? []) curves.level[`${row.rarity}-${row.level}`] = row.rate;
  for (const row of wStar.data ?? []) curves.star[`${row.rarity}-${row.star}`] = { star: row.star_rate, rand: row.rand_rate };

  write("agents.json", agents);
  write("weapon-curves.json", curves);
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
