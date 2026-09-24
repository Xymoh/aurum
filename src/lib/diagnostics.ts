/**
 * The aggregate view of a Genshin build, and the reason it exists beside
 * the per-piece grade: five individually decent artifacts can still add up
 * to a build where a third of the upgrades landed on stats the character
 * never uses, and no per-piece score can show that. Same shape as the Star
 * Rail and Zenless diagnostics, so the three games read alike.
 */

import type { ArtifactSlot } from "../types/artifact";
import type { CharacterData } from "../types/character";
import { getBuildConfig, substatWeightFor } from "./scoring";

/** Below this weight a roll is doing nothing useful and counts as waste. */
export const WASTE_THRESHOLD = 0.2;

/** Five pieces at nine rolls each: the most a build can physically hold. */
export const MAX_ROLLS = 45;
/** Rolls in a realistic strong build: five pieces that mostly started with four substats. */
export const BENCHMARK_ROLLS = 40;

export interface GenshinBuildDiagnostics {
  totalRolls: number;
  effectiveRolls: number;
  wastedRolls: number;
  /** Where the wasted rolls sit, worst first. */
  waste: { slot: ArtifactSlot; statKey: string; displayName: string; rolls: number }[];
  /** Substat totals, most rolls first. */
  totals: { statKey: string; displayName: string; isPercentage: boolean; rolls: number; value: number }[];
  /** CRIT DMG per point of CRIT Rate on the character screen; roughly 2 is balanced. */
  critRatio: number | null;
  /** The character's Energy Recharge against the rotation requirement, when one is curated. */
  energy: { current: number; target: number } | null;
  /** The lowest-scoring piece, the one holding the build back. */
  weakest: { slot: ArtifactSlot; percent: number } | null;
}

/** Rolls on a substat: every roll counted, the one that created it included. */
function rollsOf(sub: { rolls: number[]; rollCount: number }): number {
  return sub.rolls.length > 0 ? sub.rolls.length : sub.rollCount + 1;
}

export function buildDiagnostics(character: CharacterData): GenshinBuildDiagnostics {
  const totals = new Map<string, GenshinBuildDiagnostics["totals"][number]>();
  const waste: GenshinBuildDiagnostics["waste"] = [];
  let totalRolls = 0;
  let effectiveRolls = 0;
  let wastedRolls = 0;

  for (const art of character.artifacts) {
    for (const sub of art.substats) {
      const rolls = rollsOf(sub);
      totalRolls += rolls;
      const weight = substatWeightFor(character.avatarId, art.mainStat.statKey, sub.statKey);
      if (weight >= WASTE_THRESHOLD) effectiveRolls += rolls;
      else {
        wastedRolls += rolls;
        waste.push({ slot: art.slot, statKey: sub.statKey, displayName: sub.displayName, rolls });
      }

      const entry = totals.get(sub.statKey) ?? {
        statKey: sub.statKey,
        displayName: sub.displayName,
        isPercentage: sub.isPercentage,
        rolls: 0,
        value: 0,
      };
      entry.rolls += rolls;
      entry.value += sub.value;
      totals.set(sub.statKey, entry);
    }
  }
  waste.sort((a, b) => b.rolls - a.rolls);

  const { critRate, critDmg, energyRecharge } = character.stats;
  const target = getBuildConfig(character.avatarId, character.element)?.er_threshold;

  const weakestArt = [...character.artifacts].sort((a, b) => a.score.potentialPercent - b.score.potentialPercent)[0];

  return {
    totalRolls,
    effectiveRolls,
    wastedRolls,
    waste,
    totals: [...totals.values()]
      .map((t) => ({ ...t, value: Math.round(t.value * 10) / 10 }))
      .sort((a, b) => b.rolls - a.rolls),
    critRatio: critRate > 0 ? critDmg / critRate : null,
    energy: target ? { current: energyRecharge, target } : null,
    weakest: weakestArt ? { slot: weakestArt.slot, percent: weakestArt.score.potentialPercent } : null,
  };
}
