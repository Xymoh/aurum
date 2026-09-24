import type { ShareGame } from "../../lib/shareCard/model";

/**
 * The backdrop an item icon sits on, by rarity, the way the games frame
 * their own inventory tiles. Fixed colours rather than theme tokens: the
 * icons are drawn for these backgrounds and read badly on a light page.
 */
const TONES: Record<number, string> = {
  5: "linear-gradient(160deg, #6b4526 0%, #b8803f 100%)",
  4: "linear-gradient(160deg, #3c315f 0%, #7a5ca3 100%)",
  3: "linear-gradient(160deg, #2b4265 0%, #4b7ea8 100%)",
  2: "linear-gradient(160deg, #2a4a3b 0%, #4a8665 100%)",
  1: "linear-gradient(160deg, #3b3d43 0%, #6a6d74 100%)",
};

/**
 * Zenless numbers its ranks one lower than the star games (4 is S, 3 is A,
 * 2 is B), so it is shifted up to share the same five tones.
 */
export function rarityTone(game: ShareGame, rarity: number): string {
  const stars = game === "zzz" ? rarity + 1 : rarity;
  return TONES[Math.min(5, Math.max(1, stars))];
}
