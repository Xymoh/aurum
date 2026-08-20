// ── Enka.Network API v2 Response Types ──

export interface EnkaResponse {
  uid: string;
  ttl: number;
  playerInfo: EnkaPlayerInfo;
  avatarInfoList?: EnkaAvatarInfo[];
}

export interface EnkaShowAvatarInfo {
  avatarId: number;
  level: number;
  costumeId?: number;
  energyType?: number;
}

export interface EnkaPlayerInfo {
  nickname: string;
  level: number;
  worldLevel: number;
  signature?: string;
  /**
   * Current responses carry `id` (a ProfilePicture id, resolved via
   * profile-pictures.json). Older ones carried `avatarId` instead, which is a
   * character id - both are handled when resolving the avatar icon.
   */
  profilePicture?: {
    id?: number;
    avatarId?: number;
    costumeId?: number;
  };
  nameCardId: number;
  finishAchievementNum?: number;
  towerFloorIndex?: number;
  towerLevelIndex?: number;
  showAvatarInfoList?: EnkaShowAvatarInfo[];
}

export interface EnkaAvatarInfo {
  avatarId: number;
  level: number;
  talentIdList?: number[];
  constIdList?: number[];
  equipList?: Array<EnkaEquip>;
  fightPropMap?: Record<string, number>;
  skillDepotId?: number;
  inherentProudSkillList?: number[];
  /** Maps skill ID → talent level (e.g. "08901" → 9) for combat talents */
  skillLevelMap?: Record<string, number>;
}

export interface EnkaEquip {
  itemId: number;
  reliquary?: EnkaReliquary;
  weapon?: EnkaWeapon;
  flat: EnkaEquipFlat;
}

export interface EnkaReliquary {
  level: number;
  mainPropId: number;
  appendPropIdList: number[];
}

export interface EnkaWeapon {
  level: number;
  promoteLevel: number;
  affixMap?: Record<string, number>;
}

export interface EnkaProp {
  propType: string;
  propValue: number;
}

export interface EnkaEquipFlat {
  nameTextMapHash: string;
  setNameTextMapHash?: string;
  icon: string;
  equipType: string;
  rankLevel: number;
  itemType: string;
  setId?: string;
  reliquaryMainstat?: {
    mainPropId: string;
    statValue: number;
  };
  reliquarySubstats?: EnkaSubstat[];
  weaponStats?: Array<{
    appendPropId: string;
    statValue: number;
  }>;
}

export interface EnkaSubstat {
  appendPropId: string;
  statValue: number;
}

// ── Equip Types (Genshin-specific) ──

export type EquipType =
  | "EQUIP_BRACER"   // Flower of Life
  | "EQUIP_NECKLACE" // Plume of Death
  | "EQUIP_SHOES"    // Sands of Eon
  | "EQUIP_RING"     // Goblet of Eonothem
  | "EQUIP_DRESS";   // Circlet of Logos

export type FightProp =
  | "FIGHT_PROP_HP"
  | "FIGHT_PROP_HP_PERCENT"
  | "FIGHT_PROP_ATTACK"
  | "FIGHT_PROP_ATTACK_PERCENT"
  | "FIGHT_PROP_DEFENSE"
  | "FIGHT_PROP_DEFENSE_PERCENT"
  | "FIGHT_PROP_CRITICAL"
  | "FIGHT_PROP_CRITICAL_HURT"
  | "FIGHT_PROP_ELEMENT_MASTERY"
  | "FIGHT_PROP_CHARGE_EFFICIENCY"
  | "FIGHT_PROP_HEAL_ADD"
  | "FIGHT_PROP_PHYSICAL_ADD_HURT"
  | "FIGHT_PROP_FIRE_ADD_HURT"
  | "FIGHT_PROP_ELEC_ADD_HURT"
  | "FIGHT_PROP_WATER_ADD_HURT"
  | "FIGHT_PROP_WIND_ADD_HURT"
  | "FIGHT_PROP_ICE_ADD_HURT"
  | "FIGHT_PROP_ROCK_ADD_HURT"
  | "FIGHT_PROP_GRASS_ADD_HURT";
