import type { Artifact, ScoreGrade, ArtifactSubstat } from "../types/artifact";
import type { CharacterData, BuildScore, SetBonusResult } from "../types/character";
import type { ScoringWeights, CharacterBuildConfig } from "../types/scoring";
import type { FightProp } from "../types/enka";
import {
  MAX_ROLL_VALUES,
  TOTAL_ROLLS_5_STAR,
  MAX_CV,
  GRADE_THRESHOLDS,
  ELEMENT_DMG_MAP,
  POTENTIAL_SCALES,
  REFERENCE_HIGH_ROLL,
} from "./constants";
import { computeRerollAdvice } from "./reroll";
import characterBuildsData from "../data/character-builds.json";
import goProcessedData from "../../genshin_optimizer_processed_data.json";

// ── Character entry shape from the GO processed data ───────────────
interface GOCharacterEntry {
  name: string;
  display_name: string;
  element: string;
  weapon_type: string;
  rarity: number;
  avatar_id: string | null;
  scaling_attribute: string;
  scaling_stat: string;
  ascension_stat: string;
  ascension_bonus_curve: number[];
  substat_weights: ScoringWeights | null;
  main_stats_ideal: CharacterBuildConfig["main_stats_ideal"] | null;
  recommended_sets: string[];
  er_threshold: number | null;
  base_stats: { hp_base: number | null; atk_base: number | null; def_base: number | null };
  region: string | null;
  source: string;
  data_version: string;
}

type GOProcessedData = Record<string, GOCharacterEntry>;

const GO_DATA = goProcessedData as GOProcessedData;

// ── Build avatar-id → GO entry lookup ──────────────────────────────
const goByAvatarId = new Map<string, GOCharacterEntry>();
for (const entry of Object.values(GO_DATA)) {
  if (entry.avatar_id) {
    goByAvatarId.set(entry.avatar_id, entry);
  }
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  CRIT_RATE: 1.0,
  CRIT_DMG: 1.0,
  ATK_PERCENT: 0.5,
  HP_PERCENT: 0.0,
  DEF_PERCENT: 0.0,
  ELEMENTAL_MASTERY: 0.0,
  ENERGY_RECHARGE: 0.0,
  HEALING_BONUS: 0.0,
  PHYSICAL_DMG: 0.0,
  ELEMENTAL_DMG: 0.0,
  FLAT_ATK: 0.1,
  FLAT_HP: 0.0,
  FLAT_DEF: 0.0,
};

// ── Max roll lookup ──

export function getMaxRoll(statKey: string): number {
  return MAX_ROLL_VALUES[statKey] ?? 0;
}

// ── Potential scale lookup ──

export function computePotentialScale(statKey: string): number {
  const scale = POTENTIAL_SCALES[statKey];
  if (scale === undefined) {
    console.warn(`Unknown stat key for potential scale: ${statKey}`);
    return 0;
  }
  return scale;
}

// ── Adjusted weights (shared helper) ──

/**
 * Derive per-substat scoring weights: apply flat-stat derivation FIRST
 * (flat weight = percent weight × 0.4), then zero out the weight for
 * whichever stat occupies the main stat slot, so a Flower/Plume's fixed
 * flat main stat (which can never also roll as a substat) is correctly
 * excluded and not re-introduced by the derivation step above.
 */
function getAdjustedWeights(weights: ScoringWeights, mainStatKey: string): ScoringWeights {
  const adjustedWeights = { ...weights };
  adjustedWeights.FLAT_ATK = adjustedWeights.ATK_PERCENT * 0.4;
  adjustedWeights.FLAT_HP = adjustedWeights.HP_PERCENT * 0.4;
  adjustedWeights.FLAT_DEF = adjustedWeights.DEF_PERCENT * 0.4;

  const mainStatWeightKey = resolveWeightKey(mainStatKey);
  if (mainStatWeightKey && adjustedWeights[mainStatWeightKey] !== undefined) {
    adjustedWeights[mainStatWeightKey] = 0;
  }

  return adjustedWeights;
}

// ── Weighted Potential ──

/**
 * Compute the Weighted Potential for an artifact's substats.
 * For each substat: weight × statValue × potentialScale.
 */
export function computeWeightedPotential(
  substats: ArtifactSubstat[],
  weights: ScoringWeights,
  mainStatKey: string
): number {
  const adjustedWeights = getAdjustedWeights(weights, mainStatKey);

  let totalPotential = 0;
  for (const sub of substats) {
    const weightKey = resolveWeightKey(sub.statKey);
    const weight = weightKey ? (adjustedWeights[weightKey] ?? 0) : 0;
    const potentialScale = computePotentialScale(sub.statKey);

    totalPotential += weight * sub.value * potentialScale;
  }

  return totalPotential;
}

// ── Roll quality ──

export function computeRollQuality(value: number, max: number): ArtifactSubstat["rollQuality"] {
  if (max <= 0) return "medium";
  const ratio = value / (max * 4); // rough ratio against 4 max rolls
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

// ── Roll Value (RV) ──

export function computeRV(substats: ArtifactSubstat[]): number {
  let totalRolls = 0;
  for (const sub of substats) {
    if (sub.maxRoll > 0) {
      totalRolls += sub.value / sub.maxRoll;
    }
  }
  return (totalRolls / TOTAL_ROLLS_5_STAR) * 100;
}

// ── Crit Value (CV) ──

export function computeCV(substats: ArtifactSubstat[]): number {
  let cv = 0;
  for (const sub of substats) {
    if (sub.statKey === "FIGHT_PROP_CRITICAL") {
      cv += sub.value * 2;
    } else if (sub.statKey === "FIGHT_PROP_CRITICAL_HURT") {
      cv += sub.value;
    }
  }
  return cv;
}

// ── Weighted Substats Efficiency (WSE) ──

function resolveWeightKey(statKey: string): keyof ScoringWeights | null {
  const mapping: Record<string, keyof ScoringWeights> = {
    FIGHT_PROP_CRITICAL: "CRIT_RATE",
    FIGHT_PROP_CRITICAL_HURT: "CRIT_DMG",
    FIGHT_PROP_ATTACK_PERCENT: "ATK_PERCENT",
    FIGHT_PROP_HP_PERCENT: "HP_PERCENT",
    FIGHT_PROP_DEFENSE_PERCENT: "DEF_PERCENT",
    FIGHT_PROP_ELEMENT_MASTERY: "ELEMENTAL_MASTERY",
    FIGHT_PROP_CHARGE_EFFICIENCY: "ENERGY_RECHARGE",
    FIGHT_PROP_HEAL_ADD: "HEALING_BONUS",
    FIGHT_PROP_PHYSICAL_ADD_HURT: "PHYSICAL_DMG",
    FIGHT_PROP_FIRE_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ELEC_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_WATER_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_WIND_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ICE_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ROCK_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_GRASS_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ATTACK: "FLAT_ATK",
    FIGHT_PROP_HP: "FLAT_HP",
    FIGHT_PROP_DEFENSE: "FLAT_DEF",
  };
  return mapping[statKey] ?? null;
}

function getBuildConfig(avatarId: number): CharacterBuildConfig | null {
  const idStr = String(avatarId);

  // ── 1. Primary: GO processed data (authoritative + merged build configs) ──
  const goEntry = goByAvatarId.get(idStr);
  if (goEntry?.substat_weights) {
    return {
      name: goEntry.display_name,
      substat_weights: goEntry.substat_weights,
      main_stats_ideal: goEntry.main_stats_ideal ?? {},
      recommended_sets: goEntry.recommended_sets,
      er_threshold: goEntry.er_threshold ?? undefined,
    };
  }

  // ── 2. Fallback: GO data is present but build config is not filled yet ──
  //    We still return metadata-rich info so that the scoring can use default
  //    weights informed by the character's scaling_attribute.
  if (goEntry) {
    return {
      name: goEntry.display_name,
      substat_weights: deriveWeightsFromScaling(goEntry),
      main_stats_ideal: {},
      recommended_sets: [],
      er_threshold: undefined,
    };
  }

  // ── 3. Legacy fallback: old character-builds.json ──
  const builds = characterBuildsData as Record<string, CharacterBuildConfig>;
  return builds[idStr] ?? null;
}

/**
 * Derive sensible default substat weights when no explicit build config
 * is available.  Uses the character's ascension scaling stat to bias
 * weights in the right direction.
 */
function deriveWeightsFromScaling(entry: GOCharacterEntry): ScoringWeights {
  const weights = { ...DEFAULT_WEIGHTS };

  // Every character benefits from crit and some ER
  weights.CRIT_RATE = 1.0;
  weights.CRIT_DMG = 1.0;
  weights.ENERGY_RECHARGE = 0.4; // Baseline ER value for all characters

  switch (entry.scaling_stat) {
    case "HP_PERCENT":
      weights.HP_PERCENT = 0.8;
      weights.FLAT_HP = 0.15;
      break;
    case "DEF_PERCENT":
      weights.DEF_PERCENT = 0.8;
      weights.FLAT_DEF = 0.15;
      break;
    case "ELEMENTAL_MASTERY":
      weights.ELEMENTAL_MASTERY = 1.0;
      weights.ATK_PERCENT = 0.3;
      break;
    case "ENERGY_RECHARGE":
      weights.ENERGY_RECHARGE = 0.8;
      weights.ATK_PERCENT = 0.4;
      break;
    case "HEALING_BONUS":
      weights.HEALING_BONUS = 0.7;
      weights.HP_PERCENT = 0.6;
      weights.ATK_PERCENT = 0.4;
      break;
    default:
      // ATK_PERCENT, CRIT_RATE, CRIT_DMG, elemental DMG → ATK scaling
      weights.ATK_PERCENT = 0.7;
      weights.FLAT_ATK = 0.15;
      break;
  }

  return weights;
}

export function computeWSE(substats: ArtifactSubstat[], avatarId: number): number {
  const config = getBuildConfig(avatarId);
  const weights = config?.substat_weights ?? DEFAULT_WEIGHTS;

  let weightedRolls = 0;
  let maxWeightedRolls = 0;

  for (const sub of substats) {
    if (sub.maxRoll <= 0) continue;

    const weightKey = resolveWeightKey(sub.statKey);
    const weight = weightKey ? (weights[weightKey] ?? 0) : 0;
    const rolls = sub.value / sub.maxRoll;

    weightedRolls += rolls * weight;
    // Max possible: 2.25 perfect rolls scaled by this stat's weight
    maxWeightedRolls += 2.25 * weight;
  }

  if (maxWeightedRolls === 0) return 0;
  return (weightedRolls / maxWeightedRolls) * 100;
}

// ── Ideal Potential ──

/**
 * Compute the theoretical maximum weighted potential for an artifact given
 * a character's weights and the artifact's main stat (which is excluded).
 *
 * Formula: REFERENCE_HIGH_ROLL × (sum of top-4 weights + 5 × max weight) / 2
 *
 * The full formula (without /2) represents 9 perfect rolls (4 starting substats
 * + 5 upgrade rolls). We halve it to create a Fribbels-style 0–200% scale where:
 * - 100% = a solid artifact (~4.5 useful max rolls, average good piece)
 * - 200% = theoretically perfect (all 9 rolls max into best stats, near-impossible)
 */
export function computeIdealPotential(
  weights: ScoringWeights,
  mainStatKey: string
): number {
  const adjustedWeights = getAdjustedWeights(weights, mainStatKey);

  // Get all non-zero weights, sorted descending
  const nonZeroWeights = Object.values(adjustedWeights)
    .filter(w => w > 0)
    .sort((a, b) => b - a);

  if (nonZeroWeights.length === 0) return 0;

  // Take top 4 (or fewer if not enough non-zero weights)
  const topWeights = nonZeroWeights.slice(0, 4);
  const maxWeight = topWeights[0]; // highest weight

  // Ideal = REFERENCE_HIGH_ROLL × (sum of top-4 weights + 5 × maxWeight) / 2
  // The full theoretical max represents 9 perfect rolls. We halve it to set the
  // "ideal" baseline at ~4.5 useful rolls (Fribbels-style 0–200% scale).
  // 100% = a solid artifact (~4.5 effective max rolls)
  // 200% = theoretically perfect (all 9 rolls max into best stats)
  const sumTop4 = topWeights.reduce((sum, w) => sum + w, 0);
  const idealPotential = REFERENCE_HIGH_ROLL * (sumTop4 + 5 * maxWeight) / 2;

  return idealPotential;
}

// ── Main Stat Correctness ──

export function checkMainStat(
  slot: string,
  mainStatKey: FightProp,
  avatarId: number,
): { isCorrect: boolean; isRecommended: boolean } {
  // Flower/Plume have fixed main stats - always correct
  if (slot === "FLOWER" || slot === "PLUME") {
    return { isCorrect: true, isRecommended: true };
  }

  const config = getBuildConfig(avatarId);
  if (!config?.main_stats_ideal) return { isCorrect: true, isRecommended: true };

  const idealSlot = config.main_stats_ideal as Record<string, string[] | undefined>;
  const ideal = idealSlot[slot];

  if (!ideal || ideal.length === 0) return { isCorrect: true, isRecommended: true };

  // Build a list of stat keys to match against (resolve aliases)
  const statKeysToCheck: string[] = [mainStatKey];
  const mappedKey = resolveWeightKey(mainStatKey);
  if (mappedKey) statKeysToCheck.push(mappedKey);

  // If main stat is an elemental damage bonus, also add ELEMENTAL_DMG alias
  if (mainStatKey in ELEMENT_DMG_MAP) {
    statKeysToCheck.push("ELEMENTAL_DMG");
    statKeysToCheck.push(`${ELEMENT_DMG_MAP[mainStatKey].toUpperCase()}_DMG`);
  }

  for (const key of statKeysToCheck) {
    if (ideal.includes(key)) return { isCorrect: true, isRecommended: true };
  }

  return { isCorrect: false, isRecommended: false };
}

// ── Set Bonus Multiplier ──

export function computeSetBonusMultiplier(setId: string, slot: string): number {
  // Only Goblet can be off-set without penalty in Genshin (common practice)
  if (slot === "GOBLET") return 1.0;
  // Flower, Plume, Sands, Circlet are penalized if off-set
  return 1.0; // We don't penalize yet - set bonus detection is done at build level
}

// ── Set Bonus Evaluation ──

/**
 * Evaluate set bonuses from equipped artifacts and compare against
 * a character's recommended sets.
 *
 * - Counts equipped artifacts per set ID
 * - Recognizes 2-piece bonus (count ≥ 2) and 4-piece bonus (count ≥ 4)
 * - Compares active sets against recommendedSets from character config
 * - Returns SetBonusResult with activeSets and matchStatus
 * - Informational only - does NOT apply any multiplier to Potential Percent
 * - Maximum 3 distinct active set bonuses displayable (from 5 artifact slots)
 */
export function evaluateSetBonus(
  artifacts: Artifact[],
  recommendedSets: string[]
): SetBonusResult {
  // Count artifacts per set
  const setCounts = new Map<string, { count: number; name: string }>();
  for (const art of artifacts) {
    const entry = setCounts.get(art.setId) ?? { count: 0, name: art.setName };
    entry.count++;
    setCounts.set(art.setId, entry);
  }

  // Determine active bonuses (max 3 distinct sets possible from 5 slots)
  const activeSets: Array<{ setId: string; setName: string; pieces: number }> = [];
  for (const [setId, { count, name }] of setCounts) {
    if (count >= 4) {
      activeSets.push({ setId, setName: name, pieces: 4 });
    } else if (count >= 2) {
      activeSets.push({ setId, setName: name, pieces: 2 });
    }
  }

  // Determine match status
  if (!recommendedSets || recommendedSets.length === 0) {
    return { activeSets, matchStatus: "no_recommendation" };
  }

  const recommendedSetIds = new Set(recommendedSets);
  const has4pcMatch = activeSets.some(s => s.pieces === 4 && recommendedSetIds.has(s.setId));
  const has2pcMatch = activeSets.some(s => recommendedSetIds.has(s.setId));

  let matchStatus: SetBonusResult["matchStatus"];
  if (has4pcMatch) matchStatus = "full_match";
  else if (has2pcMatch) matchStatus = "partial_match";
  else matchStatus = "no_match";

  return { activeSets, matchStatus };
}

// ── Potential Percent ──

/**
 * Compute Potential Percent: the ratio of weighted potential to ideal potential.
 * Returns 0 if ideal is 0 (avoids division by zero).
 * Scores can exceed 100% (up to ~200%) since ideal represents half the theoretical max.
 */
export function computePotentialPercent(
  weightedPotential: number,
  idealPotential: number
): number {
  if (idealPotential <= 0) return 0;
  const percent = (weightedPotential / idealPotential) * 100;
  return Math.max(percent, 0);
}

// ── Grade mapping ──

export function getGrade(score: number): ScoreGrade {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.grade as ScoreGrade;
    }
  }
  return "F";
}

// ── Aggregate artifact score ──

export function scoreArtifact(
  artifact: Artifact,
  avatarId: number,
  /**
   * The character's current total Energy Recharge %. Supplying it lets reroll
   * advice respect the character's rotation requirement; without it, ER is
   * treated as an ordinary substat.
   */
  currentTotalER?: number,
): Artifact {
  const config = getBuildConfig(avatarId);
  const weights = config?.substat_weights ?? DEFAULT_WEIGHTS;

  // New Fribbels-style scoring
  const weightedPotential = computeWeightedPotential(artifact.substats, weights, artifact.mainStat.statKey);
  const idealPotential = computeIdealPotential(weights, artifact.mainStat.statKey);
  const potentialPercent = computePotentialPercent(weightedPotential, idealPotential);
  const grade = getGrade(potentialPercent);

  // Main stat evaluation
  const mainStatResult = checkMainStat(artifact.slot, artifact.mainStat.statKey, avatarId);

  // Legacy fields (backward compat)
  const rv = computeRV(artifact.substats);
  const cv = computeCV(artifact.substats);
  const cvNormalized = Math.min(cv / MAX_CV, 1.0);
  const wse = computeWSE(artifact.substats, avatarId);

  // Reroll advice needs the same main-stat-adjusted weights the score itself uses,
  // so a stat occupying the main stat slot isn't nominated as a reroll target.
  const adjustedWeights = getAdjustedWeights(weights, artifact.mainStat.statKey);
  const reroll = computeRerollAdvice(
    artifact,
    adjustedWeights,
    (statKey, w) => {
      const key = resolveWeightKey(statKey);
      return key ? (w[key] ?? 0) : 0;
    },
    computePotentialScale,
    weightedPotential,
    idealPotential,
    currentTotalER != null && config?.er_threshold != null
      ? { currentTotalER, threshold: config.er_threshold }
      : undefined,
  );

  return {
    ...artifact,
    mainStat: {
      ...artifact.mainStat,
      isCorrect: mainStatResult.isCorrect,
      isRecommended: mainStatResult.isRecommended,
    },
    score: {
      potentialPercent,
      weightedPotential,
      idealPotential,
      mainStatCorrect: mainStatResult.isCorrect,
      mainStatMultiplier: mainStatResult.isCorrect ? 1.0 : 0.3,
      setBonusMultiplier: 1.0,
      rv,
      cv,
      cvNormalized,
      wse,
      total: potentialPercent,  // unified score
      grade,
      reroll,
    },
  };
}

// ── Build score ──

export function scoreBuild(character: CharacterData): BuildScore {
  const artifactCount = character.artifacts.length;

  if (artifactCount === 0) {
    return {
      total: 0,
      grade: "F",
      artifactCount: 0,
      correctMainStats: 0,
      totalSelectableSlots: 0,
      setBonus: { activeSets: [], matchStatus: "no_recommendation" },
    };
  }

  // Average potentialPercent across all equipped artifacts
  const avgPotentialPercent = character.artifacts.reduce(
    (sum, art) => sum + art.score.potentialPercent, 0
  ) / artifactCount;
  const total = Math.round(avgPotentialPercent * 10) / 10;

  // Count correct main stats for selectable slots
  const selectableSlots: string[] = ["SANDS", "GOBLET", "CIRCLET"];
  const selectableArtifacts = character.artifacts.filter(
    art => selectableSlots.includes(art.slot)
  );
  const totalSelectableSlots = selectableArtifacts.length;
  const correctMainStats = selectableArtifacts.filter(
    art => art.score.mainStatCorrect
  ).length;

  // Evaluate set bonus (informational - no multiplier applied)
  const config = getBuildConfig(character.avatarId);
  const setBonus = evaluateSetBonus(character.artifacts, config?.recommended_sets ?? []);

  return {
    total,
    grade: getGrade(total),
    artifactCount,
    correctMainStats,
    totalSelectableSlots,
    setBonus,
  };
}
