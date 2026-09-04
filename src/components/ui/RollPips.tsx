import { ROLL_FLOOR, ROLL_TIER_BG, rollTier } from "../../lib/rollTier";

interface RollPipsProps {
  /** Each roll as a share of the max roll, in order. */
  rolls: number[];
  /** Pips for rolls whose quality is unknown, drawn neutral. */
  unknownCount?: number;
  /** Dim the whole row, for a stat the character does not use. */
  muted?: boolean;
  /** The worst roll this game can produce, from ROLL_FLOOR. */
  floor?: number;
  className?: string;
}

/**
 * One pip per roll, coloured by how good the roll was.
 *
 * A substat's value hides two things: how many upgrades landed on it and how
 * lucky each one was. A 12% CRIT Rate might be three max rolls or four poor
 * ones, and the difference decides whether a reroll can improve the piece.
 * The pips show both at a glance; the surrounding popover gives the numbers.
 */
export function RollPips({
  rolls,
  unknownCount = 0,
  muted = false,
  floor = ROLL_FLOOR.genshin,
  className = "",
}: RollPipsProps) {
  const total = rolls.length + unknownCount;
  if (total === 0) return null;
  return (
    <span className={`inline-flex items-center gap-[3px] ${muted ? "opacity-40" : ""} ${className}`} aria-hidden="true">
      {rolls.map((share, i) => (
        <span key={i} className={`h-2.5 w-[3px] rounded-sm ${ROLL_TIER_BG[rollTier(share, floor)]}`} />
      ))}
      {Array.from({ length: unknownCount }, (_, i) => (
        <span key={`u${i}`} className="h-2.5 w-[3px] rounded-sm bg-dark-muted/50" />
      ))}
    </span>
  );
}
