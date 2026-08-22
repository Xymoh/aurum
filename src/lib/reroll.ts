/**
 * Reroll advice - modelling Dust of Enlightenment (game version 5.7+).
 *
 * ── How the in-game mechanic actually works ────────────────────────────────
 * Reshaping a fully-levelled (+20) 5★ artifact redistributes its 5 upgrade
 * rolls across the 4 substats it already has. It cannot change *which* stats
 * are present, only how many upgrades each one received. You nominate two
 * substats to prioritise and are guaranteed at least two upgrades across that
 * pair; the remaining upgrades land at random. Every roll takes one of four
 * values - 70/80/90/100% of that stat's max roll - with equal probability.
 * Crucially, you may **reject** the result and keep the original, so a reshape
 * never makes an artifact worse; the only thing it costs is dust.
 *
 * ── Why this replaces a "best-case ceiling" score ──────────────────────────
 * Ranking by the theoretical ceiling (all 5 rolls landing max into the best
 * stat) is actively misleading: it scores a junk artifact - whose four substats
 * are worthless for the character - as having enormous "upside", because the
 * gap between a near-zero score and that fantasy ceiling is huge. But no amount
 * of redistributing rolls between four bad stats produces a good artifact.
 *
 * Since dust is scarce and a bad result can be rejected, the only question that
 * matters is: **how much dust should I expect to spend before this piece
 * meaningfully improves?** That is driven by three things, which this model
 * captures together:
 *   1. Are the substats worth anything to this character? (else → replace it)
 *   2. Did the current rolls land badly, leaving headroom? (else → nothing to gain)
 *   3. Is a random redistribution likely to beat the current one?
 *
 * We answer it by Monte-Carlo simulating the reshape and measuring the share of
 * outcomes that clear a meaningful margin over the current score.
 */
import type { Artifact, ArtifactSubstat, RerollAdvice } from "../types/artifact";
import type { ScoringWeights } from "../types/scoring";

/** The four possible values of any substat roll, as a fraction of its max roll. */
const ROLL_TIERS = [0.7, 0.8, 0.9, 1.0];

/** Mean roll tier - used to estimate how much of a stat's value came from upgrades. */
export const AVG_ROLL_TIER = 0.85;

/** A +20 5★ artifact always has 5 upgrade rolls (at +4/+8/+12/+16/+20). */
const UPGRADE_ROLLS = 5;

/** Upgrades guaranteed to land across the two nominated substats. */
const GUARANTEED_ON_TARGETS = 2;

/** Simulated reshapes per artifact. Enough to stabilise the probability to ~±1%. */
const TRIALS = 1500;

/**
 * Minimum gain (in Potential % points) that counts as a real improvement.
 * Below this a reshape is technically better but not worth spending dust on.
 */
const MEANINGFUL_GAIN = 5;

/**
 * A reshape is only worth dust if the piece can plausibly end up genuinely
 * good. If the realistic best case (90th percentile outcome) can't reach this,
 * the substats themselves are the problem - farm a replacement instead.
 */
const WORTH_INVESTING_IN = 90;

/** Dust cost of one reshape, per slot (Flower/Plume are half price). */
const DUST_COST: Record<string, number> = {
  FLOWER: 1,
  PLUME: 1,
  SANDS: 2,
  GOBLET: 2,
  CIRCLET: 2,
};

/** Enka's stat key for Energy Recharge, the one substat with a hard breakpoint. */
const ER_STAT_KEY = "FIGHT_PROP_CHARGE_EFFICIENCY";

/** Share of reshapes that must breach the ER floor before we warn about it. */
const ER_RISK_SHARE = 0.15;

/**
 * What the character needs from Energy Recharge, so a reshape can't quietly
 * break their rotation.
 *
 * ER is the one substat that isn't worth "more is better": it buys nothing past
 * the point where the burst comes up on time, but falling under that point
 * costs a whole burst per rotation — far more damage than the crit rolls a
 * reshape would trade it for. The weighted score can't express that, because a
 * single linear weight is monotonic by construction.
 */
export interface ErContext {
  /** The character's current total ER%, including this artifact's contribution. */
  currentTotalER: number;
  /** Rotation requirement for this character, from the curated build config. */
  threshold: number;
}

export interface RerollTierDef {
  id: "high" | "medium" | "low";
  label: string;
  /** Upper bound (inclusive) on expected dust spent to reach a meaningful gain. */
  maxExpectedDust: number;
  color: string;
  blurb: string;
}

/** Ordered cheapest-first; the first tier whose budget covers the estimate wins. */
export const REROLL_TIERS: RerollTierDef[] = [
  {
    id: "high",
    label: "Reroll now",
    maxExpectedDust: 4,
    color: "#4ade80",
    blurb: "Among the best value per dust on this account.",
  },
  {
    id: "medium",
    label: "Worth rerolling",
    maxExpectedDust: 10,
    color: "#fbbf24",
    blurb: "Decent value, but budget for several attempts.",
  },
  {
    id: "low",
    label: "Low priority",
    maxExpectedDust: 20,
    color: "#94a3b8",
    blurb: "Dust goes further on other pieces first.",
  },
];

export function getRerollTier(expectedDust: number): RerollTierDef | null {
  for (const tier of REROLL_TIERS) {
    if (expectedDust <= tier.maxExpectedDust) return tier;
  }
  return null;
}

/**
 * Odds of landing at least one meaningful gain within `reshapes` attempts.
 * Unlike an expected-dust average, every figure this produces corresponds to a
 * spend the player can actually make: `reshapes × dustCost` dust, exactly.
 */
export function chanceWithin(improveChance: number, reshapes: number): number {
  if (improveChance <= 0) return 0;
  return 1 - Math.pow(1 - improveChance, reshapes);
}

/**
 * Render a probability for display. Sampling 1,500 reshapes can't distinguish
 * "certain" from "99.9% likely", so a clean sweep is shown as "99%+" rather
 * than promising a 100% outcome the model never actually proved.
 */
export function formatChance(chance: number): string {
  if (chance >= 0.995) return "99%+";
  if (chance > 0 && chance < 0.01) return "<1%";
  return `${Math.round(chance * 100)}%`;
}

const NO_ADVICE: RerollAdvice = {
  eligible: false,
  action: "none",
  priority: null,
  improveChance: 0,
  expectedReshapes: Infinity,
  expectedDust: Infinity,
  dustCost: 0,
  currentPercent: 0,
  medianGain: 0,
  realisticCeiling: 0,
  targetStats: [],
  erRisk: false,
  erBreachChance: 0,
  erThreshold: 0,
  reason: "",
};

/** Small deterministic PRNG so scores never flicker between renders or test runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A stable identity for an artifact, built only from the properties that define
 * it. Two identical pieces hash alike and the same piece hashes the same way on
 * every load, which is what keeps the simulated advice from drifting.
 */
function artifactFingerprint(artifact: Artifact): string {
  const subs = artifact.substats
    .map((s) => `${s.statKey}:${s.value}:${s.rollCount}`)
    .join("|");
  return `${artifact.setId}/${artifact.slot}/${artifact.level}/${artifact.mainStat.statKey}/${subs}`;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Estimate reroll advice for one artifact.
 *
 * @param resolveWeight maps a substat's stat key to its scoring weight for this character
 * @param potentialScale maps a stat key to its CRIT-DMG-equivalent normalisation factor
 * @param currentWeighted the artifact's measured weighted potential
 * @param idealPotential the character/slot ideal used to convert values into Potential %
 */
export function computeRerollAdvice(
  artifact: Artifact,
  weights: ScoringWeights,
  resolveWeight: (statKey: string, weights: ScoringWeights) => number,
  potentialScale: (statKey: string) => number,
  currentWeighted: number,
  idealPotential: number,
  erContext?: ErContext,
): RerollAdvice {
  const subs = artifact.substats;
  const currentPercent = idealPotential > 0 ? Math.max(0, (currentWeighted / idealPotential) * 100) : 0;

  // Reshaping requires a fully-levelled 5★ with a full set of 4 substats.
  if (artifact.rarity !== 5 || subs.length !== 4 || idealPotential <= 0) {
    return { ...NO_ADVICE, currentPercent };
  }
  if (artifact.level < 20) {
    return {
      ...NO_ADVICE,
      currentPercent,
      action: "level_up",
      reason: "Reshaping needs a +20 artifact - level it first.",
    };
  }

  // Value of a single max-value roll into each substat, in weighted-potential units.
  const valuePerRoll = subs.map(
    (s) => resolveWeight(s.statKey, weights) * potentialScale(s.statKey) * s.maxRoll,
  );

  // An optimal player nominates the two substats worth the most per roll.
  const order = subs.map((_, i) => i).sort((a, b) => valuePerRoll[b] - valuePerRoll[a]);
  const targets = [order[0], order[1]];
  const isTarget = [false, false, false, false];
  targets.forEach((i) => (isTarget[i] = true));

  // Nothing on this piece is worth anything to this character.
  if (valuePerRoll[order[0]] <= 0) {
    return {
      ...NO_ADVICE,
      eligible: true,
      currentPercent,
      dustCost: DUST_COST[artifact.slot] ?? 2,
      action: "replace",
      reason: "None of these substats help this character - reshaping can't fix that.",
    };
  }

  // Strip the estimated contribution of the current upgrades to isolate the
  // base rolls, which a reshape leaves untouched and which therefore form the
  // floor every simulated outcome is built on.
  let baseWeighted = 0;
  for (let i = 0; i < subs.length; i++) {
    const s: ArtifactSubstat = subs[i];
    const upgradeValue = s.rollCount * AVG_ROLL_TIER * s.maxRoll;
    const baseValue = Math.max(0, s.value - upgradeValue);
    baseWeighted += resolveWeight(s.statKey, weights) * potentialScale(s.statKey) * baseValue;
  }

  // ── Energy Recharge floor ────────────────────────────────────────────────
  // Rolls sitting on ER may be load-bearing. Establish the total ER a reshape
  // must not drop below, and how much of it this artifact is responsible for.
  const erIndex = subs.findIndex((s) => s.statKey === ER_STAT_KEY);
  const erSub = erIndex >= 0 ? subs[erIndex] : null;
  const erFloor = erContext
    // Already short of the requirement? Then the floor is where they are now:
    // don't hand back advice that digs the hole deeper.
    ? Math.min(erContext.currentTotalER, erContext.threshold)
    : -Infinity;
  const erFromOthers = erContext && erSub ? erContext.currentTotalER - erSub.value : 0;
  const erBase = erSub ? Math.max(0, erSub.value - erSub.rollCount * AVG_ROLL_TIER * erSub.maxRoll) : 0;

  // Seed from the artifact's *content*, never its `id` — ids embed Date.now()
  // and Math.random() at parse time, so seeding from one would re-roll the
  // simulation on every page load and let borderline pieces flip verdicts
  // between refreshes.
  const rand = mulberry32(hashString(artifactFingerprint(artifact)));
  const outcomes: number[] = [];
  const improvedOutcomes: number[] = [];
  let erBreaches = 0;
  const gainThreshold = currentPercent + MEANINGFUL_GAIN;

  for (let t = 0; t < TRIALS; t++) {
    // Distribute the upgrades at random, then honour the two-on-target pity.
    const counts = [0, 0, 0, 0];
    for (let r = 0; r < UPGRADE_ROLLS; r++) counts[Math.floor(rand() * 4)]++;

    let onTarget = counts[targets[0]] + counts[targets[1]];
    while (onTarget < GUARANTEED_ON_TARGETS) {
      // Move a roll off a non-target stat onto one of the nominated pair.
      const donor = [0, 1, 2, 3].filter((i) => !isTarget[i] && counts[i] > 0);
      if (donor.length === 0) break;
      counts[donor[Math.floor(rand() * donor.length)]]--;
      counts[targets[Math.floor(rand() * 2)]]++;
      onTarget++;
    }

    let upgradeWeighted = 0;
    let erRolled = erBase;
    for (let i = 0; i < 4; i++) {
      for (let r = 0; r < counts[i]; r++) {
        const tier = ROLL_TIERS[Math.floor(rand() * ROLL_TIERS.length)];
        upgradeWeighted += valuePerRoll[i] * tier;
        if (i === erIndex) erRolled += subs[i].maxRoll * tier;
      }
    }

    const percent = ((baseWeighted + upgradeWeighted) / idealPotential) * 100;
    outcomes.push(percent);
    if (percent >= gainThreshold) improvedOutcomes.push(percent);

    // Tracked and reported, deliberately NOT folded into the odds above. ER
    // requirements are a single curated number per character and depend on the
    // team, so silently suppressing advice on that basis would turn an
    // approximation into a hard rule — and make the headline odds mean
    // something different for ER-bearing pieces than for everything else.
    if (erSub != null && erFromOthers + erRolled < erFloor) erBreaches++;
  }

  const median = (sorted: number[]) =>
    sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.5))];

  outcomes.sort((a, b) => a - b);
  improvedOutcomes.sort((a, b) => a - b);
  const realisticCeiling = outcomes[Math.min(outcomes.length - 1, Math.floor(outcomes.length * 0.9))];

  // Median across the *successful* reshapes only: "if this works, how much do I
  // gain?". Taking the median over all outcomes would report 0 whenever most
  // attempts fail, which is precisely when a player most needs the number.
  const medianGain =
    improvedOutcomes.length > 0 ? Math.max(0, median(improvedOutcomes) - currentPercent) : 0;

  const dustCost = DUST_COST[artifact.slot] ?? 2;
  const improveChance = improvedOutcomes.length / TRIALS;
  const expectedReshapes = improveChance > 0 ? 1 / improveChance : Infinity;
  const expectedDust = expectedReshapes * dustCost;
  const targetStats = targets.map((i) => subs[i].displayName);

  // Surfaced alongside the odds so the player can weigh it themselves: this is
  // the one substat with a hard breakpoint, and only they know their team.
  const erBreachChance = erSub != null && erContext != null ? erBreaches / TRIALS : 0;
  const erRisk = erBreachChance >= ER_RISK_SHARE;
  const erThreshold = erContext?.threshold ?? 0;

  // Only tell someone to bin a piece if it is *both* weak now and incapable of
  // becoming good. A well-rolled artifact often has a reshape ceiling below its
  // current score - that means "leave it alone", emphatically not "replace it".
  if (realisticCeiling < WORTH_INVESTING_IN && currentPercent < WORTH_INVESTING_IN) {
    return {
      ...NO_ADVICE,
      eligible: true,
      currentPercent,
      dustCost,
      realisticCeiling,
      action: "replace",
      reason: `Weak now, and even a lucky reshape tops out near ${realisticCeiling.toFixed(0)}% - farm a better piece instead.`,
    };
  }

  const tier = getRerollTier(expectedDust);
  if (!tier) {
    return {
      ...NO_ADVICE,
      eligible: true,
      currentPercent,
      dustCost,
      realisticCeiling,
      improveChance,
      expectedReshapes,
      expectedDust,
      medianGain,
      targetStats,
      erRisk,
      erBreachChance,
      erThreshold,
      action: "none",
      reason: erRisk
        ? "Rerolling risks the Energy Recharge this character needs."
        : "Its rolls already landed well - there's little left to gain.",
    };
  }

  return {
    eligible: true,
    action: "reroll",
    priority: tier.id,
    improveChance,
    expectedReshapes,
    expectedDust,
    dustCost,
    currentPercent,
    medianGain,
    realisticCeiling,
    targetStats,
    erRisk,
    erBreachChance,
    erThreshold,
    reason: tier.blurb,
  };
}
