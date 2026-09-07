/**
 * fetch-prydwen-sets.mjs
 * ──────────────────────────────────────────────────────────────────
 * Recommended relic / disc sets from Prydwen's build guides, for Star Rail
 * and Zenless, written to:
 *
 *   src/hsr/data/set-recommendations.json   relicSets + ornamentSets
 *   src/zzz/data/set-recommendations.json   sets
 *
 * Fribbels publishes sets for the characters it simulates, which leaves the
 * supports out; Prydwen lists sets for everyone, so this fills the gaps and
 * covers Zenless entirely. The runtime prefers Fribbels where it has an
 * answer and falls back to this file.
 *
 * Every guide's build tab renders the same blocks:
 *
 *   BEST RELIC SETS            1 / <Name> (4-PC) / … / 2 / <Name> (2-PC)
 *   Best Planetary Sets        1 / <Name> (2-PC) / …
 *   BEST DISK DRIVES SETS      1 / <Name> (4-PC) / … / 2P / <Name> / (Recommended)
 *
 * Set names are matched against each game's sets table; anything that does
 * not match is reported rather than guessed.
 *
 * Prydwen sits behind a Cloudflare check that a headless browser fails, so
 * this runs a visible Edge window (same as fetch-zzz-weights.mjs). Expect it
 * to open and close on its own; PRYDWEN_BROWSER=chrome switches browsers.
 *
 * Usage: node scripts/fetch-prydwen-sets.mjs [hsr|zzz] [--only=slug,slug]
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://www.prydwen.gg";
const DELAY_MS = 900;
/** Ranks past this are alternatives rather than recommendations. */
const MAX_RANKS = 3;

const ONLY = new Set((process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean));
const GAMES = process.argv.filter((a) => a === "hsr" || a === "zzz");
if (GAMES.length === 0) GAMES.push("hsr", "zzz");

function normalise(name) {
  return name.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim();
}

const HSR = {
  section: "star-rail",
  output: path.join(ROOT, "src", "hsr", "data", "set-recommendations.json"),
  characters: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "hsr", "data", "characters.json"), "utf8")),
  sets: Object.fromEntries(
    Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, "src", "hsr", "data", "sets.json"), "utf8"))).map(([id, name]) => [id, { name }]),
  ),
  /**
   * Prydwen's names where they differ from StarRailRes', both sides already
   * normalised. "name|Path" picks one of several ids sharing a name: the
   * Trailblazer has a pair per Path, March 7th has a Path-change form.
   */
  aliases: {
    "march 7th the hunt": "march 7th|Rogue",
    "march 7th": "march 7th|Knight",
    "march 7th evernight": "evernight",
    "tingyun fugue": "fugue",
    "trailblazer destruction": "trailblazer caelus|Warrior",
    "trailblazer preservation": "trailblazer caelus|Knight",
    "trailblazer harmony": "trailblazer caelus|Shaman",
    "trailblazer remembrance": "trailblazer caelus|Memory",
    "trailblazer elation": "trailblazer caelus|Elation",
  },
  parse(text) {
    const relicBlock = block(text, /BEST RELIC SETS/i, /Best Planetary Sets|BEST PLANAR|BEST STATS|RELIC STATS/i);
    const planarBlock = block(text, /Best Planetary Sets|BEST PLANAR SETS/i, /Best Specialist|BEST STATS|RELIC STATS|MAIN STATS/i);
    return {
      relicSets: rankedPicks(relicBlock).slice(0, MAX_RANKS),
      ornamentSets: rankedPicks(planarBlock).slice(0, MAX_RANKS),
    };
  },
};

const ZZZ = {
  section: "zenless",
  output: path.join(ROOT, "src", "zzz", "data", "set-recommendations.json"),
  characters: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "agents.json"), "utf8")),
  sets: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "sets.json"), "utf8")),
  /** Prydwen's names, normalised, to Enka's. */
  aliases: {
    "anby soldier 0": "soldier 0 anby",
    "billy starlight": "starlight billy",
    "jane doe": "jane",
    "anby demara": "anby",
    "billy kid": "billy",
    "grace howard": "grace",
    "nicole demara": "nicole",
    "ukinami yuzuha": "yuzuha",
    "orphie and magus": "orphie & magus",
  },
  parse(text) {
    const discBlock = block(text, /BEST DISK DRIVES? SETS/i, /BEST DISK DRIVES? STATS/i);
    return { sets: discPicks(discBlock).slice(0, MAX_RANKS) };
  },
};

/** The text between two headings, or "" when the first is absent. */
function block(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start < 0) return "";
  const rest = text.slice(start + 1);
  const end = rest.search(endRe);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * "1 / Name (4-PC) / … / 2 / Name (2-PC)" -> [[{name, pieces}], …] in rank
 * order. The "Flex" rank, a list of 2-piece bonuses to mix, is skipped: it
 * is advice for when you have nothing, not a recommendation.
 */
function rankedPicks(text) {
  const picks = [];
  // Damage dealers are ranked by a relative DPS figure ("100.00%") rather
  // than a number; both shapes are read.
  const re = /^\s*(\d+(?:\.\d+)?%?)\s*\n+\s*(.+?) \((4|2)-PC\)\s*$/gm;
  let m;
  while ((m = re.exec(text))) {
    const name = m[2].trim();
    if (/^flex$/i.test(name)) continue;
    picks.push([{ name, pieces: Number(m[3]) }]);
  }
  return picks;
}

/**
 * "1 / Name (4-PC) / … / 2P / Partner / (Recommended)" -> the 4-piece with
 * its recommended 2-piece partner, when one is marked.
 */
function discPicks(text) {
  const picks = [];
  // Ranks are a bare number, or a relative DPS figure on damage dealers.
  const chunks = text.split(/^\s*\d+(?:\.\d+)?%?\s*$/m).slice(1);
  for (const chunk of chunks) {
    const four = chunk.match(/^\s*(.+?) \(4-PC\)/m);
    if (!four) continue;
    const parts = [{ name: four[1].trim(), pieces: 4 }];
    const partner = chunk.match(/2P\s*\n+\s*(.+?)\s*\n+\s*\(Recommended\)/);
    if (partner) parts.push({ name: partner[1].trim(), pieces: 2 });
    picks.push(parts);
  }
  return picks;
}

/** Waits out Cloudflare's interstitial, which titles itself "Just a moment...". */
async function settle(page) {
  for (let i = 0; i < 30; i++) {
    if (!/just a moment/i.test(await page.title())) return;
    await page.waitForTimeout(1000);
  }
}

async function readBuildTab(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.waitForTimeout(DELAY_MS);
  return page.evaluate(async () => {
    const tab = [...document.querySelectorAll(".tabs .single-tab")].find((e) => /build/i.test(e.textContent));
    if (tab) tab.click();
    await new Promise((r) => setTimeout(r, 700));
    return document.body.innerText;
  });
}

async function run(game, page) {
  const setByName = new Map();
  for (const [id, s] of Object.entries(game.sets)) setByName.set(normalise(s.name), id);

  // Name -> ids. The Trailblazer has one id per gender per Path, so a name
  // can carry a Path qualifier and map to two ids.
  const idsByName = new Map();
  for (const [id, c] of Object.entries(game.characters)) {
    const key = normalise(c.name);
    idsByName.set(key, [...(idsByName.get(key) ?? []), id]);
    if (c.path) idsByName.set(`${key}|${c.path}`, [...(idsByName.get(`${key}|${c.path}`) ?? []), id]);
  }

  console.log(`\nLoading Prydwen ${game.section} index…`);
  await page.goto(`${BASE}/${game.section}/characters/`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const consent = page.getByRole("button", { name: /do not consent/i });
  if (await consent.count()) await consent.first().click().catch(() => {});
  await page.waitForSelector(`a[href^="/${game.section}/characters/"]`, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const links = await page.evaluate((section) => {
    const m = new Map();
    document.querySelectorAll(`a[href^="/${section}/characters/"]`).forEach((a) => {
      const slug = a.getAttribute("href").replace(/\/$/, "").split("/").pop();
      const name = (a.querySelector("h4, h5, [class*=name]")?.textContent || a.textContent).trim().split("\n")[0];
      if (slug && name && !m.has(slug)) m.set(slug, name);
    });
    return [...m.entries()];
  }, game.section);
  console.log(`  ${links.length} characters to read`);

  const characters = ONLY.size && fs.existsSync(game.output) ? (JSON.parse(fs.readFileSync(game.output, "utf8")).characters ?? {}) : {};
  const unmatched = [];
  const unknownSets = new Set();

  for (const [slug, prydwenName] of links) {
    if (ONLY.size && !ONLY.has(slug)) continue;
    const raw = normalise(prydwenName);
    // Alias values are "name" or "name|Path"; only the name part is normalised.
    const [aliasName, aliasPath] = (game.aliases[raw] ?? raw).split("|");
    const key = aliasPath ? `${normalise(aliasName)}|${aliasPath}` : normalise(aliasName);
    // Trailblazer aliases carry "|Path"; the Stelle ids share the guide.
    const ids = [
      ...(idsByName.get(key) ?? []),
      ...(key.includes("|") ? idsByName.get(key.replace("caelus", "stelle")) ?? [] : []),
    ];
    if (ids.length === 0) {
      unmatched.push(prydwenName);
      continue;
    }

    process.stdout.write(`  ${prydwenName.padEnd(28)} `);
    const text = await readBuildTab(page, `${BASE}/${game.section}/characters/${slug}`);
    const parsed = game.parse(text);

    // Names to ids; a recommendation with an unknown set is dropped whole.
    const resolve = (picks) =>
      picks
        .map((parts) =>
          parts.map((p) => {
            const setId = setByName.get(normalise(p.name));
            if (!setId) unknownSets.add(p.name);
            return setId ? { setId, pieces: p.pieces } : null;
          }),
        )
        .filter((parts) => parts.length > 0 && parts.every(Boolean));

    const entry = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, resolve(v)]));
    const counts = Object.values(entry).map((v) => v.length);
    if (counts.every((n) => n === 0)) {
      console.log("no sets found");
      unmatched.push(`${prydwenName} (no set list)`);
      continue;
    }
    for (const id of ids) {
      characters[id] = { name: game.characters[id].name, ...entry, source: `${BASE}/${game.section}/characters/${slug}` };
    }
    console.log(counts.join("/"));
  }

  const missing = Object.keys(game.characters).filter((id) => !characters[id]).map((id) => `${game.characters[id].name} (${id})`);
  const output = {
    source: `${BASE}/${game.section}/characters/`,
    fetchedAt: new Date().toISOString(),
    characters: Object.fromEntries(Object.entries(characters).sort(([a], [b]) => Number(a) - Number(b))),
  };
  fs.writeFileSync(game.output, JSON.stringify(output, null, 2) + "\n");
  console.log(`\n  ✔ wrote ${Object.keys(characters).length} characters to ${path.relative(ROOT, game.output)}`);
  if (unknownSets.size) console.log(`  ⚠ set names not in the sets table: ${[...unknownSets].join(", ")}`);
  if (unmatched.length) console.log(`  ⚠ on Prydwen but not matched: ${unmatched.join(", ")}`);
  if (missing.length) console.log(`  ⚠ no guide found for: ${missing.join(", ")}`);
}

async function main() {
  const channel = process.env.PRYDWEN_BROWSER === "chrome" ? "chrome" : "msedge";
  const browser = await chromium.launch({ channel, headless: process.env.PRYDWEN_HEADLESS === "1" });
  const context = await browser.newContext({ locale: "en-US", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);
  try {
    for (const game of GAMES) await run(game === "hsr" ? HSR : ZZZ, page);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
