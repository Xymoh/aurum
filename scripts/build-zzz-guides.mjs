/**
 * build-zzz-guides.mjs
 * ──────────────────────────────────────────────────────────────────
 * Builds the Zenless Zone Zero half of the build guides: one GuideFile per
 * agent and the shared disc set bonus text (the contract is
 * src/lib/buildTarget/guide.ts).
 *
 *   src/zzz/data/guides/<id>.json   picks + kit, materials, stats per agent
 *   src/zzz/data/set-bonuses.json   every drive disc set, 2pc and 4pc text
 *   public/zzz/items/<name>.webp    the materials' icons, 96px
 *
 * Two inputs meet here:
 *
 *   Picks        src/zzz/data/guide-picks.json, written by the Prydwen
 *                scraper (scripts/fetch-prydwen-sets.mjs). Optional: an agent
 *                the scraper has not covered gets empty picks, and a missing
 *                file just means every agent does. --picks=<path> reads
 *                another file, for testing against a small fixture.
 *
 *   Game data    Dimbreath's ZenlessData mirror (FileCfg tables and the
 *                English TextMap), plus the stat curves the site already
 *                ships in src/zzz/data (agents.json, weapons.json,
 *                weapon-curves.json, sets.json), so the numbers on a guide
 *                page agree with the numbers on a showcase.
 *
 *   Icons       The game's item sprites, by the names the item table gives
 *               them, from nanoka.cc (hakush.in as was), shrunk to 96px and
 *               shipped with the site. Shipped rather than linked because a
 *               boss drop's art is a 2048px render, near a megabyte, and so
 *               that visitors' browsers contact no one new. An icon already
 *               in public/zzz/items is not fetched again.
 *
 * Downloads are cached under node_modules/.cache/aurum-guides/zzz and keyed
 * by the mirror's head commit, so a re-run on the same game version reads
 * the 48 MB TextMap from disk. --refresh refetches anyway; --offline never
 * touches the network and uses whatever the cache holds.
 *
 * Run after a patch (after fetch-zzz-data.mjs, whose output this reads):
 *
 *   node scripts/build-zzz-guides.mjs [--picks=path] [--refresh] [--offline] [--rebaseline]
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withKitTracking } from "./guide-kit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src", "zzz", "data");
const GUIDES = path.join(DATA, "guides");
const CACHE = path.join(ROOT, "node_modules", ".cache", "aurum-guides", "zzz");
const REPO = "dimbreath/ZenlessData";
const HOST = "https://git.mero.moe";
const RAW = `${HOST}/${REPO}/raw/branch/master`;
const UA = { "User-Agent": "aurum-fetcher/1.0" };
const ENKA = "https://enka.network";
/** Material icons: where the sprites come from, where the site's copies go, and how the pages address them. */
const ICON_HOST = "https://static.nanoka.cc/assets/zzz";
const ICON_DIR = path.join(ROOT, "public", "zzz", "items");
const ICON_PATH = "zzz/items";
/** Pages draw them at 36px; 96 keeps them sharp on a high-density screen. */
const ICON_SIZE = 96;

/**
 * Levels the text and tables are quoted at. Skills go to 12 on materials
 * alone and to 16 with Mindscapes 3 and 5 (+2 each), so the scaling table
 * runs to 16 while prose figures are quoted at 12, the level every player
 * can reach. The core skill has seven levels: the base one and A to F, so
 * F is level 7.
 */
const TEXT_SKILL_LEVEL = 12;
const SCALING_LEVELS = Array.from({ length: 16 }, (_, i) => i + 1);
const CORE_MAX_LEVEL = 7;
/** Agent and W-Engine level for the stat blocks, and the W-Engine's last breakthrough. */
const MAX_LEVEL = 60;
const MAX_PROMOTION = 6;
const ENGINE_MAX_STAR = 5;
/** Denny, the currency. Listed first in every material group. */
const DENNY = 10;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);
const PICKS_FILE = path.resolve(ROOT, typeof args.picks === "string" ? args.picks : path.join(DATA, "guide-picks.json"));

/** Everything worth telling the person running the script, printed at the end. */
const gaps = [];
const gap = (msg) => gaps.push(msg);

// ── Download and cache ──────────────────────────────────────────────

const TABLES = [
  "AvatarSkillDesTemplateTb",
  "AvatarSkillTemplateTb",
  "AvatarSkillLevelTemplateTb",
  "AvatarPassiveSkillTemplateTb",
  "AvatarPassiveSkillDesTemplateTb",
  "AvatarTalentTemplateTb",
  "AvatarLevelAdvanceTemplateTb",
  "ItemTemplateTb",
  "WeaponTalentTemplateTb",
  "EquipmentSuitTemplateTb",
  "PropertyTemplateTb",
  "NounPromptsTemplateTb",
];
const TEXTMAPS = ["TextMap_ENTemplateTb", "TextMap_ENOverwriteTemplateTb"];

async function headCommit() {
  const res = await fetch(`${HOST}/api/v1/repos/${REPO}/branches/master`, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} reading the mirror's head commit`);
  const body = await res.json();
  return { sha: body.commit.id, message: String(body.commit.message ?? "").trim() };
}

/**
 * Brings the cache up to the mirror's head. Each file records the commit it
 * was fetched at, so a new game version refetches everything once and an
 * unchanged one refetches nothing.
 */
async function syncCache() {
  fs.mkdirSync(CACHE, { recursive: true });
  const metaFile = path.join(CACHE, "meta.json");
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : { files: {} };
  const wanted = [...TABLES.map((t) => `FileCfg/${t}`), ...TEXTMAPS.map((t) => `TextMap/${t}`)];
  if (args.offline) {
    const missing = wanted.filter((w) => !fs.existsSync(path.join(CACHE, `${path.basename(w)}.json`)));
    if (missing.length) throw new Error(`--offline, but the cache lacks: ${missing.join(", ")}`);
    console.log(`  offline: using the cache from ${meta.sha?.slice(0, 8) ?? "an unknown commit"}`);
    return meta;
  }
  const head = await headCommit();
  console.log(`  mirror at ${head.sha.slice(0, 8)} (${head.message})`);
  for (const w of wanted) {
    const file = path.join(CACHE, `${path.basename(w)}.json`);
    if (!args.refresh && meta.files[w] === head.sha && fs.existsSync(file)) continue;
    const res = await fetch(`${RAW}/${w}.json`, { headers: UA });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${w}.json`);
    const text = await res.text();
    // Write-then-rename, so an interrupted download never poses as a cached table.
    fs.writeFileSync(`${file}.tmp`, text, "utf8");
    fs.renameSync(`${file}.tmp`, file);
    meta.files[w] = head.sha;
    console.log(`  fetched ${w}.json (${(text.length / 1048576).toFixed(1)} MB)`);
  }
  meta.sha = head.sha;
  meta.message = head.message;
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + "\n", "utf8");
  return meta;
}

/**
 * Every FileCfg table is `{ "<obfuscated>": [rows] }`. Anything else means
 * the dump format changed and none of the detection below can be trusted.
 */
function loadTable(name) {
  const json = JSON.parse(fs.readFileSync(path.join(CACHE, `${name}.json`), "utf8"));
  const keys = Object.keys(json);
  if (keys.length !== 1 || !Array.isArray(json[keys[0]])) throw new Error(`${name}: expected { "<key>": [rows] }, got keys ${keys.join(", ")}`);
  return json[keys[0]];
}

const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// ── Field detection ─────────────────────────────────────────────────
//
// Dimbreath's dumps keep HoYoverse's obfuscated field names, and those names
// are reshuffled every game version, so no field is looked up by name. Each
// one is found by the shape of its values instead: the field that equals an
// agent id on every agent's rows, the string field whose values all end in
// "_Title", the array of {id, count} pairs that contains Denny, and so on.
// Every rule must match exactly one field. Zero or two matches stop the run
// with the candidates listed, because a guess here writes plausible-looking
// garbage into every guide.

function fieldNames(rows) {
  const seen = new Set();
  for (const r of rows) for (const k of Object.keys(r)) seen.add(k);
  return [...seen];
}

function detect(table, what, rows, test) {
  const hits = fieldNames(rows).filter((f) => test(rows.map((r) => r[f]), f));
  if (hits.length !== 1) {
    throw new Error(`${table}: cannot tell which field is ${what} (${hits.length ? `candidates: ${hits.join(", ")}` : "no field matches"})`);
  }
  return hits[0];
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isStr = (v) => typeof v === "string";
const share = (values, pred) => (values.length ? values.filter(pred).length / values.length : 0);
const nonEmpty = (values) => values.filter((v) => isStr(v) && v !== "");

/**
 * The agent id field: numeric, covers every agent in agents.json, and holds
 * an agent id on at least half the rows (the rest are trial and event
 * copies of agents, which carry their own ids).
 */
function agentField(table, rows, agentIds) {
  const ids = new Set(agentIds);
  return detect(table, "the agent id", rows, (vals) => {
    if (!vals.every(isNum)) return false;
    const present = new Set(vals);
    return agentIds.every((id) => present.has(id)) && share(vals, (v) => ids.has(v)) >= 0.5;
  });
}

/** A numeric field whose values, per agent, are exactly 1..n with n in [min, max]. */
function levelField(table, what, rows, agentKey, [min, max], groupKey = null) {
  return detect(table, what, rows, (vals, f) => {
    if (f === agentKey || f === groupKey || !vals.every(isNum)) return false;
    const groups = new Map();
    for (const r of rows) {
      const key = groupKey ? `${r[agentKey]}:${r[groupKey]}` : r[agentKey];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r[f]);
    }
    for (const levels of groups.values()) {
      const sorted = [...levels].sort((a, b) => a - b);
      if (sorted[0] !== 1 || sorted.length < min || sorted.length > max) return false;
      if (sorted.some((v, i) => v !== i + 1)) return false;
    }
    return true;
  });
}

/**
 * The awakening condition: some agents have a second, "awakened" version of
 * their kit (the Potential upgrade), filed as extra rows that list the
 * awakening stages that unlock them. The field is an array of numbers,
 * empty or [0] on the base kit's rows and non-zero on the awakened ones.
 * Guides show the base kit, which every copy of the agent has.
 */
function awakenField(table, rows) {
  return detect(table, "the awakening condition", rows, (vals) =>
    vals.every((v) => Array.isArray(v) && v.every(isNum)) && vals.some((v) => v.some((x) => x !== 0)) && share(vals, (v) => v.every((x) => x === 0)) >= 0.8);
}

/** A string field whose non-empty values match `re` (share of non-empty values at least `min`). */
function stringField(table, what, rows, re, { min = 1, count = 1 } = {}) {
  return detect(table, what, rows, (vals) => {
    const ne = nonEmpty(vals);
    return vals.every((v) => v === undefined || isStr(v)) && ne.length >= count && share(ne, (v) => re.test(v)) >= min;
  });
}

const isPair = (o) => o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length === 2 && Object.values(o).every(isNum);
const isPairArray = (v) => Array.isArray(v) && v.every(isPair);

/**
 * A cost list: an array of {item, count} pairs on every row, non-empty on
 * most, with Denny among the items of nearly every non-empty list. The
 * Denny test is what separates it from the stat-bonus lists that share the
 * same {id, value} shape.
 */
function costField(table, rows) {
  return detect(table, "the material cost list", rows, (vals) => {
    if (!vals.every(isPairArray)) return false;
    const filled = vals.filter((v) => v.length);
    if (filled.length < vals.length * 0.4) return false;
    return share(filled, (list) => list.some((p) => Object.values(p).includes(DENNY))) >= 0.8;
  });
}

/**
 * Which key of a cost pair is the item and which the count: the item key
 * holds an item-table id in every pair, the count key does not (counts run
 * into the tens of thousands, far past any item id).
 */
function pairKeys(table, lists, itemIds) {
  const pairs = lists.flat();
  if (!pairs.length) throw new Error(`${table}: no cost pairs to read`);
  const keys = Object.keys(pairs[0]);
  const allItems = keys.filter((k) => pairs.every((p) => itemIds.has(p[k])));
  if (allItems.length !== 1) throw new Error(`${table}: cannot tell item from count in cost pairs (keys ${keys.join(", ")})`);
  return { item: allItems[0], count: keys.find((k) => k !== allItems[0]) };
}

// ── Text ────────────────────────────────────────────────────────────
//
// Game text arrives as Unity rich text with the game's own placeholders.
// GuideText (see guide.ts) is plain text with "\n" breaks and "**" around
// what the game highlights. The conversions, in order:
//
//   {LAYOUT_<PLATFORM>#text}...   one variant per input device; the
//                                 FALLBACK (or KEYBOARD) wording is kept
//   {M#text}{F#text}              the Proxy's two genders, joined "a/b"
//   {NOAWAKEN_n#..}{AWAKEN_n#..}  base and awakened kit; the base is kept
//   {CAL:expr,scale,decimals}     a figure computed from the skill level
//   <IconMap:Icon_X>              a button glyph, written as its name
//   <Term:n>..</Term>             a glossary link; the tags go, the text
//                                 stays, and an empty link (the game fills
//                                 it from its glossary) gets the term's name
//   <color=#..>..</color>         "**..**"
//   any other <tag>               stripped, and reported

/** Glossary term id -> display name, filled in main() from NounPromptsTemplateTb. */
const TERMS = new Map();

/** The button glyphs skill text uses, by the action they stand for. */
const ICON_NAMES = {
  Icon_Normal: "Basic Attack",
  Icon_Special: "Special Attack",
  Icon_SpecialReady: "EX Special Attack",
  Icon_SpecialReady_Rp: "EX Special Attack",
  Icon_SpecialReady_Ep: "EX Special Attack",
  Icon_Evade: "Dodge",
  Icon_Switch: "Switch",
  Icon_UltimateReady: "Ultimate",
  Icon_Ultimate: "Ultimate",
  Icon_QTE: "Chain Attack",
  Icon_JoyStick: "joystick",
  Icon_TextArrow: "→",
};

/**
 * Evaluates the game's {CAL:expr,scale,decimals} figure. `expr` is plain
 * arithmetic over numbers and AvatarSkillLevel(n), the level of skill slot n.
 * Anything else in it is refused rather than evaluated.
 */
function calFigure(expr, scale, decimals, level, ctx) {
  let usesLevel = false;
  const arith = expr.replace(/AvatarSkillLevel\(\s*\d+\s*\)/g, () => {
    usesLevel = true;
    return `(${level})`;
  });
  if (!/^[\d\s.+\-*/()]+$/.test(arith)) throw new Error(`${ctx.where}: unexpected {CAL:} expression "${expr}"`);
  if (usesLevel) ctx.levelDependent = true;
  const value = Function(`"use strict"; return (${arith});`)() * Number(scale);
  const dp = Math.max(0, Math.min(6, Number(decimals) || 0));
  if (!Number.isFinite(value)) throw new Error(`${ctx.where}: {CAL:${expr}} is not a number`);
  return String(Number(value.toFixed(dp)));
}

/**
 * Game rich text to GuideText. `ctx.where` names the source for errors;
 * `ctx.level` is the skill level figures are computed at; after the call
 * `ctx.levelDependent` says whether any figure depended on it.
 */
function cleanText(raw, ctx) {
  let s = String(raw).replace(/\r\n?/g, "\n");

  // A run of adjacent {LAYOUT_*#} variants is one phrase in several input
  // schemes. The site has no input device, so it takes the generic one.
  s = s.replace(/(?:\{LAYOUT_[A-Z]+#[^{}]*\})+/g, (run) => {
    const variants = [...run.matchAll(/\{LAYOUT_([A-Z]+)#([^{}]*)\}/g)].map((m) => ({ kind: m[1], text: m[2] }));
    return (variants.find((v) => v.kind === "FALLBACK") ?? variants.find((v) => v.kind === "KEYBOARD") ?? variants[0]).text;
  });
  s = s.replace(/\{M#([^{}]*)\}\{F#([^{}]*)\}/g, "$1/$2").replace(/\{F#([^{}]*)\}\{M#([^{}]*)\}/g, "$2/$1");
  s = s.replace(/\{[MF]#([^{}]*)\}/g, "$1");
  s = s.replace(/\{AWAKEN_\d+#[^{}]*\}/g, "").replace(/\{NOAWAKEN_\d+#([^{}]*)\}/g, "$1");
  s = s.replace(/\{CAL:([^{},]+),([^{},]+),([^{},]+)\}/g, (_, expr, scale, dp) => calFigure(expr, scale, dp, ctx.level ?? TEXT_SKILL_LEVEL, ctx));

  s = s.replace(/<IconMap:([A-Za-z0-9_]+)>/g, (_, icon) => {
    if (icon in ICON_NAMES) return ICON_NAMES[icon];
    gap(`unmapped button glyph <IconMap:${icon}> stripped (${ctx.where})`);
    return "";
  });
  s = s.replace(/<Term:(\d+)>([\s\S]*?)<\/Term>/g, (_, id, inner) => {
    if (inner) return inner;
    const name = TERMS.get(Number(id));
    if (name === undefined) gap(`glossary term ${id} has no name, left blank (${ctx.where})`);
    return name ?? "";
  });
  s = s.replace(/<\/?Term(?::[^>]*)?>/g, "");
  s = s.replace(/<(?!\/?color\b)[^<>]*>/gi, (tag) => {
    gap(`unknown tag ${tag} stripped (${ctx.where})`);
    return "";
  });

  s = colorToBold(s);

  // The site's copy never uses the long dash; the game has one, in a
  // stammered move name ("P-Please Allow Me!"), and a hyphen reads the same.
  s = s.replace(/[—―]/g, "-");

  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").replace(/(\S)[ \t]{2,}/g, "$1 "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

/**
 * <color> spans to "**" spans. Nested colours make one span; adjacent spans
 * merge; whitespace at a span's edge moves outside it, and a span that
 * crosses a line break is closed and reopened around it, so every "**"
 * pair sits on one line around visible text.
 */
function colorToBold(s) {
  const segs = [];
  const push = (text, bold) => {
    if (!text) return;
    const prev = segs[segs.length - 1];
    if (prev && prev.bold === bold) prev.text += text;
    else segs.push({ text, bold });
  };
  let depth = 0;
  let last = 0;
  for (const m of s.matchAll(/<color=[^>]*>|<\/color>/gi)) {
    push(s.slice(last, m.index), depth > 0);
    depth = m[0][1] === "/" ? Math.max(0, depth - 1) : depth + 1;
    last = m.index + m[0].length;
  }
  push(s.slice(last), depth > 0);

  let out = "";
  for (const seg of segs) {
    if (!seg.bold) {
      out += seg.text;
      continue;
    }
    out += seg.text
      .split("\n")
      .map((part) => {
        const m = part.match(/^(\s*)(.*?)(\s*)$/s);
        return m[2] ? `${m[1]}**${m[2]}**${m[3]}` : part;
      })
      .join("\n");
  }
  // Two spans that ended up touching ("**a****b**") read as one.
  return out.replace(/\*\*\*\*/g, "");
}

// ── Formatting ──────────────────────────────────────────────────────

/**
 * A skill multiplier, stored in hundredths of a percent (3120 is 31.2%),
 * shown to one decimal the way the game's skill tables print it.
 */
const pct = (raw) => `${Math.round(raw / 10) / 10}%`;

/**
 * The game's stat display formats from PropertyTemplateTb: a divisor and a
 * .NET format string ("{0:0.#%}" for 0.144 -> "14.4%"). Only the formats
 * the stat tables actually use are understood; a new one stops the run.
 */
function formatProperty(raw, prop) {
  const v = raw / prop.divisor;
  const m = /^\{0:0(?:\.(#+))?(%?)\}$/.exec(prop.format);
  if (!m) throw new Error(`unknown property format "${prop.format}"`);
  const dp = m[1]?.length ?? 0;
  const shown = m[2] ? v * 100 : v;
  return `${Number(shown.toFixed(dp))}${m[2]}`;
}

/**
 * A boss drop's art is an animation: one image holding a grid of frames
 * (13 across at 156px, the size of any other item icon, when this was
 * written). Its icon is the first frame, which ends where the transparent
 * band before the second one does. An ordinary icon comes back as it is.
 */
async function firstFrame(sharp, buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (width < 512 || height < 512) return buf;
  const cols = new Uint8Array(width);
  const rows = new Uint8Array(height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + channels - 1]) cols[x] = rows[y] = 1;
    }
  }
  /** Where the second frame starts along one axis: the first content after the first gap after the first content. */
  const second = (line) => {
    const gap = line.indexOf(0, line.indexOf(1));
    return gap < 0 ? -1 : line.indexOf(1, gap);
  };
  const x = second(cols);
  const y = second(rows);
  return x > 0 && y > 0 ? sharp(buf).extract({ left: 0, top: 0, width: x, height: y }).toBuffer() : buf;
}

/**
 * Makes sure public/zzz/items holds each named icon, fetching and shrinking
 * the ones it lacks, and returns the names it holds. Icons no guide lists
 * any more are removed: the directory is generated. A fetch that fails
 * leaves that material without an icon, reported, not the run stopped.
 */
async function fetchIcons(names) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
  for (const f of fs.readdirSync(ICON_DIR)) {
    if (f.endsWith(".webp") && !names.has(f.slice(0, -".webp".length))) fs.unlinkSync(path.join(ICON_DIR, f));
  }
  const have = new Set();
  let sharp = null;
  let fetched = 0;
  for (const name of [...names].sort()) {
    const file = path.join(ICON_DIR, `${name}.webp`);
    if (fs.existsSync(file)) {
      have.add(name);
      continue;
    }
    if (args.offline) {
      gap(`material icon ${name} not fetched (--offline)`);
      continue;
    }
    try {
      const res = await fetch(`${ICON_HOST}/${name}.webp`, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Loaded here rather than at the top so a run with every icon in place
      // does not need the native module at all.
      sharp ??= (await import("sharp")).default;
      await sharp(await firstFrame(sharp, Buffer.from(await res.arrayBuffer())))
        .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 85 })
        .toFile(file);
      have.add(name);
      fetched++;
    } catch (err) {
      gap(`material icon ${name}: ${err.message}`);
    }
  }
  console.log(`  items/             ${String(have.size).padStart(4)} icons${fetched ? `, ${fetched} fetched` : ""}`);
  return have;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("building ZZZ guides…");
  const meta = await syncCache();

  const agents = readJSON(path.join(DATA, "agents.json"));
  const weapons = readJSON(path.join(DATA, "weapons.json"));
  const curves = readJSON(path.join(DATA, "weapon-curves.json"));
  const sets = readJSON(path.join(DATA, "sets.json"));
  const agentIds = Object.keys(agents).map(Number);

  // The overwrite map carries corrections issued after the base text was
  // frozen (reworded passives, fixed figures), so it wins.
  const text = Object.assign(
    readJSON(path.join(CACHE, "TextMap_ENTemplateTb.json")),
    readJSON(path.join(CACHE, "TextMap_ENOverwriteTemplateTb.json")),
  );
  const tx = (key) => (key && typeof text[key] === "string" ? text[key] : undefined);

  const T = Object.fromEntries(TABLES.map((t) => [t, loadTable(t)]));

  // ── Glossary ──
  // Term links that do carry text ("<Term:1000024>Purr Energy</Term>") are
  // the anchor: the id field holds the linked ids, and the name field is the
  // one whose text matches what those links say (allowing for plurals). A
  // name and a title field can carry the same text; if every candidate reads
  // the same for every term they are interchangeable, otherwise it stops.
  const nouns = T.NounPromptsTemplateTb;
  const linked = new Set();
  const anchors = [];
  for (const v of Object.values(text)) {
    if (!v.includes("<Term:")) continue;
    for (const m of v.matchAll(/<Term:(\d+)>([^<]*)<\/Term>/g)) {
      linked.add(Number(m[1]));
      if (m[2].trim()) anchors.push([Number(m[1]), m[2].trim().toLowerCase()]);
    }
  }
  const nounId = detect("NounPromptsTemplateTb", "the term id", nouns, (vals) => vals.every(isNum) && new Set(vals).size === vals.length && share([...linked], (id) => vals.includes(id)) >= 0.9);
  const nounById = new Map(nouns.map((r) => [r[nounId], r]));
  const known = anchors.filter(([id]) => nounById.has(id));
  const nameCandidates = fieldNames(nouns)
    .filter((f) => nouns.every((r) => r[f] === undefined || isStr(r[f])))
    .map((f) => {
      const names = nouns.map((r) => tx(r[f]));
      const matched = share(known, ([id, inner]) => {
        const n = tx(nounById.get(id)[f])?.toLowerCase();
        return n !== undefined && (inner.startsWith(n) || n.startsWith(inner));
      });
      return { f, matched, resolved: names.filter((n) => n !== undefined).length, short: share(names, (n) => n !== undefined && !n.includes("\n") && n.length <= 60) };
    })
    .filter((c) => c.short >= 0.9 && c.matched >= 0.5)
    .sort((a, b) => b.matched - a.matched || b.resolved - a.resolved);
  const [bestNoun, nextNoun] = nameCandidates;
  const tie = nextNoun && nextNoun.matched === bestNoun.matched && nextNoun.resolved === bestNoun.resolved && nouns.some((r) => tx(r[nextNoun.f]) !== tx(r[bestNoun.f]));
  if (!bestNoun || tie) throw new Error(`NounPromptsTemplateTb: cannot tell which field is the term name (candidates: ${nameCandidates.map((c) => c.f).join(", ") || "none"})`);
  for (const r of nouns) {
    const name = tx(r[bestNoun.f]);
    if (name !== undefined) TERMS.set(r[nounId], cleanText(name, { where: `term ${r[nounId]}` }));
  }

  // ── Items ──
  const itemRows = T.ItemTemplateTb;
  const itemId = detect("ItemTemplateTb", "the item id", itemRows, (vals) => vals.every(isNum) && new Set(vals).size === vals.length && vals.includes(DENNY));
  const itemById = new Map(itemRows.map((r) => [r[itemId], r]));
  const weaponRows = Object.keys(weapons).map((id) => itemById.get(Number(id))).filter(Boolean);
  if (weaponRows.length < Object.keys(weapons).length * 0.9) throw new Error("ItemTemplateTb: most W-Engines in weapons.json are missing from the item table");
  // The name key is the field whose text, for W-Engines, is the name Enka
  // publishes; the rarity is the field that matches Enka's W-Engine rarity.
  const itemName = detect("ItemTemplateTb", "the item name", itemRows, (vals, f) =>
    vals.every((v) => v === undefined || isStr(v)) && share(weaponRows, (r) => tx(r[f]) === weapons[r[itemId]].name) >= 0.9);
  const itemRarity = detect("ItemTemplateTb", "the item rarity", itemRows, (vals, f) =>
    vals.every((v) => isNum(v) && v >= 0 && v <= 5) && share(weaponRows, (r) => r[f] === weapons[r[itemId]].rarity) >= 0.95);
  const itemIds = new Set(itemById.keys());
  // The sprite each item shows is a path in the item table, and its file
  // name is what the icon host files it under. Boss drops have no path
  // there: the game draws them from a render named after the item's name
  // key (Item_BigBoss001_name -> ExBigBoss001). A field this cannot pin
  // down costs the icons, not the run; they are decoration.
  let itemIcon = null;
  try {
    const denny = itemById.get(DENNY);
    itemIcon = detect("ItemTemplateTb", "the item icon", itemRows, (vals, f) =>
      vals.every((v) => v === undefined || isStr(v)) && /\/ItemIcon\/UnPacker\/[^/]+\.png$/.test(denny[f] ?? ""));
  } catch (err) {
    gap(`material icons left out: ${err.message}`);
  }
  const iconName = (row) => {
    if (!itemIcon || !row) return null;
    const sprite = row[itemIcon]?.match(/\/([^/]+)\.png$/);
    if (sprite) return sprite[1];
    const boss = row[itemName]?.match(/^Item_((?:Big|Small)Boss\d+)_name$/);
    return boss ? `Ex${boss[1]}` : null;
  };
  /** Item id -> icon name, for every material a guide lists; the files are fetched once all guides are built. */
  const materialIcons = new Map();
  const material = (id, count) => {
    const row = itemById.get(id);
    const name = row ? tx(row[itemName]) : undefined;
    if (!name) gap(`item ${id} has no English name`);
    const icon = iconName(row);
    if (icon) materialIcons.set(String(id), icon);
    else if (itemIcon) gap(`item ${id} (${name ?? "unnamed"}) names no icon`);
    return { id: String(id), name: name ? cleanText(name, { where: `item ${id}` }) : `Item ${id}`, iconUrl: null, rarity: row ? row[itemRarity] : 0, count };
  };

  // ── Stat names and formats ──
  const propRows = T.PropertyTemplateTb;
  const propId = detect("PropertyTemplateTb", "the property id", propRows, (vals) => vals.every(isNum) && [11101, 12101, 20103].every((id) => vals.includes(id)));
  const propById = new Map(propRows.map((r) => [r[propId], r]));
  const need = (id) => {
    const r = propById.get(id);
    if (!r) throw new Error(`PropertyTemplateTb: no row for property ${id}`);
    return r;
  };
  // Display name: a TextMap key, and the same name for the flat and percent
  // versions of a stat (both HP rows read "HP"; the internal name field
  // tells them apart and is not what the game shows).
  const propName = detect("PropertyTemplateTb", "the stat display name", propRows, (vals, f) =>
    vals.every((v) => v === undefined || isStr(v)) && tx(need(11102)[f]) !== undefined && tx(need(11102)[f]) === tx(need(11103)[f]) && tx(need(20103)[f]) !== undefined);
  const propFormat = stringField("PropertyTemplateTb", "the display format", propRows, /^\{0:[0#.%]+\}$/);
  const propDivisor = detect("PropertyTemplateTb", "the display divisor", propRows, (vals, f) =>
    vals.every(isNum) && need(20103)[f] === 10000 && need(11101)[f] === 1 && need(30501)[f] === 100);
  /** Name and format for a stat id; the name falls back to the aggregate stat (11101 -> 111). */
  const prop = (id) => {
    const row = need(id);
    const agg = propById.get(Math.floor(id / 100));
    const name = tx(row[propName]) ?? (agg ? tx(agg[propName]) : undefined);
    if (!name) throw new Error(`PropertyTemplateTb: property ${id} has no display name`);
    return { name, aggName: agg ? tx(agg[propName]) ?? name : name, divisor: row[propDivisor], format: row[propFormat] };
  };

  // ── Skills ──
  const desAll = T.AvatarSkillDesTemplateTb;
  const desAwaken = awakenField("AvatarSkillDesTemplateTb", desAll);
  const baseKit = (r, f) => r[f].every((x) => x === 0);
  const des = desAll.filter((r) => baseKit(r, desAwaken));
  const desAgent = agentField("AvatarSkillDesTemplateTb", des, agentIds);
  const awakened = [...new Set(desAll.filter((r) => !baseKit(r, desAwaken)).map((r) => r[desAgent]))];
  // A handful of titles break the pattern ("..._Title_01", one "..._Attack"),
  // so the rule asks for most, not all.
  const desTitle = stringField("AvatarSkillDesTemplateTb", "the skill title", des, /_Title(_\w+)?$/, { min: 0.95, count: 100 });
  const desParam = detect("AvatarSkillDesTemplateTb", "the multiplier formula", des, (vals) =>
    vals.every((v) => v === undefined || isStr(v)) && share(nonEmpty(vals), (v) => /\{Skill:\s*\d+,\s*Prop:\s*\d+\}/.test(v)) >= 0.5);
  const desText = detect("AvatarSkillDesTemplateTb", "the skill description", des, (vals, f) =>
    f !== desTitle && vals.every((v) => v === undefined || isStr(v)) && share(des.filter((r) => r[desTitle]), (r) => /_Desc$/.test(r[f] ?? "")) >= 0.9);
  // Skill slot: 0 Basic, 1 Special, 2 Dodge, 3 Chain, 5 Core, 6 Assist. A
  // small integer with at least five distinct values; checked against the
  // move names below before anything is written.
  const desSlot = detect("AvatarSkillDesTemplateTb", "the skill slot", des, (vals) => vals.every((v) => isNum(v) && v >= 0 && v <= 9) && new Set(vals).size >= 5);
  // Row kind: 0 for a move's description, 1 for a multiplier table row.
  const desKind = detect("AvatarSkillDesTemplateTb", "the row kind", des, (vals, f) => {
    if (f === desSlot || !vals.every((v) => v === 0 || v === 1)) return false;
    return des.every((r) => (r[desTitle] ? r[f] === 0 : true) && (r[desParam] ? r[f] === 1 : true)) && vals.includes(1);
  });

  /** The five slots the skill screen shows, in its order, and their game names. */
  const SLOTS = [
    { slot: 0, key: "SkillText_CommonAttack", re: /^Basic Attack/ },
    { slot: 2, key: "SkillText_Evade", re: /^(Dodge|Dash Attack)/ },
    { slot: 6, key: "SkillText_AssistSkill", re: /Assist/ },
    { slot: 1, key: "SkillText_SpecialAttack", re: /Special Attack/ },
    { slot: 3, key: "SkillText_CooperateSkill", re: /^(Chain Attack|Ultimate)/ },
  ];
  for (const s of SLOTS) {
    s.name = tx(s.key);
    if (!s.name) throw new Error(`TextMap: no "${s.key}" for the ${s.slot} skill slot's name`);
    // The slot numbers are the one thing taken on trust from the old
    // schema, so they are proven here: most moves filed under a slot must
    // carry that slot's move-type prefix ("Dash Attack: ..." under Dodge).
    const titles = des.filter((r) => r[desSlot] === s.slot && r[desKind] === 0 && r[desTitle]).map((r) => tx(r[desTitle]) ?? "");
    if (share(titles, (t) => s.re.test(t)) < 0.8) throw new Error(`AvatarSkillDesTemplateTb: slot ${s.slot} does not read as ${s.name} (${titles.slice(0, 3).join(" | ")})`);
  }

  // Multipliers: {Skill:id, Prop:1001} is the DMG multiplier of that hit,
  // Prop:1002 its Daze. AvatarSkillTemplateTb stores each as a (level 1,
  // per-level growth) pair of adjacent fields, DMG first. The pairs are the
  // adjacent numeric fields where the second is set on a fair share of rows
  // and is always smaller than the first; exactly two may match.
  const skillRows = T.AvatarSkillTemplateTb;
  const refs = new Map([[1001, new Set()], [1002, new Set()]]);
  for (const r of des) for (const m of String(r[desParam] ?? "").matchAll(/\{Skill:\s*(\d+),\s*Prop:\s*(\d+)\}/g)) {
    if (!refs.has(Number(m[2]))) throw new Error(`AvatarSkillDesTemplateTb: unknown multiplier Prop:${m[2]}`);
    refs.get(Number(m[2])).add(Number(m[1]));
  }
  const allRefs = new Set([...refs.get(1001), ...refs.get(1002)]);
  const skillId = detect("AvatarSkillTemplateTb", "the hit id", skillRows, (vals) => vals.every(isNum) && new Set(vals).size === vals.length && share([...allRefs], (id) => vals.includes(id)) >= 0.99);
  const numericFields = fieldNames(skillRows).filter((f) => f !== skillId && skillRows.every((r) => r[f] === undefined || isNum(r[f])));
  const pairs = [];
  for (let i = 0; i + 1 < numericFields.length; i++) {
    const [a, b] = [numericFields[i], numericFields[i + 1]];
    const withGrowth = skillRows.filter((r) => (r[b] ?? 0) > 0);
    if (withGrowth.length >= skillRows.length * 0.2 && withGrowth.every((r) => (r[a] ?? 0) > r[b])) pairs.push({ base: a, growth: b });
  }
  if (pairs.length !== 2) throw new Error(`AvatarSkillTemplateTb: expected 2 (base, growth) multiplier pairs, found ${pairs.length}`);
  const skillById = new Map(skillRows.map((r) => [r[skillId], r]));
  const MULT = { 1001: pairs[0], 1002: pairs[1] };
  for (const [prop, pair] of Object.entries(MULT)) {
    const set = [...refs.get(Number(prop))].map((id) => skillById.get(id)).filter(Boolean);
    if (share(set, (r) => (r[pair.base] ?? 0) > 0) < 0.9) throw new Error(`AvatarSkillTemplateTb: hits quoted as Prop:${prop} mostly lack a value in ${pair.base}`);
  }
  /** A multiplier in hundredths of a percent at a skill level. */
  const multiplier = (hit, prop, level, where) => {
    const row = skillById.get(hit);
    const pair = MULT[prop];
    if (!row || !pair) throw new Error(`${where}: no multiplier for {Skill:${hit}, Prop:${prop}}`);
    return (row[pair.base] ?? 0) + (row[pair.growth] ?? 0) * (level - 1);
  };

  /**
   * One cell of a multiplier table. A formula is literal text around brace
   * groups: {Skill:a, Prop:p} is one multiplier, and {{...} + {...}} or
   * {{...}/3} is arithmetic over multipliers; each group becomes one
   * percentage and the text between groups ("+", "*3") is kept, with "*"
   * shown as "×". A bare TextMap key is a fixed figure such as an Energy
   * cost, possibly with its own {CAL:} level formula.
   */
  const cell = (param, level, where) => {
    if (/^[A-Za-z][A-Za-z0-9_]*$/.test(param)) {
      const raw = tx(param);
      if (raw === undefined) return undefined;
      return cleanText(raw, { where, level });
    }
    let out = "";
    let i = 0;
    while (i < param.length) {
      if (param[i] !== "{") {
        out += param[i] === "*" ? "×" : param[i];
        i++;
        continue;
      }
      let depth = 0;
      let j = i;
      for (; j < param.length; j++) {
        if (param[j] === "{") depth++;
        else if (param[j] === "}" && --depth === 0) break;
      }
      const group = param.slice(i, j + 1);
      const arith = group.replace(/\{Skill:\s*(\d+),\s*Prop:\s*(\d+)\}/g, (_, h, p) => `(${multiplier(Number(h), Number(p), level, where)})`).replace(/^\{|\}$/g, "");
      if (!/^[\d\s.+\-*/()]+$/.test(arith)) throw new Error(`${where}: cannot read multiplier formula "${param}"`);
      out += pct(Function(`"use strict"; return (${arith});`)());
      i = j + 1;
    }
    return out.replace(/\s+/g, " ").replace(/\s*×\s*/g, "×").trim();
  };

  // ── Upgrade costs ──
  const skillLv = T.AvatarSkillLevelTemplateTb;
  const skillLvAgent = agentField("AvatarSkillLevelTemplateTb", skillLv, agentIds);
  const skillLvSlot = detect("AvatarSkillLevelTemplateTb", "the skill slot", skillLv, (vals, f) => f !== skillLvAgent && vals.every((v) => isNum(v) && v >= 0 && v <= 9) && new Set(vals).size >= 5);
  levelField("AvatarSkillLevelTemplateTb", "the skill level", skillLv, skillLvAgent, [7, 16], skillLvSlot);
  const skillLvCost = costField("AvatarSkillLevelTemplateTb", skillLv);

  const advance = T.AvatarLevelAdvanceTemplateTb;
  const advanceAgent = agentField("AvatarLevelAdvanceTemplateTb", advance, agentIds);
  levelField("AvatarLevelAdvanceTemplateTb", "the promotion stage", advance, advanceAgent, [MAX_PROMOTION, MAX_PROMOTION]);
  const advanceCost = costField("AvatarLevelAdvanceTemplateTb", advance);

  const passive = T.AvatarPassiveSkillTemplateTb;
  const passiveAgent = agentField("AvatarPassiveSkillTemplateTb", passive, agentIds);
  levelField("AvatarPassiveSkillTemplateTb", "the core upgrade step", passive, passiveAgent, [CORE_MAX_LEVEL - 1, CORE_MAX_LEVEL - 1]);
  const passiveCost = costField("AvatarPassiveSkillTemplateTb", passive);

  const { item: pairItem, count: pairCount } = pairKeys("cost lists", [...skillLv.map((r) => r[skillLvCost]), ...advance.map((r) => r[advanceCost]), ...passive.map((r) => r[passiveCost])], itemIds);
  /** Totals a set of cost lists, Denny first, then in order of first appearance. */
  const totals = (lists) => {
    const sum = new Map();
    for (const list of lists) for (const p of list) sum.set(p[pairItem], (sum.get(p[pairItem]) ?? 0) + p[pairCount]);
    const ids = [...sum.keys()].sort((a, b) => (a === DENNY ? -1 : b === DENNY ? 1 : 0));
    return ids.map((id) => material(id, sum.get(id)));
  };

  // ── Core passive and Mindscapes text ──
  const coreDesAll = T.AvatarPassiveSkillDesTemplateTb;
  const coreAwaken = awakenField("AvatarPassiveSkillDesTemplateTb", coreDesAll);
  const coreDes = coreDesAll.filter((r) => baseKit(r, coreAwaken));
  const coreAgent = agentField("AvatarPassiveSkillDesTemplateTb", coreDes, agentIds);
  const arrayOf = (re) => (vals) => vals.every((v) => Array.isArray(v) && v.every(isStr)) && share(vals.filter((v) => v.length), (v) => v.every((k) => re.test(k))) >= 0.95 && vals.some((v) => v.length);
  const coreTitles = detect("AvatarPassiveSkillDesTemplateTb", "the core title keys", coreDes, arrayOf(/_Title$/));
  const coreTexts = detect("AvatarPassiveSkillDesTemplateTb", "the core description keys", coreDes, arrayOf(/_Desc$/));
  const coreLevel = detect("AvatarPassiveSkillDesTemplateTb", "the core level", coreDes, (vals, f) =>
    f !== coreAgent && vals.every(isNum) && Math.min(...vals) === 1 && Math.max(...vals) === CORE_MAX_LEVEL);

  const talent = T.AvatarTalentTemplateTb;
  const talentAgent = agentField("AvatarTalentTemplateTb", talent, agentIds);
  const talentLevel = levelField("AvatarTalentTemplateTb", "the Mindscape number", talent, talentAgent, [6, 6]);
  // Each Mindscape has a plain and a "_Realign" title and description. The
  // Realign text is the same wording re-broken into lines, which is how the
  // game shows it now, so it is preferred.
  const talentTitle = stringField("AvatarTalentTemplateTb", "the Mindscape title", talent, /_Title$/, { min: 0.95 });
  const talentTitleR = stringField("AvatarTalentTemplateTb", "the realigned Mindscape title", talent, /_Title_Realign$/, { min: 0.95 });
  // Mindscapes 3 and 5 share "Common_Talent_Desc" (all skills Lv. +2) in
  // both fields; "_Desc_02" is the flavour quote, which is left out.
  const talentText = stringField("AvatarTalentTemplateTb", "the Mindscape description", talent, /_Desc(_01)?$/, { min: 0.95 });
  const talentTextR = stringField("AvatarTalentTemplateTb", "the realigned Mindscape description", talent, /_Desc(_01_Realign)?$/, { min: 0.95 });

  // ── W-Engine passives ──
  const wt = T.WeaponTalentTemplateTb;
  const weaponIdSet = new Set(Object.keys(weapons).map(Number));
  const wtWeapon = detect("WeaponTalentTemplateTb", "the W-Engine id", wt, (vals) => vals.every(isNum) && share(vals, (v) => weaponIdSet.has(v)) >= 0.9);
  const wtRefine = levelField("WeaponTalentTemplateTb", "the refinement", wt, wtWeapon, [5, 5]);
  const wtTitle = stringField("WeaponTalentTemplateTb", "the passive title", wt, /Title/, { min: 0.95 });
  const wtText = stringField("WeaponTalentTemplateTb", "the passive description", wt, /Des/, { min: 0.95 });

  // ── Disc sets ──
  const suits = T.EquipmentSuitTemplateTb;
  const setIdSet = new Set(Object.keys(sets).map(Number));
  const suitId = detect("EquipmentSuitTemplateTb", "the set id", suits, (vals) => vals.every(isNum) && share(vals, (v) => setIdSet.has(v)) >= 0.9);
  const suitName = stringField("EquipmentSuitTemplateTb", "the set name", suits, /_name$/i, { min: 0.95 });
  // Bonus descriptions carry their piece count in the key: "_2_des", "_4_des".
  const suitBonusFields = fieldNames(suits).filter((f) => suits.every((r) => isStr(r[f]) && /_\d+_des$/i.test(r[f])));
  if (suitBonusFields.length !== 2) throw new Error(`EquipmentSuitTemplateTb: expected two bonus description fields, found ${suitBonusFields.join(", ") || "none"}`);

  // ── Build: set bonuses ──
  const setBonuses = {};
  const suitById = new Map(suits.map((r) => [r[suitId], r]));
  for (const [id, s] of Object.entries(sets)) {
    const row = suitById.get(Number(id));
    if (!row) {
      gap(`set ${id} (${s.name}) is not in EquipmentSuitTemplateTb`);
      continue;
    }
    const bonuses = suitBonusFields
      .map((f) => ({ pieces: Number(/_(\d+)_des$/i.exec(row[f])[1]), key: row[f] }))
      .sort((a, b) => a.pieces - b.pieces)
      .map(({ pieces, key }) => {
        const raw = tx(key);
        if (raw === undefined) gap(`set ${id} (${s.name}) has no ${pieces}pc text`);
        return raw === undefined ? null : { pieces, text: cleanText(raw, { where: `set ${id} ${pieces}pc` }) };
      })
      .filter(Boolean);
    const gameName = tx(row[suitName]);
    if (gameName && gameName !== s.name) gap(`set ${id}: sets.json says "${s.name}", the game says "${gameName}" (kept sets.json)`);
    setBonuses[id] = { name: s.name, bonuses };
  }

  // ── Build: W-Engines ──
  const wtByWeapon = new Map();
  for (const r of wt) {
    if (!wtByWeapon.has(r[wtWeapon])) wtByWeapon.set(r[wtWeapon], []);
    wtByWeapon.get(r[wtWeapon]).push(r);
  }
  const engineCache = new Map();
  /** A GuideWeapon without the pick-specific refinement, or null for an unknown id. */
  const engine = (id) => {
    if (engineCache.has(id)) return engineCache.get(id);
    const w = weapons[id];
    if (!w) return null;
    const stats = [];
    const { main, secondary } = engineStats(w, curves);
    if (main) stats.push({ label: prop(main.id).name, value: formatProperty(main.value, prop(main.id)) });
    if (secondary) stats.push({ label: prop(secondary.id).name, value: formatProperty(secondary.value, prop(secondary.id)) });
    let passiveText = null;
    const rows = (wtByWeapon.get(Number(id)) ?? []).sort((a, b) => a[wtRefine] - b[wtRefine]);
    if (rows.length === 5) {
      const name = tx(rows[0][wtTitle]);
      const texts = rows.map((r) => tx(r[wtText]));
      if (name && texts.every((t) => t !== undefined)) {
        const cleaned = texts.map((t, i) => cleanText(t, { where: `W-Engine ${id} R${i + 1}` }));
        const merged = mergeRefinements(cleaned);
        if (!merged) gap(`W-Engine ${id} (${w.name}): refinement texts differ beyond their figures, showing R1`);
        else if (!merged.exact) gap(`W-Engine ${id} (${w.name}): refinements differ in wording as well as figures; merged on the wording most of them share`);
        passiveText = { name: cleanText(name, { where: `W-Engine ${id} name` }), text: merged?.text ?? cleaned[0] };
      } else gap(`W-Engine ${id} (${w.name}): passive text missing`);
    } else gap(`W-Engine ${id} (${w.name}): ${rows.length} refinement rows, expected 5`);
    const out = { id: String(id), name: w.name, iconUrl: w.image ? `${ENKA}${w.image}` : null, rarity: w.rarity, stats, passive: passiveText };
    engineCache.set(id, out);
    return out;
  };

  // ── Picks ──
  let picks = { characters: {} };
  if (fs.existsSync(PICKS_FILE)) {
    picks = readJSON(PICKS_FILE);
    console.log(`  picks: ${Object.keys(picks.characters ?? {}).length} agents from ${path.relative(ROOT, PICKS_FILE)}`);
  } else {
    gap(`no picks file at ${path.relative(ROOT, PICKS_FILE)}: every guide has empty picks`);
  }
  for (const id of Object.keys(picks.characters ?? {})) if (!agents[id]) gap(`picks name agent ${id}, which is not in agents.json`);

  // ── Build: one guide per agent ──
  const byAgent = (rows, key) => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r[key])) m.set(r[key], []);
      m.get(r[key]).push(r);
    }
    return m;
  };
  const desBy = byAgent(des, desAgent);
  const skillLvBy = byAgent(skillLv, skillLvAgent);
  const advanceBy = byAgent(advance, advanceAgent);
  const passiveBy = byAgent(passive, passiveAgent);
  const coreBy = byAgent(coreDes, coreAgent);
  const talentBy = byAgent(talent, talentAgent);

  const guides = {};
  for (const [idStr, agent] of Object.entries(agents)) {
    const id = Number(idStr);
    const who = `${agent.name} (${id})`;

    // Skills: each move's description row, then its multiplier table,
    // which follows a header row naming the move by its title key.
    const rows = desBy.get(id) ?? [];
    const moves = [];
    const moveByTitle = new Map();
    for (const r of rows) {
      if (r[desKind] !== 0 || !r[desTitle]) continue;
      const slot = SLOTS.find((s) => s.slot === r[desSlot]);
      if (!slot) continue;
      const name = tx(r[desTitle]);
      const body = tx(r[desText]);
      if (name === undefined || body === undefined) {
        gap(`${who}: move ${r[desTitle]} has no English text`);
        continue;
      }
      const ctx = { where: `${who} ${r[desTitle]}`, level: TEXT_SKILL_LEVEL };
      const entry = { kind: slot.name, name: cleanText(name, ctx), text: cleanText(body, ctx), iconUrl: null };
      if (ctx.levelDependent) entry.level = TEXT_SKILL_LEVEL;
      moves.push({ slot: slot.slot, entry, rows: [] });
      moveByTitle.set(r[desTitle], moves[moves.length - 1]);
    }
    let current = null;
    let prefix = "";
    for (const r of rows) {
      if (r[desKind] !== 1) continue;
      if (!r[desParam]) {
        // A header. Most name a move; a few name a sub-move ("Stance:
        // Jougen") that has no description of its own, whose rows join the
        // move before it with the sub-move's name in front.
        const match = moveByTitle.get(r[desText]);
        if (match) {
          current = match;
          prefix = "";
        } else {
          const sameSlot = current && current.slot === r[desSlot] ? current : moves.find((m) => m.slot === r[desSlot]);
          current = sameSlot ?? null;
          const label = tx(r[desText]);
          prefix = label ? `${cleanText(label, { where: `${who} header` })} - ` : "";
          if (!current) gap(`${who}: multiplier header ${r[desText] || "(blank)"} has no move to join`);
        }
        continue;
      }
      if (!current) continue;
      const label = tx(r[desText]);
      if (label === undefined) {
        gap(`${who}: multiplier label ${r[desText]} has no English text`);
        continue;
      }
      const where = `${who} ${r[desText]}`;
      const values = SCALING_LEVELS.map((lv) => cell(r[desParam], lv, where));
      if (values.some((v) => v === undefined)) {
        gap(`${who}: multiplier ${r[desParam]} does not resolve`);
        continue;
      }
      current.rows.push({ label: prefix + cleanText(label, { where }), values });
    }
    const skills = [];
    for (const s of SLOTS) for (const m of moves.filter((x) => x.slot === s.slot)) {
      if (m.rows.length) m.entry.scaling = { levels: SCALING_LEVELS, rows: m.rows };
      skills.push(m.entry);
    }
    if (!skills.length) gap(`${who}: no skills`);

    // Core passive and Additional Ability, at core level 7 (F).
    const core = [];
    const coreRows = (coreBy.get(id) ?? []).filter((r) => r[coreLevel] === CORE_MAX_LEVEL);
    const firstCore = (coreBy.get(id) ?? []).find((r) => r[coreLevel] === 1);
    if (coreRows.length !== 1) gap(`${who}: ${coreRows.length} core descriptions at level ${CORE_MAX_LEVEL}, expected 1`);
    const coreRow = coreRows[0];
    if (coreRow) {
      coreRow[coreTitles].forEach((titleKey, i) => {
        const title = tx(titleKey);
        const body = tx(coreRow[coreTexts][i]);
        if (title === undefined || body === undefined) return gap(`${who}: core entry ${titleKey} has no English text`);
        const kind = i === 0 ? "Core Passive" : "Additional Ability";
        if (!title.startsWith(kind)) gap(`${who}: core entry ${i} reads "${title}", filed as ${kind}`);
        const ctx = { where: `${who} ${titleKey}`, level: TEXT_SKILL_LEVEL };
        const entry = { kind, name: cleanText(title, ctx), text: cleanText(body, ctx), iconUrl: null };
        // The Core Passive's figures grow with the core level; say which one
        // the text quotes when they do.
        if (firstCore && tx(firstCore[coreTexts][i]) !== body) entry.level = CORE_MAX_LEVEL;
        core.push(entry);
      });
    }

    // Mindscapes 1-6.
    const mindscapes = (talentBy.get(id) ?? [])
      .sort((a, b) => a[talentLevel] - b[talentLevel])
      .map((r) => {
        const title = tx(r[talentTitleR]) ?? tx(r[talentTitle]);
        const body = tx(r[talentTextR]) ?? tx(r[talentText]);
        if (title === undefined || body === undefined) {
          gap(`${who}: Mindscape ${r[talentLevel]} has no English text`);
          return null;
        }
        const ctx = { where: `${who} M${r[talentLevel]}`, level: TEXT_SKILL_LEVEL };
        const entry = { kind: `M${r[talentLevel]}`, name: cleanText(title, ctx), text: cleanText(body, ctx), iconUrl: null };
        if (ctx.levelDependent) entry.level = TEXT_SKILL_LEVEL;
        return entry;
      })
      .filter(Boolean);
    if (mindscapes.length !== 6) gap(`${who}: ${mindscapes.length} Mindscapes`);

    // Materials. Every promotion; all five skills to 12 (each skill-level
    // row holds the cost of the step up from it); core A to F.
    const fiveSlots = new Set(SLOTS.map((s) => s.slot));
    const skillCostRows = (skillLvBy.get(id) ?? []).filter((r) => fiveSlots.has(r[skillLvSlot]));
    const otherCosts = (skillLvBy.get(id) ?? []).filter((r) => !fiveSlots.has(r[skillLvSlot]) && r[skillLvCost].length);
    if (otherCosts.length) gap(`${who}: skill slot(s) ${[...new Set(otherCosts.map((r) => r[skillLvSlot]))].join(", ")} carry costs but are not one of the five`);
    const materials = [
      { id: "ascension", items: totals((advanceBy.get(id) ?? []).map((r) => r[advanceCost])) },
      { id: "skills", items: totals(skillCostRows.map((r) => r[skillLvCost])) },
      { id: "core", items: totals((passiveBy.get(id) ?? []).map((r) => r[passiveCost])) },
    ];
    for (const g of materials) if (!g.items.length) gap(`${who}: no ${g.id} materials`);

    // Stats.
    const baseStats = agentBaseStats(agent, prop);
    const bonusStats = Object.entries(agent.core?.[agent.core.length - 1] ?? {})
      .filter(([, v]) => v)
      .map(([pid, v]) => ({ label: prop(Number(pid)).name, value: formatProperty(v, prop(Number(pid))) }));
    if (agent.core?.length !== CORE_MAX_LEVEL) gap(`${who}: agents.json has ${agent.core?.length ?? 0} core rows, expected ${CORE_MAX_LEVEL}`);

    // Picks.
    const p = picks.characters?.[idStr];
    const pickedWeapons = [];
    for (const w of p?.weapons ?? []) {
      const e = engine(String(w.id));
      if (!e) {
        gap(`${who}: picked W-Engine ${w.id} is not in weapons.json`);
        continue;
      }
      pickedWeapons.push({ id: e.id, name: e.name, iconUrl: e.iconUrl, rarity: e.rarity, refinement: w.refinement ?? null, stats: e.stats, passive: e.passive });
    }
    for (const t of p?.teams ?? []) for (const m of t.members ?? []) if (!agents[m]) gap(`${who}: team member ${m} is not in agents.json`);
    for (const s of p?.synergies ?? []) if (!agents[s]) gap(`${who}: synergy ${s} is not in agents.json`);

    guides[idStr] = {
      role: p?.role ?? null,
      weapons: pickedWeapons,
      teams: (p?.teams ?? []).map((t) => ({ name: t.name ?? null, members: (t.members ?? []).map(String) })),
      synergies: (p?.synergies ?? []).map(String),
      substatLine: p?.substatLine ?? null,
      endgameStats: (p?.endgameStats ?? []).map((s) => ({ label: s.label, value: s.value })),
      skillPriority: p?.skillPriority ?? null,
      tracePriority: null,
      source: p?.source ? { label: p.sourceLabel ?? "Prydwen", url: p.source, updated: p.sourceUpdated ?? null } : null,
      baseStats,
      bonusStats,
      kit: [
        { id: "skills", entries: skills },
        { id: "core", entries: core },
        { id: "mindscapes", entries: mindscapes },
      ],
      materials,
    };
    guides[idStr] = withKitTracking(guides[idStr], path.join(GUIDES, `${idStr}.json`));
  }

  assertClean(guides, setBonuses);

  // ── Material icons ──
  // None named means the icon field went unread (reported above); the files
  // already fetched stay for the next run rather than being pruned as unused.
  const haveIcons = materialIcons.size ? await fetchIcons(new Set(materialIcons.values())) : new Set();
  for (const g of Object.values(guides)) {
    for (const group of g.materials) {
      for (const item of group.items) {
        const icon = materialIcons.get(item.id);
        item.iconUrl = icon && haveIcons.has(icon) ? `${ICON_PATH}/${icon}.webp` : null;
      }
    }
  }

  // ── Write ──
  fs.mkdirSync(GUIDES, { recursive: true });
  // The directory is generated: stale <id>.json files from agents that left
  // agents.json are removed, and anything else in it stops the run rather
  // than being deleted.
  const keep = new Set(Object.keys(guides).map((id) => `${id}.json`));
  for (const f of fs.readdirSync(GUIDES)) {
    if (keep.has(f)) continue;
    if (!/^\d+\.json$/.test(f)) throw new Error(`${path.relative(ROOT, GUIDES)} holds ${f}, which this script did not write`);
    fs.unlinkSync(path.join(GUIDES, f));
    console.log(`  removed stale ${f}`);
  }
  let biggest = { id: null, size: 0 };
  let total = 0;
  for (const [id, g] of Object.entries(guides)) {
    const file = path.join(GUIDES, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(g) + "\n", "utf8");
    const size = fs.statSync(file).size;
    total += size;
    if (size > biggest.size) biggest = { id, size };
    if (size > 60 * 1024) gap(`${agents[id].name} (${id}): guide is ${(size / 1024).toFixed(1)} kB, over the 60 kB aim`);
  }
  fs.writeFileSync(path.join(DATA, "set-bonuses.json"), JSON.stringify(setBonuses) + "\n", "utf8");

  if (awakened.length) {
    const names = awakened.filter((id) => agents[id]).map((id) => agents[id].name);
    gap(`awakened (Potential) kit variants left out for ${names.length} agents: ${names.join(", ")}; the contract has no slot for them`);
  }
  const withPicks = Object.values(guides).filter((g) => g.source).length;
  console.log(`  guides/            ${String(Object.keys(guides).length).padStart(4)} agents  ${(total / 1024).toFixed(1)} kB total, largest ${agents[biggest.id].name} ${(biggest.size / 1024).toFixed(1)} kB, ${withPicks} with picks`);
  console.log(`  set-bonuses.json   ${String(Object.keys(setBonuses).length).padStart(4)} sets`);
  console.log(`  game data: ZenlessData ${meta.sha?.slice(0, 8) ?? "?"} ${meta.message ?? ""}`);
  if (gaps.length) {
    console.log(`  ⚠ ${gaps.length} gap(s):`);
    for (const g of [...new Set(gaps)]) console.log(`    - ${g}`);
  }
  console.log("done.");
}

// ── Stats (mirrors src/zzz/stats.ts) ────────────────────────────────
//
// These two follow computeZzzStats and engineStats in src/zzz/stats.ts
// step for step, so a guide's Lv60 figures agree with what the showcase
// computes for the same agent. That module imports JSON the way Vite does,
// which plain Node cannot load, hence the copy; change both together.

/**
 * Stats at level 60 after the last promotion, before core skill, W-Engine
 * or discs: base + growth x (level - 1) / 10000 + the last promotion row,
 * with HP, ATK and DEF floored as the game does. Shown in the agent
 * screen's order, labelled and formatted by the game's property table;
 * the resource stats (Energy, Adrenaline, Sharpness) only when the agent
 * has them.
 */
function agentBaseStats(agent, prop) {
  const base = new Map(Object.entries(agent.base ?? {}).map(([k, v]) => [Number(k), v]));
  for (const [k, g] of Object.entries(agent.growth ?? {})) base.set(Number(k), (base.get(Number(k)) ?? 0) + (g * (MAX_LEVEL - 1)) / 10000);
  const promo = agent.promotion ?? [];
  const row = promo[Math.min(Math.max(MAX_PROMOTION - 1, 0), promo.length - 1)] ?? {};
  for (const [k, v] of Object.entries(row)) {
    // Promotion rows only ever carry base stats (ids ending in 01); a
    // percentage there would belong in the bonus pool, which is empty here.
    if (Number(k) % 100 !== 1) throw new Error(`${agent.name}: promotion carries non-base stat ${k}`);
    base.set(Number(k), (base.get(Number(k)) ?? 0) + v);
  }
  const floored = new Set([11101, 12101, 13101]);
  const ORDER = [11101, 12101, 13101, 12201, 20101, 21101, 31401, 31201, 23101, 30501, 32001, 32401, 21301];
  const always = new Set([11101, 12101, 13101, 12201, 20101, 21101, 31401, 31201, 23101]);
  const out = [];
  for (const id of ORDER) {
    const raw = base.get(id) ?? 0;
    if (!always.has(id) && !raw) continue;
    const p = prop(id);
    out.push({ label: p.aggName, value: formatProperty(floored.has(id) ? Math.floor(raw) : raw, p) });
  }
  return out;
}

/** A W-Engine at level 60 and its last breakthrough, as engineStats computes it. */
function engineStats(w, curves) {
  const levelRate = curves.level[`${w.rarity}-${MAX_LEVEL}`] ?? 0;
  const star = curves.star[`${w.rarity}-${ENGINE_MAX_STAR}`] ?? { star: 0, rand: 0 };
  if (!levelRate || !star.star) gap(`W-Engine ${w.name}: no level ${MAX_LEVEL} / star ${ENGINE_MAX_STAR} curve for rarity ${w.rarity}`);
  return {
    main: w.mainStat ? { id: w.mainStat.PropertyId, value: Math.floor(w.mainStat.PropertyValue * (1 + levelRate / 10000 + star.star / 10000)) } : null,
    secondary: w.secondaryStat ? { id: w.secondaryStat.PropertyId, value: w.secondaryStat.PropertyValue * (1 + star.rand / 10000) } : null,
  };
}

/**
 * The five refinements' texts as one, with every figure that changes
 * written "a/b/c/d/e" in bold. `exact` is false when the texts also differ
 * in wording (one W-Engine says "and" at R1 and "/" from R2), in which case
 * the wording most refinements share is kept, provided every text has the
 * same figures in the same places. Null when even that does not hold.
 */
function mergeRefinements(texts) {
  const parts = texts.map((t) => t.split(/(\d+(?:\.\d+)?)/));
  const skeleton = (p) => p.filter((_, i) => i % 2 === 0).join("\u0000");
  const exact = parts.every((p) => skeleton(p) === skeleton(parts[0]));
  if (!exact && !parts.every((p) => p.length === parts[0].length)) return null;
  const votes = new Map();
  for (const p of parts) votes.set(skeleton(p), (votes.get(skeleton(p)) ?? 0) + 1);
  const best = [...parts].reverse().sort((a, b) => votes.get(skeleton(b)) - votes.get(skeleton(a)))[0];
  let out = "";
  const segs = [...best];
  for (let i = 0; i < segs.length; i++) {
    if (i % 2 === 0) {
      out += segs[i];
      continue;
    }
    const vals = parts.map((p) => p[i]);
    if (vals.every((v) => v === vals[0])) {
      out += vals[0];
      continue;
    }
    const merged = vals.join("/");
    const inBold = (out.match(/\*\*/g) ?? []).length % 2 === 1;
    if (inBold) out += merged;
    else if (segs[i + 1]?.startsWith("%")) {
      out += `**${merged}%**`;
      segs[i + 1] = segs[i + 1].slice(1);
    } else out += `**${merged}**`;
  }
  return { text: out, exact };
}

/**
 * The GuideText contract, enforced: no tag, no brace placeholder, no
 * unbalanced "**" anywhere in game-derived text, and no "**" at all in
 * names and labels. Picks (the guide site's own strings) are not game
 * text and are left alone. Every failure is listed before the run stops.
 */
function assertClean(guides, setBonuses) {
  const bad = [];
  const check = (where, s, isText) => {
    if (typeof s !== "string") return bad.push(`${where}: not a string`);
    if (/[<>]/.test(s)) bad.push(`${where}: tag or angle bracket left in "${s.slice(0, 120)}"`);
    if (/[{}]/.test(s)) bad.push(`${where}: placeholder left in "${s.slice(0, 120)}"`);
    if (/\n{3,}/.test(s)) bad.push(`${where}: three or more line breaks`);
    const stars = (s.match(/\*\*/g) ?? []).length;
    if (isText ? stars % 2 : stars) bad.push(`${where}: ${isText ? "unbalanced" : "stray"} "**" in "${s.slice(0, 120)}"`);
    if (isText && s.split("\n").some((line) => (line.match(/\*\*/g) ?? []).length % 2)) bad.push(`${where}: a "**" span crosses a line break`);
  };
  for (const [id, g] of Object.entries(guides)) {
    for (const w of g.weapons) {
      check(`${id} weapon ${w.id} name`, w.name, false);
      for (const s of w.stats) check(`${id} weapon ${w.id} stat`, s.label + s.value, false);
      if (w.passive) {
        check(`${id} weapon ${w.id} passive name`, w.passive.name, false);
        check(`${id} weapon ${w.id} passive`, w.passive.text, true);
      }
    }
    for (const s of [...g.baseStats, ...g.bonusStats]) check(`${id} stat ${s.label}`, s.label + s.value, false);
    for (const group of g.kit) for (const e of group.entries) {
      check(`${id} ${group.id} ${e.kind} name`, e.name, false);
      check(`${id} ${group.id} ${e.name}`, e.text, true);
      if (!e.text) bad.push(`${id} ${group.id} ${e.name}: empty text`);
      for (const r of e.scaling?.rows ?? []) {
        check(`${id} ${e.name} scaling label`, r.label, false);
        for (const v of r.values) check(`${id} ${e.name} ${r.label}`, v, false);
        if (r.values.length !== e.scaling.levels.length) bad.push(`${id} ${e.name} ${r.label}: ${r.values.length} values for ${e.scaling.levels.length} levels`);
      }
    }
    for (const group of g.materials) for (const m of group.items) check(`${id} material ${m.id}`, m.name, false);
  }
  for (const [id, s] of Object.entries(setBonuses)) {
    check(`set ${id} name`, s.name, false);
    for (const b of s.bonuses) check(`set ${id} ${b.pieces}pc`, b.text, true);
  }
  if (bad.length) {
    for (const b of bad.slice(0, 50)) console.error(`  ✗ ${b}`);
    throw new Error(`${bad.length} output string(s) break the GuideText rules; nothing was written`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
