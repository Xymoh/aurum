/**
 * fetch-genshin-sets.mjs
 * ──────────────────────────────────────────────────────────────────
 * Recommended artifact sets per Genshin character, from genshin.gg, written
 * to src/data/set-recommendations.json.
 *
 * Why this source: the hand-maintained character-builds.json only names
 * sets for about 40% of the roster, Prydwen has no Genshin section, and
 * KQM's guides are prose with no fixed shape. genshin.gg renders every
 * character's "Best Artifacts" as the same ranked list - a set name and a
 * piece count, one or two per rank - and serves it as plain HTML, so no
 * browser is needed.
 *
 * Set names are matched against src/data/artifacts.json so the output is
 * keyed by set id; anything that does not match is reported, not guessed.
 *
 * Usage: node scripts/fetch-genshin-sets.mjs
 *        node scripts/fetch-genshin-sets.mjs --only=hutao,xingqiu
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "src", "data", "set-recommendations.json");
const CHARACTERS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "characters.json"), "utf8"));
const SETS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "artifacts.json"), "utf8"));

const BASE = "https://genshin.gg";
const ONLY = new Set((process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean));
const DELAY_MS = 400;
/** Ranks past this are "if you have nothing else" filler on most pages. */
const MAX_RANKS = 4;

/** genshin.gg's short names where they are not simply a word of Enka's. */
const NAME_ALIASES = {
  childe: "tartaglia",
  "traveler": "traveler",
};

function normalise(s) {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Tags out, headings marked, entities decoded - enough to read the lists. */
function toText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<h([1-6])[^>]*>/g, "\n## H$1: ")
    .replace(/<\/(p|div|li|tr|h[1-6]|table|section)>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&#x27;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");
}

/**
 * The "Best Artifacts" block reads, one token per line:
 *   1 / Emblem of Severed Fate / 4 / 2 / Noblesse Oblige / 4 / 3 / Emblem / 2 / Noblesse / 2
 * A rank is a bare integer followed by (name, pieces) pairs until the next
 * bare integer that is itself followed by a name rather than a count.
 */
function parseArtifacts(text) {
  const start = text.search(/## H2: [^\n]*Best Artifacts/);
  if (start < 0) return null;
  const end = text.indexOf("## H2:", start + 8);
  const lines = text
    .slice(start, end > 0 ? end : undefined)
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean);

  const ranks = [];
  let i = 0;
  while (i < lines.length) {
    // A rank number, then pairs of (name, pieces).
    if (!/^\d+$/.test(lines[i])) {
      i++;
      continue;
    }
    i++;
    const parts = [];
    while (i + 1 < lines.length && !/^\d+$/.test(lines[i]) && /^[24]$/.test(lines[i + 1])) {
      parts.push({ name: lines[i], pieces: Number(lines[i + 1]) });
      i += 2;
    }
    if (parts.length) ranks.push(parts);
  }
  return ranks;
}

function buildSetIndex() {
  const byName = new Map();
  for (const [id, s] of Object.entries(SETS)) byName.set(normalise(s.name), id);
  return byName;
}

function matchCharacter(pageName, byName) {
  const key = NAME_ALIASES[normalise(pageName)] ?? normalise(pageName);
  if (byName.has(key)) return byName.get(key);
  // "Ayaka" for "Kamisato Ayaka", "Itto" for "Arataki Itto", "Raiden" for "Raiden Shogun".
  for (const [name, id] of byName) {
    const words = name.split(" ");
    if (words.includes(key) || name.endsWith(` ${key}`) || name.startsWith(`${key} `)) return id;
  }
  return null;
}

async function main() {
  const setByName = buildSetIndex();
  const charByName = new Map();
  for (const [id, c] of Object.entries(CHARACTERS)) {
    // Both Travelers share one page; keep them both by matching the name.
    if (!charByName.has(normalise(c.name))) charByName.set(normalise(c.name), id);
  }

  console.log("Loading genshin.gg character index…");
  const index = await getText(`${BASE}/characters/`);
  const slugs = [...new Set([...index.matchAll(/href="\/characters\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))];
  console.log(`  ${slugs.length} characters to read`);

  const characters = ONLY.size && fs.existsSync(OUTPUT) ? (JSON.parse(fs.readFileSync(OUTPUT, "utf8")).characters ?? {}) : {};
  const unmatched = [];
  const unknownSets = new Set();

  for (const slug of slugs) {
    if (ONLY.size && !ONLY.has(slug)) continue;
    await new Promise((r) => setTimeout(r, DELAY_MS));
    const text = toText(await getText(`${BASE}/characters/${slug}/`));
    const title = text.match(/## H1: Genshin Impact (.+?) Build/);
    if (!title) {
      unmatched.push(`${slug} (no build page)`);
      continue;
    }
    const pageName = title[1].trim();
    const id = matchCharacter(pageName, charByName);
    if (!id) {
      unmatched.push(`${slug} ("${pageName}")`);
      continue;
    }

    const ranks = parseArtifacts(text);
    if (!ranks || ranks.length === 0) {
      unmatched.push(`${slug} (no artifact list)`);
      continue;
    }

    const sets = [];
    for (const parts of ranks.slice(0, MAX_RANKS)) {
      const resolved = parts.map((p) => {
        const setId = setByName.get(normalise(p.name));
        if (!setId) unknownSets.add(p.name);
        return setId ? { setId, pieces: p.pieces } : null;
      });
      if (resolved.every(Boolean)) sets.push(resolved);
    }

    const ids = id === "10000005" || id === "10000007" ? ["10000005", "10000007"] : [id];
    for (const cid of ids) {
      characters[cid] = { name: CHARACTERS[cid].name, sets, source: `${BASE}/characters/${slug}/` };
    }
    console.log(`  ${pageName.padEnd(22)} ${sets.length} recommendations`);
  }

  const missing = Object.keys(CHARACTERS).filter((id) => !characters[id]).map((id) => CHARACTERS[id].name);
  const output = {
    source: `${BASE}/characters/`,
    fetchedAt: new Date().toISOString(),
    characters: Object.fromEntries(Object.entries(characters).sort(([a], [b]) => Number(a) - Number(b))),
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`\n  ✔ wrote ${Object.keys(characters).length} characters to ${path.relative(ROOT, OUTPUT)}`);
  if (unknownSets.size) console.log(`  ⚠ set names not in artifacts.json: ${[...unknownSets].join(", ")}`);
  if (unmatched.length) console.log(`  ⚠ pages not matched to a character: ${unmatched.join(", ")}`);
  if (missing.length) console.log(`  ⚠ characters with no page: ${missing.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
