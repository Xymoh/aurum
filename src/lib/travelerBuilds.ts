import type { GenshinElement } from "../types/character";

/**
 * Ideal artifact main stats for each Traveler, by element.
 *
 * The Traveler is seven characters wearing one avatarId, and they do not want
 * the same pieces: Dendro is an Elemental Mastery unit, Electro is built for
 * Energy Recharge, Cryo wants ATK% in the goblet rather than its own element.
 * The single shared profile in character-builds.json could not express that,
 * so it listed elemental DMG as the only ideal goblet and accused correct
 * builds of running the wrong main stat.
 *
 * These lists only decide whether a piece is flagged as off-build, so where
 * guides disagree the entry is inclusive. The Traveler's best main stat often
 * depends on the team and the reaction being driven, and a false accusation
 * costs the reader more than a missing warning does.
 *
 * `<ELEMENT>_DMG` matches only that element's goblet, so an Anemo Traveler
 * holding a Pyro goblet is still flagged.
 *
 * Substat weights stay on the shared Traveler profile: those are a matter of
 * degree rather than a right-or-wrong call, and tuning seven of them well
 * needs per-element damage numbers this tool does not model.
 */
export type IdealMainStats = Record<"SANDS" | "GOBLET" | "CIRCLET", string[]>;

export const TRAVELER_MAIN_STATS: Record<GenshinElement, IdealMainStats> = {
  // Viridescent shredder. Elemental Mastery for swirl, ER to keep the burst up.
  Anemo: {
    SANDS: ["ELEMENTAL_MASTERY", "ATK_PERCENT", "ENERGY_RECHARGE"],
    GOBLET: ["ELEMENTAL_MASTERY", "ANEMO_DMG", "ATK_PERCENT"],
    CIRCLET: ["ELEMENTAL_MASTERY", "CRIT_RATE", "CRIT_DMG"],
  },
  Geo: {
    SANDS: ["ATK_PERCENT", "ENERGY_RECHARGE"],
    GOBLET: ["GEO_DMG", "ATK_PERCENT"],
    CIRCLET: ["CRIT_RATE", "CRIT_DMG"],
  },
  // Built as an energy battery, so Energy Recharge leads.
  Electro: {
    SANDS: ["ENERGY_RECHARGE", "ATK_PERCENT"],
    GOBLET: ["ELECTRO_DMG", "ELEMENTAL_MASTERY", "ATK_PERCENT"],
    CIRCLET: ["CRIT_RATE", "CRIT_DMG", "ELEMENTAL_MASTERY"],
  },
  // Hyperbloom driver: Elemental Mastery everywhere.
  Dendro: {
    SANDS: ["ELEMENTAL_MASTERY", "ATK_PERCENT", "ENERGY_RECHARGE"],
    GOBLET: ["ELEMENTAL_MASTERY", "DENDRO_DMG", "ATK_PERCENT"],
    CIRCLET: ["ELEMENTAL_MASTERY", "CRIT_RATE", "CRIT_DMG"],
  },
  // Guides split between an ATK% sands and an HP%/ER one, so all three stand.
  Hydro: {
    SANDS: ["ATK_PERCENT", "HP_PERCENT", "ENERGY_RECHARGE"],
    GOBLET: ["HYDRO_DMG", "ATK_PERCENT"],
    CIRCLET: ["CRIT_RATE", "CRIT_DMG"],
  },
  Pyro: {
    SANDS: ["ATK_PERCENT", "ENERGY_RECHARGE"],
    GOBLET: ["PYRO_DMG", "ATK_PERCENT"],
    CIRCLET: ["CRIT_RATE", "CRIT_DMG"],
  },
  // ATK feeds several parts of the kit, so ATK% beats a Cryo goblet here.
  Cryo: {
    SANDS: ["ATK_PERCENT", "ELEMENTAL_MASTERY"],
    GOBLET: ["ATK_PERCENT", "CRYO_DMG", "ELEMENTAL_MASTERY"],
    CIRCLET: ["CRIT_RATE", "CRIT_DMG"],
  },
};

const TRAVELER_AVATAR_IDS = new Set([10000005, 10000007]);

export function isTravelerId(avatarId: number): boolean {
  return TRAVELER_AVATAR_IDS.has(avatarId);
}

/** The ideals for this Traveler, or null when the element is not known. */
export function travelerMainStats(
  avatarId: number,
  element: GenshinElement | undefined,
): IdealMainStats | null {
  if (!isTravelerId(avatarId) || !element) return null;
  return TRAVELER_MAIN_STATS[element] ?? null;
}
