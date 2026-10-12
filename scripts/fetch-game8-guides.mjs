/**
 * fetch-game8-guides.mjs
 * ──────────────────────────────────────────────────────────────────
 * Game8's character build pages for Star Rail and Zenless, read into the
 * source cache (.sources/<game>/game8.json, see sources.mjs) for the
 * consensus step to weigh against the other guides.
 *
 * Game8 serves plain HTML to a plain fetch, so no browser is needed; pages
 * are read one at a time, DELAY_MS apart, with the same User-Agent as
 * fetch-genshin-sets.mjs. robots.txt only shuts out named AI crawlers and
 * a few search paths, none of which this touches.
 *
 * Every page follows one outline, the same one Genshin's do:
 *
 *   <Name>'s Best Builds          a build table per build (the first is read):
 *                                 weapon + alternatives, sets, main stats,
 *                                 substats; a "Stat | Recommended Value" table
 *   <Name>'s Best Teams           a table per team under an h3; an
 *                                 "Alternative | Explanation" table of partners
 *   Best Relics and Ornaments /   ranked set rows, best first
 *   Best Drive Discs
 *   Trace / Skill Priority        a star rating per skill (Star Rail adds a
 *                                 second table for the bonus abilities)
 *
 * Only facts are kept: names mapped to ids, ranks as order, stat keys and
 * short figures. The star ratings only decide the order (equal stars are one
 * tier); the ratings themselves, Game8's prose and its explanations are not
 * stored. Names that do not match an id are dropped and reported, never
 * guessed.
 *
 * Usage: node scripts/fetch-game8-guides.mjs [hsr|zzz] [--only=id,id]
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  DELAY_MS,
  ROOT,
  decode,
  game8IndexLinks,
  game8TitleName,
  getPage,
  h2Sections,
  headingsBefore,
  inlineText,
  labelledCells,
  normalise,
  roleFrom,
  stripNoise,
  tableRows,
  tablesIn,
  teamLabel,
  textLines,
} from "./fetch-genshin-sets.mjs";
import { endgameFigure } from "./guide-figures.mjs";
import { emptyEntry, writeSource } from "./sources.mjs";

const GAME8 = "https://game8.co";
const MAX_RANKS = 3;
const MAX_TEAMS = 4;

const ONLY = new Set((process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").map((s) => s.trim()).filter(Boolean));
const WANTED_GAMES = process.argv.filter((a) => a === "hsr" || a === "zzz");

const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), "utf8"));

// ── Stats ───────────────────────────────────────────────────────────

/**
 * Game8's stat wording -> Star Rail scorer keys. A bare "ATK", "HP" or "DEF"
 * is the percentage: main stats past head and hands only roll percentages,
 * and the substat lines write "Flat ATK" where they mean the flat one.
 */
const HSR_STATS = [
  [/^crit$/, ["CriticalChanceBase", "CriticalDamageBase"]],
  [/^(crit (rate|chance)|cr)$/, ["CriticalChanceBase"]],
  [/^(crit (dmg|damage)|cd)$/, ["CriticalDamageBase"]],
  [/^(flat atk|atk flat)$/, ["AttackDelta"]],
  [/^(atk|attack)$/, ["AttackAddedRatio"]],
  [/^(flat hp|hp flat)$/, ["HPDelta"]],
  [/^hp$/, ["HPAddedRatio"]],
  [/^(flat def|def flat)$/, ["DefenceDelta"]],
  [/^(def|defense|defence)$/, ["DefenceAddedRatio"]],
  [/^(spd|speed)$/, ["SpeedDelta"]],
  [/^(break effect|be)$/, ["BreakDamageAddedRatioBase"]],
  [/^(effect hit( rate)?|ehr)$/, ["StatusProbabilityBase"]],
  [/^(effect res|effect resistance|res)$/, ["StatusResistanceBase"]],
  [/^(energy regen(eration)?( rate)?|err)$/, ["SPRatioBase"]],
  [/^(outgoing )?heal(ing)?( boost)?$/, ["HealRatioBase"]],
  [/^(physical|phys) (dmg|damage)( boost| bonus)?$/, ["PhysicalAddedRatio"]],
  [/^fire (dmg|damage)( boost| bonus)?$/, ["FireAddedRatio"]],
  [/^ice (dmg|damage)( boost| bonus)?$/, ["IceAddedRatio"]],
  [/^lightning (dmg|damage)( boost| bonus)?$/, ["ThunderAddedRatio"]],
  [/^wind (dmg|damage)( boost| bonus)?$/, ["WindAddedRatio"]],
  [/^quantum (dmg|damage)( boost| bonus)?$/, ["QuantumAddedRatio"]],
  [/^imaginary (dmg|damage)( boost| bonus)?$/, ["ImaginaryAddedRatio"]],
];

/**
 * Zenless wording -> property ids (the ids fetch-zzz-weights.mjs uses), as
 * strings. Disc 4-6 main stats only roll percentages, so a bare "ATK" there
 * is ATK%; the substat lines are read the same way, "Flat ATK" being flat.
 * shortcut: a substat line that writes bare "ATK" for flat ATK reads as ATK%;
 * no page seen so far does.
 */
const ZZZ_STATS = [
  [/^crit$/, ["20103", "21103"]],
  [/^(crit rate|cr)$/, ["20103"]],
  [/^(crit (dmg|damage)|cd)$/, ["21103"]],
  [/^pen ratio$/, ["23103"]],
  [/^(pen|penetration|flat pen)$/, ["23203"]],
  [/^(energy regen(eration)?|er)$/, ["30502"]],
  [/^impact$/, ["12202"]],
  [/^(anomaly proficiency|ap)$/, ["31203"]],
  [/^(anomaly mastery|am)$/, ["31402"]],
  [/^(flat atk|atk flat)$/, ["12103"]],
  [/^(atk|attack)$/, ["12102"]],
  [/^(flat hp|hp flat)$/, ["11103"]],
  [/^hp$/, ["11102"]],
  [/^(flat def|def flat)$/, ["13103"]],
  [/^(def|defense|defence)$/, ["13102"]],
  [/^physical (dmg|damage)( bonus)?$/, ["31503"]],
  [/^fire (dmg|damage)( bonus)?$/, ["31603"]],
  [/^ice (dmg|damage)( bonus)?$/, ["31703"]],
  [/^(electric|elec) (dmg|damage)( bonus)?$/, ["31803"]],
  [/^ether (dmg|damage)( bonus)?$/, ["31903"]],
  [/^wind (dmg|damage)( bonus)?$/, ["32303"]],
];

/** One stat as written ("ATK%", "Effect RES%", "Ice DMG") -> keys, or null. */
export function statKeys(game, label) {
  const s = label.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[%.]/g, " ").replace(/\s+/g, " ").trim();
  for (const [re, keys] of game === "hsr" ? HSR_STATS : ZZZ_STATS) if (re.test(s)) return keys;
  return null;
}

/** "HP% or DEF%", "CRIT Rate / CRIT DMG" -> keys in the order written; unknown parts reported. */
function statList(game, text, unknown) {
  const keys = [];
  for (const part of text.split(/\s*(?:>=|≥|>|=|\/|,|\bor\b)\s*/i).map((p) => p.trim()).filter(Boolean)) {
    const found = statKeys(game, part);
    if (!found) unknown.add(part);
    else for (const k of found) if (!keys.includes(k)) keys.push(k);
  }
  return keys;
}

/**
 * A substat line as tiers, best first. Star Rail rates each stat in stars
 * ("Break Effect ★★★" / "ATK% ★★★" / "SPD ★★"), where equal stars are one
 * tier; elsewhere the line is an order ("CRIT DMG, CRIT Rate, ATK%", or
 * "A = B > C"), where "=" and "/" join a tier.
 */
export function substatTiers(game, lines, unknown) {
  if (lines.some((l) => l.includes("★"))) {
    const rated = lines.map((l) => ({ label: l.replace(/[★☆]/g, "").trim(), stars: (l.match(/★/g) ?? []).length })).filter((r) => r.label);
    const counts = [...new Set(rated.map((r) => r.stars))].sort((a, b) => b - a);
    const tiers = counts.map((n) => rated.filter((r) => r.stars === n).flatMap((r) => statList(game, r.label, unknown)));
    return tiers.filter((t) => t.length);
  }
  const tiers = lines
    .join(", ")
    .split(/\s*(?:>=|≥|>|,)\s*/)
    .map((tier) => statList(game, tier, unknown))
    .filter((t) => t.length);
  return tiers.length ? tiers : null;
}

/** Star Rail's slot words -> scorer slots; Zenless numbers its discs. */
const HSR_SLOTS = { body: "BODY", feet: "FOOT", boots: "FOOT", sphere: "NECK", "planar sphere": "NECK", rope: "OBJECT", "link rope": "OBJECT" };

export function mainStatsFrom(game, lines, unknown) {
  const out = {};
  for (const line of lines) {
    const m = line.match(/^(?:disc\s*)?([a-z ]+?|[456])\s*:\s*(.+)$/i);
    const slot = m && (game === "hsr" ? HSR_SLOTS[m[1].toLowerCase()] : /^[456]$/.test(m[1]) ? m[1] : null);
    if (!slot || out[slot]) continue;
    const keys = statList(game, m[2], unknown);
    if (keys.length) out[slot] = keys;
  }
  return Object.keys(out).length ? out : null;
}

// ── Page reading (pure) ─────────────────────────────────────────────

/**
 * The item links in some HTML, each with the text up to the next link,
 * where a piece count or refinement sits ("x2", "(4-pc)", "(S5)").
 * fetch-genshin-sets' linksIn stops that text at a <br>, and Game8's disc
 * rows put the count after one.
 */
export function itemsIn(html) {
  const found = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter((m) => /\ba-link\b/.test(m[1]) && !/href=['"]?#/.test(m[1]) && inlineText(m[2]));
  return found.map((m, i) => ({
    name: inlineText(m[2]),
    url: m[1].match(/href=['"]?([^'"\s>]+)/)?.[1] ?? null,
    after: inlineText(html.slice(m.index + m[0].length, found[i + 1]?.index ?? html.length).replace(/<hr\b[\s\S]*$/, "")),
  }));
}

const piecesOf = (after) => Number(after.match(/x\s*([24])\b|\b([24])\s*-?\s*p(?:c|iece)/i)?.slice(1).find(Boolean)) || null;
const refinementOf = (after) => Number(after.match(/\(\s*[SR]\s*([1-5])\s*\)/i)?.[1]) || null;

/** The stars a cell gives (★, not the empty ☆). */
const starsIn = (html) => (inlineText(html).match(/★/g) ?? []).length;

/** "Name > Name = Name" from rows of name | ★★★, best first, row order kept between equals. */
function starOrder(table) {
  const rated = tableRows(table.html)
    .filter((r) => r.length >= 2 && starsIn(r[1].html))
    .map((r) => ({ name: inlineText(r[0].html), stars: starsIn(r[1].html) }))
    .filter((r) => r.name);
  if (!rated.length) return null;
  const counts = [...new Set(rated.map((r) => r.stars))].sort((a, b) => b - a);
  return counts.map((n) => rated.filter((r) => r.stars === n).map((r) => r.name).join(" = ")).join(" > ");
}

/** Section by its title, ignoring the character's name in front. */
const sectionOf = (sections, re) => sections.find((s) => re.test(s.title));

/**
 * One page's picks, by name as printed. `game` is "hsr" or "zzz"; names are
 * resolved to ids in toEntry, stat labels here (they need no table).
 */
export function parseGuidePage(html, game) {
  const clean = stripNoise(html);
  const sections = h2Sections(clean);
  const unknownStats = new Set();
  const date = html.match(/<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})[^"]*"[^>]*itemprop="dateModified"/);
  const canonical = html.match(/<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/) ?? html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/);

  // The first build: the build section up to its second h3.
  const builds = sectionOf(sections, /Best Builds?\b|Builds? for/i);
  const buildHeads = builds ? [...builds.html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)] : [];
  const firstBuild = builds ? builds.html.slice(0, buildHeads[1]?.index ?? builds.html.length) : "";
  const weaponWord = /light cone|w-engine/i;

  const weapons = [];
  const buildSets = [];
  let mainLines = [];
  let subLines = [];
  for (const table of tablesIn(firstBuild)) {
    const rows = tableRows(table.html);
    // Star Rail's "Alternative Light Cones" tab: a title row, then 1 | cone.
    const altTable = rows[0]?.length === 1 && weaponWord.test(inlineText(rows[0][0].html));
    for (const field of labelledCells(rows)) {
      const label = field.label ?? "";
      if (weaponWord.test(label) || (altTable && /^\d+$/.test(label))) {
        for (const item of field.cells.flatMap(itemsIn)) weapons.push({ name: item.name, refinement: refinementOf(item.after) });
      } else if (/relic|ornament|drive disc build|disc set/i.test(label)) {
        for (const cell of field.cells) {
          const items = itemsIn(cell);
          if (items.length) buildSets.push(items.map((it) => ({ name: it.name, pieces: piecesOf(it.after) })));
        }
      } else if (/main stat/i.test(label)) mainLines.push(...field.cells.flatMap(textLines));
      else if (/sub ?stat/i.test(label)) subLines.push(...field.cells.flatMap(textLines));
    }
  }
  // Zenless names its build's discs in one cell; Star Rail its relic and
  // ornament in a cell each. Either way the build is one rank.
  const fromBuild = game === "zzz" ? buildSets.slice(0, 1) : buildSets.flat().map((p) => [p]);

  // The weapon section, where the build table names none.
  if (!weapons.length) {
    const sec = sectionOf(sections, /Best (Light Cones?|W-Engines?)/i);
    for (const table of sec ? tablesIn(sec.html) : []) {
      for (const row of tableRows(table.html)) {
        const item = row.flatMap((c) => itemsIn(c.html))[0];
        if (item) weapons.push({ name: item.name, refinement: refinementOf(item.after) });
      }
    }
  }

  // Ranked sets: one rank per row naming sets, in row order.
  const ranks = [];
  const setSec = sectionOf(sections, /Best (Relics|Drive Discs|Disc Drives|Discs)/i);
  for (const table of setSec ? tablesIn(setSec.html) : []) {
    for (const row of tableRows(table.html)) {
      const items = itemsIn(row[0].html);
      if (items.length) ranks.push(items.map((it) => ({ name: it.name, pieces: piecesOf(it.after) })));
    }
  }

  // "Stat | Recommended Value" tables, first figure per stat.
  const endgameStats = [];
  for (const table of builds ? tablesIn(builds.html) : []) {
    const rows = tableRows(table.html);
    if (!rows.length || !/recommended value|goal/i.test(inlineText(rows[0].map((c) => c.html).join(" ")))) continue;
    for (const row of rows.slice(1)) {
      if (row.length < 2) continue;
      const label = inlineText(row[0].html);
      const value = endgameFigure(textLines(row[1].html).join(" / "));
      if (label && value && !endgameStats.some((g) => g.label === label)) endgameStats.push({ label, value });
    }
  }

  const teamSec = sectionOf(sections, /Best Teams?/i);
  const teams = [];
  const partners = [];
  for (const table of teamSec ? tablesIn(teamSec.html) : []) {
    const rows = tableRows(table.html);
    if (rows[0]?.some((c) => /^Explanation$/i.test(inlineText(c.html)))) {
      for (const row of rows.slice(1)) {
        const item = itemsIn(row[0]?.html ?? "")[0];
        if (item) partners.push(item.name);
      }
      continue;
    }
    // Columns under a "Bangboo" header are not agents.
    const skip = new Set();
    let col = 0;
    for (const c of rows[0] ?? []) {
      const span = Number(c.attrs.match(/colspan=['"]?(\d+)/)?.[1] ?? 1);
      for (let i = 0; i < span; i++) if (/bangboo/i.test(inlineText(c.html))) skip.add(col + i);
      col += span;
    }
    const heading = headingsBefore(teamSec.html, table.at).at(-1)?.text ?? null;
    for (const row of rows) {
      if (row.every((c) => c.tag === "th") || row.length < 3) continue;
      // A slot's pick comes first; anything after an <hr> is its role or an alternate.
      const members = row
        .filter((_, i) => !skip.has(i))
        .map((c) => {
          const first = c.html.split(/<hr\b/)[0];
          return itemsIn(first)[0]?.name ?? inlineText(first);
        })
        .filter(Boolean);
      if (members.length >= 3) teams.push({ name: heading, members });
    }
  }

  // Star Rail's Trace Priority: skills first, then bonus abilities; Zenless's Skill Priority.
  const prioSec = sectionOf(sections, /(Trace|Skill) Priority/i);
  const orders = prioSec ? tablesIn(prioSec.html).map(starOrder).filter(Boolean) : [];

  // Zenless's role is its Specialty ("Attack", "Stun"); Star Rail's is the first build's title.
  let role = null;
  if (game === "zzz") {
    const row = sections.flatMap((s) => tablesIn(s.html)).flatMap((t) => tableRows(t.html)).find((r) => r[0]?.tag === "th" && /^Specialty$/i.test(inlineText(r[0].html)));
    role = row?.[1] ? inlineText(row[1].html) || null : null;
  }

  return {
    titleName: game8TitleName(html),
    canonical: canonical ? decode(canonical[1]) : null,
    updated: date ? date[1] : null,
    buildTitle: buildHeads[0] ? inlineText(buildHeads[0][1]) : null,
    role,
    weapons,
    ranks: ranks.length ? ranks : fromBuild,
    mainStats: mainStatsFrom(game, mainLines, unknownStats),
    substats: subLines.length ? substatTiers(game, subLines, unknownStats) : null,
    endgameStats,
    teams,
    partners,
    skillPriority: orders[0] ?? null,
    tracePriority: game === "hsr" ? (orders[1] ?? null) : null,
    unknownStats: [...unknownStats],
  };
}

// ── Matching ────────────────────────────────────────────────────────

/** Trailblazer element (as Game8 brackets it) -> Path in characters.json. */
const TRAILBLAZER_PATHS = { physical: "Warrior", fire: "Knight", imaginary: "Shaman", ice: "Memory", lightning: "Elation" };

/** Game8's names where they are not ours, normalised; "name|Path" picks one of a shared name. */
const ALIASES = {
  hsr: {
    "march 7th": "march 7th|Knight",
    "march 7th preservation": "march 7th|Knight",
    "march 7th hunt": "march 7th|Rogue",
    "march 7th the hunt": "march 7th|Rogue",
    "march 7th imaginary": "march 7th|Rogue",
    "march 7th ice": "march 7th|Knight",
    "trailblazer": "trailblazer caelus|Warrior",
  },
  zzz: {
    "ellen joe": "ellen",
    "jane doe": "jane",
    "anby demara": "anby",
    "nicole demara": "nicole",
    "grace howard": "grace",
    "billy kid": "billy",
    "ukinami yuzuha": "yuzuha",
    "orphie and magus": "orphie magus",
  },
};

/**
 * Lookups for one game: idsFor(name) -> [ids] (the Trailblazer is two, one
 * per body), weaponId(name), setId(name).
 */
export function lookups(game) {
  const characters = game === "hsr" ? readJson("src", "hsr", "data", "characters.json") : readJson("src", "zzz", "data", "agents.json");
  const weapons = game === "hsr" ? readJson("src", "hsr", "data", "light-cones.json") : readJson("src", "zzz", "data", "weapons.json");
  const sets = readJson("src", game, "data", "sets.json");

  const byName = new Map();
  const add = (key, id) => byName.set(key, [...(byName.get(key) ?? []), id]);
  for (const [id, c] of Object.entries(characters)) {
    add(normalise(c.name), id);
    if (c.path) add(`${normalise(c.name)}|${c.path}`, id);
  }
  const idsFor = (name) => {
    let key = normalise(name);
    const blazer = game === "hsr" && /trailblazer/.test(key) && name.match(/\((\w+)\)/);
    if (blazer && TRAILBLAZER_PATHS[blazer[1].toLowerCase()]) key = `trailblazer caelus|${TRAILBLAZER_PATHS[blazer[1].toLowerCase()]}`;
    key = ALIASES[game][key] ?? key;
    if (key.startsWith("trailblazer caelus|")) return [...(byName.get(key) ?? []), ...(byName.get(key.replace("caelus", "stelle")) ?? [])];
    if (byName.get(key)?.length === 1) return byName.get(key);
    // "Imbibitor Lunae" for "Dan Heng • Imbibitor Lunae", "Topaz" for "Topaz & Numby":
    // one name that starts or ends with it, never more.
    const loose = [...byName].filter(([n, ids]) => !n.includes("|") && ids.length === 1 && (n.endsWith(` ${key}`) || n.startsWith(`${key} `)));
    return loose.length === 1 ? loose[0][1] : [];
  };

  const weaponByName = new Map();
  // "Branch & Blade Song" is "Branch and Blade Song" on Game8.
  const itemKey = (n) => normalise(n.replace(/&/g, " and "));
  for (const [id, w] of Object.entries(weapons)) if (!weaponByName.has(itemKey(w.name))) weaponByName.set(itemKey(w.name), id);
  const setByName = new Map(Object.entries(sets).map(([id, s]) => [itemKey(typeof s === "string" ? s : s.name), id]));
  return {
    characters,
    idsFor,
    weaponId: (name) => weaponByName.get(itemKey(name)) ?? null,
    setId: (name) => setByName.get(itemKey(name)) ?? null,
  };
}

/**
 * Parsed picks -> a SourceEntry for one id. `report` collects what did not
 * resolve: { weapons, sets, members, stats } as Sets.
 */
export function toEntry(parsed, { game, id, ownIds, name, url, look }, report) {
  const entry = emptyEntry(name, url);
  entry.updated = parsed.updated;
  for (const s of parsed.unknownStats) report.stats.add(s);

  for (const w of parsed.weapons) {
    const weaponId = look.weaponId(w.name);
    if (!weaponId) report.weapons.add(w.name);
    else if (!entry.weapons.some((x) => x.id === weaponId && x.refinement === w.refinement)) entry.weapons.push({ id: weaponId, refinement: w.refinement });
  }

  // A rank naming an unknown set is dropped whole. Star Rail ranks split by
  // what they name: ornament sets are the 3xx ids, always two pieces.
  const relic = [];
  const ornament = [];
  const zzz = [];
  for (const rank of parsed.ranks) {
    const parts = rank.map((p) => ({ setId: look.setId(p.name), pieces: p.pieces, name: p.name }));
    const missing = parts.filter((p) => !p.setId);
    if (missing.length) {
      for (const p of missing) report.sets.add(p.name);
      continue;
    }
    const key = (r) => r.map((p) => `${p.setId}x${p.pieces}`).join("+");
    const push = (list, r) => list.length < MAX_RANKS && !list.some((x) => key(x) === key(r)) && list.push(r);
    if (game === "zzz") {
      // Unmarked: the first set is the 4-piece, the rest its 2-pieces.
      push(zzz, parts.map((p, i) => ({ setId: p.setId, pieces: p.pieces ?? (i === 0 && parts.length < 3 ? 4 : 2) })));
    } else {
      const orn = parts.filter((p) => Number(p.setId) >= 300);
      const rel = parts.filter((p) => Number(p.setId) < 300);
      if (orn.length) push(ornament, orn.map((p) => ({ setId: p.setId, pieces: 2 })));
      if (rel.length) push(relic, rel.map((p) => ({ setId: p.setId, pieces: p.pieces ?? (rel.length > 1 ? 2 : 4) })));
    }
  }
  entry.sets = zzz;
  entry.relicSets = relic;
  entry.ornamentSets = ornament;

  // The page's own names (its Trailblazer is either body) count as this id.
  const memberId = (n) => {
    const ids = look.idsFor(n);
    if (!ids.length) report.members.add(n);
    return ids.some((x) => ownIds.includes(x)) ? id : (ids[0] ?? null);
  };
  const seen = new Set();
  for (const team of parsed.teams) {
    if (entry.teams.length >= MAX_TEAMS) break;
    const members = [];
    for (const n of team.members) {
      const m = memberId(n);
      if (m && !members.includes(m)) members.push(m);
    }
    const k = [...members].sort().join("+");
    if (members.length < 2 || !members.includes(id) || seen.has(k)) continue;
    seen.add(k);
    entry.teams.push({ name: teamLabel(team.name, [name, parsed.titleName, ...name.split(" ")].filter(Boolean)), members });
  }
  for (const n of parsed.partners) {
    const m = memberId(n);
    if (m && m !== id && !entry.synergies.includes(m)) entry.synergies.push(m);
  }

  // "Trailblazer (Lightning) Support Build": the bracket is part of the name, not the role.
  const title = parsed.buildTitle?.replace(/\s*\([^)]*\)/g, "");
  entry.role = parsed.role ?? (title ? roleFrom({ title, h3: null }, [name, parsed.titleName, ...name.split(" ")].filter(Boolean)) : null);
  entry.mainStats = parsed.mainStats;
  entry.substats = parsed.substats;
  entry.endgameStats = parsed.endgameStats;
  entry.skillPriority = parsed.skillPriority;
  entry.tracePriority = parsed.tracePriority;
  return entry;
}

// ── Main ────────────────────────────────────────────────────────────

const GAMES = {
  hsr: {
    // The site menu on the game's top page links every character, though
    // sometimes to a banner page (Silver Wolf Lv.999); the page body links the rest.
    index: `${GAME8}/games/Honkai-Star-Rail`,
    links: (html) => [...game8IndexLinks(html), ...bodyLinks(html)],
  },
  zzz: {
    // Zenless's menu has no agents; "All Agent Builds" links each one.
    index: `${GAME8}/games/Zenless-Zone-Zero/archives/522597`,
    links: (html) => bodyLinks(html),
  },
};

function bodyLinks(html) {
  return itemsIn(html).map((it) => ({ label: it.name, url: it.url && new URL(it.url, GAME8).href }));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(game) {
  const look = lookups(game);
  console.log(`\nLoading Game8 ${game} index…`);
  const index = await getPage(GAMES[game].index);

  // Each character's candidate pages in link order; the first whose title
  // names them is read.
  const pages = new Map();
  for (const link of GAMES[game].links(index.html)) {
    if (!link.url || !/\/archives\/\d+$/.test(link.url)) continue;
    const ids = look.idsFor(link.label);
    if (!ids.length) continue;
    const page = pages.get(ids.join()) ?? { label: link.label, ids, urls: [] };
    if (!page.urls.includes(link.url)) page.urls.push(link.url);
    pages.set(ids.join(), page);
  }
  console.log(`  ${pages.size} character pages`);

  const characters = {};
  const report = { weapons: new Set(), sets: new Set(), members: new Set(), stats: new Set() };
  const notes = [];
  const coverage = {};
  for (const { label, ids, urls } of pages.values()) {
    if (ONLY.size && !ids.some((x) => ONLY.has(x))) continue;
    let page = null;
    let parsed = null;
    for (const url of urls) {
      await sleep(DELAY_MS);
      try {
        page = await getPage(url);
      } catch (err) {
        // A refusal means Game8 does not want this traffic: stop, do not retry around it.
        if (/HTTP (403|429|503)/.test(err.message)) throw new Error(`Game8 refused the request (${err.message}); stopping`);
        notes.push(`${label}: ${err.message}`);
        continue;
      }
      parsed = parseGuidePage(page.html, game);
      // The title confirms the link pointed at this character's build page.
      if (parsed.titleName && look.idsFor(parsed.titleName).join() === ids.join()) break;
      notes.push(`${label}: ${url} is titled "${parsed.titleName ?? "?"}", read the next link`);
      parsed = null;
    }
    if (!parsed) continue;
    for (const id of ids) {
      const entry = toEntry(parsed, { game, id, ownIds: ids, name: look.characters[id].name, url: parsed.canonical ?? page.url, look }, report);
      characters[id] = entry;
      for (const [k, v] of Object.entries(entry)) if (Array.isArray(v) ? v.length : v) coverage[k] = (coverage[k] ?? 0) + 1;
    }
    const e = characters[ids[0]];
    const sets = game === "hsr" ? `${e.relicSets.length}+${e.ornamentSets.length}` : `${e.sets.length}`;
    console.log(`  ${label.padEnd(28)} ${sets} sets, ${e.weapons.length} weapons, ${e.teams.length} teams${e.updated ? `, updated ${e.updated}` : ""}`);
  }

  const file = writeSource(game, "game8", characters, { merge: ONLY.size > 0 });
  console.log(`\n  ✔ wrote ${Object.keys(characters).length} entries to ${path.relative(ROOT, file)}`);
  console.log(`    filled: ${Object.entries(coverage).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  const covered = new Set([...pages.values()].flatMap((p) => p.ids));
  const missing = Object.keys(look.characters).filter((id) => !covered.has(id)).map((id) => `${look.characters[id].name} (${id})`);
  if (!ONLY.size && missing.length) console.log(`  ⚠ no Game8 page found for: ${missing.join(", ")}`);
  if (report.weapons.size) console.log(`  ⚠ weapon names not matched: ${[...report.weapons].join(", ")}`);
  if (report.sets.size) console.log(`  ⚠ set names not matched: ${[...report.sets].join(", ")}`);
  if (report.members.size) console.log(`  ⚠ team / partner names not matched: ${[...report.members].join(", ")}`);
  if (report.stats.size) console.log(`  ⚠ stat labels not mapped: ${[...report.stats].join(", ")}`);
  for (const n of notes) console.log(`  ⚠ ${n}`);
}

async function main() {
  for (const game of WANTED_GAMES.length ? WANTED_GAMES : ["hsr", "zzz"]) await run(game);
}

// Only as a script: the tests import the page readers without starting a fetch.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
