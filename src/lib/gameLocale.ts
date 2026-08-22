/**
 * Localized game text (weapon, artifact-set and character names).
 *
 * Two sources, both official game wording:
 *   - Weapon and artifact-set names come from Enka's loc.json, keyed by the
 *     text hash the showcase API returns on each equip (game-<lang>.json).
 *   - Character names come from Project Amber, keyed directly by avatarId
 *     (names-<lang>.json). Enka's own character store lags weeks behind each
 *     patch, so a just-released character would otherwise show no localized
 *     name; Amber tracks new characters within a day.
 *
 * Parsing is synchronous, so the active tables are held at module scope and
 * must be loaded *before* a showcase is parsed — see `useShowcase`, which
 * awaits `loadGameLocale` and keys its query by language so switching
 * languages re-derives the names.
 */
import gameEn from "../data/locales/game-en.json";
import namesEn from "../data/locales/names-en.json";

type TextMap = Record<string, string>;

const GAME_EN = gameEn as TextMap;
const NAMES_EN = namesEn as TextMap;

/**
 * English ships in the main bundle; other languages are fetched on demand.
 * English + Chinese only for now — see src/i18n/index.ts for why.
 */
const GAME_LOADERS: Record<string, () => Promise<{ default: TextMap }>> = {
  zh: () => import("../data/locales/game-zh.json"),
};

const NAME_LOADERS: Record<string, () => Promise<{ default: TextMap }>> = {
  zh: () => import("../data/locales/names-zh.json"),
};

const gameCache = new Map<string, TextMap>([["en", GAME_EN]]);
const nameCache = new Map<string, TextMap>([["en", NAMES_EN]]);
let activeGame: TextMap = GAME_EN;
let activeNames: TextMap = NAMES_EN;

async function loadInto(
  lang: string,
  loaders: Record<string, () => Promise<{ default: TextMap }>>,
  cache: Map<string, TextMap>,
  english: TextMap,
): Promise<TextMap> {
  const cached = cache.get(lang);
  if (cached) return cached;

  const loader = loaders[lang];
  if (!loader) return english;

  try {
    const table = (await loader()).default as TextMap;
    cache.set(lang, table);
    return table;
  } catch {
    // A failed chunk shouldn't break the showcase — English always works.
    return english;
  }
}

export async function loadGameLocale(lang: string): Promise<void> {
  const [game, names] = await Promise.all([
    loadInto(lang, GAME_LOADERS, gameCache, GAME_EN),
    loadInto(lang, NAME_LOADERS, nameCache, NAMES_EN),
  ]);
  activeGame = game;
  activeNames = names;
}

/**
 * Resolve a text hash in the active language, falling back to English so a
 * gap in one locale shows a readable name rather than nothing.
 */
export function resolveGameText(hash: string | undefined): string | undefined {
  if (!hash) return undefined;
  return activeGame[hash] ?? GAME_EN[hash];
}

/**
 * Localized character name for an avatarId, falling back to the English name
 * (then, for the caller, to the curated characters.json) when a brand-new
 * character isn't in the Amber data yet.
 */
export function resolveCharacterName(avatarId: number): string | undefined {
  const id = String(avatarId);
  return activeNames[id] ?? NAMES_EN[id];
}
