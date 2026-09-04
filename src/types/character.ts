import type { Artifact } from "./artifact";
import type { ScoreGrade } from "./artifact";

export type GenshinElement =
  | "Pyro"
  | "Hydro"
  | "Anemo"
  | "Electro"
  | "Dendro"
  | "Cryo"
  | "Geo";

export const ELEMENT_COLORS: Record<GenshinElement, string> = {
  Pyro: "#ef4444",
  Hydro: "#3b82f6",
  Anemo: "#22d3ee",
  Electro: "#a855f7",
  Dendro: "#22c55e",
  Cryo: "#93c5fd",
  Geo: "#f59e0b",
};

export interface CharacterWeapon {
  name: string;
  icon: string;
  level: number;
  refinement: number;
  rarity: number;
  mainStat: { name: string; value: string };
  substat: { name: string; value: string };
}

export interface CharacterStats {
  maxHp: number;
  atk: number;
  def: number;
  elementalMastery: number;
  critRate: number;
  critDmg: number;
  energyRecharge: number;
  elementalDmg: number;
  /** Raw fightPropMap from Enka for any extra stats */
  raw: Record<string, number>;
}

export interface CharacterData {
  id: string;
  avatarId: number;
  name: string;
  element: GenshinElement;
  weaponType: string;
  level: number;
  constellation: number;
  friendshipLevel?: number;
  talents: number[];
  /** Talent icon suffix (extracted from character icon, e.g. "Zibai") */
  talentIconSuffix: string;
  icon: string;
  weapon: CharacterWeapon | null;
  artifacts: Artifact[];
  stats: CharacterStats;
  buildScore: BuildScore;
  activeSetBonuses: string[];
  /**
   * True for the Traveler: their avatarId doesn't encode which of the 7
   * elements is currently active, so scoring falls back to one generic
   * all-purpose weight profile rather than an element-tuned one.
   */
  usesGenericWeights?: boolean;
}

export interface SetBonusResult {
  activeSets: Array<{ setId: string; setName: string; pieces: number }>;
  matchStatus: "full_match" | "partial_match" | "no_match" | "no_recommendation";
}

export interface BuildScore {
  total: number;
  grade: ScoreGrade;
  /**
   * All five slots filled. A partial build has no meaningful build score:
   * the total averages only the pieces that are there, so two good artifacts
   * read as a finished S+ build. Callers show the slot count instead, and
   * leave the character out of account-wide averages.
   */
  complete: boolean;
  artifactCount: number;
  correctMainStats: number;
  totalSelectableSlots: number;
  setBonus: SetBonusResult;
}

export interface ShowcaseData {
  playerInfo: {
    nickname: string;
    level: number;
    worldLevel: number;
    avatarIcon: string;
    signature: string;
  };
  characters: CharacterData[];
  lastUpdated: number;
}
