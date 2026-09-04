/**
 * Banding for how good a substat roll was, shared by the games that have
 * roll quality at all.
 *
 * The games do not roll over the same range. A Genshin roll is one of four
 * tiers at 0.7 / 0.8 / 0.9 / 1.0 of the max; a Star Rail roll is one of three
 * at 0.8 / 0.9 / 1.0. Banding both against a single fixed scale meant a Star
 * Rail roll could never be worse than "mid": the worst roll the game can give
 * you drew the third of four colours, and averages over several rolls bunched
 * into "high" no matter how they actually landed.
 *
 * So quality is normalised against the floor first: 0 is the worst roll that
 * game can produce, 1 the best. The bands then mean the same thing in both
 * games, and each game's full range uses the full palette. On Genshin's floor
 * the four tiers land back on the four bands exactly, which is what it did
 * before.
 *
 * Zenless is absent on purpose. Every roll of a stat there is worth the same
 * fixed amount, so there is no quality to band and its pips are one colour.
 */
export type RollTier = "max" | "high" | "mid" | "low";

/** The worst single roll each game can give, as a share of its max roll. */
export const ROLL_FLOOR = {
  genshin: 0.7,
  hsr: 0.8,
} as const;

/**
 * @param share Roll value as a share of the max roll.
 * @param floor The worst roll this game can produce, from ROLL_FLOOR.
 */
export function rollTier(share: number, floor: number = ROLL_FLOOR.genshin): RollTier {
  const span = 1 - floor;
  const t = span > 0 ? Math.min(1, Math.max(0, (share - floor) / span)) : 0;
  if (t >= 0.9) return "max";
  if (t >= 0.6) return "high";
  if (t >= 0.3) return "mid";
  return "low";
}

/** Tailwind background class per tier, from the roll tokens in index.css. */
export const ROLL_TIER_BG: Record<RollTier, string> = {
  max: "bg-roll-max",
  high: "bg-roll-high",
  mid: "bg-roll-mid",
  low: "bg-roll-low",
};
