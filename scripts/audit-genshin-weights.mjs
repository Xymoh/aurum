/**
 * audit-genshin-weights.mjs
 * ──────────────────────────────────────────────────────────────────
 * Cross-checks the curated Genshin substat weights against three guide
 * sites and writes a report of every disagreement:
 *
 *   Prydwen  - "Investment Priority" on the Build tab (build guides only;
 *              older characters have a profile page without one). Needs a
 *              real browser, the site refuses plain HTTP clients, so this
 *              drives the Edge that ships with Windows through Playwright.
 *   KQM      - keqingmains.com/<name>/ "Substat Priority" line.
 *   Game8    - "Artifact Sub Stats" list on the character build page.
 *
 * Nothing here changes the weights. The output is for a person to read and
 * act on, because the guides describe an ordering, not a magnitude, and
 * turning "ER (until requirement) > CR = CD > ATK%" into numbers is a
 * judgement call the script should not make silently.
 *
 * Usage: node scripts/audit-genshin-weights.mjs [--skip-prydwen] [--only=Name,Name]
 * Output: plans/genshin-weight-audit.md and plans/genshin-weight-audit.json
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_MD = path.join(ROOT, "plans", "genshin-weight-audit.md");
const OUT_JSON = path.join(ROOT, "plans", "genshin-weight-audit.json");

const args = process.argv.slice(2);
const SKIP_PRYDWEN = args.includes("--skip-prydwen");
const ONLY = (args.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Our table ─────────────────────────────────────────────────────

const GO = JSON.parse(fs.readFileSync(path.join(ROOT, "genshin_optimizer_processed_data.json"), "utf8"));

/** Weight keys, and the many ways guides spell them. */
const STAT_ALIASES = [
  ["CRIT_RATE", /^(crit(ical)?\s*rate|cr|crit%|crit rate%)$/i],
  ["CRIT_DMG", /^(crit(ical)?\s*(dmg|damage)|cd|crit dmg%)$/i],
  ["ATK_PERCENT", /^(atk%?|attack%?)$/i],
  ["HP_PERCENT", /^(hp%?)$/i],
  ["DEF_PERCENT", /^(def%?|defense%?)$/i],
  ["ELEMENTAL_MASTERY", /^(em|elemental mastery|elemental mastery%?)$/i],
  ["ENERGY_RECHARGE", /^(er%?|energy recharge%?)$/i],
  ["HEALING_BONUS", /^(healing( bonus)?%?|heal%?)$/i],
  ["FLAT_ATK", /^(flat atk|atk \(flat\))$/i],
  ["FLAT_HP", /^(flat hp|hp \(flat\))$/i],
  ["FLAT_DEF", /^(flat def|def \(flat\))$/i],
];

function normaliseStat(token) {
  const t = token
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[*†]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  for (const [key, re] of STAT_ALIASES) if (re.test(t)) return key;
  return null;
}

/**
 * "ER (until requirement) > CRIT Rate = CRIT DMG > ATK%" -> [["ENERGY_RECHARGE"], ["CRIT_RATE","CRIT_DMG"], ["ATK_PERCENT"]]
 * Unrecognised tokens are kept in `unknown` so nothing is silently dropped.
 */
function parsePriority(text) {
  const unknown = [];
  // "ER (until requirement)" is a threshold, not a rank: the guide is saying
  // "get enough, then stop", which our ER caution models separately. Noted
  // so the comparison does not treat it as "ER beats CRIT".
  const erThreshold = /\bER%?\s*\((?:until|to|up to)[^)]*\)|\bER%?\s*(?:until|to) (?:requirement|req)/i.test(text);
  const tiers = text
    .split(/\s*(?:>|>>|→|＞)\s*/)
    .map((tier) =>
      tier
        .split(/\s*(?:=|≈|≥|>=|\/|~)\s*/)
        .flatMap((tok) => {
          // Bare "CRIT" means both crit stats.
          if (/^crit(\s*stats?)?(\s*\(.*\))?$/i.test(tok.trim())) return ["CRIT_RATE", "CRIT_DMG"];
          const key = normaliseStat(tok);
          if (!key && tok.trim()) unknown.push(tok.trim());
          return key ? [key] : [];
        }),
    )
    .filter((tier) => tier.length > 0);
  return { tiers, unknown, erThreshold };
}

/** Our weights as tiers: stats grouped when within 0.05 of each other, best first. */
function ourTiers(weights) {
  const ranked = Object.entries(weights)
    .filter(([key, w]) => w >= 0.2 && !key.startsWith("FLAT_") && key !== "PHYSICAL_DMG" && key !== "ELEMENTAL_DMG")
    .sort((a, b) => b[1] - a[1]);
  const tiers = [];
  for (const [key, w] of ranked) {
    const last = tiers[tiers.length - 1];
    if (last && Math.abs(last.weight - w) <= 0.05) last.keys.push(key);
    else tiers.push({ weight: w, keys: [key] });
  }
  return tiers;
}

// ── Comparison ────────────────────────────────────────────────────

const SHORT = {
  CRIT_RATE: "CR",
  CRIT_DMG: "CD",
  ATK_PERCENT: "ATK%",
  HP_PERCENT: "HP%",
  DEF_PERCENT: "DEF%",
  ELEMENTAL_MASTERY: "EM",
  ENERGY_RECHARGE: "ER",
  HEALING_BONUS: "Heal",
  FLAT_ATK: "flat ATK",
  FLAT_HP: "flat HP",
  FLAT_DEF: "flat DEF",
};

function fmtTiers(tiers) {
  return tiers.map((t) => t.map((k) => SHORT[k] ?? k).join(" = ")).join(" > ");
}

/**
 * Flags where the guide and the table disagree in a way that changes a score:
 *  - a stat the guide lists that we weight below 0.2 (we ignore it)
 *  - a stat we weight at 0.6+ that the guide does not list at all
 *  - a guide stat ranked above another that we rank clearly below it
 */
function compare(weights, guideTiers, erThreshold = false) {
  const flags = [];
  const rank = new Map();
  guideTiers.forEach((tier, i) => tier.forEach((k) => rank.set(k, i)));
  // A guide that puts "ER first" is nearly always stating a requirement to
  // meet, which the scorer handles with the ER caution rather than a weight.
  // Presence is still checked; its rank is not.
  const erFirst = guideTiers[0]?.length === 1 && guideTiers[0][0] === "ENERGY_RECHARGE";
  const skipRank = new Set(erThreshold || erFirst ? ["ENERGY_RECHARGE"] : []);

  for (const [k] of rank) {
    if ((weights[k] ?? 0) < 0.2) flags.push(`guide lists ${SHORT[k]}, we weight it ${(weights[k] ?? 0).toFixed(2)}`);
  }
  for (const [k, w] of Object.entries(weights)) {
    if (w >= 0.6 && !k.startsWith("FLAT_") && SHORT[k] && !rank.has(k) && k !== "PHYSICAL_DMG" && k !== "ELEMENTAL_DMG") {
      flags.push(`we weight ${SHORT[k]} ${w.toFixed(2)}, guide does not list it`);
    }
  }
  const listed = [...rank.keys()].filter((k) => !skipRank.has(k));
  for (let i = 0; i < listed.length; i++) {
    for (let j = i + 1; j < listed.length; j++) {
      const a = listed[i];
      const b = listed[j];
      if (rank.get(a) < rank.get(b) && (weights[a] ?? 0) + 0.1 < (weights[b] ?? 0)) {
        flags.push(`guide ranks ${SHORT[a]} above ${SHORT[b]}, we weight ${(weights[a] ?? 0).toFixed(2)} vs ${(weights[b] ?? 0).toFixed(2)}`);
      }
    }
  }
  return flags;
}

// ── Sources ───────────────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) return null;
  return res.text();
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d|td|th|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function slugCandidates(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const words = base.split(/\s+/);
  const out = [base.replace(/\s+/g, "-")];
  if (words.length > 1) out.push(words[words.length - 1], words[0]);
  return [...new Set(out)];
}

/** KQM: the "Substat Priority" line on keqingmains.com/<slug>/. */
async function kqm(name) {
  for (const slug of slugCandidates(name)) {
    const html = await fetchText(`https://keqingmains.com/${slug}/`);
    await sleep(400);
    if (!html) continue;
    const text = htmlToText(html);
    // Take the first line after a "Substat Priority" heading that contains a ">" or "=".
    const m = text.match(/Substats?\s*Priorit(?:y|ies)[^\n]*\n((?:[^\n]*\n){0,6})/i);
    if (!m) return { url: `https://keqingmains.com/${slug}/`, priority: null };
    const line = m[1].split("\n").find((l) => /[>=]/.test(l) && /crit|atk|hp|em|er|def|heal/i.test(l));
    return { url: `https://keqingmains.com/${slug}/`, priority: line?.trim() ?? null };
  }
  return { url: null, priority: null };
}

/** Game8: character build pages are linked from the tier list; substats are a comma list. */
let game8Links = null;
async function game8Index() {
  if (game8Links) return game8Links;
  game8Links = new Map();
  const html = await fetchText("https://game8.co/games/Genshin-Impact/archives/297465");
  if (!html) return game8Links;
  for (const m of html.matchAll(/<a[^>]+href="([^"]*\/games\/Genshin-Impact\/archives\/[^"]+)"[^>]*>([^<]{2,40})<\/a>/g)) {
    const text = m[2].trim();
    const href = m[1].startsWith("http") ? m[1] : `https://game8.co${m[1]}`;
    if (/^[A-Z][A-Za-z' .-]+$/.test(text) && !game8Links.has(text.toLowerCase())) game8Links.set(text.toLowerCase(), href);
  }
  return game8Links;
}

async function game8(name) {
  const links = await game8Index();
  const candidates = [name, ...name.split(" ").reverse()].map((n) => n.toLowerCase());
  const url = candidates.map((c) => links.get(c)).find(Boolean);
  if (!url) return { url: null, priority: null };
  const html = await fetchText(url);
  await sleep(400);
  if (!html) return { url, priority: null };
  const text = htmlToText(html);
  const at = text.search(/Artifact Sub[- ]?Stats?/i);
  if (at < 0) return { url, priority: null };
  const after = text.slice(at, at + 600).split("\n").slice(1).map((l) => l.trim()).filter(Boolean);
  // Two layouts: a numbered list ("1. Energy Recharge", "2. HP%") or one
  // comma-separated line ("CRIT Rate, CRIT DMG, HP%").
  const numbered = [];
  for (const line of after) {
    const m = line.match(/^\d+\.\s*(.+)$/);
    if (m) numbered.push(m[1].trim());
    else if (numbered.length) break;
  }
  const priority = numbered.length
    ? numbered.join(" > ")
    : after[0] && /,/.test(after[0]) && after[0].length < 160
      ? after[0].replace(/,/g, " >")
      : after[0] && after[0].length < 80
        ? after[0].replace(/,/g, " >")
        : null;
  return { url, priority };
}

/** Prydwen: needs a browser. Returns null priority for characters with no build guide. */
async function makePrydwen() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto("https://www.prydwen.gg/genshin-impact/characters/", { waitUntil: "domcontentloaded" });
  await page.locator('button:has-text("Do not consent")').click({ timeout: 5000 }).catch(() => {});
  const index = await page.evaluate(() => {
    const m = {};
    document.querySelectorAll('a[href^="/genshin-impact/characters/"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (href.split("/").filter(Boolean).length === 3) m[a.textContent.trim().replace(/New$/, "").toLowerCase()] = href;
    });
    return m;
  });

  async function lookup(name) {
    const slug = index[name.toLowerCase()];
    if (!slug) return { url: null, priority: null, mainStats: null, guide: false };
    const url = `https://www.prydwen.gg${slug}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await sleep(800);
    const title = await page.title();
    if (!/build/i.test(title)) return { url, priority: null, mainStats: null, guide: false };
    await page.evaluate(() => {
      [...document.querySelectorAll("a")].filter((a) => /^build$/i.test(a.textContent.trim())).forEach((a) => a.click());
    });
    await sleep(900);
    const text = await page.evaluate(() => document.body.innerText);
    // "Investment Priority\nStats\nER\n>\nHP%\n<prose>" - tokens until the first prose line.
    let priority = null;
    const m = text.match(/Investment Priority\s*\nStats\s*\n([\s\S]{0,400})/i);
    if (m) {
      const tokens = [];
      for (const line of m[1].split("\n")) {
        const l = line.trim();
        if (!l) continue;
        if (l.split(" ").length > 5 || /^Talents$/i.test(l)) break;
        tokens.push(l);
      }
      priority = tokens.join(" ");
    }
    const ms = text.match(/Artifact main stats\s*\nSands\s*\n([^\n]+)\s*\nGoblet\s*\n([^\n]+)\s*\nCirclet\s*\n([^\n]+)/i);
    const mainStats = ms ? { SANDS: ms[1].trim(), GOBLET: ms[2].trim(), CIRCLET: ms[3].trim() } : null;
    await sleep(700);
    return { url, priority, mainStats, guide: true };
  }

  return { lookup, close: () => browser.close() };
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const entries = Object.values(GO)
    .filter((c) => c.substat_weights && c.display_name !== "Traveler")
    .filter((c) => ONLY.length === 0 || ONLY.includes(c.display_name))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  const prydwen = SKIP_PRYDWEN ? null : await makePrydwen();
  const results = [];

  for (const c of entries) {
    const name = c.display_name;
    process.stdout.write(`${name} … `);
    const row = { name, avatarId: c.avatar_id, ours: ourTiers(c.substat_weights), weights: c.substat_weights, sources: {}, flags: {} };
    const sources = {
      prydwen: prydwen ? await prydwen.lookup(name) : { url: null, priority: null },
      kqm: await kqm(name),
      game8: await game8(name),
    };
    for (const [src, info] of Object.entries(sources)) {
      const parsed = info.priority ? parsePriority(info.priority) : null;
      row.sources[src] = { ...info, tiers: parsed?.tiers ?? null, unknown: parsed?.unknown ?? [], erThreshold: parsed?.erThreshold ?? false };
      row.flags[src] = parsed && parsed.tiers.length > 0 ? compare(c.substat_weights, parsed.tiers, parsed.erThreshold) : [];
    }
    results.push(row);
    const total = Object.values(row.flags).reduce((n, f) => n + f.length, 0);
    console.log(total ? `${total} flag(s)` : "ok");
  }

  await prydwen?.close();

  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

  const lines = [
    "# Genshin substat weight audit",
    "",
    `Generated ${new Date().toISOString().slice(0, 10)} by scripts/audit-genshin-weights.mjs. Guides give an ordering; our table gives magnitudes. A flag means the two disagree in a way that changes a score, and someone should decide which is right.`,
    "",
  ];
  const flagged = results.filter((r) => Object.values(r.flags).some((f) => f.length));
  lines.push(`${flagged.length} of ${results.length} characters flagged.`, "");
  for (const r of results) {
    const any = Object.values(r.flags).some((f) => f.length);
    lines.push(`## ${r.name}${any ? "" : " (agrees)"}`, "");
    lines.push(`- Ours: ${r.ours.map((t) => `${t.keys.map((k) => SHORT[k]).join(" = ")} (${t.weight})`).join(" > ")}`);
    for (const [src, info] of Object.entries(r.sources)) {
      if (!info.url) {
        lines.push(`- ${src}: not found`);
        continue;
      }
      const pr = info.priority ? `"${info.priority}"` : info.guide === false ? "no build guide" : "no priority found";
      lines.push(`- ${src}: ${pr}${info.tiers ? ` -> ${fmtTiers(info.tiers)}` : ""}${info.unknown?.length ? ` (unparsed: ${info.unknown.join(", ")})` : ""} <${info.url}>`);
      if (info.mainStats) lines.push(`  - main stats: ${info.mainStats.SANDS} / ${info.mainStats.GOBLET} / ${info.mainStats.CIRCLET}`);
      for (const f of r.flags[src]) lines.push(`  - ⚠ ${f}`);
    }
    lines.push("");
  }
  fs.writeFileSync(OUT_MD, lines.join("\n"));
  console.log(`\nWrote ${path.relative(ROOT, OUT_MD)} (${flagged.length} flagged) and ${path.relative(ROOT, OUT_JSON)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
