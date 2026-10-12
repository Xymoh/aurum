// Types for the page readers fetch-kqm-guides.mjs exports, so the tests can import them under the app's strict settings.

export interface KqmGuide {
  name: string | null;
  canonical: string | null;
  updated: string | null;
  role: string | null;
  skillPriority: string | null;
  mainStatLabels: Partial<Record<"SANDS" | "GOBLET" | "CIRCLET", string>>;
  substatLine: string | null;
  erFigures: string[];
  sets: { label: string; ids: string[] }[];
  weapons: { names: string[]; ids: string[] }[];
  teams: KqmTeam[];
}

/** One example team as read off the page: its archetype heading, and each slot's names, pick first. */
export interface KqmTeam {
  name: string | null;
  members: string[][];
}

export interface KqmReport {
  weapons: Set<string>;
  sets: Set<string>;
  members: Set<string>;
  stats: Set<string>;
}

export interface SourceEntry {
  name: string | null;
  url: string;
  updated: string | null;
  role: string | null;
  weapons: { id: string; refinement: number | null }[];
  teams: { name: string | null; members: string[]; alternates?: string[][] }[];
  synergies: string[];
  mainStats: Partial<Record<"SANDS" | "GOBLET" | "CIRCLET", string[]>> | null;
  substats: string[][] | null;
  endgameStats: { label: string; value: string }[];
  skillPriority: string | null;
  tracePriority: string | null;
  erTarget: number | null;
  sets: { setId: string; pieces: number }[][];
  relicSets: { setId: string; pieces: number }[][];
  ornamentSets: { setId: string; pieces: number }[][];
}

export function parseKqmGuide(html: string): KqmGuide;
export function parseKqmTeams(html: string): KqmTeam[];
export function talentOrder(line: string | null): string | null;
export function substatTiers(line: string | null, unmapped?: Set<string>): string[][] | null;
export function erFromFigures(figures: string[]): number | null;
export function memberName(name: string): string;
export function characterIndex(): (name: string) => string | null;
export function kqmEntry(
  parsed: KqmGuide,
  context: { id: string; url: string; weaponByName: Map<string, string>; characterId: (name: string) => string | null; report: KqmReport },
): SourceEntry;
export function kqmGuideLinks(html: string): { slug: string; url: string }[];
