/**
 * genshin-traveler.mjs
 * ──────────────────────────────────────────────────────────────────
 * The Traveler as the build pages see them: one page per element, not per
 * avatar id. The game has two avatar ids (Aether and Lumine) and lets
 * either switch between seven elements, and each element is a different
 * character in all but name: its own kit, materials, weapons, sets and
 * teams, and its own Game8 page. Shared by fetch-genshin-sets.mjs,
 * build-genshin-guides.mjs and refresh.mjs.
 *
 * Ids follow Project Amber's: "10000005-cryo" is Aether on Cryo. Picks and
 * set recommendations are keyed by Aether's id alone, since both bodies
 * share one guide page; guide files are written for both, so a Lumine
 * player's showcase links to a page with Lumine on it.
 * ──────────────────────────────────────────────────────────────────
 */

/** Aether, then Lumine: the showcase's avatar ids. */
export const TRAVELER_IDS = ["10000005", "10000007"];

/** In the order the game added them. */
export const TRAVELER_ELEMENTS = ["Anemo", "Geo", "Electro", "Dendro", "Hydro", "Pyro", "Cryo"];

/** "Cryo" -> "10000005-cryo"; `body` picks Lumine. */
export function travelerId(element, body = TRAVELER_IDS[0]) {
  return `${body}-${element.toLowerCase()}`;
}

/** "10000007-cryo" -> { body: "10000007", element: "Cryo" }; null for any other id. */
export function parseTravelerId(id) {
  const m = /^(\d+)-([a-z]+)$/.exec(id);
  if (!m || !TRAVELER_IDS.includes(m[1])) return null;
  const element = TRAVELER_ELEMENTS.find((e) => e.toLowerCase() === m[2]);
  return element ? { body: m[1], element } : null;
}

/** How the pages name one: "Traveler (Cryo)". */
export function travelerName(element) {
  return `Traveler (${element})`;
}
