/**
 * fetch-prydwen-sets.mjs
 * ──────────────────────────────────────────────────────────────────
 * Recommended relic / disc sets from Prydwen's build guides, for Star Rail
 * and Zenless, written to:
 *
 *   src/hsr/data/set-recommendations.json   relicSets + ornamentSets
 *   src/zzz/data/set-recommendations.json   sets
 *
 * The same visit also reads the rest of the guide's picks (weapons, teams,
 * synergies, substat line, endgame stats, skill and trace priority) and the
 * date the guide says it was last updated, into the shape
 * src/lib/buildTarget/guide.ts calls GuidePicksFile:
 *
 *   src/hsr/data/guide-picks.json
 *   src/zzz/data/guide-picks.json
 *
 * Only facts are kept: names mapped to ids, ranks as order, stat lines and
 * priorities. Prydwen's commentary, relative DPS figures, usage and
 * appearance rates and tier ratings are read past, never stored.
 *
 * Fribbels publishes sets for the characters it simulates, which leaves the
 * supports out; Prydwen lists sets for everyone, so this fills the gaps and
 * covers Zenless entirely. The runtime prefers Fribbels where it has an
 * answer and falls back to this file.
 *
 * Every guide's build tab renders the same blocks:
 *
 *   BEST RELIC SETS            1 / <Name> (4-PC) / … / 2 / <Name> (2-PC)
 *   Best Planetary Sets        1 / <Name> (2-PC) / …
 *   BEST DISK DRIVES SETS      1 / <Name> (4-PC) / … / 2P / <Name> / (Recommended)
 *
 * Set names are matched against each game's sets table; anything that does
 * not match is reported rather than guessed.
 *
 * Prydwen sits behind a Cloudflare check that a headless browser fails, so
 * this runs a visible Edge window (same as fetch-zzz-weights.mjs). Expect it
 * to open and close on its own; PRYDWEN_BROWSER=chrome switches browsers.
 *
 * Usage: node scripts/fetch-prydwen-sets.mjs [hsr|zzz] [--only=slug,slug]
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { endgameFigure, trimQualifiers } from "./guide-figures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://www.prydwen.gg";
const DELAY_MS = 900;
/** Ranks past this are alternatives rather than recommendations. */
const MAX_RANKS = 3;

/** Team rows past this are variations on the same few cores. */
const MAX_TEAMS = 4;

const ONLY = new Set((process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean));
const GAMES = process.argv.filter((a) => a === "hsr" || a === "zzz");
if (GAMES.length === 0) GAMES.push("hsr", "zzz");

function normalise(name) {
  return name.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Some of Prydwen's text is UTF-8 that was decoded as Latin-1 on their side
 * ("Module Î±" for the game's "Module α"). Re-decoding fixes it; a string
 * with anything past Latin-1 in it cannot be that mistake and is left alone.
 */
function demojibake(s) {
  if (typeof s !== "string" || !/[Â-ô][\u0080-¿]/.test(s) || /[^\u0000-ÿ]/.test(s)) return s;
  const fixed = Buffer.from(s, "latin1").toString("utf8");
  return fixed.includes("�") ? s : fixed;
}

const HSR = {
  section: "star-rail",
  output: path.join(ROOT, "src", "hsr", "data", "set-recommendations.json"),
  picksOutput: path.join(ROOT, "src", "hsr", "data", "guide-picks.json"),
  characters: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "hsr", "data", "characters.json"), "utf8")),
  weapons: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "hsr", "data", "light-cones.json"), "utf8")),
  /** Guide headings, matched against each `.content-header`'s text. */
  headings: {
    weapons: /^best light cones?$/i,
    stats: /^(best|relic|main) stats$/i,
    endgame: /endgame stats/i,
    traces: /^traces? priority$/i,
    synergy: /^synerg/i,
    // The first mode's rows (Memory of Chaos); the switcher renders one mode at a time.
    teams: /^teams$/i,
  },
  sets: Object.fromEntries(
    Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, "src", "hsr", "data", "sets.json"), "utf8"))).map(([id, name]) => [id, { name }]),
  ),
  /**
   * Prydwen's names where they differ from StarRailRes', both sides already
   * normalised. "name|Path" picks one of several ids sharing a name: the
   * Trailblazer has a pair per Path, March 7th has a Path-change form.
   */
  aliases: {
    "march 7th the hunt": "march 7th|Rogue",
    "march 7th": "march 7th|Knight",
    "march 7th evernight": "evernight",
    "tingyun fugue": "fugue",
    "trailblazer destruction": "trailblazer caelus|Warrior",
    "trailblazer preservation": "trailblazer caelus|Knight",
    "trailblazer harmony": "trailblazer caelus|Shaman",
    "trailblazer remembrance": "trailblazer caelus|Memory",
    "trailblazer elation": "trailblazer caelus|Elation",
  },
  parse(text) {
    const relicBlock = block(text, /BEST RELIC SETS/i, /Best Planetary Sets|BEST PLANAR|BEST STATS|RELIC STATS/i);
    const planarBlock = block(text, /Best Planetary Sets|BEST PLANAR SETS/i, /Best Specialist|BEST STATS|RELIC STATS|MAIN STATS/i);
    return {
      relicSets: rankedPicks(relicBlock).slice(0, MAX_RANKS),
      ornamentSets: rankedPicks(planarBlock).slice(0, MAX_RANKS),
    };
  },
};

const ZZZ = {
  section: "zenless",
  output: path.join(ROOT, "src", "zzz", "data", "set-recommendations.json"),
  picksOutput: path.join(ROOT, "src", "zzz", "data", "guide-picks.json"),
  characters: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "agents.json"), "utf8")),
  sets: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "sets.json"), "utf8")),
  weapons: JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "weapons.json"), "utf8")),
  headings: {
    // The block also names the team the figures were calculated with
    // ("Dialyn + Yesterday Calls"); only the ranked accordions are picks.
    weapons: /^best w-engines?$/i,
    stats: /^best disk drives? stats$/i,
    endgame: /endgame stats/i,
    skills: /^skills? priority$/i,
    synergy: /^synerg/i,
    teams: /^teams \(shiyu defense\)$/i,
  },
  /** Prydwen's names, normalised, to Enka's. */
  aliases: {
    "anby soldier 0": "soldier 0 anby",
    "billy starlight": "starlight billy",
    "jane doe": "jane",
    "anby demara": "anby",
    "billy kid": "billy",
    "grace howard": "grace",
    "nicole demara": "nicole",
    "ukinami yuzuha": "yuzuha",
    "orphie and magus": "orphie & magus",
  },
  parse(text) {
    const discBlock = block(text, /BEST DISK DRIVES? SETS/i, /BEST DISK DRIVES? STATS/i);
    return { sets: discPicks(discBlock).slice(0, MAX_RANKS) };
  },
};

/** The text between two headings, or "" when the first is absent. */
function block(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start < 0) return "";
  const rest = text.slice(start + 1);
  const end = rest.search(endRe);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * "1 / Name (4-PC) / … / 2 / Name (2-PC)" -> [[{name, pieces}], …] in rank
 * order. The "Flex" rank, a list of 2-piece bonuses to mix, is skipped: it
 * is advice for when you have nothing, not a recommendation.
 */
function rankedPicks(text) {
  const picks = [];
  // Damage dealers are ranked by a relative DPS figure ("100.00%") rather
  // than a number; both shapes are read.
  const re = /^\s*(\d+(?:\.\d+)?%?)\s*\n+\s*(.+?) \((4|2)-PC\)\s*$/gm;
  let m;
  while ((m = re.exec(text))) {
    const name = m[2].trim();
    if (/^flex$/i.test(name)) continue;
    picks.push([{ name, pieces: Number(m[3]) }]);
  }
  return picks;
}

/**
 * "1 / Name (4-PC) / … / 2P / Partner / (Recommended)" -> the 4-piece with
 * its recommended 2-piece partner, when one is marked.
 */
function discPicks(text) {
  const picks = [];
  // Ranks are a bare number, or a relative DPS figure on damage dealers.
  const chunks = text.split(/^\s*\d+(?:\.\d+)?%?\s*$/m).slice(1);
  for (const chunk of chunks) {
    const four = chunk.match(/^\s*(.+?) \(4-PC\)/m);
    if (!four) continue;
    const parts = [{ name: four[1].trim(), pieces: 4 }];
    const partner = chunk.match(/2P\s*\n+\s*(.+?)\s*\n+\s*\(Recommended\)/);
    if (partner) parts.push({ name: partner[1].trim(), pieces: 2 });
    picks.push(parts);
  }
  return picks;
}

/**
 * Runs in the page. Reads the blocks under each wanted `.content-header` by
 * structure rather than by text: names come from links and image alts, so a
 * paragraph that mentions three partners still yields three ids, and the
 * prose around them is never read. Every tab's content is already in the
 * DOM (the hidden ones are display:none), so this uses textContent and does
 * not depend on which tab is showing. A heading that is missing yields no
 * key, and each list comes back empty rather than throwing.
 *
 * Self-contained on purpose: Playwright serialises the function source.
 */
function extractGuide(wanted) {
  const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;
  const headers = [...document.querySelectorAll(".content-header")];
  const linkOf = (a) => ({
    slug: (a.getAttribute("href") ?? "").replace(/[?#].*$/, "").replace(/\/$/, "").split("/").pop(),
    name:
      clean(a.querySelector(".inline-name")?.textContent) ||
      a.querySelector("img.character-icon-responsive, img")?.getAttribute("alt")?.trim() ||
      clean(a.textContent),
  });
  // A list item's own text, without the lists nested inside it.
  const ownText = (li) => {
    const copy = li.cloneNode(true);
    copy.querySelectorAll("ul, ol").forEach((l) => l.remove());
    return clean(copy.textContent);
  };

  const out = { sections: {}, role: null };
  for (const [key, source] of Object.entries(wanted)) {
    const re = new RegExp(source, "i");
    const at = headers.findIndex((h) => re.test(clean(h.textContent)));
    if (at < 0) continue;
    const head = headers[at];
    const next = headers[at + 1];
    const inside = (el) => head.compareDocumentPosition(el) & FOLLOWING && (!next || el.compareDocumentPosition(next) & FOLLOWING);
    const all = (sel) => [...document.querySelectorAll(sel)].filter(inside);

    const weapons = all(".hsr-light-cone .pw-accordion-button, .zzz-engine .pw-accordion-button").map((b) => ({
      name: clean(b.querySelector("[class*=set-name]")?.textContent) || b.querySelector("img")?.getAttribute("alt")?.trim() || "",
      refinement: clean(b.querySelector(".cone-super")?.textContent),
    }));
    const links = all('a[href*="/characters/"]')
      .filter((a) => !a.closest(".team-row"))
      .map(linkOf);
    const container = all("[class*=team-container]")[0];
    const teams = (container ? [...container.querySelectorAll(".team-row")] : all(".team-row")).map((row) =>
      [...row.querySelectorAll('a[href*="/characters/"]')].map(linkOf),
    );
    // "Substats:" / "Skills priority:" boxes: a label span and the line.
    const boxes = all(".sub-stats").map((box) => {
      const label = clean(box.querySelector("span")?.textContent);
      const copy = box.cloneNode(true);
      copy.querySelector("span")?.remove();
      return { label, value: clean(copy.textContent) };
    });
    // Only the first list: a guide with two builds ("Crit March" / "Break
    // March") prints one list each, and the contract has room for one.
    const lists = all("ul, ol").filter((l) => !l.parentElement?.closest("li"));
    const items = [...(lists[0]?.children ?? [])]
      .filter((li) => li.tagName === "LI")
      .map((li) => ({ text: ownText(li), sub: [...li.querySelectorAll(":scope > ul > li, :scope > ol > li")].map(ownText) }));
    // Zenless draws its skill order as cards with an icon between each pair.
    const skills = [];
    const priority = all(".skill-priority")[0];
    for (const el of priority ? priority.children : []) {
      if (el.classList.contains("skill")) skills.push({ skill: clean(el.textContent) || el.querySelector("img")?.getAttribute("alt")?.trim() || "" });
      else if (el.classList.contains("order") && !el.classList.contains("mobile")) {
        skills.push({ order: el.querySelector("svg")?.getAttribute("data-icon") || clean(el.textContent) });
      }
    }
    out.sections[key] = { weapons, links, teams, boxes, items, lists: lists.length, skills };
  }

  // The role label heads the tier ratings: Star Rail prints it beside an
  // icon ("Damage dealer"), Zenless as a plain heading ("Crit DPS"). Some
  // Star Rail pages leave it empty. The ratings themselves are not read.
  const ratings = document.querySelector(".ratings-container, .detailed-ratings");
  const roleHead = ratings?.previousElementSibling;
  if (roleHead?.tagName === "H5") out.role = clean(roleHead.textContent) || null;
  return out;
}

/** Zenless's skill-order icons. Anything else is reported, not guessed. */
const ORDER_ICONS = { "angles-right": ">", "angle-right": ">", "chevron-right": ">", "arrow-right": ">", equals: "=", ">": ">", "=": "=", ">=": ">=" };

/**
 * The page's raw blocks -> GuidePicks. Names are resolved by the caller's
 * lookups; whatever does not resolve is collected in `report` and dropped.
 */
function buildPicks(guide, { who, weaponId, memberId, ownIds }, report) {
  const sections = guide.sections ?? {};
  const empty = { weapons: [], links: [], teams: [], boxes: [], items: [], lists: 0, skills: [] };
  const sec = (key) => ({ ...empty, ...(sections[key] ?? {}) });
  // Guides that print more than the contract holds: the first is kept.
  const substatBoxes = sec("stats").boxes.filter((b) => /^substats/i.test(b.label)).length;
  if (substatBoxes > 1) report.shapes.push(`${who}: ${substatBoxes} substat lines, kept the first`);
  if (sec("endgame").lists > 1) report.shapes.push(`${who}: ${sec("endgame").lists} endgame stat lists, kept the first`);
  const boxValue = (key, re) => {
    const value = sec(key).boxes.find((b) => re.test(b.label))?.value;
    return value ? demojibake(value) : null;
  };

  const weapons = [];
  for (const w of sec("weapons").weapons) {
    const id = weaponId(w.name);
    if (!id) {
      report.weapons.add(w.name);
      continue;
    }
    const refinement = Number(w.refinement.match(/S\s*(\d)/i)?.[1]) || null;
    // The same weapon can be ranked twice at different refinements (S5 and S1).
    if (!weapons.some((x) => x.id === id && x.refinement === refinement)) weapons.push({ id, refinement });
  }

  const synergies = [];
  for (const link of sec("synergy").links) {
    const id = memberId(link);
    if (!id) report.members.add(link.name || link.slug);
    else if (!ownIds.includes(id) && !synergies.includes(id)) synergies.push(id);
  }

  // A team with a member we cannot name is dropped whole; so is a repeat of
  // one already taken in another order.
  const teams = [];
  const seen = new Set();
  for (const row of sec("teams").teams) {
    if (teams.length >= MAX_TEAMS) break;
    const members = [];
    for (const link of row) {
      const id = memberId(link);
      if (!id) report.members.add(link.name || link.slug);
      if (!members.includes(id)) members.push(id);
    }
    if (members.length === 0 || members.includes(null)) continue;
    const key = [...members].sort().join("+");
    if (seen.has(key)) continue;
    seen.add(key);
    teams.push({ name: null, members });
  }

  // "HP: 2800-3000+". A label with an empty value takes its nested list
  // when that is figures ("DEF:" / "1800 - 2200+ (EHR build)"); nested
  // prose is commentary and is left out, with the label.
  const endgameStats = [];
  for (const item of sec("endgame").items) {
    const m = item.text.match(/^([^:]{1,40}?)\s*:\s*(.*)$/);
    if (!m) continue;
    let value = m[2];
    if (!value && item.sub.length && item.sub.every((s) => s.length <= 60 && /\d/.test(s))) value = item.sub.join(" / ");
    if (!value || value.length > 120) continue;
    const figure = endgameFigure(demojibake(value));
    if (figure) endgameStats.push({ label: demojibake(m[1]), value: figure });
  }

  let skillPriority = boxValue("traces", /^skills? priority/i);
  const cards = sec("skills").skills;
  if (!skillPriority && cards.length) {
    const parts = [];
    for (const c of cards) {
      if (c.skill !== undefined) parts.push(c.skill);
      else if (ORDER_ICONS[c.order]) parts.push(ORDER_ICONS[c.order]);
      else {
        report.orders.add(c.order);
        parts.length = 0;
        break;
      }
    }
    skillPriority = parts.length ? demojibake(parts.join(" ")) : null;
  }

  const substatLine = boxValue("stats", /^substats/i);
  const tracePriority = boxValue("traces", /^major traces? priority/i);
  return {
    role: guide.role ?? null,
    weapons,
    teams,
    synergies,
    substatLine: substatLine ? trimQualifiers(substatLine) : null,
    endgameStats,
    skillPriority: skillPriority ? trimQualifiers(skillPriority) : null,
    tracePriority: tracePriority ? trimQualifiers(tracePriority) : null,
  };
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * The guide's own "Last updated" date -> YYYY-MM-DD. Prydwen prints it as
 * day/month-name/year, the month short or long ("31/May/2026",
 * "09/September/2026"). Anything else is null, and the caller reports it.
 */
export function guideDate(raw) {
  const m = (raw ?? "").trim().match(/^(\d{1,2})[\/\s.-]+([a-z]{3,})\.?[\/\s.-]+(\d{4})$/i);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
  const day = Number(m[1]);
  if (!month || day < 1 || day > 31) return null;
  return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Waits out Cloudflare's interstitial, which titles itself "Just a moment...". */
async function settle(page) {
  for (let i = 0; i < 30; i++) {
    if (!/just a moment/i.test(await page.title())) return;
    await page.waitForTimeout(1000);
  }
}

/**
 * The build tab's visible text (for the set lists), the guide's picks blocks
 * and the raw "Last updated" date from the page's title block (not the
 * update tracker further down, whose dates are per section).
 */
async function readBuildTab(page, url, headings) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.waitForTimeout(DELAY_MS);
  const { text, updated } = await page.evaluate(async () => {
    const tab = [...document.querySelectorAll(".tabs .single-tab")].find((e) => /build/i.test(e.textContent));
    if (tab) tab.click();
    await new Promise((r) => setTimeout(r, 700));
    const line = [...document.querySelectorAll(".character-top p")].find((p) => /^\s*last updated/i.test(p.textContent));
    const updated = line ? (line.querySelector("span")?.textContent ?? line.textContent.replace(/^\s*last updated\s*:?/i, "")).trim() : null;
    return { text: document.body.innerText, updated };
  });
  const wanted = Object.fromEntries(Object.entries(headings).map(([k, re]) => [k, re.source]));
  // A page whose layout breaks the extractor still yields its sets.
  const guide = await page.evaluate(extractGuide, wanted).catch((err) => {
    console.log(`\n    picks not read: ${err.message.split("\n")[0]}`);
    return { sections: {}, role: null };
  });
  return { text, guide, updated };
}

async function run(game, page) {
  const setByName = new Map();
  for (const [id, s] of Object.entries(game.sets)) setByName.set(normalise(s.name), id);

  // Name -> ids. The Trailblazer has one id per gender per Path, so a name
  // can carry a Path qualifier and map to two ids.
  const idsByName = new Map();
  for (const [id, c] of Object.entries(game.characters)) {
    const key = normalise(c.name);
    idsByName.set(key, [...(idsByName.get(key) ?? []), id]);
    if (c.path) idsByName.set(`${key}|${c.path}`, [...(idsByName.get(`${key}|${c.path}`) ?? []), id]);
  }

  console.log(`\nLoading Prydwen ${game.section} index…`);
  await page.goto(`${BASE}/${game.section}/characters/`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const consent = page.getByRole("button", { name: /do not consent/i });
  if (await consent.count()) await consent.first().click().catch(() => {});
  await page.waitForSelector(`a[href^="/${game.section}/characters/"]`, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const links = await page.evaluate((section) => {
    const m = new Map();
    document.querySelectorAll(`a[href^="/${section}/characters/"]`).forEach((a) => {
      const slug = a.getAttribute("href").replace(/\/$/, "").split("/").pop();
      const name = (a.querySelector("h4, h5, [class*=name]")?.textContent || a.textContent).trim().split("\n")[0];
      if (slug && name && !m.has(slug)) m.set(slug, name);
    });
    return [...m.entries()];
  }, game.section);
  console.log(`  ${links.length} characters to read`);

  const idsFor = (prydwenName) => {
    const raw = normalise(prydwenName);
    // Alias values are "name" or "name|Path"; only the name part is normalised.
    const [aliasName, aliasPath] = (game.aliases[raw] ?? raw).split("|");
    const key = aliasPath ? `${normalise(aliasName)}|${aliasPath}` : normalise(aliasName);
    // Trailblazer aliases carry "|Path"; the Stelle ids share the guide.
    return [...(idsByName.get(key) ?? []), ...(key.includes("|") ? idsByName.get(key.replace("caelus", "stelle")) ?? [] : [])];
  };

  const weaponByName = new Map();
  for (const [id, w] of Object.entries(game.weapons)) if (!weaponByName.has(normalise(w.name))) weaponByName.set(normalise(w.name), id);

  // Team and synergy links are read by slug, through the index's own name
  // for it, so they resolve exactly as the guide pages do. A person is one
  // id in a list: the Trailblazer takes the first (Caelus) id, and each of
  // the page's own ids gets itself in its teams.
  const nameBySlug = new Map(links);
  const memberId = (link) => idsFor(nameBySlug.get(link.slug) ?? link.name)[0] ?? null;

  const characters = ONLY.size && fs.existsSync(game.output) ? (JSON.parse(fs.readFileSync(game.output, "utf8")).characters ?? {}) : {};
  const picksById =
    ONLY.size && fs.existsSync(game.picksOutput) ? (JSON.parse(fs.readFileSync(game.picksOutput, "utf8")).characters ?? {}) : {};
  const unmatched = [];
  const unknownSets = new Set();
  const noPicks = [];
  const undated = [];
  const badDates = [];
  const report = { weapons: new Set(), members: new Set(), orders: new Set(), shapes: [] };
  const coverage = { read: 0, weapons: 0, teams: 0, synergies: 0, substatLine: 0, endgameStats: 0, skillPriority: 0, tracePriority: 0, role: 0 };
  const lacking = { weapons: [], teams: [], skillPriority: [] };

  for (const [slug, prydwenName] of links) {
    if (ONLY.size && !ONLY.has(slug)) continue;
    const ids = idsFor(prydwenName);
    if (ids.length === 0) {
      unmatched.push(prydwenName);
      continue;
    }

    process.stdout.write(`  ${prydwenName.padEnd(28)} `);
    const source = `${BASE}/${game.section}/characters/${slug}`;
    const { text, guide, updated } = await readBuildTab(page, source, game.headings);
    const parsed = game.parse(text);
    const sourceUpdated = guideDate(updated);
    if (updated === null) undated.push(prydwenName);
    else if (!sourceUpdated) badDates.push(`${prydwenName} ("${updated}")`);

    const picks = buildPicks(
      guide,
      { who: prydwenName, weaponId: (name) => weaponByName.get(normalise(name)) ?? null, memberId, ownIds: ids },
      report,
    );
    const found = [
      picks.weapons.length && `${picks.weapons.length} weapons`,
      picks.teams.length && `${picks.teams.length} teams`,
      picks.synergies.length && `${picks.synergies.length} synergies`,
      picks.endgameStats.length && `${picks.endgameStats.length} endgame`,
      picks.substatLine && "substats",
      picks.skillPriority && "skills",
      picks.tracePriority && "traces",
      picks.role && `role "${picks.role}"`,
    ].filter(Boolean);
    const picksLine = found.length ? found.join(", ") : "no picks";
    if (found.length) {
      coverage.read++;
      for (const k of Object.keys(coverage)) if (k !== "read" && (Array.isArray(picks[k]) ? picks[k].length : picks[k])) coverage[k]++;
      for (const k of Object.keys(lacking)) if (Array.isArray(picks[k]) ? !picks[k].length : !picks[k]) lacking[k].push(prydwenName);
      for (const id of ids) {
        picksById[id] = {
          name: game.characters[id].name,
          source,
          sourceLabel: "Prydwen",
          sourceUpdated,
          // Only Genshin's guides are read for main stats.
          mainStats: null,
          ...picks,
          teams: picks.teams.map((t) => ({ ...t, members: t.members.map((m) => (ids.includes(m) ? id : m)) })),
        };
      }
    } else {
      noPicks.push(prydwenName);
    }

    // Names to ids; a recommendation with an unknown set is dropped whole.
    const resolve = (picks) =>
      picks
        .map((parts) =>
          parts.map((p) => {
            const setId = setByName.get(normalise(p.name));
            if (!setId) unknownSets.add(p.name);
            return setId ? { setId, pieces: p.pieces } : null;
          }),
        )
        .filter((parts) => parts.length > 0 && parts.every(Boolean));

    const entry = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, resolve(v)]));
    const counts = Object.values(entry).map((v) => v.length);
    if (counts.every((n) => n === 0)) {
      console.log(`no sets found | ${picksLine}`);
      unmatched.push(`${prydwenName} (no set list)`);
      continue;
    }
    for (const id of ids) {
      characters[id] = { name: game.characters[id].name, ...entry, source };
    }
    console.log(`${counts.join("/")} | ${picksLine}`);
  }

  const byId = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => Number(a) - Number(b)));
  const missing = Object.keys(game.characters).filter((id) => !characters[id]).map((id) => `${game.characters[id].name} (${id})`);
  const output = {
    source: `${BASE}/${game.section}/characters/`,
    fetchedAt: new Date().toISOString(),
    characters: byId(characters),
  };
  fs.writeFileSync(game.output, JSON.stringify(output, null, 2) + "\n");
  console.log(`\n  ✔ wrote ${Object.keys(characters).length} characters to ${path.relative(ROOT, game.output)}`);
  if (unknownSets.size) console.log(`  ⚠ set names not in the sets table: ${[...unknownSets].join(", ")}`);
  if (unmatched.length) console.log(`  ⚠ on Prydwen but not matched: ${unmatched.join(", ")}`);
  if (missing.length) console.log(`  ⚠ no guide found for: ${missing.join(", ")}`);

  const picksOutput = { source: output.source, fetchedAt: output.fetchedAt, characters: byId(picksById) };
  fs.writeFileSync(game.picksOutput, JSON.stringify(picksOutput, null, 2) + "\n");
  console.log(`  ✔ wrote picks for ${Object.keys(picksById).length} characters to ${path.relative(ROOT, game.picksOutput)}`);
  console.log(
    `    of ${coverage.read} guides read this run: ` +
      Object.entries(coverage)
        .filter(([k]) => k !== "read")
        .map(([k, n]) => `${k} ${n}`)
        .join(", "),
  );
  const dated = Object.values(picksById).filter((p) => p.sourceUpdated).length;
  console.log(`    last-updated dates: ${dated} of ${Object.keys(picksById).length} entries`);
  if (undated.length) console.log(`  ⚠ no "Last updated" line: ${undated.join(", ")}`);
  if (badDates.length) console.log(`  ⚠ "Last updated" not read as a date: ${badDates.join(", ")}`);
  for (const [k, names] of Object.entries(lacking)) if (names.length) console.log(`  ⚠ no ${k}: ${names.join(", ")}`);
  if (noPicks.length) console.log(`  ⚠ guide pages with no picks: ${noPicks.join(", ")}`);
  if (report.weapons.size) console.log(`  ⚠ weapon names not in the weapons table: ${[...report.weapons].join(", ")}`);
  if (report.members.size) console.log(`  ⚠ team / synergy names not matched: ${[...report.members].join(", ")}`);
  if (report.orders.size) console.log(`  ⚠ skill order icons not recognised (priority left empty): ${[...report.orders].join(", ")}`);
  for (const note of report.shapes) console.log(`  ⚠ ${note}`);
}

async function main() {
  const channel = process.env.PRYDWEN_BROWSER === "chrome" ? "chrome" : "msedge";
  const browser = await chromium.launch({ channel, headless: process.env.PRYDWEN_HEADLESS === "1" });
  const context = await browser.newContext({ locale: "en-US", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);
  try {
    for (const game of GAMES) await run(game === "hsr" ? HSR : ZZZ, page);
  } finally {
    await browser.close();
  }
}

// Run only as a script, so the text helpers above can be imported without
// opening a browser.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
