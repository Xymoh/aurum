/**
 * fetch-enka-locale.js
 * ──────────────────────────────────────────────────────────────────
 * Fetches the Enka Network locale file (loc.json) and extracts the
 * English locale entries. This provides hash-based name resolution
 * for all game items (weapons, artifacts, characters, skills, etc.).
 *
 * The Enka API returns `flat.nameTextMapHash` for equipment items.
 * This locale file maps those hash strings to display names.
 *
 * Usage: node scripts/fetch-enka-locale.js
 * Output: src/data/enka-locale.json
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

const LOC_URL =
  "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json";

const OUTPUT_FILE = path.join(ROOT, "src", "data", "enka-locale.json");

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
          // Follow redirects
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
                `  ⚠ Attempt ${attemptNumber}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s…`
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
              const raw = Buffer.concat(chunks).toString("utf-8");
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
            }
          });
        })
        .on("error", (e) => {
          if (attemptNumber < retries) {
            const delay = Math.pow(2, attemptNumber) * 1000;
            console.warn(
              `  ⚠ Attempt ${attemptNumber}/${retries} network error: ${e.message}. Retrying in ${delay / 1000}s…`
            );
            setTimeout(() => attempt(attemptNumber + 1), delay);
          } else {
            reject(
              new Error(`Network error fetching ${url} after ${retries} attempts: ${e.message}`)
            );
          }
        });
    };
    attempt(1);
  });
}

// ── Main pipeline ──────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Genshin Artifact Scoring - Enka Locale Fetcher     ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── 1. Fetch loc.json from Enka Network ────────────────────────
  console.log("[1/3] Fetching loc.json from Enka Network API-docs…");
  console.log(`      (up to 3 attempts with exponential backoff)`);

  let locData;
  try {
    locData = await fetchJSON(LOC_URL);
    console.log(`  ✔ Downloaded successfully\n`);
  } catch (e) {
    console.error(`  ✖ Fatal: ${e.message}`);
    console.error("    Fetch failed after 3 retry attempts. Existing output preserved.");
    process.exit(1);
  }

  // ── 2. Extract the English locale ──────────────────────────────
  console.log("[2/3] Extracting English locale entries…");

  const enLocale = locData["en"];
  if (!enLocale || typeof enLocale !== "object") {
    console.error(`  ✖ Fatal: "en" key not found or invalid in loc.json`);
    console.error("    Existing output preserved.");
    process.exit(1);
  }

  const entryCount = Object.keys(enLocale).length;
  console.log(`  ✔ Found ${entryCount.toLocaleString()} English locale entries\n`);

  // ── 3. Write output ────────────────────────────────────────────
  console.log(`[3/3] Writing output to ${path.relative(ROOT, OUTPUT_FILE)}…`);

  try {
    const jsonStr = JSON.stringify(enLocale, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonStr, "utf-8");
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`  ✔ Written ${(stats.size / 1024 / 1024).toFixed(2)} MB (${entryCount.toLocaleString()} entries)`);
  } catch (e) {
    console.error(`  ✖ Failed to write output: ${e.message}`);
    process.exit(1);
  }

  // ── Validate written JSON (re-read and parse) ───────────────────
  console.log("  ⏳ Validating written file…");
  try {
    const reReadRaw = fs.readFileSync(OUTPUT_FILE, "utf-8");
    const reReadParsed = JSON.parse(reReadRaw);
    const reReadKeys = Object.keys(reReadParsed).length;
    if (reReadKeys !== entryCount) {
      throw new Error(
        `Integrity mismatch: expected ${entryCount} entries but re-read ${reReadKeys}`
      );
    }
    console.log(`  ✔ Validation passed - ${reReadKeys.toLocaleString()} entries verified\n`);
  } catch (e) {
    console.error(`  ✖ Validation failed: ${e.message}`);
    console.error("    The output file may be corrupted.");
    process.exit(1);
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Locale Fetch Complete                              ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Entries:    ${String(entryCount.toLocaleString()).padStart(38)} ║`);
  console.log(`║  Output:     ${path.relative(ROOT, OUTPUT_FILE).padStart(38)} ║`);
  console.log("╚══════════════════════════════════════════════════════╝");
}

main().catch((e) => {
  console.error("\n  Unhandled error:", e);
  process.exit(1);
});
