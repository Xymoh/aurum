/**
 * The list of games this site scores.
 *
 * One entry per game, and that entry is the only thing navigation reads: the
 * picker, the side rail and the switcher all iterate this array. Adding a
 * third game means adding an object here and mounting its routes in App.tsx -
 * no navigation component needs touching.
 *
 * `status` lets a game be announced before it is built, so the picker can show
 * what is coming without pretending the route works.
 */

import genshinIcon from "../assets/games/genshin.png";
import hsrIcon from "../assets/games/hsr.png";
import zzzIcon from "../assets/games/zzz.png";

export type GameId = "genshin" | "hsr" | "zzz";

export interface GameDef {
  id: GameId;
  /** Full title, used on the picker tile. */
  name: string;
  /** Short label for the rail tooltip and the switcher. */
  short: string;
  /** Route prefix. The game's own routes live beneath it. */
  path: string;
  icon: string;
  /** What the scorer does for this game, in one line. */
  tagline: string;
  /**
   * Accent colour as a raw hex value. Kept out of Tailwind classes so the rail
   * can tint borders and glows inline without every game needing its own
   * safelisted utility classes.
   */
  accent: string;
  /**
   * The same accent as a theme token, for text. Unlike `accent` it swaps to a
   * darker value in light mode, where the raw gold and teal fall below 3:1.
   */
  accentToken: string;
  status: "live" | "planned";
}

export const GAMES: GameDef[] = [
  {
    id: "genshin",
    name: "Genshin Impact",
    short: "Genshin",
    path: "/genshin",
    icon: genshinIcon,
    tagline: "Score artifacts and price up a reroll before you spend the dust.",
    accent: "#d4a853",
    accentToken: "var(--accent)",
    status: "live",
  },
  {
    id: "hsr",
    name: "Honkai: Star Rail",
    short: "Star Rail",
    path: "/hsr",
    icon: hsrIcon,
    tagline: "See how many of your relic rolls are actually doing something.",
    accent: "#5eead4",
    accentToken: "var(--hsr-accent)",
    status: "live",
  },
  {
    id: "zzz",
    name: "Zenless Zone Zero",
    short: "Zenless",
    path: "/zzz",
    icon: zzzIcon,
    tagline: "Find out which drive discs are carrying dead rolls.",
    accent: "#d4ff00",
    accentToken: "var(--zzz-accent)",
    status: "live",
  },
];

export const LIVE_GAMES = GAMES.filter((g) => g.status === "live");

export function gameById(id: GameId): GameDef {
  const game = GAMES.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game: ${id}`);
  return game;
}
