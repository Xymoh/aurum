// Types for the page readers fetch-genshin-sets.mjs exports, so the tests can import them under the app's strict settings.

/** One team as read off the page: its title, and each slot's names, pick first. */
export interface Game8Team {
  name: string | null;
  members: string[][];
}

export function parseGame8Teams(section: { title: string; html: string }): Game8Team[];
export function teamLabel(name: string | null, stripNames: string[]): string | null;
