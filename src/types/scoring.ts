export interface ScoringWeights {
  CRIT_RATE: number;
  CRIT_DMG: number;
  ATK_PERCENT: number;
  HP_PERCENT: number;
  DEF_PERCENT: number;
  ELEMENTAL_MASTERY: number;
  ENERGY_RECHARGE: number;
  HEALING_BONUS: number;
  PHYSICAL_DMG: number;
  ELEMENTAL_DMG: number;
  FLAT_ATK: number;
  FLAT_HP: number;
  FLAT_DEF: number;
}

export interface CharacterBuildConfig {
  name: string;
  substat_weights: ScoringWeights;
  main_stats_ideal: {
    SANDS?: string[];
    GOBLET?: string[];
    CIRCLET?: string[];
  };
  recommended_sets: string[];
  er_threshold?: number;
}
