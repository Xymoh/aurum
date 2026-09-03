/**
 * fetch-fribbels-weights.mjs
 * ──────────────────────────────────────────────────────────────────
 * Pulls per-character relic scoring metadata (substat weights and ideal
 * main stats) from the Fribbels HSR Optimizer repository, which is MIT
 * licensed, and writes it as src/hsr/data/scoring-metadata.json.
 *
 * Fribbels keeps one TypeScript file per character under
 * src/lib/conditionals/character/<group>/<Name>.ts, each exporting a
 * CharacterConfig with an `id` and a `scoring()` block:
 *
 *   stats: { [Stats.SPD]: 1, [Stats.CD]: 1, [Stats.RES]: 0.25, ... }
 *   parts: { [Parts.Body]: [Stats.CD], [Parts.Feet]: [Stats.SPD], ... }
 *   flatMainstatBoost?: Stats.HP
 *
 * We read those literally: no TypeScript evaluation, just a tolerant parse
 * of the object literal. Stat names are mapped onto Enka's property keys so
 * the scorer never has to know Fribbels' naming.
 *
 * Usage: node scripts/fetch-fribbels-weights.mjs
 *        GITHUB_TOKEN=$(gh auth token) node scripts/fetch-fribbels-weights.mjs
 * Re-run whenever a new character ships. Unauthenticated GitHub API calls
 * are rate limited to 60/hour and sometimes refused outright; this script
 * makes two, the rest go to raw.githubusercontent.com which is not limited
 * the same way.
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "src", "hsr", "data", "scoring-metadata.json");
const CHARACTERS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "hsr", "data", "characters.json"), "utf8"));

const REPO = "fribbels/hsr-optimizer";
const BRANCH = "main";
const CHARACTER_DIR = "src/lib/conditionals/character/";

/** Fribbels `Stats.X` names to Enka property keys. */
const STAT_TO_ENKA = {
  ATK: "AttackDelta",
  ATK_P: "AttackAddedRatio",
  HP: "HPDelta",
  HP_P: "HPAddedRatio",
  DEF: "DefenceDelta",
  DEF_P: "DefenceAddedRatio",
  SPD: "SpeedDelta",
  CR: "CriticalChanceBase",
  CD: "CriticalDamageBase",
  EHR: "StatusProbabilityBase",
  RES: "StatusResistanceBase",
  BE: "BreakDamageAddedRatioBase",
  OHB: "HealRatioBase",
  ERR: "SPRatioBase",
  Physical_DMG: "PhysicalAddedRatio",
  Fire_DMG: "FireAddedRatio",
  Ice_DMG: "IceAddedRatio",
  Lightning_DMG: "ThunderAddedRatio",
  Wind_DMG: "WindAddedRatio",
  Quantum_DMG: "QuantumAddedRatio",
  Imaginary_DMG: "ImaginaryAddedRatio",
};

/** Fribbels part names to our slot keys. Head and Hands have fixed mains. */
const PART_TO_SLOT = {
  Body: "BODY",
  Feet: "FOOT",
  PlanarSphere: "NECK",
  LinkRope: "OBJECT",
};

/** Optional: a token lifts the unauthenticated rate limit (`GITHUB_TOKEN=$(gh auth token)`). */
const TOKEN = process.env.GITHUB_TOKEN;

async function getJSON(url) {
  const headers = { "User-Agent": "aurum-fetcher/1.0", Accept: "application/vnd.github+json" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Extracts the text between the opening brace after `marker` and its matching close. */
function braceBlock(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) return null;
  const open = source.indexOf("{", at);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return null;
}

function parseStats(block) {
  const stats = {};
  const re = /\[Stats\.(\w+)\]:\s*([0-9.]+)/g;
  let m;
  while ((m = re.exec(block))) {
    const key = STAT_TO_ENKA[m[1]];
    const value = Number(m[2]);
    if (!key) {
      console.warn(`    ? unknown stat Stats.${m[1]}`);
      continue;
    }
    if (value > 0) stats[key] = value;
  }
  return stats;
}

function parseParts(block) {
  const parts = { BODY: [], FOOT: [], NECK: [], OBJECT: [] };
  const re = /\[Parts\.(\w+)\]:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(block))) {
    const slot = PART_TO_SLOT[m[1]];
    if (!slot) continue;
    const stats = [...m[2].matchAll(/Stats\.(\w+)/g)].map((s) => STAT_TO_ENKA[s[1]]).filter(Boolean);
    parts[slot] = stats;
  }
  return parts;
}

function parseCharacterFile(source, file) {
  // Reworked kits carry a "b1" suffix on the same in-game id: '1306b1'.
  const idMatch = source.match(/\bid:\s*'(\d{4})(b1)?'/i);
  if (!idMatch) return null;
  const scoringBlock = braceBlock(source, "const scoring = ()");
  if (!scoringBlock) return null;

  const statsBlock = braceBlock(scoringBlock, "stats:");
  const partsBlock = braceBlock(scoringBlock, "parts:");
  if (!statsBlock || !partsBlock) return null;

  const boost = scoringBlock.match(/flatMainstatBoost:\s*Stats\.(\w+)/);

  return {
    id: idMatch[1],
    file,
    variant: idMatch[2] ? "B1" : "base",
    stats: parseStats(statsBlock),
    parts: parseParts(partsBlock),
    flatMainstatBoost: boost ? STAT_TO_ENKA[boost[1]] : undefined,
  };
}

async function main() {
  console.log(`Fetching ${REPO}@${BRANCH} character metadata…`);
  const head = await getJSON(`https://api.github.com/repos/${REPO}/commits/${BRANCH}`);
  const tree = await getJSON(`https://api.github.com/repos/${REPO}/git/trees/${head.sha}?recursive=1`);
  const files = tree.tree
    .map((t) => t.path)
    .filter((p) => p.startsWith(CHARACTER_DIR) && p.endsWith(".ts") && !p.endsWith(".test.ts"));
  console.log(`  ${files.length} character files at ${head.sha.slice(0, 7)}`);

  const parsed = [];
  for (const file of files) {
    const source = await getText(`https://raw.githubusercontent.com/${REPO}/${head.sha}/${file}`);
    const entry = parseCharacterFile(source, file);
    if (entry) parsed.push(entry);
    else console.warn(`  ✖ could not parse ${file}`);
  }

  // Reworked kits ship as a sibling "<Name>B1.ts" with the same id. The B1
  // file describes the character as they play now, so it wins; the earlier
  // file is kept under `variants` for reference.
  const characters = {};
  for (const entry of parsed) {
    const existing = characters[entry.id];
    const record = {
      name: CHARACTERS[entry.id]?.name ?? path.basename(entry.file, ".ts"),
      stats: entry.stats,
      parts: entry.parts,
      ...(entry.flatMainstatBoost ? { flatMainstatBoost: entry.flatMainstatBoost } : {}),
      file: entry.file,
      variant: entry.variant,
    };
    if (!existing) {
      characters[entry.id] = record;
    } else if (entry.variant === "B1" && existing.variant !== "B1") {
      characters[entry.id] = { ...record, variants: [...(existing.variants ?? []), existing] };
    } else {
      existing.variants = [...(existing.variants ?? []), record];
    }
  }

  const missing = Object.keys(CHARACTERS).filter((id) => !characters[id]);
  const output = {
    source: `https://github.com/${REPO}`,
    license: "MIT",
    commit: head.sha,
    fetchedAt: new Date().toISOString(),
    characters: Object.fromEntries(Object.entries(characters).sort(([a], [b]) => Number(a) - Number(b))),
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`  ✔ wrote ${Object.keys(characters).length} characters to ${path.relative(ROOT, OUTPUT)}`);
  if (missing.length) {
    console.log(`  ⚠ ${missing.length} characters in characters.json have no Fribbels entry (Path fallback applies):`);
    console.log("    " + missing.map((id) => `${id} ${CHARACTERS[id].name}`).join(", "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
