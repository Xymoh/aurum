/**
 * fetch-genshin-sets.mjs
 * ──────────────────────────────────────────────────────────────────
 * Recommended artifact sets per Genshin character, written to
 * src/data/set-recommendations.json, and the rest of each guide's picks
 * (role, weapons, teams, main stats, substat line, talent priority) written
 * to src/data/guide-picks.json. Game8 first; genshin.gg for a character
 * Game8 has no usable page for.
 *
 * Why Game8: it covers the whole roster, dates every page, and keeps up
 * with buffs. genshin.gg lagged behind them (Yumemizuki Mizuki still read
 * Viridescent Venerer and ER sands months after her Stellar-Swirl sets had
 * changed everyone else's advice). Both serve plain HTML, so no browser is
 * needed. The hand-maintained character-builds.json only names sets for
 * about 40% of the roster, Prydwen has no Genshin section, and KQM's guides
 * are prose with no fixed shape.
 *
 * Only facts are taken: names, ranks, stat lines, dates and a short
 * team/build title. Never the guides' prose, notes, tooltips or ratings. The
 * game text that goes with the picks (weapon passives, skill descriptions)
 * comes from Project Amber in build-genshin-guides.mjs.
 *
 * Set, weapon and character names are matched against src/data/artifacts.json,
 * weapon-ids.json and characters.json so the output is keyed by id; anything
 * that does not match is reported, not guessed.
 *
 * The Traveler has one guide page per element and one avatar id per body.
 * Every element's page is read, as a character of its own keyed by Project
 * Amber's id for it on Aether ("10000005-cryo", see genshin-traveler.mjs);
 * both bodies' build pages share it. A team naming "Traveler (Cryo)" points
 * at that element's entry.
 *
 * Usage: node scripts/fetch-genshin-sets.mjs
 *        node scripts/fetch-genshin-sets.mjs --only=hutao,xingqiu
 *        (--only takes character ids, full names or one word of a name)
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { endgameFigure, energyTarget } from "./guide-figures.mjs";
import { TRAVELER_ELEMENTS, TRAVELER_IDS, travelerId, travelerName } from "./genshin-traveler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "src", "data", "set-recommendations.json");
const PICKS_OUTPUT = path.join(ROOT, "src", "data", "guide-picks.json");
const CHARACTERS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "characters.json"), "utf8"));
const SETS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "artifacts.json"), "utf8"));
const WEAPONS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "weapon-ids.json"), "utf8"));

const GAME8 = "https://game8.co";
/**
 * Where the character pages are listed. Every Game8 page carries the site
 * menu, which links each character by a short label ("Hu Tao", "Mizuki");
 * the "All Character Builds" page also has a table that still lists the few
 * characters the menu has dropped (Lan Yan). Both are read.
 */
const GAME8_INDEXES = [`${GAME8}/games/Genshin-Impact/archives/296707`, `${GAME8}/games/Genshin-Impact/archives/530535`];
const GG = "https://genshin.gg";
// Only used to tell a real weapon from the game's internal duplicates that
// share its name (see buildWeaponIndex).
const AMBER_WEAPONS = "https://gi.yatta.moe/api/v2/en/weapon";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) aurum-fetcher/1.0";
const ONLY = new Set(
  (process.argv.find((a) => a.startsWith("--only=")) ?? "")
    .slice(7)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);
/** One page at a time, a second apart. */
const DELAY_MS = 1000;
/** Ranks past this are "if you have nothing else" filler on most pages. */
const MAX_RANKS = 4;
/** Pages list three or four teams; past that they repeat themselves. */
const MAX_TEAMS = 4;

/**
 * Manekin and Manekina are Miliastra Wonderland avatars: they exist only in
 * that mode, no guide covers them, and the site has no build page for them.
 */
const NEVER_BUILT = new Set(["10000117", "10000118"]);

/** The guides' short names where they are not simply a word of Enka's. */
const NAME_ALIASES = {
  childe: "tartaglia",
};

/**
 * Set names Game8 shortens or spells apart from the game's table, keyed and
 * valued in normalise() form. Checked against the set list, not guessed:
 * each one names a single set.
 */
const SET_ALIASES = {
  "nighttime whispers": "nighttime whispers in the echoing woods",
  "disenchantment in deep shadows": "disenchantment in deep shadow",
};

/** A labelled figure's slot on the page -> the scorer's slot key. */
const SLOT_OF = { sands: "SANDS", hourglass: "SANDS", goblet: "GOBLET", circlet: "CIRCLET" };

function normalise(s) {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The page's HTML and the URL it ended up at (Game8 redirects old ids to slugs). */
async function getPage(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return { html: await res.text(), url: res.url || url };
}

async function getText(url) {
  return (await getPage(url)).html;
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

function decode(s) {
  return s
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#x27;|&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    // Soft hyphens and zero-width marks the page adds for line breaking
    // ("Foot­print of the Rain­bow") would split a name in two.
    .replace(/[­​-‍⁠﻿]/g, "");
}

/** One element's inner HTML as a single line of text. */
function inlineText(html) {
  return decode(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** One element's inner HTML as its visible lines ("<br>", "<hr>" and blocks break). */
function textLines(html) {
  return decode(html.replace(/<br\s*\/?>|<hr\b[^>]*>|<\/(div|p|li)>/g, "\n").replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// ── genshin.gg (fallback) ───────────────────────────────────────────

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

/**
 * The picks read from the raw HTML rather than the flattened text: the
 * weapon list and the artifact list share their class names, and only the
 * section title tells them apart, so the markup is the reliable anchor.
 * Names come back as the page prints them; matching happens in main().
 */
function parseGgPicks(html) {
  const role = html.match(/<div class="character-role">([\s\S]*?)<\/div>/);

  // "Best Weapons" runs from its section title to the next section.
  const weapons = [];
  const weaponsAt = html.search(/<h2 class="character-build-section-title">[^<]*Best Weapons<\/h2>/);
  if (weaponsAt >= 0) {
    const rest = html.slice(weaponsAt);
    const end = rest.search(/<div class="character-build-section">|<div class="character-stats">/);
    const block = end > 0 ? rest.slice(0, end) : rest;
    // A weapon ranked at a given refinement reads "The Catch <span>R5</span>".
    for (const m of block.matchAll(/<div class="character-build-weapon-name">([\s\S]*?)<\/div>/g)) {
      const label = inlineText(m[1]);
      const refinement = label.match(/\s+R([1-5])$/);
      weapons.push({
        name: refinement ? label.slice(0, refinement.index) : label,
        refinement: refinement ? Number(refinement[1]) : null,
      });
    }
  }

  // Teams sit between the "teams" anchor and the next category heading.
  const teams = [];
  const teamsAt = html.indexOf('<div class="character-teams"');
  if (teamsAt >= 0) {
    const rest = html.slice(teamsAt);
    const firstHeading = rest.indexOf('<h2 class="character-category"');
    const end = rest.indexOf('<h2 class="character-category"', firstHeading + 1);
    const block = end > 0 ? rest.slice(0, end) : rest;
    for (const chunk of block.split('<div class="character-team">').slice(1)) {
      const name = chunk.match(/<div class="character-team-name">([\s\S]*?)<\/div>/);
      const members = [...chunk.matchAll(/<a class="character-portrait"[^>]*>\s*<img alt="([^"]*)"/g)].map((m) => [inlineText(m[1])]);
      teams.push({ name: name ? inlineText(name[1]) || null : null, members });
    }
  }

  // "Best Stats": "Sands: Elemental Mastery / Energy Recharge", one item per
  // slot, then "Substats: CRIT Rate / CRIT DMG > Elemental Mastery > HP%".
  let substatLine = null;
  const mainStatLabels = {};
  for (const m of html.matchAll(/<div class="character-stats-item[^"]*">([\s\S]*?)<\/div>/g)) {
    const line = inlineText(m[1]);
    const slot = line.match(/^(Sands|Goblet|Circlet)\s*:\s*(.+)$/i);
    if (slot) mainStatLabels[SLOT_OF[slot[1].toLowerCase()]] = slot[2];
    if (/^Substats\s*:/i.test(line)) substatLine = line.replace(/^Substats\s*:\s*/i, "") || null;
  }

  return { role: role ? inlineText(role[1]) || null : null, weapons, teams, substatLine, mainStatLabels };
}

// ── Game8 ───────────────────────────────────────────────────────────

/** Tooltips (weapon passives, set bonuses), scripts and comments out: none of it is read. */
function stripNoise(html) {
  return html
    .replace(/<template\b[\s\S]*?<\/template>/g, "")
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/** The page split at each h2: [{ title, html }], html running to the next h2. */
function h2Sections(html) {
  const marks = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)];
  return marks.map((m, i) => ({
    title: inlineText(m[1]),
    html: html.slice(m.index + m[0].length, marks[i + 1]?.index ?? html.length),
  }));
}

/** A table as rows of cells: { tag: "th" | "td", attrs, html }. */
function tableRows(table) {
  return table
    .split(/<tr\b[^>]*>/)
    .slice(1)
    .map((tr) => [...tr.matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map((m) => ({ tag: m[1], attrs: m[2], html: m[3] })))
    .filter((row) => row.length > 0);
}

/** Every table in a stretch of HTML, with where it starts. */
function tablesIn(html) {
  return [...html.matchAll(/<table\b[\s\S]*?<\/table>/g)].map((m) => ({ at: m.index, html: m[0] }));
}

/** The last h3/h4 before a point in a section: the title the table sits under. */
function headingsBefore(html, at) {
  return [...html.slice(0, at).matchAll(/<h([34])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ level: Number(m[1]), text: inlineText(m[2]) }));
}

/**
 * The item links in a cell: weapons, sets and characters are all
 * `<a class="a-link">`. In-page anchors ("Best <a href=#hl_3>Weapon</a>")
 * are headings, not items. Each comes back with the text that follows it up
 * to the next link, where a refinement or piece count sits ("(R5)", "x2").
 */
function linksIn(html) {
  const found = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter(
    (m) => /\ba-link\b/.test(m[1]) && !/href=['"]?#/.test(m[1]) && inlineText(m[2]),
  );
  return found.map((m, i) => ({
    name: inlineText(m[2]),
    after: inlineText(html.slice(m.index + m[0].length, found[i + 1]?.index ?? html.length).split(/<\/div>|<br\s*\/?>/)[0]),
  }));
}

/**
 * The build table's cells by their label. Two layouts are in use:
 *   newer  a header row of labels ("Best Weapon" | "Alternative Weapons"),
 *          then a row with a cell under each
 *   older  one row per field: "Best Weapon" | cell, with "Artifact Main
 *          Stats" spanning three rows (Sands, Goblet, Circlet)
 */
function labelledCells(rows) {
  const fields = [];
  let pending = null;
  for (const row of rows) {
    if (row.every((c) => c.tag === "th")) {
      pending = row.map((c) => inlineText(c.html));
      continue;
    }
    if (row[0].tag === "th") {
      fields.push({ label: inlineText(row[0].html), cells: row.slice(1).map((c) => c.html) });
      pending = null;
      continue;
    }
    if (pending) {
      row.forEach((c, i) => fields.push({ label: pending[i] ?? pending.at(-1), cells: [c.html] }));
      pending = null;
      continue;
    }
    // A row the one above spans into: more of the same field.
    if (fields.length) fields.at(-1).cells.push(...row.map((c) => c.html));
  }
  return fields;
}

/** "Sands: Elemental Mastery" lines anywhere in the given cells -> { SANDS: label }. */
function slotLabels(cells) {
  const out = {};
  for (const cell of cells) {
    for (const line of textLines(cell)) {
      const m = line.match(/^(Sands|Goblet|Circlet)\s*:\s*(.+)$/i);
      if (m && !out[SLOT_OF[m[1].toLowerCase()]]) out[SLOT_OF[m[1].toLowerCase()]] = m[2];
    }
  }
  return out;
}

/**
 * A substat list as one ranked line. Newer pages number it ("1. CRIT",
 * "2. Elemental Mastery"), older ones write "CRIT Rate, CRIT DMG, HP%".
 */
function substatList(lines) {
  const text = lines.join(" ");
  const items = /(^|\s)\d+\.\s*/.test(text)
    ? text.split(/(?:^|\s)\d+\.\s*/)
    : (lines[0] ?? "").split(/,\s*|\.\s+(?=[A-Z])/);
  const clean = items.map((s) => s.trim()).filter(Boolean);
  return clean.length ? clean.join(" > ") : null;
}

/**
 * The first build on the page: its title, weapons, sets, main stats and
 * substats. Pages with several builds (Hu Tao's three sets, Raiden's
 * Main DPS and Hyperbloom) list their headline build first.
 */
function parseGame8Build(section) {
  const table = tablesIn(section.html).find((t) => /Best\s*(?:<[^>]+>\s*)*Weapon/.test(t.html));
  if (!table) return null;
  const fields = labelledCells(tableRows(table.html));

  const weapons = [];
  for (const field of fields.filter((f) => /Weapon/i.test(f.label))) {
    for (const cell of field.cells) {
      for (const link of linksIn(cell)) {
        // "Sacrificial Jade (R5)": only a stated refinement, never a guess.
        const r = link.after.match(/^\(\s*R([1-5])\s*\)/);
        weapons.push({ name: link.name, refinement: r ? Number(r[1]) : null });
      }
    }
  }

  // Only read when the page has no ranked set table (see parseGame8Ranks).
  const sets = [];
  for (const field of fields.filter((f) => /Artifact/i.test(f.label) && !/Stat/i.test(f.label))) {
    for (const cell of field.cells) {
      let pair = [];
      for (const link of linksIn(cell)) {
        if (/^x\s*2\b/i.test(link.after)) {
          pair.push({ name: link.name, pieces: 2 });
          if (pair.length === 2) {
            sets.push(pair);
            pair = [];
          }
        } else sets.push([{ name: link.name, pieces: 4 }]);
      }
    }
  }

  const statCells = fields.filter((f) => /Stat/i.test(f.label)).flatMap((f) => f.cells);
  // Newer pages put "Artifact Sub Stats" and its list in the stats cell;
  // older ones give it a row of its own.
  let substatLine = null;
  const ownRow = fields.find((f) => /^(Artifact )?Sub ?stats$/i.test(f.label));
  if (ownRow) substatLine = substatList(ownRow.cells.flatMap(textLines));
  else {
    for (const cell of statCells) {
      const lines = textLines(cell);
      const at = lines.findIndex((l) => /^Artifact Sub ?Stats$/i.test(l));
      if (at >= 0) substatLine = substatList(lines.slice(at + 1));
    }
  }

  const heads = headingsBefore(section.html, table.at);
  return {
    title: heads.at(-1)?.text ?? null,
    h3: [...heads].reverse().find((h) => h.level === 3)?.text ?? null,
    weapons,
    sets,
    mainStatLabels: slotLabels(statCells),
    substatLine,
  };
}

/**
 * The "Artifact Stat Priority" table some pages add under their set ranking:
 * one cell per slot, then "Substats: CRIT >= Elemental Mastery > Energy
 * Recharge". Where a page has it, it is the page's own stat line, and it
 * is kept up to date where the build table is not (Neuvillette's build table
 * still lists ATK% substats).
 */
function parseStatPriority(html) {
  const table = tablesIn(html).find((t) => /<th\b[^>]*>\s*Stat Priority\s*<\/th>/.test(t.html));
  if (!table) return null;
  const mainStatLabels = {};
  let substatLine = null;
  for (const row of tableRows(table.html)) {
    const cells = row.filter((c) => c.tag === "td");
    if (cells.length === 3 && !Object.keys(mainStatLabels).length) {
      cells.forEach((c, i) => {
        const alt = c.html.match(/alt=['"][^'"]*\b(Hourglass|Sands|Goblet|Circlet)\b/i);
        mainStatLabels[alt ? SLOT_OF[alt[1].toLowerCase()] : ["SANDS", "GOBLET", "CIRCLET"][i]] = inlineText(c.html);
      });
    }
    for (const c of cells) {
      const line = inlineText(c.html);
      if (/^Substats\s*:/i.test(line)) {
        substatLine = line.replace(/^Substats\s*:\s*/i, "").replace(/\s*(>=|>|=)\s*/g, " $1 ").trim() || null;
      }
    }
  }
  return { mainStatLabels, substatLine };
}

/** 1 for "Best" / "1st", 2 for "2nd" / "Second Best", null for "Alternative". */
function ordinal(label) {
  const s = label.toLowerCase().trim();
  if (/^(best|1st|first best)$/.test(s)) return 1;
  const n = s.match(/^(\d+)(st|nd|rd|th)$/);
  if (n) return Number(n[1]);
  const word = { second: 2, third: 3, fourth: 4, fifth: 5 }[s.replace(/\s+best$/, "")];
  return word ?? null;
}

/**
 * A rank's label worth showing beside it ("Best for Stellar", "Alt. for
 * Freeze"), or null. Plain rank words ("Best", "2nd") and ratings repeat what
 * the rank number already says, and anything longer than a few words is the
 * guide explaining itself, which stays on its page.
 */
function rankLabel(label) {
  const text = label.replace(/[:：]\s*$/, "").trim();
  if (!text || ordinal(text) !== null) return null;
  // Star ratings, letter grades ("SS", "A+") and scores ("4.5/5").
  if (/^[★☆\s]+$|^(s{1,3}|[a-d])[+-]?$|^\d+(\.\d+)?\s*\/\s*\d+$/i.test(text)) return null;
  return text.split(/\s+/).length <= 4 ? text : null;
}

/**
 * The set ranking under "Best Artifacts". Three layouts:
 *   "Best Artifact Sets for X"  label | set(s), a notes row after each;
 *                               two sets in one cell ("A x2 | B x2") are 2+2
 *   "Artifact Rankings"         1st | set | bonus, a 2+2 rank spanning two
 *                               rows (the label cell has rowspan="2")
 *   "Rating | Set | Bonus"      Best | set | bonus
 * Rows that name no set (prose such as "2-PC EM combinations") are skipped.
 * Returns the ranks as set parts, and each rank's label (see rankLabel).
 */
function parseGame8Ranks(section, report) {
  for (const table of tablesIn(section.html)) {
    const ranks = [];
    for (const row of tableRows(table.html)) {
      const first = row[0];
      const firstLinks = linksIn(first.html);
      if (first.tag === "th" && !firstLinks.length && inlineText(first.html)) {
        const cell = row.slice(1).find((c) => linksIn(c.html).length);
        if (!cell) continue;
        ranks.push({ label: inlineText(first.html), links: linksIn(cell.html), text: inlineText(cell.html) });
      } else if (firstLinks.length && ranks.length && (first.tag === "th" || (row.length > 1 && !/colspan/.test(first.attrs)))) {
        // The second set of a 2+2 rank, in the row the label spans into.
        ranks.at(-1).links.push(...firstLinks);
        ranks.at(-1).text += ` ${inlineText(first.html)}`;
      }
    }
    if (!ranks.length) continue;

    // Keqing's page lists Best, 3rd, 2nd: where every label is a rank
    // number, the numbers decide the order, not the row order.
    if (ranks.every((r) => ordinal(r.label) !== null)) {
      const before = ranks.map((r) => r.label).join(",");
      ranks.sort((a, b) => ordinal(a.label) - ordinal(b.label));
      if (ranks.map((r) => r.label).join(",") !== before) report.push(`ranks reordered by label (${before})`);
    }

    const out = { sets: [], labels: [] };
    for (const rank of ranks) {
      if (rank.links.length === 1) {
        // A single set the page marks as a 2-piece ("2-Pc. Alternative", "x2").
        const two = /\b2\s*-?\s*p(c|iece)/i.test(rank.label) || /^x\s*2\b/i.test(rank.links[0].after);
        out.sets.push([{ name: rank.links[0].name, pieces: two ? 2 : 4 }]);
      } else if (rank.links.length === 2) {
        out.sets.push(rank.links.map((l) => ({ name: l.name, pieces: 2 })));
      } else {
        report.push(`rank "${rank.label}" names ${rank.links.length} sets (${rank.text})`);
        continue;
      }
      out.labels.push(rankLabel(rank.label));
    }
    return out;
  }
  return { sets: [], labels: [] };
}

/**
 * Teams under "Best Team Comps". Each slot cell holds the pick first and
 * any alternates after an <hr>; every name is kept, pick first. Two layouts:
 *   one table per team, titled in its header ("Mizuki's Best Stellar-Swirl Team")
 *   a table of roles (Main DPS | Sub-DPS | ...) with one team per row,
 *   titled by the heading above it ("Hu Tao Vaporize Teams")
 * Tables of teammates ("Character | Explanation") are not teams. They have
 * two cells a row, but Nahida's has a stray <tr> that runs two rows into
 * one, so they are skipped by their header.
 *
 * A table is named by the heading it sits under, not by its own title
 * cell. The headings are the page's outline and have been right wherever
 * the two disagree; the title cells get copied from table to table and not
 * always updated (Mizuki's Lunar-Charged team was titled "Mizuki's Best
 * Stellar-Swirl Team", both of Lynette's "Furina Freeze Team"). The title
 * cell names a table only where there is no heading, or where one heading
 * covers several tables and their titles are what tells them apart.
 */
export function parseGame8Teams(section) {
  const tables = [];
  for (const table of tablesIn(section.html)) {
    const rows = tableRows(table.html);
    if (!rows.length || rows[0].some((c) => c.tag === "th" && /^Explanation$/i.test(inlineText(c.html)))) continue;
    const teams = rows
      .map((row) => row.filter((c) => c.tag === "td" && !/colspan/.test(c.attrs)))
      .filter((slots) => slots.length >= 3)
      .map((slots) =>
        slots.map((c) =>
          c.html
            .split(/<hr\b/)
            .map((part) => linksIn(part)[0]?.name ?? inlineText(part))
            .filter(Boolean),
        ),
      );
    if (!teams.length) continue;
    tables.push({
      title: rows[0].length === 1 && rows[0][0].tag === "th" ? inlineText(rows[0][0].html) || null : null,
      heading: headingsBefore(section.html, table.at).at(-1)?.text ?? null,
      teams,
    });
  }
  return tables.flatMap((table) => {
    const underHeading = tables.filter((t) => t.heading === table.heading);
    const titlesTellApart = underHeading.length > 1 && underHeading.every((t) => t.title) && new Set(underHeading.map((t) => t.title)).size === underHeading.length;
    const name = table.heading && !titlesTellApart ? table.heading : (table.title ?? table.heading);
    return table.teams.map((members) => ({ name, members }));
  });
}

/**
 * "Talent Priority": either 1st | 2nd | 3rd over one row of talents, or a
 * column per role with a row per rank, where the first role is read.
 */
function parseTalentPriority(html) {
  const heading = html.match(/<h[234]\b[^>]*>(?:(?!<\/h[234]>)[\s\S])*Talent Priority(?:(?!<\/h[234]>)[\s\S])*<\/h[234]>/);
  if (!heading) return null;
  const table = tablesIn(html.slice(heading.index + heading[0].length))[0];
  if (!table) return null;
  const rows = tableRows(table.html);
  let order;
  if (rows.some((r) => r[0].tag === "th" && ordinal(inlineText(r[0].html)) !== null && r.length > 1 && r[1].tag === "td")) {
    order = rows.filter((r) => r[0].tag === "th" && ordinal(inlineText(r[0].html)) !== null).map((r) => r.find((c) => c.tag === "td")?.html ?? "");
  } else {
    order = (rows.find((r) => r.some((c) => c.tag === "td")) ?? []).filter((c) => c.tag === "td").map((c) => c.html);
  }
  const names = order.map(inlineText).filter(Boolean);
  return names.length ? names.join(" > ") : null;
}

/**
 * The stat goals a page states: its "Goal Stat Values" table (Stat | Goal
 * Value), and, where that table has no Energy Recharge row, the one-row
 * statement some build tables carry instead ("Recommended Energy Recharge
 * ±130% Total Energy Recharge"). Values are as printed, alternatives joined
 * with " / "; guide-figures.mjs reduces them to figures.
 */
function parseGoalStats(html) {
  const goals = [];
  const header = html.search(/<th\b[^>]*>\s*Stat\s*<\/th>\s*<th\b[^>]*>\s*Goal Value\s*<\/th>/i);
  if (header >= 0) {
    const table = tablesIn(html.slice(html.lastIndexOf("<table", header)))[0];
    for (const row of table ? tableRows(table.html).slice(1) : []) {
      if (row.length < 2) continue;
      const label = inlineText(row[0].html);
      if (label) goals.push({ label, value: textLines(row[1].html).join(" / ") });
    }
  }
  if (!goals.some((g) => /^energy recharge$/i.test(g.label))) {
    for (const table of tablesIn(html)) {
      // "Energy Recharge%" rows are base-stat tables, not goals; the label must be exact.
      const row = tableRows(table.html).find((r) => r.length >= 2 && /^(recommended )?energy recharge$/i.test(inlineText(r[0].html)));
      if (!row) continue;
      const value = textLines(row[1].html)
        .join(" / ")
        .replace(/±/g, "")
        .replace(/\b(total\s+)?energy recharge\b/gi, "");
      goals.push({ label: "Energy Recharge", value });
      break;
    }
  }
  return goals;
}

/**
 * A team title as a card heading: without the character's own name in
 * front (it is their page, and their team), and singular, since each card
 * shows one team.
 *   "Mizuki's Best Stellar-Swirl Team" -> "Best Stellar-Swirl Team"
 *   "Hu Tao Vaporize Teams"            -> "Vaporize Team"
 * The name stays where it is part of the title rather than in front of it
 * ("Xiangling-Bennett Duo Team", "Jean - Furina Team Comp", "Kirara in
 * Bloom Team": what would be left does not start like a title), and where
 * the title would be left saying nothing but "Team".
 */
export function teamLabel(name, stripNames) {
  if (!name) return null;
  const singular = (s) => s.replace(/\bTeams$/i, "Team").replace(/\bTeam Comps$/i, "Team Comp");
  for (const strip of [...stripNames].sort((a, b) => b.length - a.length)) {
    const rest = name.replace(new RegExp(`^${escapeRegExp(strip)}(?:'s)?\\s+`, "i"), "");
    if (rest === name) continue;
    if (/^[A-Z0-9]/.test(rest) && !/^(best\s+)?team(\s+comps?)?s?$/i.test(rest)) return singular(rest);
    break;
  }
  return singular(name);
}

/**
 * The name in the page title: "Yumemizuki Mizuki Best Builds and Teams | ..."
 * -> "Yumemizuki Mizuki", and "Pyro Traveler How to Unlock and Best Builds"
 * -> "Pyro Traveler".
 */
function game8TitleName(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title) return null;
  const m = inlineText(title[1]).match(/^(.+?)\s+(?:How to (?:Unlock|Get)(?: and)?\s+)?(?:Ratings?|Best Builds?|Builds?)\b/);
  return m ? m[1] : null;
}

function parseGame8Page(html) {
  const clean = stripNoise(html);
  const sections = h2Sections(clean);
  const builds = sections.find((s) => /\bBuilds?\b/.test(s.title) && !/Team/.test(s.title));
  const artifacts = sections.find((s) => /Artifacts/.test(s.title));
  const teams = sections.find((s) => s !== builds && /Team/.test(s.title));
  const shape = [];
  const date = html.match(/<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})[^"]*"[^>]*itemprop="dateModified"/);
  const canonical = html.match(/<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/) ?? html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/);
  return {
    titleName: game8TitleName(html),
    canonical: canonical ? canonical[1] : null,
    // The date as the page writes it, no timezone conversion.
    updated: date ? date[1] : null,
    build: builds ? parseGame8Build(builds) : null,
    statPriority: parseStatPriority(clean),
    ranks: artifacts ? parseGame8Ranks(artifacts, shape) : { sets: [], labels: [] },
    teams: teams ? parseGame8Teams(teams) : [],
    skillPriority: parseTalentPriority(clean),
    goals: parseGoalStats(clean),
    shape,
  };
}

/** The Game8 menu and build-table links: [{ label, url, fromTable }]. */
function game8IndexLinks(html) {
  const links = [];
  for (const m of html.matchAll(/<a class="menuItem-link[^"]*"[^>]*data-track-nier-value="([^"]*)"[^>]*href="([^"]*)"/g)) {
    if (/\/archives\//.test(m[2])) links.push({ label: decode(m[1]), url: new URL(m[2], GAME8).href, fromTable: false });
  }
  // "All Character Builds": one row per character, portrait link first.
  for (const m of html.matchAll(/<td class="center">\s*<a class='a-link' href=([^>\s]+)>(?:<img[^>]*>)?([^<]*)<\/a>/g)) {
    if (/\/archives\//.test(m[1]) && m[2].trim()) links.push({ label: decode(m[2].trim()), url: new URL(m[1], GAME8).href, fromTable: true });
  }
  return links;
}

// ── Matching ────────────────────────────────────────────────────────

function buildSetIndex() {
  const byName = new Map();
  for (const [id, s] of Object.entries(SETS)) byName.set(normalise(s.name), id);
  return byName;
}

function matchSet(name, setByName) {
  const key = normalise(name);
  return setByName.get(SET_ALIASES[key] ?? key) ?? null;
}

/**
 * weapon-ids.json carries the game's internal duplicates under the real
 * weapon's name (a second Haran Geppaku Futsu with a placeholder icon, three
 * Prized Isshin Blades). Where a name has more than one id, the one Project
 * Amber lists is the weapon a player can hold; if Amber cannot be reached or
 * does not settle it, the name is reported rather than guessed.
 */
async function buildWeaponIndex() {
  const byName = new Map();
  for (const [id, name] of Object.entries(WEAPONS)) {
    const key = normalise(name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(id);
  }
  let known = null;
  if ([...byName.values()].some((ids) => ids.length > 1)) {
    try {
      const res = await fetch(AMBER_WEAPONS, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      known = new Set(Object.keys((await res.json()).data.items));
    } catch (err) {
      console.warn(`  ⚠ Project Amber weapon list unavailable (${err.message}); duplicate weapon names will be reported`);
    }
  }
  const resolved = new Map();
  for (const [key, ids] of byName) {
    if (ids.length === 1) resolved.set(key, ids[0]);
    else if (known) {
      const real = ids.filter((id) => known.has(id));
      if (real.length === 1) resolved.set(key, real[0]);
    }
  }
  return resolved;
}

/** "Traveler (Cryo)", "Cryo Traveler" -> "Cryo"; null for everyone else. */
function travelerElementOf(name) {
  const m = name.match(/^Traveler\s*\((\w+)\)$/i) ?? name.match(/^(\w+)\s+Traveler$/i);
  if (!m) return null;
  return TRAVELER_ELEMENTS.find((e) => e.toLowerCase() === m[1].toLowerCase()) ?? null;
}

function matchCharacter(pageName, byName) {
  // "Traveler (Anemo)", "Tartaglia (Childe)", "Wanderer (Scaramouche)": the
  // bracket is the page's business, the id is not.
  const bare = pageName.replace(/\s*\([^)]*\)\s*$/, "");
  const key = NAME_ALIASES[normalise(bare)] ?? normalise(bare);
  if (!key) return null;
  if (byName.has(key)) return byName.get(key);
  // "Ayaka" for "Kamisato Ayaka", "Itto" for "Arataki Itto", "Raiden" for "Raiden Shogun".
  for (const [name, id] of byName) {
    const words = name.split(" ");
    if (words.includes(key) || name.endsWith(` ${key}`) || name.startsWith(`${key} `)) return id;
  }
  return null;
}

/** "traveler(anemo)" -> "Anemo"; null for every other slug. */
function travelerSlugElement(slug) {
  const m = slug.match(/^traveler\(([a-z]+)\)$/);
  return m ? m[1][0].toUpperCase() + m[1].slice(1) : null;
}

/**
 * Everyone a guide is read for, by id: each character in characters.json,
 * except that the Traveler is seven, one per element, and never one per body.
 */
function subjects() {
  const out = new Map();
  for (const [id, c] of Object.entries(CHARACTERS)) {
    if (NEVER_BUILT.has(id) || TRAVELER_IDS.includes(id)) continue;
    out.set(id, { name: c.name, element: null });
  }
  if (TRAVELER_IDS.some((id) => CHARACTERS[id])) {
    for (const element of TRAVELER_ELEMENTS) out.set(travelerId(element), { name: travelerName(element), element });
  }
  return out;
}

function wanted(id, subject) {
  if (!ONLY.size) return true;
  const name = normalise(subject.name);
  return ONLY.has(id) || ONLY.has(name) || ONLY.has(name.replace(/ /g, "")) || name.split(" ").some((w) => ONLY.has(w));
}

// ── Stats and roles ─────────────────────────────────────────────────

/**
 * One stat as the scorer names it. Main stats only, so a bare "ATK", "HP"
 * or "DEF" is the percentage (flat stats never roll on sands, goblet or
 * circlet). "CRIT" is both crit stats.
 */
function mainStatKeys(part) {
  const s = part.toLowerCase().replace(/[%.]/g, "").replace(/\s+/g, " ").trim();
  if (s === "crit") return ["CRIT_RATE", "CRIT_DMG"];
  if (s === "crit rate") return ["CRIT_RATE"];
  if (s === "crit dmg" || s === "crit damage") return ["CRIT_DMG"];
  if (s === "atk" || s === "attack") return ["ATK_PERCENT"];
  if (s === "hp") return ["HP_PERCENT"];
  if (s === "def") return ["DEF_PERCENT"];
  if (s === "elemental mastery" || s === "em") return ["ELEMENTAL_MASTERY"];
  if (s === "energy recharge" || s === "er") return ["ENERGY_RECHARGE"];
  if (/^healing( bonus)?$/.test(s)) return ["HEALING_BONUS"];
  if (/^physical (dmg|damage)( bonus)?$/.test(s)) return ["PHYSICAL_DMG"];
  const element = s.match(/^(pyro|hydro|anemo|electro|dendro|cryo|geo) (dmg|damage)( bonus)?$/);
  if (element) return [`${element[1].toUpperCase()}_DMG`];
  // Varka's goblet: whichever element the team runs.
  if (/^elemental (dmg|damage)( bonus)?$/.test(s)) return ["ELEMENTAL_DMG"];
  return null;
}

/**
 * { SANDS: "Energy Recharge or ATK%", ... } -> { SANDS: ["ENERGY_RECHARGE",
 * "ATK_PERCENT"], ... }, best first. Notes in brackets ("CRIT Rate (if
 * Favonius)") are dropped; a part that names no stat is reported.
 */
function mainStatsFrom(labels, unmapped) {
  const out = {};
  for (const slot of ["SANDS", "GOBLET", "CIRCLET"]) {
    const label = labels?.[slot];
    if (!label) continue;
    const keys = [];
    const text = label.replace(/\([^)]*\)/g, " ").replace(/crit\s*rate\s*\/\s*(?:crit\s*)?dmg/gi, "CRIT");
    for (const part of text.split(/\s*(?:>=|=|>|\/|,|\bor\b)\s*/i).map((p) => p.trim()).filter(Boolean)) {
      const found = mainStatKeys(part);
      if (!found) unmapped.add(`${part} (${slot.toLowerCase()})`);
      else for (const k of found) if (!keys.includes(k)) keys.push(k);
    }
    if (keys.length) out[slot] = keys;
  }
  return Object.keys(out).length ? out : null;
}

/** First two words of every set name, lowercased: a build titled by its set starts with one. */
const SET_PREFIXES = Object.values(SETS).map((s) => normalise(s.name).split(" ").slice(0, 2).join(" "));

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The build's title as a role: "Yumemizuki Mizuki Stellar-Swirl Build" ->
 * "Stellar-Swirl", "Support Build for Diona" -> "Support". The character's
 * names, "Best" and "Build(s)" are dropped. A title that names a set
 * ("Crimson Witch of Flames DPS") is the build's name, not a role, and the
 * heading above it ("Hu Tao Main DPS Builds") is used instead.
 */
function roleFrom(build, names) {
  const clean = (title) => {
    if (!title) return null;
    let t = ` ${title} `;
    for (const name of [...names].sort((a, b) => b.length - a.length)) {
      t = t.replace(new RegExp(`\\s${escapeRegExp(name)}(?:'s)?(?=\\s)`, "gi"), " ");
    }
    t = t
      .replace(/\sBuilds?(?=\s)/gi, " ")
      .replace(/^\s*Best\s/i, " ")
      .replace(/\sfor(\s.*)?$/i, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s\-/,]+|[\s\-/,]+$/g, "");
    return t || null;
  };
  const title = clean(build.title);
  if (title && !SET_PREFIXES.some((p) => normalise(title).startsWith(p))) return title;
  return clean(build.h3) ?? title;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const setByName = buildSetIndex();
  const weaponByName = await buildWeaponIndex();
  const charByName = new Map();
  for (const [id, c] of Object.entries(CHARACTERS)) {
    // Both Travelers answer to one name; which element is meant is read
    // from the name's bracket wherever it is used (see travelerElementOf).
    if (!charByName.has(normalise(c.name))) charByName.set(normalise(c.name), id);
  }
  const who = subjects();

  // Game8's character pages, by id. An exact name beats a name word, and the
  // build table's link (the page's own address) beats the menu's (an old id
  // that redirects to it).
  console.log("Loading Game8 character index…");
  const game8 = new Map();
  for (const [i, url] of GAME8_INDEXES.entries()) {
    if (i > 0) await sleep(DELAY_MS);
    for (const link of game8IndexLinks(await getText(url))) {
      const element = travelerElementOf(link.label);
      let id = null;
      let exact = false;
      if (element) {
        id = travelerId(element);
        exact = true;
      } else {
        id = matchCharacter(link.label, charByName);
        exact = id !== null && charByName.get(normalise(link.label)) === id;
      }
      if (!id || NEVER_BUILT.has(id)) continue;
      const seen = game8.get(id);
      if (!seen || (exact && !seen.exact) || (exact === seen.exact && link.fromTable && !seen.fromTable)) {
        game8.set(id, { url: link.url, label: link.label, exact, fromTable: link.fromTable });
      }
    }
  }
  console.log(`  ${game8.size} characters with a Game8 page`);

  const readExisting = (file) => (ONLY.size && fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")).characters ?? {}) : {});
  const characters = readExisting(OUTPUT);
  const picks = readExisting(PICKS_OUTPUT);
  // The Traveler is keyed per element; a per-body entry is from before that.
  for (const id of TRAVELER_IDS) {
    delete characters[id];
    delete picks[id];
  }
  const unmatched = [];
  const unknownSets = new Set();
  const unknownWeapons = new Set();
  const unknownMembers = new Set();
  const unmappedStats = new Set();
  const shapes = [];
  const bySource = { Game8: [], "genshin.gg": [] };
  const fallbackWhy = [];
  const roles = [];
  // The index pages were the last request; every page after waits its turn.
  const polite = () => sleep(DELAY_MS);

  /** Names -> weapon picks, deduplicated, unknown names reported. */
  const resolveWeapons = (list) => {
    const out = [];
    for (const { name, refinement } of list) {
      const weaponId = weaponByName.get(normalise(name));
      if (!weaponId) unknownWeapons.add(name);
      else if (!out.some((w) => w.id === weaponId && w.refinement === refinement)) out.push({ id: weaponId, refinement });
    }
    return out;
  };
  /**
   * A team member's id. The Traveler's is read from the element in the name
   * ("Traveler (Cryo)", "Cryo Traveler"); one named with no element is the
   * page's own Traveler on a Traveler page, and unknown anywhere else.
   */
  const memberOf = (name, selfId) => {
    const element = travelerElementOf(name);
    if (element) return travelerId(element);
    const id = matchCharacter(name, charByName);
    if (id && TRAVELER_IDS.includes(id)) return who.get(selfId)?.element ? selfId : null;
    return id;
  };
  /**
   * Team cells -> distinct teams of ids, up to MAX_TEAMS. A slot's pick is
   * the first name in it we know, and the rest are its alternates. A pick we
   * do not know yet (a character newer than our tables) hands the slot to
   * the first alternate we do, instead of leaving the team a member short.
   */
  const resolveTeams = (list, stripNames, selfId) => {
    const teams = [];
    const seen = new Set();
    for (const team of list) {
      const members = [];
      const options = [];
      for (const names of team.members) {
        const ids = [];
        for (const name of names) {
          const memberId = memberOf(name, selfId);
          if (!memberId) unknownMembers.add(name);
          else if (!ids.includes(memberId)) ids.push(memberId);
        }
        const pick = ids.find((memberId) => !members.includes(memberId));
        if (!pick) continue;
        members.push(pick);
        options.push(ids.filter((memberId) => memberId !== pick));
      }
      // An alternate that is already in the team is not an alternative to anyone.
      const alternates = options.map((ids) => ids.filter((memberId) => !members.includes(memberId)));
      // Same four in another order is the same team.
      const key = [...members].sort().join(",");
      if (members.length < 2 || seen.has(key)) continue;
      // A row without the page's own character is a list of partners for
      // them ("Recommended Main DPS" on the Electro Traveler's page), not a
      // team they are in.
      if (selfId && ![...members, ...alternates.flat()].includes(selfId)) continue;
      seen.add(key);
      teams.push({ name: teamLabel(team.name, stripNames), members, ...(alternates.some((ids) => ids.length) ? { alternates } : {}) });
      if (teams.length === MAX_TEAMS) break;
    }
    return teams;
  };
  /**
   * Named ranks -> set-recommendation ranks, capped; a rank naming an unknown
   * set is dropped whole, and its label with it.
   */
  const resolveRanks = (ranks, labels = []) => {
    const sets = [];
    const kept = [];
    ranks.slice(0, MAX_RANKS).forEach((parts, i) => {
      const resolved = parts.map((p) => {
        const setId = matchSet(p.name, setByName);
        if (!setId) unknownSets.add(p.name);
        return setId ? { setId, pieces: p.pieces } : null;
      });
      if (!resolved.every(Boolean)) return;
      sets.push(resolved);
      kept.push(labels[i] ?? null);
    });
    return { sets, labels: kept };
  };

  /** Game8's picks for one character, or the reason they cannot be used. */
  async function fromGame8(id) {
    const subject = who.get(id);
    const entry = game8.get(id);
    if (!entry) return { why: "no Game8 page" };
    await polite();
    let page;
    try {
      page = await getPage(entry.url);
    } catch (err) {
      return { why: err.message };
    }
    const parsed = parseGame8Page(page.html);
    // The title confirms the menu label pointed at the right character.
    const titleElement = parsed.titleName ? travelerElementOf(parsed.titleName) : null;
    const titleId = titleElement ? travelerId(titleElement) : parsed.titleName ? matchCharacter(parsed.titleName, charByName) : null;
    if (titleId !== id) return { why: `page title "${parsed.titleName}" is not ${subject.name}` };
    if (!parsed.build) return { why: "no build table" };
    const weapons = resolveWeapons(parsed.build.weapons);
    if (!weapons.length) return { why: "no weapons" };
    let named = parsed.ranks.sets;
    let labels = parsed.ranks.labels;
    if (!named.length && parsed.build.sets.length) {
      named = parsed.build.sets;
      labels = [];
      shapes.push(`${subject.name}: no set ranking; sets from the build table`);
    }
    const { sets, labels: setLabels } = resolveRanks(named, labels);
    if (!sets.length) return { why: "no ranked sets" };
    for (const s of parsed.shape) shapes.push(`${subject.name}: ${s}`);

    const names = [subject.name, ...subject.name.split(" "), entry.label, parsed.titleName, parsed.titleName?.replace(/\s*\([^)]*\)$/, "")]
      .concat(subject.element ? ["Traveler", `${subject.element} Traveler`] : [])
      .filter(Boolean);
    const role = roleFrom(parsed.build, names);
    roles.push(`${subject.name}: "${role}" <- "${parsed.build.title}"`);
    if (!parsed.teams.length) shapes.push(`${subject.name}: no team tables`);
    if (!parsed.skillPriority) shapes.push(`${subject.name}: no talent priority`);

    // The stat priority table where the page has one, else the build table.
    const stats = parsed.statPriority;
    const endgameStats = parsed.goals
      .map((g) => ({ label: g.label, value: endgameFigure(g.value) }))
      .filter((g) => g.value);
    const er = endgameStats.find((g) => /^energy recharge$/i.test(g.label));
    return {
      endgameStats,
      // Only what the page states: a page with no ER figure gets no ER target.
      erTarget: energyTarget(er?.value),
      source: parsed.canonical ?? page.url,
      sourceLabel: "Game8",
      sourceUpdated: parsed.updated,
      mainStats: mainStatsFrom(stats && Object.keys(stats.mainStatLabels).length ? stats.mainStatLabels : parsed.build.mainStatLabels, unmappedStats),
      role,
      weapons,
      teams: resolveTeams(parsed.teams, names, id),
      substatLine: stats?.substatLine ?? parsed.build.substatLine,
      skillPriority: parsed.skillPriority,
      sets,
      setLabels,
    };
  }

  // genshin.gg's slugs, read only if some character needs them.
  let ggSlugs = null;
  async function fromGenshinGg(id) {
    if (!ggSlugs) {
      console.log("  Loading genshin.gg character index…");
      await polite();
      const index = await getText(`${GG}/characters/`);
      // Parentheses too: the Traveler's pages are "traveler(anemo)" and so on.
      ggSlugs = [...new Set([...index.matchAll(/href="\/characters\/([a-z0-9()-]+)\/"/g)].map((m) => m[1]))];
    }
    const subject = who.get(id);
    const name = normalise(subject.name);
    const slug = subject.element
      ? ggSlugs.find((s) => travelerSlugElement(s) === subject.element)
      : ggSlugs.find((s) => s === name.replace(/ /g, "")) ??
        ggSlugs.find((s) => NAME_ALIASES[s] === name) ??
        ggSlugs.find((s) => !travelerSlugElement(s) && name.split(" ").includes(s));
    if (!slug) return { why: "no genshin.gg page" };
    await polite();
    const html = await getText(`${GG}/characters/${slug}/`);
    const title = toText(html).match(/## H1: Genshin Impact (.+?) Build/);
    if (!title) return { why: `genshin.gg ${slug} has no build page` };
    const pageId = matchCharacter(title[1].trim(), charByName);
    if (subject.element ? !TRAVELER_IDS.includes(pageId) : pageId !== id) return { why: `genshin.gg ${slug} is "${title[1].trim()}"` };

    const page = parseGgPicks(html);
    const ranks = parseArtifacts(toText(html));
    if (!ranks || ranks.length === 0) unmatched.push(`${slug} (no artifact list)`);
    const ggSets = resolveRanks(ranks ?? []);
    return {
      source: `${GG}/characters/${slug}/`,
      sourceLabel: "genshin.gg",
      // genshin.gg prints no date on its pages.
      sourceUpdated: null,
      // Nor any stat goals, so no ER target either.
      endgameStats: [],
      erTarget: null,
      mainStats: mainStatsFrom(page.mainStatLabels, unmappedStats),
      role: page.role,
      weapons: resolveWeapons(page.weapons),
      teams: resolveTeams(page.teams, [], id),
      substatLine: page.substatLine,
      skillPriority: null,
      sets: ggSets.sets,
      setLabels: ggSets.labels,
    };
  }

  for (const [id, subject] of who) {
    if (!wanted(id, subject)) continue;

    let result = await fromGame8(id);
    if (!result.sourceLabel) {
      fallbackWhy.push(`${subject.name} (${result.why})`);
      result = await fromGenshinGg(id);
    }
    if (!result.sourceLabel) {
      unmatched.push(`${subject.name} (${result.why})`);
      continue;
    }
    bySource[result.sourceLabel].push(subject.name);

    picks[id] = {
      name: subject.name,
      source: result.source,
      sourceLabel: result.sourceLabel,
      sourceUpdated: result.sourceUpdated,
      mainStats: result.mainStats,
      role: result.role,
      weapons: result.weapons,
      teams: result.teams,
      synergies: [],
      substatLine: result.substatLine,
      endgameStats: result.endgameStats,
      skillPriority: result.skillPriority,
      tracePriority: null,
    };
    // These feed the scorer's set-bonus verdict and "farm this set" advice.
    // The Traveler's are per element, and the scorer reads the entry for the
    // element the player's Traveler is on.
    if (result.sets.length) {
      characters[id] = {
        name: subject.name,
        sets: result.sets,
        // The guide's short label per rank ("Best for Stellar"), in step with `sets`.
        ...(result.setLabels.some(Boolean) ? { labels: result.setLabels } : {}),
        // The guide's main stats, which the scorer accepts alongside the curated ones.
        ...(result.mainStats ? { mainStats: result.mainStats } : {}),
        // The Energy Recharge the page states, the scorer's only ER target.
        ...(result.erTarget ? { erTarget: result.erTarget } : {}),
        source: result.source,
        sourceLabel: result.sourceLabel,
      };
    }
    console.log(
      `  ${subject.name.padEnd(22)} ${result.sourceLabel.padEnd(10)} ${result.sets.length} sets, ${result.weapons.length} weapons, ${result.teams.length} teams${result.sourceUpdated ? `, updated ${result.sourceUpdated}` : ""}`,
    );
  }

  // By avatar id, the Traveler's elements after the body they are keyed on.
  const byId = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => parseInt(a) - parseInt(b) || a.localeCompare(b)));
  const missing = [...who].filter(([id]) => !picks[id]).map(([, subject]) => subject.name);
  const fetchedAt = new Date().toISOString();
  const indexUrl = GAME8_INDEXES.at(-1);
  const output = {
    source: indexUrl,
    fetchedAt,
    // Kept with the data, not just printed: a recommendation naming one of
    // these was dropped whole, and refresh.mjs lists them for a person.
    ...(unknownSets.size ? { unmatchedSets: [...unknownSets].sort() } : {}),
    characters: byId(characters),
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`\n  ✔ wrote ${Object.keys(characters).length} characters to ${path.relative(ROOT, OUTPUT)}`);

  const picksOutput = { source: indexUrl, fetchedAt, characters: byId(picks) };
  fs.writeFileSync(PICKS_OUTPUT, JSON.stringify(picksOutput, null, 2) + "\n");
  console.log(`  ✔ wrote ${Object.keys(picks).length} characters to ${path.relative(ROOT, PICKS_OUTPUT)}`);
  console.log(`  Game8: ${bySource.Game8.length}, genshin.gg: ${bySource["genshin.gg"].length}${bySource["genshin.gg"].length ? ` (${bySource["genshin.gg"].join(", ")})` : ""}`);

  if (fallbackWhy.length) console.log(`  ⚠ fell back to genshin.gg: ${fallbackWhy.join(", ")}`);
  if (unknownSets.size) console.log(`  ⚠ set names not in artifacts.json: ${[...unknownSets].join(", ")}`);
  if (unknownWeapons.size) console.log(`  ⚠ weapon names not matched in weapon-ids.json: ${[...unknownWeapons].join(", ")}`);
  if (unknownMembers.size) console.log(`  ⚠ team members not matched to a character: ${[...unknownMembers].join(", ")}`);
  if (unmappedStats.size) console.log(`  ⚠ main stat labels with no scorer key: ${[...unmappedStats].join(", ")}`);
  if (shapes.length) console.log(`  ⚠ page shapes to check:\n      ${shapes.join("\n      ")}`);
  if (unmatched.length) console.log(`  ⚠ characters not matched to a page: ${unmatched.join(", ")}`);
  if (missing.length) console.log(`  ⚠ characters with no picks: ${missing.join(", ")}`);
  if (process.env.SHOW_ROLES) console.log(`  roles:\n      ${roles.join("\n      ")}`);
}

// Only as a script: the tests import the page readers without starting a fetch.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
