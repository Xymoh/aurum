/**
 * Banding for how good a single substat roll was, shared by both games.
 *
 * Genshin's four tiers land exactly on 0.7 / 0.8 / 0.9 / 1.0 of the max roll;
 * Star Rail's three on 0.8 / 0.9 / 1.0. Thresholds sit between the tiers so
 * rounding never flips a band.
 */
export type RollTier = "max" | "high" | "mid" | "low";

export function rollTier(share: number): RollTier {
  if (share >= 0.95) return "max";
  if (share >= 0.85) return "high";
  if (share >= 0.75) return "mid";
  return "low";
}

/** Tailwind background class per tier, from the roll tokens in index.css. */
export const ROLL_TIER_BG: Record<RollTier, string> = {
  max: "bg-roll-max",
  high: "bg-roll-high",
  mid: "bg-roll-mid",
  low: "bg-roll-low",
};
