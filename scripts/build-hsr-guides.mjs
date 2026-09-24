/**
 * build-hsr-guides.mjs
 * ------------------------------------------------------------------
 * Builds the long-form half of every Star Rail build page: one GuideFile per
 * character (src/lib/buildTarget/guide.ts is the contract) plus the shared
 * relic set bonus text.
 *
 * Two inputs, kept apart the way the contract describes:
 *
 *   Picks      src/hsr/data/guide-picks.json, written by
 *              scripts/fetch-prydwen-sets.mjs. Copied across as facts; a
 *              character the scraper has not covered gets empty picks and
 *              `source: null`, never a guess.
 *   Game data  Mar-7th/StarRailRes index_min/en, the same mirror
 *              fetch-hsr-data.js and fetch-hsr-stats.mjs read, so ids, names
 *              and icons line up with the rest of the site.
 *
 * Usage: node scripts/build-hsr-guides.mjs [--picks=<path>] [--fresh] [--rebaseline]
 *   --picks=<path>  read picks from another file (a test fixture, say)
 *   --fresh         re-download every table even if the cache looks current
 *
 * Output: src/hsr/data/guides/<id>.json   one per id in characters.json
 *         src/hsr/data/set-bonuses.json   every set in sets.json
 *
 * Raw tables are cached in node_modules/.cache/aurum-guides/hsr/ and only
 * re-downloaded when StarRailRes's info.json says the upstream data changed.
 *
 * Every piece of game text is checked before anything is written: no tags,
 * no unresolved "#n[...]" placeholders, no unbalanced "**". A failure stops
 * the run with a list of offenders rather than shipping a broken tooltip.
 * (The picks are the guide's own lines and pass through untouched.)
 * ------------------------------------------------------------------
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withKitTracking } from "./guide-kit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src", "hsr", "data");
const OUT_DIR = path.join(DATA, "guides");
const SET_OUT = path.join(DATA, "set-bonuses.json");
const CACHE = path.join(ROOT, "node_modules", ".cache", "aurum-guides", "hsr");

const SRR_REPO = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master";
const SRR = `${SRR_REPO}/index_min/en`;
// Same CDN src/hsr/images.ts serves art from, so the page needs no new origin.
const CDN = "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master";

const TABLES = [
  "characters",
  "character_skills",
  "character_skill_trees",
  "character_ranks",
  "character_promotions",
  "items",
  "light_cones",
  "light_cone_ranks",
  "light_cone_promotions",
  "relic_sets",
  "properties",
];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);
const PICKS = path.resolve(ROOT, typeof args.picks === "string" ? args.picks : path.join(DATA, "guide-picks.json"));

/** Anything worth a human's attention, printed at the end instead of guessed around. */
const gaps = [];
const gap = (msg) => gaps.push(msg);

// ── Download and cache ──────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * info.json is a few bytes and changes with every upstream data push, so it
 * is the cheap question "has anything changed since the last run?". A stale
 * cache after a patch would ship last patch's kit text without a word.
 */
async function loadTables() {
  fs.mkdirSync(CACHE, { recursive: true });
  const infoFile = path.join(CACHE, "info.json");
  const cachedInfo = fs.existsSync(infoFile) ? fs.readFileSync(infoFile, "utf8") : null;
  let liveInfo = null;
  try {
    liveInfo = await fetchText(`${SRR_REPO}/info.json`);
  } catch (err) {
    if (!cachedInfo) throw err;
    console.warn(`  could not reach StarRailRes (${err.message}); using the cached tables`);
  }
  const complete = TABLES.every((t) => fs.existsSync(path.join(CACHE, `${t}.json`)));
  const stale = args.fresh || !complete || (liveInfo !== null && liveInfo !== cachedInfo);

  if (stale) {
    console.log("  downloading StarRailRes tables...");
    const bodies = await Promise.all(TABLES.map((t) => fetchText(`${SRR}/${t}.json`)));
    TABLES.forEach((t, i) => fs.writeFileSync(path.join(CACHE, `${t}.json`), bodies[i], "utf8"));
    // Written last, so an interrupted download is retried on the next run.
    if (liveInfo) fs.writeFileSync(infoFile, liveInfo, "utf8");
  } else {
    console.log("  StarRailRes tables unchanged, using the cache");
  }
  const info = JSON.parse(liveInfo ?? cachedInfo ?? "{}");
  console.log(`  StarRailRes version ${info.version ?? "?"}`);

  const out = {};
  for (const t of TABLES) out[t] = JSON.parse(fs.readFileSync(path.join(CACHE, `${t}.json`), "utf8"));
  return out;
}

// ── Text ────────────────────────────────────────────────────────────

// Private-use marks for "a highlighted span starts / ends here". Placeholders
// and colour tags both produce them; they are flattened to "**" in one pass
// at the end, so a figure inside a coloured span cannot come out as "****".
const OPEN = "\u0001";
const CLOSE = "\u0002";

/**
 * One figure, as the placeholder asks for it. The format letter ([i], [f1],
 * [f2]) is the precision the game's text prints; a figure that is not a
 * whole number under [i] (Shared Feeling's S2 is 12.5%, Guinaifen's Burn is
 * 218.21%) keeps its decimals, because rounding would print a number the
 * effect does not have. Trailing zeros go too: "24%" rather than "24.0%".
 */
function formatFigure(value, fmt, percent) {
  let v = percent ? value * 100 : value;
  const want = fmt === "i" ? 0 : Number(fmt.slice(1)) || 0;
  const places = Math.max(want, 2);
  v = Math.round(v * 10 ** places) / 10 ** places;
  return String(Number(v.toFixed(places))) + (percent ? "%" : "");
}

const PLACEHOLDER = /#(\d+)\[(i|f\d)\](%?)/g;

/**
 * Resolves "#n[fmt]" against one row of params. `pick` turns the n-th param
 * into display text, so the Light Cone path can print "a/b/c/d/e" through
 * the same code. A missing param is left as the raw placeholder, which the
 * final assertion then reports by name.
 */
function resolvePlaceholders(desc, pick) {
  return desc.replace(PLACEHOLDER, (raw, n, fmt, pct) => {
    const shown = pick(Number(n) - 1, fmt, pct === "%");
    return shown === null ? raw : `${OPEN}${shown}${CLOSE}`;
  });
}

/**
 * Game text -> GuideText. StarRailRes has already stripped the game's markup
 * from index_min, but the tags below are what the game's own strings carry,
 * so a table regenerated with them in place still comes out clean: colour
 * and bold become highlights, everything else (<u> keyword links, <unbreak>,
 * <size>, <i>) keeps its text and loses the tag.
 */
function toGuideText(raw) {
  let s = String(raw ?? "");
  s = s.replace(/\\n/g, "\n").replace(/\r\n?/g, "\n");
  // The game fills these in at runtime; StarRailRes keeps the raw token.
  s = s.replace(/\{NICKNAME\}/g, "Trailblazer");
  s = s.replace(/\{RUBY_B#[^}]*\}|\{RUBY_E#\}/g, "");
  s = s.replace(/<(color|b)(?:=[^>]*)?>([\s\S]*?)<\/\1>/gi, (_, _tag, inner) => `${OPEN}${inner}${CLOSE}`);
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  s = s.replace(/<\/?>/g, "");
  // Spaces belong outside a highlight, so "** 12%**" cannot happen. Done on
  // the marks, where opening and closing are still told apart.
  s = s.replace(/\u0001(\s+)/g, "$1\u0001").replace(/(\s+)\u0002/g, "\u0002$1");

  // Flatten nested highlights: only the outermost span gets "**".
  let out = "";
  let depth = 0;
  for (const ch of s) {
    if (ch === OPEN) {
      if (depth++ === 0) out += "**";
    } else if (ch === CLOSE) {
      if (depth > 0 && --depth === 0) out += "**";
    } else {
      out += ch;
    }
  }
  if (depth > 0) out += "**";
  // Two spans back to back read as one; an empty span is noise.
  out = out.replace(/\*\*\*\*/g, "");

  out = out
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

/** Skill or trace text at one level's params. */
function renderAt(desc, params) {
  const row = params ?? [];
  return toGuideText(
    resolvePlaceholders(desc ?? "", (i, fmt, pct) => (typeof row[i] === "number" ? formatFigure(row[i], fmt, pct) : null)),
  );
}

/**
 * Light Cone passive across S1..S5: a figure that changes is printed
 * "a/b/c/d/e" the way guide sites and the contract read it, with the unit
 * once at the end; a figure that stays put is printed once.
 */
function renderSuperimposed(desc, ranks) {
  return toGuideText(
    resolvePlaceholders(desc ?? "", (i, fmt, pct) => {
      const vals = ranks.map((r) => r?.[i]);
      if (!vals.length || vals.some((v) => typeof v !== "number")) return null;
      const shown = vals.map((v) => formatFigure(v, fmt, pct).replace(/%$/, ""));
      const unit = pct ? "%" : "";
      return new Set(shown).size === 1 ? shown[0] + unit : shown.join("/") + unit;
    }),
  );
}

// ── Stats ───────────────────────────────────────────────────────────

const MAX_LEVEL = 80;

/**
 * The value on the character or Light Cone screen at Lv80 after the final
 * ascension. The game floors: Acheron's ATK is 698.54 and shows 698, and In
 * the Night's HP/ATK/DEF (1058.4 / 582.12 / 463.05) show 1058 / 582 / 463.
 */
function atMax(curve) {
  if (!curve) return null;
  return Math.floor(curve.base + (curve.step ?? 0) * (MAX_LEVEL - 1) + 1e-6);
}

/**
 * Labels for the minor trace totals. Mirrors STAT_LABELS in src/hsr/labels.ts
 * so the guide reads like the rest of the page; the "%" of "ATK%" moves into
 * the value, which already carries it. Anything the UI has no label for yet
 * falls back to the game's own property name.
 */
const BONUS_LABELS = {
  HPAddedRatio: "HP",
  AttackAddedRatio: "ATK",
  DefenceAddedRatio: "DEF",
  SpeedDelta: "SPD",
  CriticalChanceBase: "CRIT Rate",
  CriticalDamageBase: "CRIT DMG",
  StatusProbabilityBase: "Effect Hit Rate",
  StatusResistanceBase: "Effect RES",
  BreakDamageAddedRatioBase: "Break Effect",
  HealRatioBase: "Outgoing Healing",
  SPRatioBase: "Energy Regen",
  PhysicalAddedRatio: "Physical DMG",
  FireAddedRatio: "Fire DMG",
  IceAddedRatio: "Ice DMG",
  ThunderAddedRatio: "Lightning DMG",
  WindAddedRatio: "Wind DMG",
  QuantumAddedRatio: "Quantum DMG",
  ImaginaryAddedRatio: "Imaginary DMG",
};

function formatStatValue(value, percent) {
  const v = percent ? value * 100 : value;
  return String(Number(v.toFixed(1))) + (percent ? "%" : "");
}

// ── Materials ───────────────────────────────────────────────────────

/**
 * Display order: Credits, then the ascension boss drop, Calyx trace
 * materials, common enemy drops, weekly boss drops (Tracks of Destiny last,
 * being the rarest). Within a family, lowest tier first. The same order the
 * game's own cost preview reads in.
 */
const SUBTYPE_ORDER = ["Virtual", "AvatarRank", "TracePath", "CommonMonsterDrop", "WeeklyMonsterDrop"];

function materialList(totals, items, owner) {
  const list = [];
  for (const [id, count] of totals) {
    const item = items[id];
    if (!item) {
      gap(`${owner}: material ${id} is not in items.json`);
      continue;
    }
    list.push({
      id,
      name: item.name,
      iconUrl: item.icon ? `${CDN}/${item.icon}` : null,
      rarity: item.rarity,
      count,
      _order: [
        id === "2" ? -1 : SUBTYPE_ORDER.indexOf(item.sub_type) === -1 ? 99 : SUBTYPE_ORDER.indexOf(item.sub_type),
        item.rarity,
        Number(id),
      ],
    });
  }
  list.sort((a, b) => a._order[0] - b._order[0] || a._order[1] - b._order[1] || a._order[2] - b._order[2]);
  return list.map(({ _order, ...m }) => m);
}

function addAll(totals, mats) {
  for (const m of mats ?? []) totals.set(String(m.id), (totals.get(String(m.id)) ?? 0) + m.num);
}

// ── Kit ─────────────────────────────────────────────────────────────

/** Fallback slot names, only used if a skill ever arrives without type_text. */
const TYPE_KIND = {
  Normal: "Basic ATK",
  BPSkill: "Skill",
  Ultra: "Ultimate",
  Talent: "Talent",
  Maze: "Technique",
  MemospriteSkill: "Memosprite Skill",
  MemospriteTalent: "Memosprite Talent",
  ElationDamage: "Elation Skill",
  Assist: "Assist Skill",
};

/**
 * A character's own trace tree. Ten older characters also carry a second,
 * "enhanced" copy of their kit under 8-digit node ids (11006001 next to
 * 1006001) with its own skills and Eidolons. The contract has no slot for a
 * second kit, so the guide shows the base one and the run reports the rest.
 */
function baseTreeIds(ch) {
  return ch.skill_trees.filter((id) => id.length === String(ch.id).length + 3);
}

/**
 * A skill with no long description of its own: StarRailRes copies the short
 * one in. The game ships these for sub-hits and state swaps that the parent
 * ability already explains (Acheron's "Rainblade" inside her Ultimate).
 */
const isBare = (s) => !s.desc || s.desc === s.simple_desc;

/**
 * Which of a character's skills the kit shows. The tables list more than the
 * game's skill screen does, so:
 *
 *   - only skills a trace node levels (that is what makes a skill part of the
 *     kit; the overworld "Attack", "Cancel" and "End" buttons have no node),
 *   - one entry per name, unless a same-named skill is a different slot or
 *     hits a different shape of target (Hook's Skill and its Blast upgrade
 *     share a name and both stay, as do Castorice's "Wings Sweep the Ruins"
 *     Talent and Skill; the empty copies Rappa's enhanced Basic ATK carries
 *     and Feixiao's second "Terrasplit" do not),
 *   - a bare sub-skill is dropped when another entry already names it,
 *     because the parent's text is the fuller account.
 */
function selectSkills(ch, tables) {
  const { character_skills: skills, character_skill_trees: trees } = tables;
  // Within a node, the character's own skill list sets the order (it runs by
  // id, the way the game files them); a skill only a node knows about goes
  // after, in the node's order.
  const rank = (id) => {
    const i = ch.skills.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const candidates = [];
  for (const nodeId of baseTreeIds(ch)) {
    const node = trees[nodeId];
    const ordered = [...(node?.level_up_skills ?? [])].sort((a, b) => rank(a.id) - rank(b.id));
    for (const { id } of ordered) {
      const s = skills[id];
      if (!s) {
        gap(`${ch.id}: skill ${id} levelled by node ${nodeId} is missing from character_skills`);
        continue;
      }
      if (s.type === "MazeNormal" || !s.name?.trim() || !s.desc?.trim()) continue;
      if (candidates.some((c) => c.skill.id === id)) continue;
      candidates.push({ skill: s, node });
    }
  }

  // Same-name groups: the fullest description wins the slot, a variant that
  // hits a different shape of target keeps its own.
  const kept = [];
  const byName = new Map();
  for (const c of candidates) {
    const group = byName.get(c.skill.name) ?? [];
    group.push(c);
    byName.set(c.skill.name, group);
  }
  for (const c of candidates) {
    const group = byName.get(c.skill.name);
    const full = group.filter((g) => !isBare(g.skill));
    if (!full.length) {
      if (group[0] === c) kept.push(c);
      continue;
    }
    if (isBare(c.skill)) continue;
    const earlier = full.slice(0, full.indexOf(c));
    if (!earlier.some((g) => g.skill.type === c.skill.type && g.skill.effect === c.skill.effect)) kept.push(c);
  }

  return kept.filter((c) => {
    if (!isBare(c.skill)) return true;
    const named = kept.some((o) => o !== c && o.skill.desc.includes(c.skill.name));
    return !named;
  });
}

/**
 * The Ultimate's cost, when it is Energy. Some characters charge theirs from
 * a resource of their own (Acheron's Slashed Dream, Feixiao's Flying Aureus)
 * and the table's max_sp then holds that resource's cap, which would be a
 * wrong "Energy 9". Their Talent says so in words, which is what is checked.
 */
const CUSTOM_ULT_RESOURCE =
  /activate(d)? (the |her |his |their )?Ultimate|Ultimate can be (activated|used)|can (use|cast) (the |her |his )?Ultimate/i;

function ultimateEnergy(ch, selected) {
  if (typeof ch.max_sp !== "number") return null;
  if (selected.some((c) => CUSTOM_ULT_RESOURCE.test(c.skill.desc))) return null;
  return ch.max_sp;
}

function buildKit(ch, tables) {
  const { character_skill_trees: trees, character_ranks: ranks } = tables;
  const icon = (p) => (p ? `${CDN}/${p}` : null);

  const extra = ch.skill_trees.length - baseTreeIds(ch).length;
  if (extra) gap(`${ch.id}: enhanced kit (${extra} extra trace nodes, own skills and Eidolons) left out; guide shows the base kit`);

  const selected = selectSkills(ch, tables);
  const energy = ultimateEnergy(ch, selected);
  let ultTagged = false;
  const skills = selected.map(({ skill, node }) => {
    // The node's cap is the level without Eidolons: Basic ATK 6, Skill,
    // Ultimate and Talent 10, Technique 1, Memosprite skills 6.
    const level = node.max_level;
    const tags = [];
    if (skill.effect_text) tags.push(skill.effect_text);
    if (skill.type === "Ultra" && !ultTagged && energy !== null) {
      tags.push(`Energy ${energy}`);
      ultTagged = true;
    }
    return {
      kind: skill.type_text || TYPE_KIND[skill.type] || skill.type,
      name: skill.name,
      text: renderAt(skill.desc, skill.params?.[level - 1]),
      iconUrl: icon(skill.icon),
      level,
      tags,
    };
  });

  // Major traces are the 1xx nodes; the ascension that unlocks each one is
  // its label (A2, A4, A6). The Remembrance Trailblazer's 5xx node sits
  // outside that ladder and is listed after them as "Special".
  const traces = [];
  for (const nodeId of baseTreeIds(ch)) {
    const node = trees[nodeId];
    const suffix = nodeId.slice(-3);
    if (!node || !node.desc || node.level_up_skills?.length) continue;
    if (suffix[0] !== "1" && suffix[0] !== "5") continue;
    const promotion = node.levels?.[0]?.promotion;
    const kind = suffix[0] === "1" ? (promotion ? `A${promotion}` : `A${Number(suffix[2]) * 2}`) : "Special";
    if (suffix[0] === "5") gap(`${ch.id}: node ${nodeId} "${node.name}" listed in traces as kind "Special"`);
    traces.push({ kind, name: node.name, text: renderAt(node.desc, node.params?.[0]), iconUrl: icon(node.icon) });
  }

  const eidolons = ch.ranks.map((rankId) => {
    const r = ranks[rankId];
    if (!r) {
      gap(`${ch.id}: Eidolon ${rankId} missing from character_ranks`);
      return null;
    }
    return { kind: `E${r.rank}`, name: r.name, text: renderAt(r.desc, []), iconUrl: icon(r.icon) };
  });

  return [
    { id: "skills", entries: skills },
    { id: "traces", entries: traces },
    { id: "eidolons", entries: eidolons.filter(Boolean) },
  ];
}

// ── Per character ───────────────────────────────────────────────────

function buildWeapon(pick, tables, owner) {
  const id = String(pick.id);
  const lc = tables.light_cones[id];
  const promo = tables.light_cone_promotions[id];
  const rank = tables.light_cone_ranks[id];
  if (!lc) {
    gap(`${owner}: picked Light Cone ${id} is not in StarRailRes; left out`);
    return null;
  }
  const top = promo?.values?.[promo.values.length - 1];
  if (!top) gap(`${owner}: Light Cone ${id} has no promotion values`);
  const stats = top
    ? [
        { label: "HP", value: String(atMax(top.hp)) },
        { label: "ATK", value: String(atMax(top.atk)) },
        { label: "DEF", value: String(atMax(top.def)) },
      ]
    : [];
  return {
    id,
    name: lc.name,
    iconUrl: lc.icon ? `${CDN}/${lc.icon}` : `${CDN}/icon/light_cone/${id}.png`,
    rarity: lc.rarity,
    refinement: typeof pick.refinement === "number" ? pick.refinement : null,
    stats,
    passive: rank ? { name: rank.skill, text: renderSuperimposed(rank.desc, rank.params ?? []) } : null,
  };
}

function buildGuide(id, tables, picks) {
  const ch = tables.characters[id];
  const pick = picks[id] ?? null;

  const promo = tables.character_promotions[id];
  const top = promo?.values?.[promo.values.length - 1];
  const baseStats = top
    ? [
        { label: "HP", value: String(atMax(top.hp)) },
        { label: "ATK", value: String(atMax(top.atk)) },
        { label: "DEF", value: String(atMax(top.def)) },
        { label: "SPD", value: String(atMax(top.spd)) },
      ]
    : [];
  if (!top) gap(`${id}: no promotion values, baseStats left empty`);

  // Minor traces, summed per stat. Ordered by how many nodes feed each stat,
  // which is the game's own main / secondary / tertiary split.
  const bonus = new Map();
  for (const nodeId of baseTreeIds(ch)) {
    const node = tables.character_skill_trees[nodeId];
    for (const lv of node?.levels ?? []) {
      for (const p of lv.properties ?? []) {
        const b = bonus.get(p.type) ?? { value: 0, nodes: 0, first: bonus.size };
        b.value += p.value;
        b.nodes += 1;
        bonus.set(p.type, b);
      }
    }
  }
  const bonusStats = [...bonus.entries()]
    .sort((a, b) => b[1].nodes - a[1].nodes || a[1].first - b[1].first)
    .map(([type, b]) => {
      const prop = tables.properties[type];
      if (!BONUS_LABELS[type]) gap(`${id}: no UI label for trace stat ${type}, used "${prop?.name ?? type}"`);
      return {
        label: BONUS_LABELS[type] ?? prop?.name ?? type,
        value: formatStatValue(b.value, prop ? prop.percent : true),
      };
    });

  const ascension = new Map();
  for (const step of promo?.materials ?? []) addAll(ascension, step);
  const traceCost = new Map();
  for (const nodeId of baseTreeIds(ch)) {
    for (const lv of tables.character_skill_trees[nodeId]?.levels ?? []) addAll(traceCost, lv.materials);
  }

  return {
    role: pick?.role ?? null,
    weapons: (pick?.weapons ?? []).map((w) => buildWeapon(w, tables, id)).filter(Boolean),
    teams: (pick?.teams ?? []).map((t) => ({ name: t.name ?? null, members: (t.members ?? []).map(String) })),
    synergies: (pick?.synergies ?? []).map(String),
    substatLine: pick?.substatLine ?? null,
    endgameStats: (pick?.endgameStats ?? []).map((s) => ({ label: s.label, value: s.value })),
    skillPriority: pick?.skillPriority ?? null,
    tracePriority: pick?.tracePriority ?? null,
    source: pick?.source ? { label: pick.sourceLabel ?? "Prydwen", url: pick.source, updated: pick.sourceUpdated ?? null } : null,
    baseStats,
    bonusStats,
    kit: buildKit(ch, tables),
    materials: [
      { id: "ascension", items: materialList(ascension, tables.items, id) },
      { id: "traces", items: materialList(traceCost, tables.items, id) },
    ],
  };
}

function buildSetBonuses(setIds, tables) {
  const out = {};
  for (const id of setIds) {
    const set = tables.relic_sets[id];
    if (!set) {
      gap(`set ${id} is in sets.json but not in StarRailRes relic_sets; left out`);
      continue;
    }
    // Cavern relics read [2-piece, 4-piece]; Planar ornaments have only the
    // 2-piece line.
    out[id] = {
      name: set.name,
      bonuses: (set.desc ?? []).map((d, i) => ({ pieces: [2, 4][i], text: renderAt(d, []) })).filter((b) => b.pieces),
    };
  }
  return out;
}

// ── Checks ──────────────────────────────────────────────────────────

/**
 * The contract's GuideText rules, enforced on every string that reaches a
 * file. Names are checked too: a stray tag in a name shows up the same way.
 */
function checkText(where, s, problems) {
  if (typeof s !== "string") return;
  if (/[<>]/.test(s)) problems.push(`${where}: tag or angle bracket: ${JSON.stringify(s.slice(0, 120))}`);
  if (/#\d+\[/.test(s)) problems.push(`${where}: unresolved placeholder: ${JSON.stringify(s.match(/.{0,40}#\d+\[.{0,20}/)?.[0])}`);
  if (/\{[A-Z_]+(#[^}]*)?\}/.test(s)) problems.push(`${where}: unfilled game token: ${s.match(/\{[A-Z_]+(#[^}]*)?\}/)[0]}`);
  if (/[\u0001\u0002]/.test(s)) problems.push(`${where}: leftover highlight marker`);
  if ((s.match(/\*\*/g) ?? []).length % 2) problems.push(`${where}: unbalanced **: ${JSON.stringify(s.slice(0, 120))}`);
  if (/\*\*\*/.test(s)) problems.push(`${where}: run of 3+ asterisks: ${JSON.stringify(s.slice(0, 120))}`);
  if (/\n{3,}/.test(s)) problems.push(`${where}: 3+ line breaks`);
}

function walk(where, value, problems) {
  if (typeof value === "string") checkText(where, value, problems);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(`${where}[${i}]`, v, problems));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(`${where}.${k}`, v, problems);
}

const GUIDE_KEYS = [
  "role", "weapons", "teams", "synergies", "substatLine", "endgameStats", "skillPriority",
  "tracePriority", "source", "baseStats", "bonusStats", "kit", "materials", "kitChangedAt", "kitHash",
];

function checkShape(id, g, problems) {
  const keys = Object.keys(g);
  if (keys.join() !== GUIDE_KEYS.join()) problems.push(`${id}: keys ${keys.join()} do not match GuideFile`);
  for (const k of ["weapons", "teams", "synergies", "endgameStats", "baseStats", "bonusStats", "kit", "materials"]) {
    if (!Array.isArray(g[k])) problems.push(`${id}: ${k} is not an array`);
  }
  for (const group of g.kit) {
    for (const e of group.entries) {
      if (!e.kind || !e.name || !e.text) problems.push(`${id}: ${group.id} entry missing kind/name/text: ${JSON.stringify(e).slice(0, 100)}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadPicks() {
  if (!fs.existsSync(PICKS)) {
    console.warn(`  no picks at ${path.relative(ROOT, PICKS)}; every guide gets empty picks`);
    return {};
  }
  const file = readJSON(PICKS);
  const count = Object.keys(file.characters ?? {}).length;
  console.log(`  picks: ${count} characters from ${path.relative(ROOT, PICKS)} (${file.source ?? "?"}, ${file.fetchedAt ?? "?"})`);
  return file.characters ?? {};
}

function writeCompact(file, data) {
  fs.writeFileSync(file, JSON.stringify(data) + "\n", "utf8");
  return fs.statSync(file).size;
}

async function main() {
  console.log("building HSR guides...");
  const tables = await loadTables();
  const picks = loadPicks();

  // The site's own roster decides which files exist, so a guide never
  // outruns the character list the rest of the page reads.
  const roster = readJSON(path.join(DATA, "characters.json"));
  const setIds = Object.keys(readJSON(path.join(DATA, "sets.json")));

  for (const id of Object.keys(picks)) {
    if (!roster[id]) gap(`picks name character ${id}, which is not in characters.json`);
  }

  const guides = {};
  for (const id of Object.keys(roster)) {
    if (!tables.characters[id]) {
      gap(`${id} (${roster[id].name}) is not in StarRailRes characters; no guide written`);
      continue;
    }
    guides[id] = withKitTracking(buildGuide(id, tables, picks), path.join(OUT_DIR, `${id}.json`));
  }
  const setBonuses = buildSetBonuses(setIds, tables);

  const problems = [];
  for (const [id, g] of Object.entries(guides)) {
    checkShape(id, g, problems);
    // Game text only. The picks are the guide's own lines, verbatim, and
    // "Ultimate > Skill" is exactly what a priority line should say.
    for (const k of ["weapons", "baseStats", "bonusStats", "kit", "materials"]) walk(`${id}.${k}`, g[k], problems);
  }
  walk("set-bonuses", setBonuses, problems);
  if (problems.length) {
    console.error(`\nGuideText check failed, nothing written (${problems.length}):`);
    for (const p of problems.slice(0, 50)) console.error(`  ${p}`);
    if (problems.length > 50) console.error(`  ...and ${problems.length - 50} more`);
    process.exit(1);
  }

  // The directory holds exactly one file per character: anything else is a
  // leftover from a roster change and would be served as a stale guide.
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const expected = new Set(Object.keys(guides).map((id) => `${id}.json`));
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!expected.has(f)) {
      fs.rmSync(path.join(OUT_DIR, f), { recursive: true, force: true });
      console.log(`  removed stale ${f}`);
    }
  }

  let total = 0;
  let largest = { id: null, size: 0 };
  for (const [id, g] of Object.entries(guides)) {
    const size = writeCompact(path.join(OUT_DIR, `${id}.json`), g);
    total += size;
    if (size > largest.size) largest = { id, size };
    if (size > 60 * 1024) gap(`${id}: guide is ${(size / 1024).toFixed(1)} kB, over the 60 kB budget`);
  }
  const setSize = writeCompact(SET_OUT, setBonuses);

  const withPicks = Object.keys(guides).filter((id) => guides[id].source).length;
  const skillCount = Object.values(guides).reduce((n, g) => n + g.kit[0].entries.length, 0);
  console.log(`  guides/        ${Object.keys(guides).length} of ${Object.keys(roster).length} characters, ${(total / 1024).toFixed(0)} kB total, largest ${largest.id} ${(largest.size / 1024).toFixed(1)} kB`);
  console.log(`                 ${withPicks} with picks, ${skillCount} skill entries`);
  console.log(`  set-bonuses    ${Object.keys(setBonuses).length} of ${setIds.length} sets, ${(setSize / 1024).toFixed(1)} kB`);

  if (gaps.length) {
    console.log(`\ngaps (${gaps.length}):`);
    for (const g of gaps) console.log(`  ${g}`);
  }
  console.log("done.");
}

main().catch((err) => {
  console.error("failed:", err.message);
  process.exit(1);
});
