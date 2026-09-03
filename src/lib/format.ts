/**
 * Number formatting shared by every surface that shows a score.
 *
 * One rule: a score is a whole-number percent. The header used to show
 * "133.1", the bar "133.1%", the summary "127%" and the artifact card
 * "129.0", all for the same kind of number, and the decimal added nothing
 * with grades spaced five points apart.
 */
export function formatScore(value: number): string {
  return `${Math.round(value)}%`;
}

/** A stat value: percentages keep one decimal, flats are rounded and grouped. */
export function formatStatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString();
}
