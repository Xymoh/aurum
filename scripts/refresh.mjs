/**
 * refresh.mjs
 * ──────────────────────────────────────────────────────────────────
 * One command for patch day. Runs every data fetcher in order, keeps going
 * when one fails, and finishes with what changed and what still needs a
 * person: a new Genshin character has no curated weights until someone
 * reads a guide, and a new HSR character scores on a Path profile until
 * Fribbels adds them.
 *
 * The build guides refresh with everything else: new characters and sets
 * join the tables first, the guide sites are read again for their current
 * weapon, team and set picks, and every guide page is rebuilt from those
 * and the current game text. A character a guide site has not covered yet
 * is listed at the end; their page shows game data until a later refresh.
 *
 * Usage: npm run refresh
 *        node scripts/refresh.mjs --skip=locale,pfps   (skip named steps)
 *        node scripts/refresh.mjs --only=hsr,hsr-weights
 *
 * GITHUB_TOKEN is optional; without it the Fribbels import uses the
 * unauthenticated GitHub API, which is occasionally refused. When the gh
 * CLI is installed and logged in, its token is used automatically.
 * ──────────────────────────────────────────────────────────────────
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { guideBehindKit } from "./guide-kit.mjs";
import { TRAVELER_ELEMENTS, TRAVELER_IDS, travelerId, travelerName } from "./genshin-traveler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flag = (name) => (args.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3).split(",").filter(Boolean);
const SKIP = new Set(flag("skip"));
const ONLY = new Set(flag("only"));

/** Where the table sync leaves its findings for the summary. */
const TABLE_REPORT = path.join(os.tmpdir(), `aurum-genshin-tables-${process.pid}.json`);

/** In dependency order: tables first, names and locale next, weights and guides last. */
const STEPS = [
  // Everything after this reads the Genshin tables, so new characters and
  // sets have to be in them first.
  {
    id: "genshin-tables",
    label: "Genshin character and artifact set tables (Project Amber)",
    script: "sync-genshin-tables.mjs",
    args: [`--report=${TABLE_REPORT}`],
  },
  { id: "go", label: "Genshin character stats (Genshin Optimizer)", script: "fetch-go-data.js" },
  { id: "locale", label: "Genshin names in every language (Enka, Project Amber)", script: "fetch-enka-locale.js" },
  { id: "weapons", label: "Genshin weapon ids", script: "build-weapon-ids.js" },
  { id: "pfps", label: "Profile pictures", script: "fetch-profile-pictures.js" },
  { id: "hsr", label: "Star Rail game tables (StarRailRes)", script: "fetch-hsr-data.js" },
  { id: "hsr-weights", label: "Star Rail per-character weights (Fribbels)", script: "fetch-fribbels-weights.mjs" },
  { id: "hsr-stats", label: "Star Rail stat curves (StarRailRes)", script: "fetch-hsr-stats.mjs" },
  { id: "zzz", label: "Zenless game tables (Enka store)", script: "fetch-zzz-data.mjs" },
  { id: "zzz-weights", label: "Zenless per-agent weights (Prydwen guides)", script: "fetch-zzz-weights.mjs" },
  { id: "zzz-art", label: "Zenless render framing for new agents", script: "measure-zzz-art.mjs" },
  { id: "genshin-sets", label: "Genshin recommended artifact sets and guide picks (Game8, genshin.gg fallback)", script: "fetch-genshin-sets.mjs" },
  { id: "sets", label: "Star Rail and Zenless recommended sets and guide picks (Prydwen guides)", script: "fetch-prydwen-sets.mjs" },
  // The guide pages merge the picks above with game text, so they run last.
  // Genshin's builder keeps Amber's answers for a day, which would carry
  // yesterday's text into a patch-day run; the other two builders check
  // their source's version themselves.
  {
    id: "genshin-guides",
    label: "Genshin guide pages: kit, materials, weapons (Project Amber)",
    script: "build-genshin-guides.mjs",
    args: ["--fresh"],
  },
  { id: "hsr-guides", label: "Star Rail guide pages: kit, materials, Light Cones (StarRailRes)", script: "build-hsr-guides.mjs" },
  { id: "zzz-guides", label: "Zenless guide pages: kit, materials, W-Engines (Dimbreath; material icons from nanoka.cc)", script: "build-zzz-guides.mjs" },
];

const readJSON = (rel) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
};

function snapshot() {
  const gi = readJSON("src/data/characters.json") ?? {};
  const go = readJSON("src/data/genshin-optimizer.json") ?? {};
  const hsr = readJSON("src/hsr/data/characters.json") ?? {};
  const fribbels = readJSON("src/hsr/data/scoring-metadata.json")?.characters ?? {};
  const zzz = readJSON("src/zzz/data/agents.json") ?? {};
  const prydwenZzz = readJSON("src/zzz/data/scoring-metadata.json")?.characters ?? {};
  // The build picker lists the Genshin characters with a build config, which
  // leaves out placeholders no guide site will ever cover. Both Travelers
  // read Aether's entry.
  const goIds = new Set(Object.values(go).map((c) => c.avatar_id).filter((id) => typeof id === "string"));
  if (goIds.has("10000005")) goIds.add("10000007");
  // The Traveler's guides are per element, on both bodies, with the picks
  // keyed on Aether's: these are the names and ids the reports need for them.
  const travelerFiles = Object.fromEntries(
    TRAVELER_IDS.filter((id) => gi[id]).flatMap((body) => TRAVELER_ELEMENTS.map((element) => [travelerId(element, body), travelerName(element)])),
  );
  // Null when a picks file is missing, so the summary says nothing rather
  // than listing the whole roster as uncovered.
  const picked = (rel) => {
    const file = readJSON(rel);
    return file ? new Set(Object.keys(file.characters ?? {})) : null;
  };
  return {
    gi: new Set(Object.keys(gi)),
    giNames: { ...Object.fromEntries(Object.entries(gi).map(([id, c]) => [id, c.name])), ...travelerFiles },
    giUnweighted: Object.values(go)
      .filter((c) => !c.substat_weights)
      .map((c) => c.display_name),
    hsr: new Set(Object.keys(hsr)),
    hsrNames: Object.fromEntries(Object.entries(hsr).map(([id, c]) => [id, c.name])),
    hsrUnweighted: Object.keys(hsr).filter((id) => {
      const key = Number(id) >= 8000 && Number(id) % 2 === 0 ? String(Number(id) - 1) : id;
      return !fribbels[key];
    }),
    zzz: new Set(Object.keys(zzz)),
    zzzNames: Object.fromEntries(Object.entries(zzz).map(([id, c]) => [id, c.name])),
    zzzUnweighted: Object.keys(zzz).filter((id) => !prydwenZzz[id]),
    giListed: Object.keys(gi)
      .filter((id) => goIds.has(id))
      .flatMap((id) => (TRAVELER_IDS.includes(id) ? (id === TRAVELER_IDS[0] ? TRAVELER_ELEMENTS.map((element) => travelerId(element)) : []) : [id])),
    giPicks: picked("src/data/guide-picks.json"),
    hsrPicks: picked("src/hsr/data/guide-picks.json"),
    zzzPicks: picked("src/zzz/data/guide-picks.json"),
    giUnmatchedSets: readJSON("src/data/set-recommendations.json")?.unmatchedSets ?? [],
  };
}

/**
 * Guides older than the kit they describe: the game changed the character
 * after the guide site last updated its page. The page already warns its
 * visitors; the summary lists them so a person can decide whether to wait
 * for the site or step in.
 */
function guidesBehindKit(dirRel, names) {
  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((file) => {
    const guide = readJSON(path.join(dirRel, file));
    if (!guide || !guideBehindKit(guide)) return [];
    const id = file.replace(/\.json$/, "");
    return [`${names[id] ?? id} (${id}): kit changed ${guide.kitChangedAt}, guide ${guide.source.updated ? `updated ${guide.source.updated}` : "undated"}`];
  });
}

/** What the table sync reported, read once and removed; null when that step did not run. */
function readTableReport() {
  try {
    const report = JSON.parse(fs.readFileSync(TABLE_REPORT, "utf8"));
    fs.rmSync(TABLE_REPORT, { force: true });
    return report;
  } catch {
    return null;
  }
}

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const gh = spawnSync("gh", ["auth", "token"], { encoding: "utf8", shell: true });
  return gh.status === 0 ? gh.stdout.trim() : undefined;
}

function run(step, token) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [path.join(__dirname, step.script), ...(step.args ?? [])], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...(token ? { GITHUB_TOKEN: token } : {}) },
  });
  return { ok: result.status === 0, seconds: ((Date.now() - started) / 1000).toFixed(0) };
}

function main() {
  const before = snapshot();
  const token = githubToken();
  const results = [];

  for (const step of STEPS) {
    if (SKIP.has(step.id) || (ONLY.size > 0 && !ONLY.has(step.id))) {
      results.push({ step, skipped: true });
      continue;
    }
    console.log(`\n━━ ${step.label} (${step.script}) ━━`);
    results.push({ step, ...run(step, token) });
  }

  const after = snapshot();
  const newGi = [...after.gi].filter((id) => !before.gi.has(id)).map((id) => `${after.giNames[id]} (${id})`);
  const newHsr = [...after.hsr].filter((id) => !before.hsr.has(id)).map((id) => `${after.hsrNames[id]} (${id})`);
  const newZzz = [...after.zzz].filter((id) => !before.zzz.has(id)).map((id) => `${after.zzzNames[id]} (${id})`);

  console.log("\n━━ Summary ━━");
  for (const r of results) {
    const mark = r.skipped ? "–" : r.ok ? "✔" : "✖";
    console.log(`  ${mark} ${r.step.label}${r.skipped ? " (skipped)" : ` ${r.seconds}s`}`);
  }

  const changed = spawnSync("git", ["status", "--short", "--", "src/data", "src/hsr/data", "src/zzz/data", "src/data/genshin-optimizer.json"], {
    cwd: ROOT,
    encoding: "utf8",
  }).stdout.trim();
  console.log(changed ? `\nChanged files:\n${changed}` : "\nNo data files changed.");

  if (newGi.length) console.log(`\nNew Genshin characters: ${newGi.join(", ")}`);
  if (newHsr.length) console.log(`New Star Rail characters: ${newHsr.join(", ")}`);
  if (newZzz.length) console.log(`New Zenless agents: ${newZzz.join(", ")}`);

  const todo = [];
  if (after.giUnweighted.length) {
    todo.push(
      `Genshin characters scoring on default weights (derived from their ascension stat): ${after.giUnweighted.join(", ")}.\n` +
        `    Once Prydwen or KQM has a guide, run: node scripts/audit-genshin-weights.mjs --only=<Name>\n` +
        `    then add their weights and ideal main stats to src/data/character-builds.json and re-run fetch-go-data.js.`,
    );
  }
  if (after.hsrUnweighted.length) {
    const names = after.hsrUnweighted.map((id) => `${after.hsrNames[id]} (${id})`);
    todo.push(
      `Star Rail characters on a Path fallback (no Fribbels entry yet): ${names.join(", ")}.\n` +
        `    Re-run npm run fetch-hsr-weights in a few days, or add a CHARACTER_OVERRIDES entry in src/hsr/weights.ts from Prydwen's guide.`,
    );
  }
  if (after.zzzUnweighted.length) {
    const names = after.zzzUnweighted.map((id) => `${after.zzzNames[id]} (${id})`);
    todo.push(
      `Zenless agents on a role fallback (no Prydwen guide parsed yet): ${names.join(", ")}.\n` +
        `    Re-run npm run fetch-zzz-weights once Prydwen publishes their build page.`,
    );
  }
  const tables = readTableReport();
  if (tables?.problems.length) {
    todo.push(
      `The Genshin tables disagree with Project Amber:\n${tables.problems.map((p) => `      ${p}`).join("\n")}\n` +
        `    Check src/data/characters.json and artifacts.json against the game and correct whichever side is wrong.`,
    );
  }
  if (after.giUnmatchedSets.length) {
    todo.push(
      `genshin.gg recommends sets src/data/artifacts.json does not know, so those recommendations were left out: ${after.giUnmatchedSets.join(", ")}.\n` +
        `    Usually genshin.gg spelling a set differently from the game: match the name in scripts/fetch-genshin-sets.mjs,\n` +
        `    then re-run it and scripts/build-genshin-guides.mjs.`,
    );
  }
  if (todo.length) {
    console.log("\nNeeds a person:");
    for (const t of todo) console.log(`  • ${t}`);
  }

  const behind = [
    ["Genshin", guidesBehindKit("src/data/guides", after.giNames)],
    ["Star Rail", guidesBehindKit("src/hsr/data/guides", after.hsrNames)],
    ["Zenless", guidesBehindKit("src/zzz/data/guides", after.zzzNames)],
  ].filter(([, list]) => list.length > 0);
  if (behind.length) {
    console.log("\nGuides older than a kit change (their pages say so until the guide site updates):");
    for (const [game, list] of behind) for (const line of list) console.log(`  • ${game}: ${line}`);
  }

  // Not a job for anyone: the guide sites publish a few days after release,
  // and the next refresh picks the guide up by itself.
  const uncovered = (listed, picks, names) => (picks ? listed.filter((id) => !picks.has(id)).map((id) => `${names[id]} (${id})`) : []);
  const waiting = [
    ["Genshin, Game8", uncovered(after.giListed, after.giPicks, after.giNames)],
    ["Star Rail, Prydwen", uncovered([...after.hsr], after.hsrPicks, after.hsrNames)],
    ["Zenless, Prydwen", uncovered([...after.zzz], after.zzzPicks, after.zzzNames)],
  ].filter(([, names]) => names.length > 0);
  if (waiting.length) {
    console.log("\nNo guide yet (their build pages show game data only until a later refresh finds one):");
    for (const [site, names] of waiting) console.log(`  • ${site}: ${names.join(", ")}`);
  }

  console.log("\nNext: review `git diff`, run `npm test`, commit.");
  process.exit(results.some((r) => !r.skipped && !r.ok) ? 1 : 0);
}

// Only as a script: importing this file must not start a full refresh.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
