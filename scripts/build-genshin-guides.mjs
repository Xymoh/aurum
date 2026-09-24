/**
 * build-genshin-guides.mjs
 * ──────────────────────────────────────────────────────────────────
 * One guide file per Genshin character, src/data/guides/<id>.json, and the
 * artifact set bonus text for every set, src/data/set-bonuses.json. Shapes
 * are GuideFile and SetBonusFile in src/lib/buildTarget/guide.ts.
 *
 * The Traveler gets one file per element and body ("10000005-cryo",
 * "10000007-cryo"; see genshin-traveler.mjs): each element has its own kit
 * and materials, and both bodies share that element's picks.
 *
 * Two inputs, kept apart as the contract asks:
 *
 *   Picks (role, weapons, teams, substat line, talent priority, the guide's
 *   own last-updated date) come from src/data/guide-picks.json, which
 *   fetch-genshin-sets.mjs reads from Game8, or genshin.gg where Game8 has
 *   no build page. Nothing here reads a guide site.
 *
 * Every guide also carries a fingerprint of its kit text; see guide-kit.mjs
 * for how a change to it is dated and flagged.
 *
 *   Game data (talents, constellations, materials, base stats, weapon
 *   passives, set bonuses) comes from Project Amber (gi.yatta.moe), the
 *   mirror fetch-enka-locale.js and build-weapon-ids.js already use. It
 *   tracks new releases within a day, and serves the talent tables with
 *   their labelled rows and format codes, which no other mirror does.
 *
 * Game text is flattened to GuideText: the game's colour spans become
 * "**", its links, italics and keyboard-layout variants keep only their
 * text, and every output is scanned before it is written. A tag or a
 * placeholder that survives fails the build instead of reaching the page.
 *
 * Icons point at Enka's UI CDN, which the site already loads character and
 * set art from, for talents, constellations and weapons. Material icons come
 * from Amber's own asset host instead: Enka stopped adding item icons around
 * Natlan, so every material from the last few regions 404s there, while
 * Amber serves all of them under the same file names. --check-icons sends
 * one HEAD request per distinct icon and reports any that no longer load.
 *
 * Amber is asked politely: four requests at a time with a short pause, and
 * every response cached under node_modules/.cache/aurum-guides for a day,
 * so a re-run after a tweak here costs no requests at all.
 *
 * Usage: node scripts/build-genshin-guides.mjs
 *        node scripts/build-genshin-guides.mjs --fresh   (ignore the cache)
 *        node scripts/build-genshin-guides.mjs --check-icons
 *        node scripts/build-genshin-guides.mjs --rebaseline (adopt current kits, see guide-kit.mjs)
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withKitTracking } from "./guide-kit.mjs";
import { TRAVELER_ELEMENTS, TRAVELER_IDS, parseTravelerId, travelerId, travelerName } from "./genshin-traveler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src", "data");
const GUIDES_DIR = path.join(DATA, "guides");
const SET_BONUSES = path.join(DATA, "set-bonuses.json");
const PICKS = path.join(DATA, "guide-picks.json");
const CHARACTERS = JSON.parse(fs.readFileSync(path.join(DATA, "characters.json"), "utf8"));
const SETS = JSON.parse(fs.readFileSync(path.join(DATA, "artifacts.json"), "utf8"));

const AMBER = "https://gi.yatta.moe/api/v2";
const ENKA_UI = "https://enka.network/ui";
const AMBER_UI = "https://gi.yatta.moe/assets/UI";
const CACHE_DIR = path.join(ROOT, "node_modules", ".cache", "aurum-guides");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FRESH = process.argv.includes("--fresh");
const CHECK_ICONS = process.argv.includes("--check-icons");
const CONCURRENCY = 4;
const DELAY_MS = 150;
const USER_AGENT = "Aurum/0.1 (+https://github.com/Xymoh/aurum) guide-builder";

/** Genshin's final ascension caps characters at 90; levels past it are a separate system. */
const CHARACTER_MAX_LEVEL = 90;
/** Talents are levelled with books to 10; constellations carry them further. */
const TALENT_MAX_LEVEL = 10;
const MORA = "202";

/** Base stats are the game's FIGHT_PROP_BASE_* names, which Amber's prop tables leave out. */
const BASE_STATS = [
  ["FIGHT_PROP_BASE_HP", "Base HP"],
  ["FIGHT_PROP_BASE_ATTACK", "Base ATK"],
  ["FIGHT_PROP_BASE_DEFENSE", "Base DEF"],
];
/** The one stat Genshin shows as a flat number; every other bonus is a percentage. */
const FLAT_PROPS = new Set(["FIGHT_PROP_ELEMENT_MASTERY", "FIGHT_PROP_BASE_ATTACK", "FIGHT_PROP_BASE_HP", "FIGHT_PROP_BASE_DEFENSE"]);

const problems = { missingAvatars: [], mismatchedIds: [], missingWeapons: new Set(), missingSets: [], unmergedPassives: [], unknownItems: new Set(), odd: [] };

// ── Fetching ──────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cached GET of an Amber path. A 404 is cached as null so it is not asked again. */
async function amber(apiPath) {
  const file = path.join(CACHE_DIR, apiPath.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "_") + ".json");
  if (!FRESH && fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < CACHE_TTL_MS) {
    const cached = JSON.parse(fs.readFileSync(file, "utf8"));
    return cached ? cached.data : null;
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${AMBER}${apiPath}`, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 404) {
        fs.writeFileSync(file, "null");
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const body = JSON.parse(text);
      fs.writeFileSync(file, text);
      await sleep(DELAY_MS);
      return body.data;
    } catch (err) {
      if (attempt < 3) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      // An expired copy beats no build at all when Amber is down.
      if (fs.existsSync(file)) {
        console.warn(`  ⚠ ${apiPath}: ${err.message}; using the cached copy from ${fs.statSync(file).mtime.toISOString()}`);
        const cached = JSON.parse(fs.readFileSync(file, "utf8"));
        return cached ? cached.data : null;
      }
      throw new Error(`${apiPath}: ${err.message}`);
    }
  }
}

/** Runs `fn` over `items`, at most CONCURRENCY at a time, keeping order. */
async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// ── Game text ─────────────────────────────────────────────────────

/**
 * Amber's text is the game's own markup: <color=#...> spans, <i> for flavour
 * lines, {LINK#id}...{/LINK} around glossary terms, one variant per input
 * device, and "\n" written as a backslash and an n. Colour becomes "**";
 * the rest keeps its text and loses its wrapper.
 */
function gameText(raw) {
  let s = String(raw ?? "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    // A leading "#" marks a string that carries placeholders; it is not text.
    .replace(/^#/, "")
    // The keyboard wording, which is also the one that reads right on a page.
    .replace(/(\{LAYOUT_[A-Z]+#[^}]*\})+/g, (run) => run.match(/\{LAYOUT_PC#([^}]*)\}/)?.[1] ?? run.match(/\{LAYOUT_[A-Z]+#([^}]*)\}/)[1])
    .replace(/\{LINK#[^}]*\}([\s\S]*?)\{\/LINK\}/g, "$1")
    // "resets at 4:00 AM {TIMEZONE}": the server's zone, which a page cannot know.
    .replace(/\s*\{TIMEZONE\}/g, "");

  // Colour spans can nest; only the outermost one turns into "**".
  let depth = 0;
  s = s.replace(/<color=[^>]*>|<\/color>/g, (tag) => {
    if (tag.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      return depth === 0 ? "\u0001" : "";
    }
    depth++;
    return depth === 1 ? "\u0001" : "";
  });
  // Every other tag (<i>, <b>, <u>) keeps its text.
  s = s.replace(/<\/?[a-zA-Z][^<>]*>/g, "");

  // A span that wraps a line break or edge whitespace is bolded line by line
  // with the whitespace outside, so "**" never opens on one line and closes
  // on the next. A full stop the game coloured along with a figure
  // ("increased by <color>120.</color>") belongs to the sentence, not the figure.
  s = s.replace(/\u0001([\s\S]*?)\u0001/g, (_, inner) =>
    inner
      .split("\n")
      .map((line) => {
        const m = line.match(/^(\s*)([\s\S]*?)([.,;]*)(\s*)$/);
        if (!m[2]) return line;
        return `${m[1]}**${m[2]}**${m[3]}${m[4]}`;
      })
      .join("\n"),
  );
  return s
    .replace(/\*\*\*\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Rounds half away from zero, with a nudge for float noise (0.0835 * 100). */
function round(value, digits) {
  const f = 10 ** digits;
  return (Math.sign(value) * Math.round(Math.abs(value) * f + 1e-7)) / f;
}

/** A number the way the game prints it: no trailing zeros ("20", not "20.0"). */
function trimmed(value, digits) {
  return String(round(value, digits));
}

/**
 * The talent table's format codes: F1P is a percentage to one decimal, P a
 * whole percentage, F2 two decimals, I an integer. The game drops trailing
 * zeros, so a 10 second cooldown reads "10s".
 */
function formatParam(value, code) {
  const percent = code.endsWith("P");
  const spec = percent ? code.slice(0, -1) : code;
  const digits = /^F\d$/.test(spec) ? Number(spec[1]) : 0;
  if (spec !== "" && spec !== "I" && !/^F\d$/.test(spec)) problems.odd.push(`unknown format code ${code}`);
  return percent ? `${trimmed(value * 100, digits)}%` : trimmed(value, digits);
}

/** "5-Hit DMG|{param5:F1P}+{param6:F1P}" at one level -> ["5-Hit DMG", "33.3%+35.2%"]. */
function scalingRow(template, params) {
  const bar = template.indexOf("|");
  const label = template.slice(0, bar);
  const value = template.slice(bar + 1).replace(/\{param(\d+):([A-Z0-9]+)\}/g, (_, n, code) => formatParam(params[Number(n) - 1] ?? 0, code));
  return [gameText(label), gameText(value)];
}

function scalingTable(promote) {
  const levels = Object.values(promote ?? {})
    .filter((p) => Array.isArray(p.description) && Array.isArray(p.params))
    .sort((a, b) => a.level - b.level);
  if (levels.length === 0) return null;
  const templates = levels[0].description.filter((t) => t && t.includes("|"));
  if (templates.length === 0) return null;
  const rows = templates.map((template) => ({ label: scalingRow(template, levels[0].params)[0], values: [] }));
  for (const level of levels) {
    templates.forEach((template, i) => {
      // A row whose wording changes between levels is keyed by its position.
      const row = level.description.filter((t) => t && t.includes("|"))[i] ?? template;
      rows[i].values.push(scalingRow(row, level.params)[1]);
    });
  }
  return { levels: levels.map((l) => l.level), rows };
}

// ── Stats ─────────────────────────────────────────────────────────

function statValue(prop, value) {
  return FLAT_PROPS.has(prop) ? String(Math.round(value)) : `${round(value * 100, 1).toFixed(1)}%`;
}

/**
 * initValue x curve[level] plus the ascension bonus, per prop. The phase is
 * the ascension that opens `level` (Genshin's Lv90 is reached after the
 * sixth); its addProps are totals for that phase, not increments.
 */
function statsAt(upgrade, curves, level) {
  const curve = curves[String(level)]?.curveInfos ?? {};
  const phase = [...(upgrade.promote ?? [])].sort((a, b) => a.promoteLevel - b.promoteLevel).find((p) => p.unlockMaxLevel >= level) ?? {};
  const out = {};
  for (const p of upgrade.prop ?? []) {
    if (!(p.type in curve)) problems.odd.push(`curve ${p.type} missing at level ${level}`);
    out[p.propType] = p.initValue * (curve[p.type] ?? 1) + (phase.addProps?.[p.propType] ?? 0);
  }
  for (const [prop, value] of Object.entries(phase.addProps ?? {})) if (!(prop in out)) out[prop] = value;
  return out;
}

// ── Materials ─────────────────────────────────────────────────────

/**
 * Amber keys cost items by id, which loses the game's order. The game lists
 * ascension as gem, boss drop, local specialty, common drop, and talents as
 * books, common drop, weekly boss drop, Crown; the id ranges say which is
 * which, and ids within a range rise with the tier.
 */
function itemRank(id, group) {
  const n = Number(id);
  if (id === MORA) return 0;
  const block = Math.floor(n / 1000);
  if (group === "ascension") {
    if (block === 104 && n % 1000 < 300) return 1; // gems
    if (block === 113) return 2; // boss drops
    if (block === 100 || block === 101) return 3; // local specialties
    if (block === 112) return 4; // common drops
  } else {
    if (n === 104319) return 4; // Crown of Insight
    if (block === 104 && n % 1000 >= 300) return 1; // books
    if (block === 112) return 2; // common drops
    if (block === 113) return 3; // weekly boss drops
  }
  return 9;
}

function materialGroup(id, costs, items) {
  const totals = new Map();
  for (const { costItems, coinCost } of costs) {
    if (coinCost) totals.set(MORA, (totals.get(MORA) ?? 0) + coinCost);
    for (const [item, count] of Object.entries(costItems ?? {})) totals.set(item, (totals.get(item) ?? 0) + count);
  }
  const list = [...totals]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => itemRank(a, id) - itemRank(b, id) || Number(a) - Number(b))
    .map(([item, count]) => {
      const info = items?.[item];
      if (!info) problems.unknownItems.add(item);
      if (itemRank(item, id) === 9) problems.odd.push(`item ${item} (${info?.name}) has no known place in ${id}`);
      return { id: item, name: info?.name ?? item, iconUrl: info?.icon ? `${AMBER_UI}/${info.icon}.png` : null, rarity: info?.rank ?? 1, count };
    });
  return list.length ? { id, items: list } : null;
}

// ── Kit ───────────────────────────────────────────────────────────

const icon = (name) => (name ? `${ENKA_UI}/${name}.png` : null);

/**
 * Passives have no label in the game's data, only an order and a skill id:
 * the first two unlock at Ascension 1 and 4. The rest are always on; the
 * ones that only touch exploration, crafting or expeditions are what
 * players call utility passives, and they read that way. Anything that
 * names a fight stays a plain "Passive" rather than risk hiding a combat
 * effect under "Utility".
 */
const UTILITY = /expedition|\bcraft|cook|dish|food|mini-?map|stamina consumption|gliding|swimming|climbing|\bsprint|underwater|movement spd|swift stride|phlogiston|nightsoul transmission|talent material|ascension material|mora expended|daily commission|cosmetic|startle|local specialt|resources unique|not in combat|out of combat|harvestable|seasoning|revive|\bfish|\bwood\b|zoom lens|xenochromatic/i;
const FAMILY = /^(Night Realm's Gift|Moonsign Benediction|Witch's Eve Rite)/;

function passiveKind(index, talent, text) {
  if (index === 0) return "Ascension 1";
  if (index === 1) return "Ascension 4";
  if (FAMILY.test(talent.name)) return "Passive";
  return UTILITY.test(text) ? "Utility" : "Passive";
}

function buildKit(avatar) {
  const talents = Object.entries(avatar.talent ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, t]) => t)
    // Placeholders the game keeps in the table with no name or text.
    .filter((t) => t.name && t.description);

  const active = talents.filter((t) => t.type === 0 || t.type === 1);
  const normals = active.filter((t) => t.type === 0);
  const skills = [];
  for (const t of active) {
    const text = gameText(t.description);
    let kind;
    if (t.type === 1) kind = "Elemental Burst";
    else if (t === normals[0]) kind = "Normal Attack";
    else if (t === normals[1]) kind = "Elemental Skill";
    else {
      // Alternate sprints (Ayaka, Mona) carry a table; Natlan's exploration
      // jumps carry none and are not part of a fight.
      const table = scalingTable(t.promote);
      if (!table) continue;
      kind = text.match(/^\*\*([^*\n]+)\*\*\n/)?.[1] ?? "Special";
    }
    skills.push({ kind, name: gameText(t.name), text, iconUrl: icon(t.icon), scaling: scalingTable(t.promote) });
  }

  const passiveTalents = talents.filter((t) => t.type === 2);
  const base = passiveTalents.length ? Math.floor(passiveTalents[0].skillId / 10) : 0;
  passiveTalents.slice(0, 2).forEach((t, i) => {
    if (t.skillId !== base * 10 + i + 1) problems.odd.push(`${avatar.name}: passive "${t.name}" is not where Ascension ${i ? 4 : 1} usually sits`);
  });
  const passives = passiveTalents.map((t, i) => {
    const text = gameText(t.description);
    return { kind: passiveKind(i, t, text), name: gameText(t.name), text, iconUrl: icon(t.icon) };
  });

  const constellations = Object.entries(avatar.constellation ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, c], i) => ({ kind: `C${i + 1}`, name: gameText(c.name), text: gameText(c.description), iconUrl: icon(c.icon) }));

  return {
    kit: [
      { id: "skills", entries: skills },
      { id: "passives", entries: passives },
      { id: "constellations", entries: constellations },
    ].filter((g) => g.entries.length),
    combat: [normals[0], normals[1], active.find((t) => t.type === 1)].filter(Boolean),
  };
}

// ── Weapons ───────────────────────────────────────────────────────

const TOKEN = /\d+(?:\.\d+)?|\*\*|[A-Za-z'’]+|\s+|[\s\S]/g;
const isNumber = (t) => t != null && /^\d/.test(t);
const sameToken = (a, b) => a === b || (isNumber(a) && isNumber(b));

/**
 * Longest-common-subsequence alignment of two token lists, numbers counting
 * as equal to each other. Returns base index -> other index for the tokens
 * that line up.
 */
function align(base, other) {
  const n = base.length;
  const m = other.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = sameToken(base[i], other[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const map = new Map();
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (sameToken(base[i], other[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) map.set(i++, j++);
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return map;
}

/**
 * One passive text for all five refinements, every figure that moves
 * written "20/25/30/35/40%". The game's own wording is not always identical
 * across refinements ("gain" at R1, "earn" at R2; "22s" highlighted whole at
 * R3 but "22" alone at R1), so the texts are aligned token by token and the
 * most common wording is kept, with each refinement's figures read off its
 * aligned position.
 *
 * A merged figure outside a highlighted span is highlighted, so the reader
 * can always see which numbers move. A span that is already a slash list
 * (Mistsplitter's "8/16/28%") cannot take a second level of slashes; its
 * refinements are separated by " | " instead.
 */
function mergeRefinements(texts, label) {
  if (texts.length <= 1 || texts.every((t) => t === texts[0])) return texts[0] ?? "";
  const skeleton = (t) => t.replace(/\d+(?:\.\d+)?/g, "#");
  const counts = new Map();
  for (const t of texts) counts.set(skeleton(t), (counts.get(skeleton(t)) ?? 0) + 1);
  const common = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  const base = texts.find((t) => skeleton(t) === common);

  const baseTokens = base.match(TOKEN);
  const tokens = texts.map((t) => t.match(TOKEN));
  const maps = tokens.map((t) => align(baseTokens, t));
  /** Each refinement's figure at base position k, or null when it did not line up. */
  const figures = (k) => tokens.map((t, r) => (maps[r].has(k) && isNumber(t[maps[r].get(k)]) ? t[maps[r].get(k)] : null));

  let lost = false;
  const out = [];
  let bold = false;
  for (let k = 0; k < baseTokens.length; k++) {
    const token = baseTokens[k];
    if (token === "**") {
      bold = !bold;
      if (!bold) {
        out.push(token);
        continue;
      }
      // A highlighted span: find its end and decide how to merge it.
      const end = baseTokens.indexOf("**", k + 1);
      const span = baseTokens.slice(k + 1, end);
      const moving = span
        .map((t, i) => (isNumber(t) ? figures(k + 1 + i) : null))
        .filter((f) => f && !f.every((v) => v === f[0]));
      if (moving.length >= 2 && span.includes("/")) {
        const perRefinement = texts.map((_, r) =>
          span.map((t, i) => (isNumber(t) ? (figures(k + 1 + i)[r] ?? t) : t)).join(""),
        );
        out.push("**", perRefinement.join(" | "), "**");
        k = end;
        bold = false;
      } else out.push(token);
      continue;
    }
    if (!isNumber(token)) {
      out.push(token);
      continue;
    }
    const values = figures(k);
    if (values.some((v) => v == null)) {
      lost = true;
      out.push(token);
    } else if (values.every((v) => v === values[0])) out.push(token);
    else if (bold) out.push(values.join("/"));
    else {
      const unit = baseTokens[k + 1] === "%" ? "%" : "";
      if (unit) k++;
      out.push(`**${values.join("/")}${unit}**`);
    }
  }
  if (lost) problems.unmergedPassives.push(label);
  return out.join("").replace(/\*\*\*\*/g, "");
}

function buildWeapon(id, weapon, curves, propNames) {
  const promotes = [...(weapon.upgrade?.promote ?? [])].sort((a, b) => a.promoteLevel - b.promoteLevel);
  const maxLevel = promotes.at(-1)?.unlockMaxLevel ?? 90;
  const at = statsAt(weapon.upgrade ?? {}, curves, maxLevel);
  const stats = [];
  if (at.FIGHT_PROP_BASE_ATTACK != null) stats.push({ label: "Base ATK", value: statValue("FIGHT_PROP_BASE_ATTACK", at.FIGHT_PROP_BASE_ATTACK) });
  const sub = weapon.specialProp;
  if (sub && sub !== "NONE" && at[sub] != null) stats.push({ label: propNames[sub] ?? sub, value: statValue(sub, at[sub]) });

  const affix = Object.values(weapon.affix ?? {})[0];
  let passive = null;
  if (affix) {
    const texts = Object.entries(affix.upgrade ?? {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, t]) => gameText(t));
    passive = { name: gameText(affix.name), text: mergeRefinements(texts, weapon.name) };
  }
  if (Object.keys(weapon.affix ?? {}).length > 1) problems.odd.push(`${weapon.name} has more than one passive; only the first is kept`);

  return {
    id,
    name: gameText(weapon.name),
    iconUrl: icon(weapon.icon),
    rarity: weapon.rank,
    refinement: null,
    stats,
    passive,
  };
}

// ── Checks ────────────────────────────────────────────────────────

/**
 * Every string in every output, checked for anything the page would print
 * as a typo: a tag, a placeholder, a literal "\n", an unclosed "**".
 */
function assertClean(label, value, where = "") {
  const failures = [];
  const walk = (v, at) => {
    if (typeof v === "string") {
      if (/<\/?[a-zA-Z][^<>]*>/.test(v)) failures.push(`${at}: tag in "${v.slice(0, 80)}"`);
      if (/[{}]/.test(v)) failures.push(`${at}: placeholder in "${v.slice(0, 80)}"`);
      if (v.includes("\\n")) failures.push(`${at}: literal \\n in "${v.slice(0, 80)}"`);
      if ((v.match(/\*\*/g)?.length ?? 0) % 2) failures.push(`${at}: unbalanced ** in "${v.slice(0, 80)}"`);
      if (/\n{3,}/.test(v)) failures.push(`${at}: 3+ newlines`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
  };
  walk(value, where);
  if (failures.length) {
    console.error(`\n  ✘ ${label}: game text did not flatten cleanly`);
    for (const f of failures.slice(0, 20)) console.error(`    ${f}`);
    throw new Error(`${failures.length} unclean strings in ${label}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────

/**
 * Every guide file to write: one per character in characters.json, with
 * the Traveler as one per element and body instead of one per body.
 */
function guideIds() {
  return Object.keys(CHARACTERS).flatMap((id) =>
    TRAVELER_IDS.includes(id) ? TRAVELER_ELEMENTS.map((element) => travelerId(element, id)) : [id],
  );
}

/** The name a guide id goes by in this script's reports. */
function nameOf(id) {
  const traveler = parseTravelerId(id);
  return traveler ? travelerName(traveler.element) : CHARACTERS[id].name;
}

/**
 * The Amber entry for a guide id. The Traveler's ids are Amber's own.
 *
 * characters.json is the site's identity table, and the picks are keyed by
 * its names. Where it disagrees with the game about who an id is (it has
 * held pre-release guesses for new characters), the kit is taken from the
 * Amber entry with the same name, so a page never pairs one character's
 * picks with another's talents. The disagreement is reported; the fix
 * belongs in characters.json.
 */
function amberKey(id, index, mismatches) {
  if (parseTravelerId(id)) return index.items[id] ? id : null;
  const entry = index.items[id];
  if (!entry || entry.name === CHARACTERS[id].name) return entry ? id : null;
  const byName = Object.keys(index.items).find((k) => index.items[k].name === CHARACTERS[id].name);
  mismatches.push(`${id} is ${entry.name} in the game data but ${CHARACTERS[id].name} in characters.json${byName ? ` (kit taken from Amber ${byName})` : ""}`);
  return byName ?? id;
}

/**
 * The picks for a guide id. Both Travelers read their element's picks,
 * which are keyed on Aether; a Lumine page names Lumine wherever its teams
 * name a Traveler, so the page's own slot is marked as hers.
 */
function picksFor(id, picks) {
  const traveler = parseTravelerId(id);
  if (!traveler) return picks[id];
  const pick = picks[travelerId(traveler.element)];
  if (!pick || traveler.body === TRAVELER_IDS[0]) return pick;
  const own = (member) => {
    const other = parseTravelerId(member);
    return other ? travelerId(other.element, traveler.body) : member;
  };
  return {
    ...pick,
    teams: pick.teams.map((t) => ({
      ...t,
      members: t.members.map(own),
      ...(t.alternates ? { alternates: t.alternates.map((ids) => ids.map(own)) } : {}),
    })),
  };
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const picksFile = fs.existsSync(PICKS) ? JSON.parse(fs.readFileSync(PICKS, "utf8")) : null;
  if (!picksFile) console.warn("  ⚠ no guide-picks.json; guides will carry game data only (run fetch-genshin-sets.mjs first)");
  const picks = picksFile?.characters ?? {};

  console.log("Loading Project Amber indexes and curves…");
  const [avatarIndex, weaponIndex, avatarCurves, weaponCurves] = await Promise.all([
    amber("/en/avatar"),
    amber("/en/weapon"),
    amber("/static/avatarCurve"),
    amber("/static/weaponCurve"),
  ]);
  // The game's own stat names ("CRIT DMG", "Energy Recharge", "Pyro DMG Bonus").
  const propNames = { ...weaponIndex.props, ...avatarIndex.props };

  const ids = guideIds();
  console.log(`Reading ${ids.length} characters…`);
  const keys = ids.map((id) => amberKey(id, avatarIndex, problems.mismatchedIds));
  const avatars = await pool(keys, async (key) => (key ? amber(`/en/avatar/${key}`) : null));

  const weaponIds = [...new Set(Object.values(picks).flatMap((p) => p.weapons.map((w) => String(w.id))))];
  console.log(`Reading ${weaponIds.length} recommended weapons…`);
  const weapons = new Map((await pool(weaponIds, async (wid) => [wid, await amber(`/en/weapon/${wid}`)])).filter(([, w]) => w));
  for (const wid of weaponIds) if (!weapons.has(wid)) problems.missingWeapons.add(wid);
  // Built once each: a weapon several characters recommend reads the same on every page.
  const built = new Map([...weapons].map(([wid, w]) => [wid, buildWeapon(wid, w, weaponCurves, propNames)]));

  const setIds = Object.keys(SETS);
  console.log(`Reading ${setIds.length} artifact sets…`);
  const reliquaries = await pool(setIds, (sid) => amber(`/en/reliquary/${sid}`));

  // Guides, all built and checked before any is written, so a failed check
  // leaves the previous files in place rather than half a roster.
  const guides = new Map();
  for (const [i, id] of ids.entries()) {
    const avatar = avatars[i];
    if (!avatar) {
      problems.missingAvatars.push(`${id} ${nameOf(id)}`);
      continue;
    }
    const pick = picksFor(id, picks);
    const { kit, combat } = buildKit(avatar);

    const promotes = [...(avatar.upgrade?.promote ?? [])].sort((a, b) => a.promoteLevel - b.promoteLevel);
    const at = statsAt(avatar.upgrade ?? {}, avatarCurves, CHARACTER_MAX_LEVEL);
    const baseStats = BASE_STATS.filter(([prop]) => at[prop] != null).map(([prop, label]) => ({ label, value: statValue(prop, at[prop]) }));
    const special = avatar.specialProp;
    const bonusStats = special && at[special] != null ? [{ label: propNames[special] ?? special, value: statValue(special, at[special]) }] : [];

    const talentCosts = combat.flatMap((t) =>
      Object.values(t.promote ?? {}).filter((p) => p.level >= 2 && p.level <= TALENT_MAX_LEVEL),
    );
    const materials = [materialGroup("ascension", promotes, avatar.items), materialGroup("talents", talentCosts, avatar.items)].filter(Boolean);

    const guide = {
      role: pick?.role ?? null,
      weapons: (pick?.weapons ?? [])
        .filter((w) => built.has(String(w.id)))
        .map((w) => ({ ...built.get(String(w.id)), refinement: w.refinement ?? null })),
      teams: pick?.teams ?? [],
      synergies: pick?.synergies ?? [],
      substatLine: pick?.substatLine ?? null,
      endgameStats: pick?.endgameStats ?? [],
      skillPriority: pick?.skillPriority ?? null,
      tracePriority: pick?.tracePriority ?? null,
      source: pick?.source ? { label: pick.sourceLabel ?? "genshin.gg", url: pick.source, updated: pick.sourceUpdated ?? null } : null,
      baseStats,
      bonusStats,
      kit,
      materials,
    };
    assertClean(`guides/${id}.json`, guide);
    guides.set(id, withKitTracking(guide, path.join(GUIDES_DIR, `${id}.json`)));
  }

  // Set bonuses. Two bonuses are the 2- and 4-piece; the Prayers sets have one, at 1 piece.
  const bonuses = {};
  for (const [i, sid] of setIds.entries()) {
    const set = reliquaries[i];
    if (!set) {
      problems.missingSets.push(`${sid} ${SETS[sid].name}`);
      continue;
    }
    const texts = Object.entries(set.affixList ?? {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, t]) => gameText(t));
    const pieces = texts.length === 1 ? [1] : texts.length === 2 ? [2, 4] : null;
    if (!pieces) {
      problems.odd.push(`set ${sid} ${set.name} has ${texts.length} bonuses`);
      continue;
    }
    if (set.name !== SETS[sid].name) problems.odd.push(`set ${sid}: Amber calls it "${set.name}", artifacts.json "${SETS[sid].name}"`);
    bonuses[sid] = { name: gameText(set.name), bonuses: texts.map((text, j) => ({ pieces: pieces[j], text })) };
  }
  assertClean("set-bonuses.json", bonuses);

  fs.mkdirSync(GUIDES_DIR, { recursive: true });
  const written = new Set();
  let largest = { id: null, bytes: 0 };
  for (const [id, guide] of guides) {
    const json = JSON.stringify(guide) + "\n";
    fs.writeFileSync(path.join(GUIDES_DIR, `${id}.json`), json);
    written.add(`${id}.json`);
    if (json.length > largest.bytes) largest = { id, bytes: json.length };
  }
  // The directory is generated: a character that left characters.json takes its file with it.
  const stale = fs.readdirSync(GUIDES_DIR).filter((f) => !written.has(f));
  for (const f of stale) fs.rmSync(path.join(GUIDES_DIR, f));
  fs.writeFileSync(SET_BONUSES, JSON.stringify(bonuses) + "\n");

  const withPicks = ids.filter((id) => written.has(`${id}.json`) && picksFor(id, picks)).length;
  console.log(`\n  ✔ wrote ${written.size} guides to ${path.relative(ROOT, GUIDES_DIR)} (${withPicks} with guide picks; largest ${largest.id}, ${(largest.bytes / 1024).toFixed(1)} KB)`);
  if (stale.length) console.log(`  ✔ removed ${stale.length} stale file(s): ${stale.join(", ")}`);
  console.log(`  ✔ wrote ${Object.keys(bonuses).length} of ${setIds.length} sets to ${path.relative(ROOT, SET_BONUSES)}`);
  const noPicks = [...new Set(ids.filter((id) => written.has(`${id}.json`) && !picksFor(id, picks)).map(nameOf))];
  if (noPicks.length) console.log(`  ⚠ guides with no picks: ${noPicks.join(", ")}`);
  for (const line of problems.mismatchedIds) console.log(`  ⚠ ${line}`);
  if (problems.missingAvatars.length) console.log(`  ⚠ characters Project Amber does not know: ${problems.missingAvatars.join(", ")}`);
  if (problems.missingWeapons.size) console.log(`  ⚠ picked weapons Project Amber does not know: ${[...problems.missingWeapons].join(", ")}`);
  if (problems.missingSets.length) console.log(`  ⚠ sets Project Amber does not know: ${problems.missingSets.join(", ")}`);
  if (problems.unmergedPassives.length) console.log(`  ⚠ weapon passives with a figure that did not line up across refinements (one refinement's value kept): ${problems.unmergedPassives.join(", ")}`);
  if (problems.unknownItems.size) console.log(`  ⚠ cost items with no name: ${[...problems.unknownItems].join(", ")}`);
  for (const line of new Set(problems.odd)) console.log(`  ⚠ ${line}`);

  if (CHECK_ICONS) await checkIcons([...guides.values()]);
}

/** One HEAD per distinct icon URL, reporting any that do not come back as an image. */
async function checkIcons(guides) {
  const urls = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) k === "iconUrl" ? x && urls.add(x) : walk(x);
  };
  walk(guides);
  console.log(`\nChecking ${urls.size} icons…`);
  const broken = (
    await pool([...urls], async (url) => {
      const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } }).catch(() => null);
      await sleep(50);
      return res?.ok && res.headers.get("content-type")?.startsWith("image/") ? null : `${res?.status ?? "no answer"} ${url}`;
    })
  ).filter(Boolean);
  if (broken.length) console.log(`  ⚠ ${broken.length} icons do not load:\n    ${broken.join("\n    ")}`);
  else console.log(`  ✔ all ${urls.size} icons load`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
