// Types for the page readers fetch-game8-guides.mjs exports, so the tests can import them under the app's strict settings.

export type Game8Game = "hsr" | "zzz";

export interface ParsedGuide {
  titleName: string | null;
  canonical: string | null;
  updated: string | null;
  buildTitle: string | null;
  role: string | null;
  weapons: { name: string; refinement: number | null }[];
  ranks: { name: string; pieces: number | null }[][];
  mainStats: Record<string, string[]> | null;
  substats: string[][] | null;
  endgameStats: { label: string; value: string }[];
  teams: { name: string | null; members: string[] }[];
  partners: string[];
  skillPriority: string | null;
  tracePriority: string | null;
  unknownStats: string[];
}

export interface Lookups {
  characters: Record<string, { name: string }>;
  idsFor(name: string | null): string[];
  weaponId(name: string): string | null;
  setId(name: string): string | null;
}

export interface Report {
  weapons: Set<unknown>;
  sets: Set<unknown>;
  members: Set<unknown>;
  stats: Set<unknown>;
}

type SetPart = { setId: string; pieces: number };

export interface SourceEntry {
  name: string;
  url: string | null;
  updated: string | null;
  role: string | null;
  weapons: { id: string; refinement: number | null }[];
  teams: { name: string | null; members: string[] }[];
  synergies: string[];
  mainStats: Record<string, string[]> | null;
  substats: string[][] | null;
  endgameStats: { label: string; value: string }[];
  skillPriority: string | null;
  tracePriority: string | null;
  erTarget: number | null;
  sets: SetPart[][];
  relicSets: SetPart[][];
  ornamentSets: SetPart[][];
}

export function statKeys(game: Game8Game, label: string): string[] | null;
export function substatTiers(game: Game8Game, lines: string[], unknown: Set<string>): string[][] | null;
export function mainStatsFrom(game: Game8Game, lines: string[], unknown: Set<string>): Record<string, string[]> | null;
export function itemsIn(html: string): { name: string; url: string | null; after: string }[];
export function parseGuidePage(html: string, game: Game8Game): ParsedGuide;
export function lookups(game: Game8Game): Lookups;
export function toEntry(
  parsed: ParsedGuide,
  ctx: { game: Game8Game; id: string; ownIds: string[]; name: string; url: string | null; look: Lookups },
  report: Report,
): SourceEntry;
