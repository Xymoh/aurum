/**
 * fetch-profile-pictures.js
 * ──────────────────────────────────────────────────────────────────
 * Builds the profile-picture id → icon name map used to render a
 * player's avatar in the showcase header.
 *
 * The Enka API reports a player's avatar as `playerInfo.profilePicture.id`
 * - a ProfilePicture id, which is NOT an avatarId and cannot be derived
 * from one (costume and event-only pictures have no character behind
 * them). Resolving it needs the game's own ProfilePictureExcelConfigData.
 *
 * Enka's bundled store/pfps.json covers only part of the range and lags
 * new releases, so we read the game data directly instead.
 *
 * Usage: node scripts/fetch-profile-pictures.js
 * Output: src/data/profile-pictures.json  ({ "11500": "UI_AvatarIcon_Lohen_Circle" })
 * ──────────────────────────────────────────────────────────────────
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Resolve paths ──────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const SOURCE_URL =
  "https://gitlab.com/Dimbreath/AnimeGameData/-/raw/master/ExcelBinOutput/ProfilePictureExcelConfigData.json";

const OUTPUT_FILE = path.join(ROOT, "src", "data", "profile-pictures.json");

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Fetch a URL and return the parsed JSON body.
 * Implements retry with exponential backoff (max 3 attempts).
 */
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
              console.warn(
                `  ⚠ Attempt ${attemptNumber}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s…`,
              );
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
              reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
            }
          });
        })
        .on("error", (e) => {
          if (attemptNumber < retries) {
            const delay = Math.pow(2, attemptNumber) * 1000;
            console.warn(
              `  ⚠ Attempt ${attemptNumber}/${retries} failed: ${e.message}. Retrying in ${delay / 1000}s…`,
            );
            setTimeout(() => attempt(attemptNumber + 1), delay);
            return;
          }
          reject(e);
        });
    };
    attempt(1);
  });
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("[1/3] Fetching ProfilePictureExcelConfigData…");
  const data = await fetchJSON(SOURCE_URL);

  if (!Array.isArray(data)) {
    console.error("  ✖ Fatal: expected an array. Existing output preserved.");
    process.exit(1);
  }
  console.log(`  ✔ ${data.length} entries\n`);

  console.log("[2/3] Building id → iconPath map…");
  const map = {};
  let skipped = 0;
  for (const entry of data) {
    if (entry?.id == null || !entry.iconPath) {
      skipped++;
      continue;
    }
    map[String(entry.id)] = entry.iconPath;
  }

  const count = Object.keys(map).length;
  if (count === 0) {
    console.error("  ✖ Fatal: produced an empty map. Existing output preserved.");
    process.exit(1);
  }
  console.log(`  ✔ ${count} usable entries${skipped ? ` (${skipped} skipped)` : ""}\n`);

  console.log(`[3/3] Writing ${path.relative(ROOT, OUTPUT_FILE)}…`);
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(map, null, 2)}\n`, "utf-8");
  console.log(`  ✔ ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error(`✖ ${e.message}`);
  process.exit(1);
});
