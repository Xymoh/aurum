/**
 * refresh.mjs
 * ──────────────────────────────────────────────────────────────────
 * One command for patch day. Runs every data fetcher in order, keeps going
 * when one fails, and finishes with what changed and what still needs a
 * person: a new Genshin character has no curated weights until someone
 * reads a guide, and a new HSR character scores on a Path profile until
 * Fribbels adds them.
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
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flag = (name) => (args.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3).split(",").filter(Boolean);
const SKIP = new Set(flag("skip"));
const ONLY = new Set(flag("only"));

/** In dependency order: names and locale first, weights last. */
const STEPS = [
  { id: "go", label: "Genshin character stats (Genshin Optimizer)", script: "fetch-go-data.js" },
  { id: "locale", label: "Genshin names in every language (Enka, Project Amber)", script: "fetch-enka-locale.js" },
  { id: "weapons", label: "Genshin weapon ids", script: "build-weapon-ids.js" },
  { id: "pfps", label: "Profile pictures", script: "fetch-profile-pictures.js" },
  { id: "hsr", label: "Star Rail game tables (StarRailRes)", script: "fetch-hsr-data.js" },
  { id: "hsr-weights", label: "Star Rail per-character weights (Fribbels)", script: "fetch-fribbels-weights.mjs" },
  { id: "zzz", label: "Zenless game tables (Enka store)", script: "fetch-zzz-data.mjs" },
  { id: "zzz-weights", label: "Zenless per-agent weights (Prydwen guides)", script: "fetch-zzz-weights.mjs" },
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
  const go = readJSON("genshin_optimizer_processed_data.json") ?? {};
  const hsr = readJSON("src/hsr/data/characters.json") ?? {};
  const fribbels = readJSON("src/hsr/data/scoring-metadata.json")?.characters ?? {};
  const zzz = readJSON("src/zzz/data/agents.json") ?? {};
  const prydwenZzz = readJSON("src/zzz/data/scoring-metadata.json")?.characters ?? {};
  return {
    gi: new Set(Object.keys(gi)),
    giNames: Object.fromEntries(Object.entries(gi).map(([id, c]) => [id, c.name])),
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
  };
}

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const gh = spawnSync("gh", ["auth", "token"], { encoding: "utf8", shell: true });
  return gh.status === 0 ? gh.stdout.trim() : undefined;
}

function run(step, token) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [path.join(__dirname, step.script)], {
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

  const changed = spawnSync("git", ["status", "--short", "--", "src/data", "src/hsr/data", "src/zzz/data", "genshin_optimizer_processed_data.json"], {
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
  if (todo.length) {
    console.log("\nNeeds a person:");
    for (const t of todo) console.log(`  • ${t}`);
  }

  console.log("\nNext: review `git diff`, run `npm test`, commit.");
  process.exit(results.some((r) => !r.skipped && !r.ok) ? 1 : 0);
}

main();
