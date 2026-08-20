/**
 * build-weapon-ids.js
 * ──────────────────────────────────────────────────────────────────
 * Builds a comprehensive weaponId → name mapping by combining:
 *   1. Enka loc.json direct hash lookup
 *   2. Hash +512 offset (Enka API returns hashes that are exactly 512
 *      less than the corresponding loc.json hash for many weapons)
 *   3. Manual overrides for weapons not in any automated source
 *
 * Also regenerates weapons.json (icon suffix → name) from the same data.
 *
 * Usage: node scripts/build-weapon-ids.js
 * Output:
 *   - src/data/weapon-ids.json  (weaponId → name)
 *   - src/data/weapons.json     (iconSuffix → name)
 * ──────────────────────────────────────────────────────────────────
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const WEAPON_EXCEL_URL =
  "https://raw.githubusercontent.com/DimbreathBot/AnimeGameData/master/ExcelBinOutput/WeaponExcelConfigData.json";

const OUTPUT_WEAPON_IDS = path.join(ROOT, "src", "data", "weapon-ids.json");
const OUTPUT_WEAPONS = path.join(ROOT, "src", "data", "weapons.json");
const LOCALE_FILE = path.join(ROOT, "src", "data", "enka-locale.json");

// Manual overrides for weapons that can't be resolved automatically.
// These are weapons whose hashes don't appear in loc.json even with the +512 offset.
const MANUAL_OVERRIDES = {
  11411: "One Side",                    // Sword_Blunt (4-star, placeholder icon, quest reward)
  11508: "Haran Geppaku Futsu",         // Sword_Blunt (5-star, placeholder icon - internal duplicate)
  11519: "Lightbearing Moonshard",      // Sword_SilverwareSaw
  12508: "The Unforged",                // Claymore_Aniki (placeholder icon - internal duplicate)
  12509: "Song of Broken Pines",        // Claymore_Aniki (placeholder icon - internal duplicate)
  12515: "Gest of the Mighty Wolf",     // Claymore_EnsisAquilonis
  13503: "Beginner's Protector",        // Pole_Gewalt (starter polearm)
  13517: "Disaster and Remorse",        // Pole_Carbine
  14411: "Dodoco Tales",                // Catalyst_Apprentice (event, placeholder icon)
  14508: "Everlasting Moonglow",        // Catalyst_Apprentice (placeholder icon - internal duplicate)
  14522: "Nocturne's Curtain Call",     // Catalyst_Brisingamen (Columbina's signature)
  14523: "Angelos' Heptades",           // Catalyst_FairyGarden (Nicole's signature)
  15516: "Golden Frostbound Oath",      // Bow_Alkonost
  20001: "Wilderness Rod",              // FishingRod
};

function fetchJSON(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber) => {
      https
        .get(url, { headers: { "User-Agent": "genshin-artscore-fetcher/1.0" } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return fetchJSON(res.headers.location, retries - attemptNumber + 1)
              .then(resolve)
              .catch(reject);
          }
          if (res.statusCode !== 200) {
            const err = new Error(`HTTP ${res.statusCode} for ${url}`);
            if (attemptNumber < retries) {
              const delay = Math.pow(2, attemptNumber) * 1000;
              console.warn(`  ⚠ Attempt ${attemptNumber}/${retries}: ${err.message}. Retrying…`);
              setTimeout(() => attempt(attemptNumber + 1), delay);
              return;
            }
            return reject(err);
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
            } catch (e) {
              reject(new Error(`JSON parse error: ${e.message}`));
            }
          });
        })
        .on("error", (e) => {
          if (attemptNumber < retries) {
            const delay = Math.pow(2, attemptNumber) * 1000;
            setTimeout(() => attempt(attemptNumber + 1), delay);
          } else {
            reject(e);
          }
        });
    };
    attempt(1);
  });
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Build Weapon ID → Name Mapping                     ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Load local Enka locale
  const locale = JSON.parse(fs.readFileSync(LOCALE_FILE, "utf-8"));
  console.log(`  Loaded enka-locale.json (${Object.keys(locale).length} entries)`);

  console.log("\n[1/3] Fetching WeaponExcelConfigData.json…");
  const weaponExcel = await fetchJSON(WEAPON_EXCEL_URL);
  console.log(`  ✔ Got ${weaponExcel.length} weapon entries\n`);

  console.log("[2/3] Building weapon ID → name mapping…");

  const weaponIdToName = {};
  const iconToName = {};
  let fromDirect = 0;
  let fromOffset = 0;
  let fromManual = 0;
  let unresolved = 0;
  const unresolvedList = [];

  for (const w of weaponExcel) {
    if (!w.icon || !w.nameTextMapHash) continue;
    if ((w.rankLevel ?? 0) < 1) continue;

    const id = w.id;
    const hash = String(w.nameTextMapHash);
    const offsetHash = String(w.nameTextMapHash + 512);
    const iconMatch = w.icon.match(/UI_EquipIcon_(.+)/);
    const suffix = iconMatch ? iconMatch[1] : null;

    let name = null;

    // Strategy 1: Direct hash match in locale
    if (locale[hash] && locale[hash].trim() !== "" && locale[hash] !== "TBD") {
      name = locale[hash];
      fromDirect++;
    }
    // Strategy 2: Offset hash (+512) match in locale
    else if (locale[offsetHash] && locale[offsetHash].trim() !== "" && locale[offsetHash] !== "TBD") {
      name = locale[offsetHash];
      fromOffset++;
    }
    // Strategy 3: Manual override
    else if (MANUAL_OVERRIDES[id]) {
      name = MANUAL_OVERRIDES[id];
      fromManual++;
    }
    // Unresolved
    else {
      unresolved++;
      if (w.rankLevel >= 3) {
        unresolvedList.push({ id, suffix, rank: w.rankLevel, hash: w.nameTextMapHash });
      }
      continue;
    }

    weaponIdToName[id] = name;
    if (suffix) {
      iconToName[suffix] = name;
    }
  }

  console.log(`  ✔ Direct hash match: ${fromDirect}`);
  console.log(`  ✔ Offset (+512) match: ${fromOffset}`);
  console.log(`  ✔ Manual override: ${fromManual}`);
  console.log(`  ─ Total resolved: ${fromDirect + fromOffset + fromManual}`);
  if (unresolved > 0) {
    console.log(`  ⚠ Unresolved: ${unresolved} (${unresolvedList.length} rank 3+)`);
    if (unresolvedList.length > 0) {
      console.log("\n  Unresolved rank 3+ weapons:");
      for (const u of unresolvedList) {
        console.log(`    ${u.id}: ${u.suffix} (rank ${u.rank}, hash ${u.hash})`);
      }
    }
  }

  // ── 3. Write outputs ─────────────────────────────────────────────
  console.log("\n[3/3] Writing output files…");

  // Sort weapon-ids by numeric key
  const sortedIds = {};
  for (const key of Object.keys(weaponIdToName).sort((a, b) => Number(a) - Number(b))) {
    sortedIds[key] = weaponIdToName[key];
  }
  const idsJson = JSON.stringify(sortedIds, null, 2);
  fs.writeFileSync(OUTPUT_WEAPON_IDS, idsJson, "utf-8");
  console.log(`  ✔ weapon-ids.json: ${Object.keys(sortedIds).length} entries (${(Buffer.byteLength(idsJson) / 1024).toFixed(1)} KB)`);

  // Sort weapons.json (icon suffix → name) alphabetically
  const sortedIcons = {};
  for (const key of Object.keys(iconToName).sort()) {
    sortedIcons[key] = iconToName[key];
  }
  const iconsJson = JSON.stringify(sortedIcons, null, 2);
  fs.writeFileSync(OUTPUT_WEAPONS, iconsJson, "utf-8");
  console.log(`  ✔ weapons.json: ${Object.keys(sortedIcons).length} entries (${(Buffer.byteLength(iconsJson) / 1024).toFixed(1)} KB)`);

  // ── Summary ─────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  Weapon Data Build Complete                         ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Total resolved:   ${String(Object.keys(sortedIds).length).padStart(32)} ║`);
  console.log(`║  weapon-ids.json:  ${String(Object.keys(sortedIds).length + " entries").padStart(32)} ║`);
  console.log(`║  weapons.json:     ${String(Object.keys(sortedIcons).length + " entries").padStart(32)} ║`);
  console.log("╚══════════════════════════════════════════════════════╝");
}

main().catch((e) => {
  console.error("\n  Unhandled error:", e);
  process.exit(1);
});
