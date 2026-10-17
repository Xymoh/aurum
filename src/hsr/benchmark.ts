// Kept apart from scoring.ts so the home page can quote them without loading
// the scoring engine and its data tables.

/**
 * Upgrades in a realistic strong build: 6 relics that mostly started with 4
 * substats. Fribbels' 100% benchmark uses 48, and its 200% ceiling uses 54,
 * so measuring against 48 puts our efficiency figure on the same footing as
 * the DPS score people are used to seeing.
 */
export const BENCHMARK_ROLLS = 48;
/** Six relics at 9 upgrades each: the most a build can physically hold. */
export const MAX_ROLLS = 54;
