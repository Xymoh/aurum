/**
 * fetch-zzz-weights.mjs
 * ──────────────────────────────────────────────────────────────────
 * Reads each agent's ideal disc main stats and substat priority from
 * Prydwen's build guides into the local cache (.sources/zzz/prydwen.weights.json).
 * scripts/consensus.mjs turns every source's priorities into the published
 * src/zzz/data/scoring-metadata.json.
 *
 * There is no Fribbels-style open weight table for ZZZ, but Prydwen's ZZZ
 * pages are structured enough to generate one: every agent's Build tab lists
 * the ideal main stat per selectable disc and a ranked substat priority:
 *
 *   Disk 4: CRIT Rate% >= ATK%   Disk 5: Ice DMG% = ATK%   Disk 6: ATK%
 *   Substats: CRIT RATE (Until 80%) >= CRIT DMG = ATK% > Anomaly Proficiency = ATK = PEN
 *
 * The priority is stored as tiers: two stats joined by "=" share a tier,
 * ">=" counts as a step. A "(Until X%)" qualifier is recorded as a
 * threshold. consensus.mjs maps tiers onto 1 / 0.75 / 0.5 / 0.25.
 *
 * Prydwen refuses plain HTTP clients, so this drives a visible Edge or
 * Chrome window through Playwright (see launchBrowser in sources.mjs). Set
 * ZZZ_BROWSER=chrome to try Chrome first. Pass --only=miyabi,ellen to limit the run.
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchBrowser, writeSource } from "./sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AGENTS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "agents.json"), "utf8"));

const BASE = "https://www.prydwen.gg";
const ONLY = new Set(
  (process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean),
);
const DELAY_MS = 900;

/** Prydwen's display names where they differ from Enka's English names. */
const NAME_ALIASES = {
  "anby: soldier 0": "soldier 0 - anby",
  "billy - starlight": "starlight - billy",
  "jane doe": "jane",
};

/** Guide wording to Enka PropertyIds. Order matters: longer phrases first. */
const STAT_PATTERNS = [
  // "Profiency" is a typo that appears on at least one Prydwen page.
  [/anomaly\s*prof(?:ic)?iency|\bAP\b/i, 31203],
  [/anomaly\s*mastery|\bAM\b/i, 31402],
  [/crit(?:ical)?\s*rate|\bCR\b/i, 20103],
  [/crit(?:ical)?\s*(?:dmg|damage)|\bCD\b/i, 21103],
  [/\bpen\b(?!\s*ratio)|penetration(?!\s*ratio)/i, 23203],
  [/pen\s*ratio/i, 23103],
  [/energy\s*regen|\benergy\b/i, 30502],
  [/impact/i, 12202],
  [/hp\s*%|hp%|\bhp\s*percent/i, 11102],
  [/atk\s*%|atk%|attack\s*%/i, 12102],
  [/def\s*%|def%|defen[cs]e\s*%/i, 13102],
  [/\bhp\b/i, 11103],
  [/\batk\b|\battack\b/i, 12103],
  [/\bdef\b|\bdefen[cs]e\b/i, 13103],
  [/physical\s*dmg/i, 31503],
  [/fire\s*dmg/i, 31603],
  [/ice\s*dmg/i, 31703],
  [/electric\s*dmg|elec\s*dmg/i, 31803],
  [/ether\s*dmg/i, 31903],
  [/wind\s*dmg/i, 32303],
  [/auric\s*ether\s*dmg/i, 32003],
];

function statId(text) {
  const clean = text.replace(/\([^)]*\)/g, "").trim();
  if (!clean) return null;
  for (const [re, id] of STAT_PATTERNS) if (re.test(clean)) return id;
  return null;
}

/** "A (Until 80%) >= B = C > D" -> tiers of PropertyIds plus any thresholds. */
function parsePriority(text) {
  const thresholds = {};
  const unknown = [];
  const tiers = text
    .split(/\s*(?:>=|≥|>|→)\s*/)
    .map((tier) =>
      tier
        .split(/\s*(?:=|≈|\/)\s*/)
        .map((tok) => {
          const id = statId(tok);
          if (!id) {
            if (tok.trim()) unknown.push(tok.trim());
            return null;
          }
          const until = tok.match(/until\s*([\d.]+)\s*%?/i);
          if (until) thresholds[id] = Number(until[1]);
          return id;
        })
        .filter(Boolean),
    )
    .filter((tier) => tier.length > 0);
  return { tiers, thresholds, unknown };
}

function parseMains(text) {
  // "Disk 4\nCRIT Rate% >= ATK%\nDisk 5\n..." -> { 4: [ids], 5: [ids], 6: [ids] }
  const parts = { 4: [], 5: [], 6: [] };
  for (const slot of [4, 5, 6]) {
    const m = text.match(new RegExp(`Disk ${slot}\\s+([^\\n]+)`, "i"));
    if (!m) continue;
    parts[slot] = m[1]
      .split(/\s*(?:>=|≥|>|=|\/|,|\bor\b)\s*/i)
      .map(statId)
      .filter(Boolean);
  }
  return parts;
}

/** Waits out Cloudflare's interstitial, which titles itself "Just a moment...". */
async function settle(page) {
  for (let i = 0; i < 30; i++) {
    if (!/just a moment/i.test(await page.title())) return;
    await page.waitForTimeout(1000);
  }
}

function normalise(name) {
  return name.toLowerCase().replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Enka's English name to Prydwen's URL slug, with the handful that differ. */
const SLUG_OVERRIDES = {
  "soldier 0 - anby": "anby-demara-soldier-0",
  "starlight - billy": "billy-starlight",
  anby: "anby-demara",
  billy: "billy-kid",
  grace: "grace-howard",
  jane: "jane-doe",
  nicole: "nicole-demara",
  yuzuha: "ukinami-yuzuha",
  "orphie & magus": "orphie-and-magus",
};

function slugFor(name) {
  const key = normalise(name);
  return SLUG_OVERRIDES[key] ?? key.replace(/&/g, "and").replace(/\s+/g, "-");
}

async function main() {
  const enkaByName = new Map();
  for (const [id, a] of Object.entries(AGENTS)) enkaByName.set(normalise(a.name), id);

  // Prydwen's Zenless section sits behind a Cloudflare check that a headless
  // browser fails ("Just a moment..."). A visible window passes it, so this
  // runs headed unless ZZZ_HEADLESS=1 is set; expect an Edge window to open
  // and close on its own.
  const browser = await launchBrowser({ prefer: process.env.ZZZ_BROWSER, headless: process.env.ZZZ_HEADLESS === "1" });
  const context = await browser.newContext({ locale: "en-US", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);

  console.log("Loading Prydwen ZZZ agent index…");
  await page.goto(`${BASE}/zenless/characters/`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const consent = page.getByRole("button", { name: /do not consent/i });
  if (await consent.count()) await consent.first().click().catch(() => {});
  // Gatsby renders the agent grid after hydration; wait for it rather than a fixed delay.
  await page.waitForSelector('a[href^="/zenless/characters/"]', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);

  let links = await page.evaluate(() => {
    const m = new Map();
    document.querySelectorAll('a[href^="/zenless/characters/"]').forEach((a) => {
      const slug = a.getAttribute("href").replace(/\/$/, "").split("/").pop();
      const name = (a.querySelector("h4, h5, [class*=name]")?.textContent || a.textContent).trim().split("\n")[0];
      if (slug && name && !m.has(slug)) m.set(slug, name);
    });
    return [...m.entries()];
  });
  if (links.length === 0) {
    // The index grid sometimes never renders in a headless session. Fall back
    // to the agents Enka knows, slugged the way Prydwen slugs them, so the run
    // still covers everyone rather than nobody.
    console.warn(`  ⚠ index gave no agents (title: "${await page.title()}"); using slugs derived from Enka's agent list`);
    links = Object.values(AGENTS).map((a) => [slugFor(a.name), a.name]);
  }
  console.log(`  ${links.length} agents to read`);

  // A partial run (--only) updates the agents it visited and keeps the rest.
  const characters = {};
  const unmatched = [];
  for (const [slug, prydwenName] of links) {
    if (ONLY.size && !ONLY.has(slug)) continue;
    const key = normalise(NAME_ALIASES[prydwenName.toLowerCase()] ?? prydwenName);
    const id = enkaByName.get(key);
    if (!id) {
      unmatched.push(prydwenName);
      continue;
    }

    process.stdout.write(`  ${prydwenName.padEnd(20)} `);
    await page.goto(`${BASE}/zenless/characters/${slug}`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(DELAY_MS);
    const text = await page.evaluate(async () => {
      const tab = [...document.querySelectorAll(".tabs .single-tab")].find((e) => /build/i.test(e.textContent));
      if (tab) tab.click();
      await new Promise((r) => setTimeout(r, 700));
      return document.body.innerText;
    });

    // innerText separates blocks with blank lines, so allow any whitespace
    // between the label and the priority string.
    const mainsBlock = text.match(/BEST DISK DRIVES? STATS\s*([\s\S]{0,400}?)\s*Substats?:/i);
    const subsLine = text.match(/Substats?:\s*([^\n]+)/i);
    if (!subsLine) {
      console.log("no substat priority found");
      unmatched.push(`${prydwenName} (no build tab)`);
      continue;
    }

    const { tiers, thresholds, unknown } = parsePriority(subsLine[1]);
    const parts = mainsBlock ? parseMains(mainsBlock[1]) : { 4: [], 5: [], 6: [] };
    const stats = tiers.flat();

    // Only this importer's part of Prydwen's entry; the picks are fetch-prydwen-sets.mjs's.
    characters[id] = {
      substats: tiers.map((tier) => tier.map(String)),
      mainStats: Object.fromEntries(Object.entries(parts).map(([slot, ids]) => [slot, ids.map(String)])),
      thresholds,
    };
    console.log(`${stats.length} stats, mains ${[4, 5, 6].map((s) => parts[s].length).join("/")}${unknown.length ? `  ? ${unknown.join(", ")}` : ""}`);
  }

  await browser.close();

  const missing = Object.keys(AGENTS).filter((id) => !characters[id]).map((id) => `${AGENTS[id].name} (${id})`);
  const file = writeSource("zzz", "prydwen", characters, { merge: ONLY.size > 0, part: "weights" });
  console.log(`
  ✔ wrote ${Object.keys(characters).length} agents to ${path.relative(ROOT, file)}`);
  if (unmatched.length) console.log(`  ⚠ on Prydwen but not in Enka's tables yet: ${unmatched.join(", ")}`);
  if (missing.length) console.log(`  ⚠ in Enka's tables with no guide (profession fallback applies): ${missing.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
