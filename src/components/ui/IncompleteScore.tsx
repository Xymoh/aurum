/**
 * Stands in for the build score when a character is not fully geared.
 *
 * A partial build has no honest overall number. Genshin averages only the
 * pieces that are equipped, so two good artifacts read as a finished S+
 * build; Star Rail and Zenless divide by all six slots, so the same build
 * reads as a bad one rather than an unfinished one. Neither is worth
 * showing, so the slot count goes here instead and the character is left
 * out of the account average.
 */
interface IncompleteScoreProps {
  filled: number;
  total: number;
  /** Matches the surrounding score type: the header uses the large one. */
  size?: "sm" | "lg";
  /** Muted colour for this game's palette, e.g. "text-hsr-muted". */
  mutedClass?: string;
}

export function IncompleteScore({
  filled,
  total,
  size = "lg",
  mutedClass = "text-dark-muted",
}: IncompleteScoreProps) {
  return (
    <>
      <p
        className={`font-mono font-bold leading-none tabular-nums ${mutedClass} ${
          size === "lg" ? "text-2xl sm:text-3xl" : "text-lg"
        }`}
        title={`Not scored: ${filled} of ${total} slots equipped`}
      >
        &mdash;
      </p>
      <p className={`mt-1 font-mono text-xs whitespace-nowrap ${mutedClass}`}>
        {filled}/{total} pieces
      </p>
    </>
  );
}
