/**
 * Max roll values for 5-star artifact substats.
 * These represent the highest possible value for a single substat roll at level 0.
 * Source: Genshin community datamining (Genshin Optimizer)
 */
export const MAX_ROLL_VALUES: Record<string, number> = {
  FIGHT_PROP_ATTACK_PERCENT: 5.83,
  FIGHT_PROP_HP_PERCENT: 5.83,
  FIGHT_PROP_DEFENSE_PERCENT: 7.29,
  FIGHT_PROP_CRITICAL: 3.89,
  FIGHT_PROP_CRITICAL_HURT: 7.77,
  FIGHT_PROP_ELEMENT_MASTERY: 23.31,
  FIGHT_PROP_CHARGE_EFFICIENCY: 6.48,
  FIGHT_PROP_HEAL_ADD: 4.49,
  FIGHT_PROP_PHYSICAL_ADD_HURT: 0, // Main stat only, not a substat
  FIGHT_PROP_FIRE_ADD_HURT: 0,
  FIGHT_PROP_ELEC_ADD_HURT: 0,
  FIGHT_PROP_WATER_ADD_HURT: 0,
  FIGHT_PROP_WIND_ADD_HURT: 0,
  FIGHT_PROP_ICE_ADD_HURT: 0,
  FIGHT_PROP_ROCK_ADD_HURT: 0,
  FIGHT_PROP_GRASS_ADD_HURT: 0,
  FIGHT_PROP_ATTACK: 19.45,
  FIGHT_PROP_HP: 298.75,
  FIGHT_PROP_DEFENSE: 23.15,
};

/** Number of substat upgrades a 5-star artifact gets (4 subs at +0 → 5 upgrades at +4/+8/+12/+16/+20) */
export const TOTAL_ROLLS_5_STAR = 9;

/** Max CV value for normalization (50 CV = god piece) */
export const MAX_CV = 50;

/** Reference high roll: CRIT DMG max roll for 5-star Genshin artifacts */
export const REFERENCE_HIGH_ROLL = 7.77;

/** Score grade thresholds following the Fribbels 18-grade scale (0–200% range).
 *  Since ideal is now half the theoretical max, scores are doubled compared to 0–100% scale.
 *  100% = solid artifact (~4.5 useful max rolls), 200% = theoretically perfect. */
export const GRADE_THRESHOLDS: Array<{ grade: import("../types/artifact").ScoreGrade; min: number; color: string; textColor: string }> = [
  { grade: "WTF+", min: 170, color: "#39ff5e", textColor: "#000000" },
  { grade: "WTF",  min: 160, color: "#1fe03f", textColor: "#000000" },
  { grade: "SSS+", min: 150, color: "#de3a35", textColor: "#000000" },
  { grade: "SSS",  min: 140, color: "#ff8c00", textColor: "#000000" },
  { grade: "SS+",  min: 130, color: "#ff8c00", textColor: "#000000" },
  { grade: "SS",   min: 120, color: "#ffbd59", textColor: "#000000" },
  { grade: "S+",   min: 110, color: "#ffe44d", textColor: "#000000" },
  { grade: "S",    min: 100, color: "#ffd700", textColor: "#000000" },
  { grade: "A+",   min: 90,  color: "#c084fc", textColor: "#000000" },
  { grade: "A",    min: 80,  color: "#a855f7", textColor: "#000000" },
  { grade: "B+",   min: 70,  color: "#60a5fa", textColor: "#ffffff" },
  { grade: "B",    min: 60,  color: "#3b82f6", textColor: "#ffffff" },
  { grade: "C+",   min: 50,  color: "#4ade80", textColor: "#000000" },
  { grade: "C",    min: 40,  color: "#22c55e", textColor: "#000000" },
  { grade: "D+",   min: 30,  color: "#9ca3af", textColor: "#ffffff" },
  { grade: "D",    min: 20,  color: "#6b7280", textColor: "#ffffff" },
  { grade: "F+",   min: 10,  color: "#6b7280", textColor: "#ffffff" },
  { grade: "F",    min: 0,   color: "#4b5563", textColor: "#ffffff" },
];

/**
 * Potential scales: normalizing factor that converts substat values into comparable units.
 * Calculated as REFERENCE_HIGH_ROLL / stat's high roll value.
 * This ensures all stats are converted to CRIT DMG-equivalent units.
 */
export const POTENTIAL_SCALES: Record<string, number> = {
  FIGHT_PROP_CRITICAL:          REFERENCE_HIGH_ROLL / 3.89,   // ≈ 1.997
  FIGHT_PROP_CRITICAL_HURT:     REFERENCE_HIGH_ROLL / 7.77,   // = 1.0
  FIGHT_PROP_ATTACK_PERCENT:    REFERENCE_HIGH_ROLL / 5.83,   // ≈ 1.333
  FIGHT_PROP_HP_PERCENT:        REFERENCE_HIGH_ROLL / 5.83,   // ≈ 1.333
  FIGHT_PROP_DEFENSE_PERCENT:   REFERENCE_HIGH_ROLL / 7.29,   // ≈ 1.066
  FIGHT_PROP_ELEMENT_MASTERY:   REFERENCE_HIGH_ROLL / 23.31,  // ≈ 0.333
  FIGHT_PROP_CHARGE_EFFICIENCY: REFERENCE_HIGH_ROLL / 6.48,   // ≈ 1.199
  FIGHT_PROP_ATTACK:            REFERENCE_HIGH_ROLL / 19.45,  // ≈ 0.400
  FIGHT_PROP_HP:                REFERENCE_HIGH_ROLL / 298.75, // ≈ 0.026
  FIGHT_PROP_DEFENSE:           REFERENCE_HIGH_ROLL / 23.15,  // ≈ 0.336
};

/** Map Enka equipType to our slot name */
export const SLOT_MAP: Record<string, string> = {
  EQUIP_BRACER: "FLOWER",
  EQUIP_NECKLACE: "PLUME",
  EQUIP_SHOES: "SANDS",
  EQUIP_RING: "GOBLET",
  EQUIP_DRESS: "CIRCLET",
};

/** Slot display order */
export const SLOT_ORDER = ["FLOWER", "PLUME", "SANDS", "GOBLET", "CIRCLET"] as const;

/** Map element DMG bonus props to a canonical element name */
export const ELEMENT_DMG_MAP: Record<string, string> = {
  FIGHT_PROP_FIRE_ADD_HURT: "Pyro",
  FIGHT_PROP_ELEC_ADD_HURT: "Electro",
  FIGHT_PROP_WATER_ADD_HURT: "Hydro",
  FIGHT_PROP_WIND_ADD_HURT: "Anemo",
  FIGHT_PROP_ICE_ADD_HURT: "Cryo",
  FIGHT_PROP_ROCK_ADD_HURT: "Geo",
  FIGHT_PROP_GRASS_ADD_HURT: "Dendro",
};
