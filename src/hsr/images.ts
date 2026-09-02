/**
 * Artwork URLs.
 *
 * StarRailRes publishes every character, light cone, relic, element and path
 * image the game uses. Serving them from jsDelivr rather than bundling keeps
 * ~200 MB of art out of the repo and off the GitHub Pages build, at the cost
 * of a third-party dependency for decoration only: every image here is
 * cosmetic, and the scorer reads correctly with all of them missing.
 */

import relicIndex from "./data/relics.json";

const CDN = "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master";

const RELICS = relicIndex as Record<string, { icon?: string }>;

/** Round character bust, for list rows. */
export function characterIcon(avatarId: number): string {
  return `${CDN}/icon/character/${avatarId}.png`;
}

/** Wide splash art, for the expanded panel. */
export function characterPreview(avatarId: number): string {
  return `${CDN}/image/character_preview/${avatarId}.png`;
}

export function lightConeIcon(id: number): string {
  return `${CDN}/icon/light_cone/${id}.png`;
}

export function elementIcon(element: string): string {
  return `${CDN}/icon/element/${element}.png`;
}

/**
 * Path icons are filed under the English Path name, which is not the internal
 * one the character data uses, and not always the display label either: the
 * Hunt's file is "Hunt.png", never "The Hunt.png".
 */
const PATH_ICON_NAME: Record<string, string> = {
  Warrior: "Destruction",
  Rogue: "Hunt",
  Mage: "Erudition",
  Shaman: "Harmony",
  Warlock: "Nihility",
  Knight: "Preservation",
  Priest: "Abundance",
  Memory: "Remembrance",
  Elation: "Elation",
};

export function pathIcon(path: string): string | null {
  const name = PATH_ICON_NAME[path];
  return name ? `${CDN}/icon/path/${name}.png` : null;
}

/** The relic's own artwork, which differs per slot within a set. */
export function relicIcon(tid: number): string | null {
  const icon = RELICS[String(tid)]?.icon;
  return icon ? `${CDN}/${icon}` : null;
}
