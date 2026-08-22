/**
 * fetch-enka-locale.js
 * ──────────────────────────────────────────────────────────────────
 * Builds the localized game-text maps used to display weapon names,
 * artifact set names and character names in the player's language.
 *
 * Enka returns `nameTextMapHash` / `setNameTextMapHash` on equipment and
 * publishes loc.json, which resolves those hashes in every language the
 * game ships. Using it means every in-game proper noun is the official
 * translation rather than something we invented.
 *
 * Character names arrive differently: `avatarInfoList` carries only an
 * avatarId. Enka's own store lags several weeks behind each patch, so a
 * just-released character shows no localized name there. We instead pull
 * per-language names from Project Amber (gi.yatta.moe), which tracks new
 * characters within a day of release, keyed directly by avatarId — no text
 * hash indirection, and none of Enka's +512 hash-offset quirk.
 *
 * Usage: node scripts/fetch-enka-locale.js
 * Output: src/data/locales/game-<lang>.json     (weapon + artifact-set names)
 *         src/data/locales/names-<lang>.json     (avatarId -> character name)
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

const LOC_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json";
const AMBER_URL = "https://gi.yatta.moe/api/v2";

const LOCALE_DIR = path.join(ROOT, "src", "data", "locales");

/** App language code -> the key Enka uses in loc.json. */
const LANGUAGES = {
  en: "en",
  zh: "zh-cn",
};

/** App language code -> the code Project Amber uses in its avatar endpoint. */
const AMBER_LANGUAGES = {
  en: "en",
  zh: "chs",
};

/**
 * The Traveler is keyed per-element in Amber ("10000005-anemo", …) and every
 * variant carries the same display name, so we fold them onto the two base
 * avatarIds the app actually sees.
 */
const TRAVELER_BASE_IDS = ["10000005", "10000007"];

/**
 * If a language resolves fewer than this share of English's entries, treat it
 * as broken upstream rather than shipping a half-translated table.
 */
const MIN_COVERAGE = 0.8;

// ── Helpers ────────────────────────────────────────────────────────

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
                `  ! Attempt ${attemptNumber}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`,
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
              `  ! Attempt ${attemptNumber}/${retries} failed: ${e.message}. Retrying in ${delay / 1000}s...`,
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

/** Build an { avatarId -> name } map from a Project Amber avatar payload. */
function buildNameMap(items) {
  const names = {};
  for (const [key, entry] of Object.entries(items)) {
    const name = entry?.name;
    if (!name) continue;
    // Traveler variants look like "10000005-anemo"; fold onto the base id.
    const base = key.split("-")[0];
    if (TRAVELER_BASE_IDS.includes(base)) {
      names[base] = name;
    } else {
      names[key] = name;
    }
  }
  return names;
}

async function main() {
  console.log("[1/3] Fetching Enka loc.json...");
  const loc = await fetchJSON(LOC_URL);
  console.log(`  OK ${Object.keys(loc).length} languages available\n`);

  const englishCount = Object.keys(loc.en ?? {}).length;
  if (englishCount === 0) {
    console.error("  FATAL: English table is empty. Existing output preserved.");
    process.exit(1);
  }

  fs.mkdirSync(LOCALE_DIR, { recursive: true });

  console.log("[2/3] Writing weapon + artifact-set name tables...");
  let written = 0;
  for (const [appLang, enkaKey] of Object.entries(LANGUAGES)) {
    const table = loc[enkaKey];
    if (!table) {
      console.warn(`  ! ${appLang}: "${enkaKey}" missing upstream - skipped`);
      continue;
    }

    const coverage = Object.keys(table).length / englishCount;
    if (coverage < MIN_COVERAGE) {
      console.warn(
        `  ! ${appLang}: only ${(coverage * 100).toFixed(0)}% of English entries - skipped`,
      );
      continue;
    }

    // Merge over English so a hash missing in one language still renders
    // something readable instead of disappearing from the UI.
    const merged = { ...loc.en, ...table };
    const file = path.join(LOCALE_DIR, `game-${appLang}.json`);
    fs.writeFileSync(file, `${JSON.stringify(merged)}\n`, "utf-8");
    console.log(
      `  OK ${appLang.padEnd(3)} ${String(Object.keys(merged).length).padStart(4)} entries` +
        `  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`,
    );
    written++;
  }

  if (written === 0) {
    console.error("  FATAL: wrote no language tables. Existing output preserved.");
    process.exit(1);
  }

  console.log("\n[3/3] Writing character name tables (Project Amber)...");
  // English drives the coverage check: every other language must resolve at
  // least MIN_COVERAGE of the same avatarIds, else it's treated as broken.
  const englishNames = buildNameMap((await fetchJSON(`${AMBER_URL}/en/avatar`)).data.items);
  const englishNameCount = Object.keys(englishNames).length;
  if (englishNameCount === 0) {
    console.error("  FATAL: English name map is empty. Existing output preserved.");
    process.exit(1);
  }

  for (const [appLang, amberKey] of Object.entries(AMBER_LANGUAGES)) {
    let names;
    try {
      names = buildNameMap((await fetchJSON(`${AMBER_URL}/${amberKey}/avatar`)).data.items);
    } catch (e) {
      console.warn(`  ! ${appLang}: Amber fetch failed (${e.message}) - skipped`);
      continue;
    }

    const coverage = Object.keys(names).length / englishNameCount;
    if (coverage < MIN_COVERAGE) {
      console.warn(
        `  ! ${appLang}: only ${(coverage * 100).toFixed(0)}% of English names - skipped`,
      );
      continue;
    }

    // Fall back onto English for any name a language hasn't localized yet.
    const merged = { ...englishNames, ...names };
    const file = path.join(LOCALE_DIR, `names-${appLang}.json`);
    fs.writeFileSync(file, `${JSON.stringify(merged)}\n`, "utf-8");
    console.log(
      `  OK ${appLang.padEnd(3)} ${String(Object.keys(merged).length).padStart(4)} names` +
        `  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`,
    );
  }
}

main().catch((e) => {
  console.error(`FAILED: ${e.message}`);
  process.exit(1);
});
