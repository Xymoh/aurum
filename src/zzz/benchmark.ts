// Kept apart from scoring.ts so the home page can quote them without loading
// the scoring engine and its data tables.

/** Six discs at nine rolls each: the most a build can physically hold. */
export const MAX_ROLLS = 54;
/** Rolls in a realistic strong build: six discs that mostly started with four substats. */
export const BENCHMARK_ROLLS = 48;

/**
 * The ten stats a disc can roll as substats, with the fixed value of one roll
 * in display units. Read off live Enka data (PropertyValue is constant for a
 * stat whatever the roll count) and matching the in-game values.
 */
export const ROLL_VALUE: Record<number, number> = {
  11102: 3.0, // HP%
  12102: 3.0, // ATK%
  13102: 4.8, // DEF%
  11103: 112, // HP
  12103: 19, // ATK
  13103: 15, // DEF
  20103: 2.4, // CRIT Rate
  21103: 4.8, // CRIT DMG
  23203: 9, // PEN
  31203: 9, // Anomaly Proficiency
};
