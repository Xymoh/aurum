/**
 * fetch-kqm-guides.mjs
 * ──────────────────────────────────────────────────────────────────
 * KQM's (keqingmains.com) Genshin quick guides: role, weapons, artifact
 * sets, main stats, substat priority, the Energy Recharge requirement,
 * talent priority and example teams. Written to .sources/genshin/kqm.json
 * (see sources.mjs); scripts/consensus.mjs weighs it against the others.
 *
 * The guide index is the home page, which links every quick guide as
 * /q/<slug>-quickguide/. The WordPress REST API and sitemaps answer 404 to
 * plain requests, so the home page is the only list. Pages are plain HTML.
 *
 * Only facts are taken: ids, ranks, stat lines and dates. Never the guides'
 * prose, notes or damage figures. Names that match nothing in our tables are
 * reported, not guessed.
 *
 * Usage: node scripts/fetch-kqm-guides.mjs
 *        node scripts/fetch-kqm-guides.mjs --only=10000089,10000005-pyro
 * ──────────────────────────────────────────────────────────────────
 */

import { pathToFileURL } from "node:url";
import { energyTarget } from "./guide-figures.mjs";
import { TRAVELER_IDS, travelerId } from "./genshin-traveler.mjs";
import {
  CHARACTERS,
  DELAY_MS,
  NEVER_BUILT,
  SETS,
  WEAPONS,
  buildSetIndex,
  buildWeaponIndex,
  decode,
  getText,
  inlineText,
  mainStatKeys,
  mainStatsFrom,
  matchCharacter,
  matchSet,
  normalise,
  tableRows,
  tablesIn,
  textLines,
  travelerElementOf,
} from "./fetch-genshin-sets.mjs";
import { emptyEntry, writeSource } from "./sources.mjs";

const KQM = "https://keqingmains.com";
const ONLY = new Set(
  (process.argv.find((a) => a.startsWith("--only=")) ?? "")
    .slice(7)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);
const MAX_RANKS = 4;
const MAX_TEAMS = 4;
/** The scorer's substat keys; anything else in a substat line is a main stat. */
const SUBSTAT_KEYS = new Set(["CRIT_RATE", "CRIT_DMG", "ATK_PERCENT", "HP_PERCENT", "DEF_PERCENT", "ELEMENTAL_MASTERY", "ENERGY_RECHARGE", "FLAT_ATK", "FLAT_HP", "FLAT_DEF"]);
const TALENTS = { "normal attack": "Normal Attack", skill: "Elemental Skill", burst: "Elemental Burst" };

/** decode() plus the numeric entities it leaves ("&#8220;The Catch&#8221;"). */
const text = (html) => inlineText(html.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))));

/**
 * Table-of-contents anchors, which pages name differently: "Artifacts",
 * "Support_Artifacts", "Builds"; "Weapons", "Support_Weapons" (and never
 * "Weapons-2", the second build's); "Teams", "Teams_and_Rotations".
 */
const ANCHOR = {
  playstyles: /^Playstyles$/,
  talents: /^(Talents|Character_Overview)$/,
  artifacts: /^(?:\w+_)?Artifacts?(?:_Stats)?$|^Builds$/,
  sets: /Artifact_Sets$/,
  weapons: /^(?:\w+_)?Weapons$/,
  teams: /^(?:\w+_)?Teams(?:_and_Rotations)?$/,
  credits: /^Credits$/,
};

/** Where the first anchor matching `re` at or after `from` is, or -1. */
function anchorAt(html, re, from = 0) {
  for (const m of html.slice(from).matchAll(/<span class="ez-toc-section" id="([^"]+)"/g)) if (re.test(m[1])) return from + m.index;
  return -1;
}

/** The HTML from one anchor to the next matching `end`. */
function sectionOf(html, start, end) {
  const at = anchorAt(html, start);
  if (at < 0) return "";
  const stop = anchorAt(html, end, at + 1);
  return html.slice(at, stop < 0 ? html.length : stop);
}

/** The lines of a `substats` paragraph that carry an order ("A > B"), its label dropped. */
function rankedLine(html) {
  const lines = textLines(html.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))));
  // Hu Tao's "Substat priorities:" is a numbered list, one line per rank.
  const numbered = lines.filter((l) => /^\d+\.\s/.test(l));
  if (numbered.length > 1) return numbered.join(" ");
  const line = lines.find((l) => /[>≥=]/.test(l));
  // "Stat Priority (General): ER > ..." and "Off-Field DPS: Burst > Skill": the first role's line.
  return line ? line.replace(/^[^:>≥=]{0,40}:\s*/, "") : null;
}

/** "Burst ≥ Skill = Lvl. 90" -> "Elemental Burst > Elemental Skill"; null without two talents. */
export function talentOrder(line) {
  if (!line) return null;
  const names = [];
  for (const part of line.split(/\s*(?:>+=?|≥|=)\s*/)) {
    const key = Object.keys(TALENTS).find((k) => new RegExp(`^(?:elemental )?${k}s?$`, "i").test(part.replace(/\([^)]*\)/g, "").trim()));
    if (key && !names.includes(TALENTS[key])) names.push(TALENTS[key]);
  }
  return names.length >= 2 ? names.join(" > ") : null;
}

/** One substat as scorer keys: main-stat names plus the flat stats. */
function substatKeys(part) {
  const flat = part.toLowerCase().match(/^flat (hp|atk|def)$/);
  if (flat) return [`FLAT_${flat[1].toUpperCase()}`];
  return mainStatKeys(part);
}

/**
 * A substat line as tiers, best first: "ER (until requirement) > CRIT DMG =
 * CRIT Rate > HP%" -> [["ENERGY_RECHARGE"], ["CRIT_DMG", "CRIT_RATE"],
 * ["HP_PERCENT"]]. Numbered lists ("1. EM to ~100 2. CRIT") are one tier per
 * number. A stat already ranked is not ranked again lower down.
 */
export function substatTiers(line, unmapped = new Set()) {
  if (!line) return null;
  const numbered = /(^|\s)\d+\.\s/.test(line);
  const tiers = numbered ? line.split(/(?:^|\s)\d+\.\s*/) : line.split(/\s*(?:>+=?|≥)\s*/);
  const seen = new Set();
  const out = [];
  for (const tier of tiers) {
    const keys = [];
    const clean = tier
      .replace(/\([^)]*\)/g, " ")
      .replace(/\*/g, "")
      .replace(/crit\s*rate\s*\/\s*(?:crit\s*)?dmg/gi, "CRIT")
      // "EM to ~100", "ER until requirements": the qualifier, not a stat.
      .replace(/\s(?:to|until|up to)\s.*$/i, "");
    for (const part of clean.split(/\s*(?:=|≈|\/|,)\s*/).map((p) => p.trim()).filter(Boolean)) {
      const found = substatKeys(part);
      if (!found || !found.every((k) => SUBSTAT_KEYS.has(k))) unmapped.add(part);
      else for (const k of found) if (!seen.has(k)) keys.push(k), seen.add(k);
    }
    if (keys.length) out.push(keys);
  }
  return out.length ? out : null;
}

/** The weapon or set names in a table's first cell: "4★ Iron Sting, 4★ Toukabou Shigure". */
function itemNames(cell) {
  return textLines(cell.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))))
    .flatMap((l) => l.split(/\s+\/\s+|,\s+/))
    .map((n) => n.replace(/^\d\s*★\s*/, "").replace(/["“”]/g, "").trim())
    .filter(Boolean);
}

/** The data-gi-id attributes of one kind in a cell, in order (KQM's tooltips carry the game's ids). */
function giIds(cell, type) {
  return [...cell.matchAll(new RegExp(`data-gi-type="${type}"[^>]*?data-gi-id="(\\d+)"`, "g"))].map((m) => m[1]);
}

/**
 * Everything a quick guide states, as read: names and labels, not ids yet
 * (see kqmEntry). The first build's tables are read where a page has two
 * (Raiden's On-Field and Hyperbloom).
 */
export function parseKqmGuide(html) {
  const title = html.match(/<h1 class="entry-title"[^>]*>([\s\S]*?)<\/h1>/);
  const modified = html.match(/<meta property="article:modified_time" content="(\d{4}-\d{2}-\d{2})/);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);

  const playstyles = sectionOf(html, ANCHOR.playstyles, ANCHOR.talents);
  const role = playstyles.match(/<h[3-5]\b[^>]*>([\s\S]*?)<\/h[3-5]>/);

  const artifactsAt = anchorAt(html, ANCHOR.artifacts);
  const talentLine = (html.slice(0, artifactsAt < 0 ? html.length : artifactsAt).match(/<p class="[^"]*\bsubstats\b[^"]*"[^>]*>([\s\S]*?)<\/p>/) ?? [])[1];

  const artifacts = sectionOf(html, ANCHOR.artifacts, ANCHOR.weapons);
  const tables = tablesIn(artifacts);
  const statsAt = tables.findIndex((t) => /Sands/.test(text(tableRows(t.html)[0]?.map((c) => c.html).join(" ") ?? "")));
  const mainStatLabels = {};
  if (statsAt >= 0) {
    const [head, values] = tableRows(tables[statsAt].html);
    head.forEach((cell, i) => {
      const slot = text(cell.html).match(/Sands|Goblet|Circlet/)?.[0].toUpperCase();
      if (slot && values?.[i]) mainStatLabels[slot] = text(values[i].html).replace(/\*/g, "");
    });
  }
  // ER tables differ per page (per team, per weapon, per constellation), so
  // every requirement figure before the stats table is kept, in page order.
  const erFigures = tables
    .slice(0, Math.max(statsAt, 0))
    .flatMap((t) => tableRows(t.html).flat())
    .map((c) => text(c.html))
    .filter((t) => /^\d{2,3}\s*%?\s*(?:[–-]\s*\d{2,3}\s*)?%\+?/.test(t));
  const substatLine = (artifacts.slice(statsAt >= 0 ? tables[statsAt].at : 0).match(/<p class="[^"]*\bsubstats(?:-2)?\b[^"]*"[^>]*>([\s\S]*?)<\/p>/) ?? [])[1];

  const setsHtml = artifacts.slice(Math.max(anchorAt(artifacts, ANCHOR.sets), statsAt >= 0 ? tables[statsAt].at : 0));
  const sets = [];
  for (const t of tablesIn(setsHtml)) {
    for (const row of tableRows(t.html)) {
      const label = text(row[0].html);
      if (/\d\s*pc/i.test(label)) sets.push({ label: itemNames(row[0].html).join(" / "), ids: giIds(row[0].html, "artifact") });
    }
  }

  const weapons = [];
  for (const t of tablesIn(sectionOf(html, ANCHOR.weapons, new RegExp(`${ANCHOR.teams.source}|${ANCHOR.credits.source}`)))) {
    for (const row of tableRows(t.html)) {
      const names = itemNames(row[0].html);
      if (!names.length || /^(weapons?|swords?|claymores?|polearms?|catalysts?|bows?)$/i.test(names[0])) continue;
      weapons.push({ names, ids: giIds(row[0].html, "weapon") });
    }
  }

  return {
    name: title ? text(title[1]).replace(/\s*Quick ?Guide$/i, "") : null,
    canonical: canonical ? canonical[1] : null,
    updated: modified ? modified[1] : null,
    role: role ? text(role[1]) || null : null,
    skillPriority: talentOrder(talentLine ? rankedLine(talentLine) : null),
    mainStatLabels,
    substatLine: substatLine ? rankedLine(substatLine) ?? text(substatLine) : null,
    erFigures,
    sets,
    weapons,
    teams: parseKqmTeams(sectionOf(html, ANCHOR.teams, ANCHOR.credits)),
  };
}

/** Headings that hold teams rather than name them. */
const CONTAINER = /^(teams?|teambuilding|team archetypes)$/i;
/** Headings under which nothing is a team archetype's name. */
const STOPPER = /example teams?|notable|teammates|sustain|options/i;

/**
 * Example teams are image captions, "Furina — Neuvillette — Kazuha — Xilonen
 * / Zhongli". Each is named after the archetype heading it sits under; the
 * "Limited Roster Alternatives" teams are left out (the page says they trade
 * damage for accessibility).
 */
export function parseKqmTeams(html) {
  const stack = [];
  const teams = [];
  for (const m of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>|<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)) {
    if (m[1]) {
      const level = Number(m[1]);
      while (stack.length && stack.at(-1).level >= level) stack.pop();
      stack.push({ level, text: text(m[2]) });
      continue;
    }
    if (stack.some((h) => /limited roster/i.test(h.text))) continue;
    const slots = text(m[3])
      .split(/\s*—\s*/)
      .map((slot) => slot.split(/\s*\/\s*/).filter(Boolean));
    if (slots.length !== 4) continue;
    let name = null;
    for (const h of stack) {
      if (STOPPER.test(h.text)) break;
      if (!CONTAINER.test(h.text)) name = h.text;
    }
    teams.push({ name, members: slots });
  }
  return teams;
}

/**
 * The median of the stated requirements' lower bounds, to the nearest 5%.
 * KQM states one per team or weapon, and the first is often the hardest case
 * (Solo Hydro, no Favonius), so the middle one is the typical build. A 100%
 * row ("no ER needed") counts toward the median; energyTarget() then drops a
 * median that asks for nothing.
 */
export function erFromFigures(figures) {
  const values = figures
    .map((f) => Number(f.match(/\d+/)?.[0]))
    .filter((n) => n >= 100 && n <= 400)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const mid = values.length / 2;
  const median = values.length % 2 ? values[Math.floor(mid)] : (values[mid - 1] + values[mid]) / 2;
  return energyTarget(`${Math.round(median / 5) * 5}%`);
}

/**
 * A team slot's name without what the page adds to it: "C6 Faruzan",
 * "(C6) Xingqiu", "Bennett C6", "Freeze: Chongyun", "Kazuha *See Raiden guide".
 */
export function memberName(name) {
  return name
    .replace(/\s*\*.*$/, "")
    .replace(/^[^:]+:\s*/, "")
    .replace(/\(C\d\+?\)|\bC\d\+?(?=\s|$)|[“”"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Main-stat cells as mainStatsFrom() reads them. KQM separates choices with
 * "|", "≥" and "≈" as well as "/" and "or", and footnotes them ("CRIT²").
 */
function mainStatLabels(labels) {
  const out = {};
  for (const [slot, label] of Object.entries(labels)) {
    out[slot] = label
      .replace(/[|≥≈]/g, " > ")
      .replace(/[¹²³⁴*]/g, "")
      .replace(/\bHeal(?:ing)?%|\bHB\b/gi, "Healing Bonus")
      .replace(/\b(\w+) DMG%/g, "$1 DMG")
      .replace(/\b(Pyro|Hydro|Anemo|Electro|Dendro|Cryo|Geo)%/gi, "$1 DMG")
      .replace(/crit rate\s+crit dmg/gi, "CRIT");
  }
  return out;
}

/** Character name -> id, the Traveler by element ("Pyro Traveler" -> "10000005-pyro"). */
export function characterIndex() {
  const byName = new Map();
  for (const [id, c] of Object.entries(CHARACTERS)) if (!byName.has(normalise(c.name))) byName.set(normalise(c.name), id);
  return (name) => {
    const element = travelerElementOf(name.replace(/\s*\([^)]*\)\s*$/, ""));
    if (element) return travelerId(element);
    const id = matchCharacter(name, byName);
    if (id) return TRAVELER_IDS.includes(id) || NEVER_BUILT.has(id) ? null : id;
    // "Yunjin" for "Yun Jin".
    const squashed = normalise(name).replace(/ /g, "");
    return [...byName].find(([n]) => n.replace(/ /g, "") === squashed)?.[1] ?? null;
  };
}

/**
 * A parsed guide as a SourceEntry. Weapons and sets use the game ids KQM's
 * tooltips carry where they are in our tables, and their names where not.
 * `report` collects what matched nothing: { weapons, sets, members, stats }.
 */
export function kqmEntry(parsed, { id, url, weaponByName, characterId, report }) {
  const entry = emptyEntry(parsed.name, url);
  entry.updated = parsed.updated;
  entry.role = parsed.role;
  entry.skillPriority = parsed.skillPriority;
  entry.mainStats = mainStatsFrom(mainStatLabels(parsed.mainStatLabels), report.stats);
  entry.substats = substatTiers(parsed.substatLine, report.stats);
  entry.erTarget = erFromFigures(parsed.erFigures);

  for (const row of parsed.weapons) {
    const known = row.ids.filter((w) => WEAPONS[w]);
    const bare = (n) => n.replace(/\([^)]*\)|\bR[1-5]\+?(?=\s|$)/g, " ").trim();
    const picks = known.length === row.names.length ? known.map((w, i) => [w, row.names[i]]) : row.names.map((n) => [weaponByName.get(normalise(bare(n))), n]);
    for (const [weaponId, name] of picks) {
      if (!weaponId) {
        // Some weapon sections also table teammates or sets; those are not weapons to report.
        if (!characterId(bare(name)) && !/^\dpc\b/i.test(name)) report.weapons.add(name);
        continue;
      }
      const r = name.match(/\bR([1-5])\b/);
      const refinement = r ? Number(r[1]) : null;
      if (!entry.weapons.some((w) => w.id === weaponId && w.refinement === refinement)) entry.weapons.push({ id: weaponId, refinement });
    }
  }

  const setByName = buildSetIndex();
  for (const row of parsed.sets) {
    // "4pc Scroll / 4pc Silken Moon's Serenade" is two options, each its own rank.
    for (const option of row.label.replace(/\([^)]*\)/g, "").split(/\s+\/\s+/)) {
      const parts = [];
      for (const piece of option.split(/\s*\+\s*/)) {
        const m = piece.match(/^(\d)\s*pc\s+(.+)$/i);
        const setId = m ? matchSet(m[2].replace(/\([^)]*\)/g, "").trim(), setByName) : null;
        if (!setId || !SETS[setId]) {
          parts.length = 0;
          report.sets.add(piece);
          break;
        }
        parts.push({ setId, pieces: Number(m[1]) });
      }
      const key = JSON.stringify(parts);
      if (parts.length && entry.sets.length < MAX_RANKS && !entry.sets.some((s) => JSON.stringify(s) === key)) entry.sets.push(parts);
    }
  }

  const seen = new Set();
  for (const team of parsed.teams) {
    const members = [];
    const alternates = [];
    for (const slot of team.members) {
      const ids = [];
      for (const name of slot) {
        const memberId = name.toLowerCase() === "traveler" && /^\d+-/.test(id) ? id : characterId(memberName(name));
        if (!memberId) report.members.add(name);
        else if (!ids.includes(memberId) && !members.includes(memberId)) ids.push(memberId);
      }
      if (!ids.length) break;
      members.push(ids[0]);
      alternates.push(ids.slice(1));
    }
    // A template ("Furina — Healer — Flex — Flex") names roles, not people.
    if (members.length !== 4 || !members.includes(id)) continue;
    const key = [...members].sort().join();
    if (seen.has(key) || entry.teams.length >= MAX_TEAMS) continue;
    seen.add(key);
    entry.teams.push({ name: team.name, members, ...(alternates.some((a) => a.length) ? { alternates } : {}) });
  }
  return entry;
}

/** The quick guides the home page links: [{ slug, url }]. */
export function kqmGuideLinks(html) {
  const out = new Map();
  for (const m of html.matchAll(/href="https:\/\/keqingmains\.com\/q\/([a-z0-9-]+)-quickguide\/"/g)) out.set(m[1], `${KQM}/q/${m[1]}-quickguide/`);
  return [...out].map(([slug, url]) => ({ slug, url }));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Loading KQM guide index…");
  const robots = await getText(`${KQM}/robots.txt`);
  // Only one path is disallowed today; stop rather than read past a new rule.
  if (/^Disallow:\s*\/(q\/)?\s*$/im.test(robots)) throw new Error("robots.txt disallows the quick guides");
  await sleep(DELAY_MS);
  const links = kqmGuideLinks(await getText(`${KQM}/`));
  console.log(`  ${links.length} quick guides linked`);

  const characterId = characterIndex();
  const weaponByName = await buildWeaponIndex();
  const report = { weapons: new Set(), sets: new Set(), members: new Set(), stats: new Set() };
  const unmatchedPages = [];
  const characters = {};
  const pages = new Map();
  for (const link of links) {
    const id = characterId(decode(link.slug.replace(/-/g, " ")));
    if (!id) unmatchedPages.push(link.slug);
    else if (!ONLY.size || ONLY.has(id)) pages.set(id, link.url);
  }

  for (const [id, url] of pages) {
    await sleep(DELAY_MS);
    let html;
    try {
      html = await getText(url);
    } catch (err) {
      console.warn(`  ⚠ ${url}: ${err.message}`);
      continue;
    }
    const parsed = parseKqmGuide(html);
    const entry = kqmEntry(parsed, { id, url: parsed.canonical ?? url, weaponByName, characterId, report });
    characters[id] = entry;
    const gaps = ["role", "skillPriority", "mainStats", "substats", "erTarget"].filter((k) => entry[k] === null);
    if (!entry.weapons.length) gaps.push("weapons");
    if (!entry.sets.length) gaps.push("sets");
    if (!entry.teams.length) gaps.push("teams");
    console.log(`  ${entry.name}: ${entry.weapons.length} weapons, ${entry.sets.length} set ranks, ${entry.teams.length} teams${gaps.length ? ` (none: ${gaps.join(", ")})` : ""}`);
  }

  const file = writeSource("genshin", "kqm", characters, { merge: ONLY.size > 0 });
  console.log(`✓ ${Object.keys(characters).length} characters -> ${file}`);
  const missing = Object.keys(CHARACTERS).filter((id) => !TRAVELER_IDS.includes(id) && !NEVER_BUILT.has(id) && !pages.has(id) && !ONLY.size);
  if (unmatchedPages.length) console.log(`  ⚠ guides not matched to a character: ${unmatchedPages.join(", ")}`);
  if (missing.length) console.log(`  ⚠ characters with no quick guide: ${missing.map((id) => CHARACTERS[id].name).join(", ")}`);
  for (const [kind, names] of Object.entries(report)) if (names.size) console.log(`  ⚠ ${kind} not matched: ${[...names].join(", ")}`);
}

// Only as a script: the tests import the page readers without starting a fetch.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
