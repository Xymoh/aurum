/** Flattens a Star Rail character's scoring metadata into the target model. */

import type { BuildListing, BuildTarget, TargetSlot, TargetStat, Translate } from "../lib/buildTarget/model";
import { rankSubstats } from "../lib/buildTarget/model";
import charactersData from "./data/characters.json";
import { characterIcon, characterPreview, pathIcon, relicSetIcon } from "./images";
import { elementTint } from "./labels";
import type { HsrStatKey } from "./types";
import { getScoringMeta, prydwenSetsUrl, SELECTABLE_SLOTS } from "./weights";

const CHARACTERS = charactersData as Record<
  string,
  { name: string; path: string; element: string; rarity: number }
>;

/** Whether a build page exists for this character; see hasGenshinBuild. */
export function hasHsrBuild(avatarId: number | string): boolean {
  return String(avatarId) in CHARACTERS;
}

/**
 * The Trailblazer is a character per Path, each with its own kit, Light
 * Cones, relics and teams, and one id per body for each (8001/8002
 * Destruction, 8005/8006 Harmony, Caelus odd and Stelle even). The Path is
 * the build, so it names the page and badges the face; the body shows in
 * the face itself.
 */
function isTrailblazer(avatarId: number): boolean {
  return avatarId >= 8000 && avatarId < 9000;
}

/**
 * Whether a showcase character is the one a build page is for: the same
 * id, or the Trailblazer on the same Path, whichever body the account plays.
 */
export function sameHsrBuild(showcaseId: number | string, pageId: number | string): boolean {
  if (String(showcaseId) === String(pageId)) return true;
  const [a, b] = [Number(showcaseId), Number(pageId)];
  return isTrailblazer(a) && isTrailblazer(b) && CHARACTERS[String(a)]?.path === CHARACTERS[String(b)]?.path;
}

/** "Trailblazer (Harmony)" for the Trailblazer, the plain name for everyone else. */
function pageName(avatarId: number, c: { name: string; path: string }, t: Translate): string {
  return isTrailblazer(avatarId) ? `${c.name.replace(/\s*\(.*\)$/, "")} (${t("hsrPaths", c.path as "Warrior")})` : c.name;
}

/** The Path's icon on the Trailblazer's face, which is the same face on every Path. */
function pathBadge(avatarId: number, c: { path: string }, t: Translate): BuildListing["badge"] {
  const icon = isTrailblazer(avatarId) ? pathIcon(c.path) : null;
  return icon ? { iconUrl: icon, label: t("hsrPaths", c.path as "Warrior") } : undefined;
}

export function listHsrBuilds(t: Translate): BuildListing[] {
  return Object.entries(CHARACTERS)
    .map(([id, c]): BuildListing => {
      const avatarId = Number(id);
      const badge = pathBadge(avatarId, c, t);
      return {
        id,
        name: pageName(avatarId, c, t),
        iconUrl: characterIcon(avatarId),
        tags: [t("hsrPaths", c.path as "Warrior"), t("hsrElements", c.element as "Thunder")],
        rarity: c.rarity,
        generic: getScoringMeta(avatarId).source !== "fribbels",
        ...(badge ? { badge } : {}),
        // One row per Path: Stelle's page on it is the same build as Caelus's.
        ...(isTrailblazer(avatarId) && avatarId % 2 === 0 ? { unlisted: true } : {}),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getHsrBuild(id: string, t: Translate): BuildTarget | null {
  const character = CHARACTERS[id];
  if (!character) return null;

  const avatarId = Number(id);
  const meta = getScoringMeta(avatarId);

  // Head and Hands have a fixed main stat, so there is nothing to advise on
  // them; only the four slots with a choice appear here.
  const slots: TargetSlot[] = SELECTABLE_SLOTS.map((slot) => ({
    slot: t("hsrSlots", slot),
    stats: (meta.parts[slot] ?? []).map((stat) => t("hsrStats", stat)),
  }));

  const substats: TargetStat[] = rankSubstats(
    Object.entries(meta.stats).map(([key, weight]) => ({
      label: t("hsrStats", key as HsrStatKey),
      weight: weight ?? 0,
    })),
  );

  const badge = pathBadge(avatarId, character, t);

  return {
    game: "hsr",
    id,
    name: pageName(avatarId, character, t),
    ...(badge ? { badge } : {}),
    iconUrl: characterIcon(avatarId),
    portraitUrl: characterPreview(avatarId),
    tags: [t("hsrPaths", character.path as "Warrior"), t("hsrElements", character.element as "Thunder")],
    rarity: character.rarity,
    accent: elementTint(character.element),
    generic: meta.source !== "fribbels",
    slots,
    substats,
    sets: [...meta.relicSets, ...meta.ornamentSets].map((parts) => ({
      parts: parts.map((p) => ({
        setId: p.setId,
        name: p.name,
        pieces: p.pieces,
        iconUrl: p.setId ? relicSetIcon(p.setId) : null,
      })),
    })),
    priority: null,
    thresholds: [],
    energyTarget: null,
    source: { label: "Fribbels HSR Optimizer", url: "https://github.com/fribbels/hsr-optimizer" },
    setsSource: meta.setsSource === "prydwen" ? { label: "Prydwen", url: prydwenSetsUrl(avatarId) } : null,
  };
}
