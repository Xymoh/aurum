/**
 * What a showcase looked like the last time this browser saw it, so the
 * next visit can say what changed. Kept per UID in local storage, alongside
 * the recent-UID list, and never sent anywhere.
 */

import type { ShowcaseData } from "../types/character";

export interface BuildSnapshot {
  total: number;
  complete: boolean;
  /** Per-slot potential percent, keyed by slot name. */
  slots: Record<string, number>;
}

export interface ShowcaseSnapshot {
  at: number;
  characters: Record<string, BuildSnapshot>;
}

export interface BuildDelta {
  /** Change in build score since the snapshot, or null when either side was unscored. */
  build: number | null;
  /** The character was not on display last time. */
  isNew: boolean;
  /** When the earlier snapshot was taken. */
  since: number;
}

const PREFIX = "aurum:history:gi:";

function isSnapshot(value: unknown): value is ShowcaseSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ShowcaseSnapshot).at === "number" &&
    typeof (value as ShowcaseSnapshot).characters === "object"
  );
}

export function readSnapshot(uid: string): ShowcaseSnapshot | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + uid);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function snapshotOf(data: ShowcaseData): ShowcaseSnapshot {
  const characters: Record<string, BuildSnapshot> = {};
  for (const c of data.characters) {
    const slots: Record<string, number> = {};
    for (const a of c.artifacts) slots[a.slot] = a.score.potentialPercent;
    characters[c.id] = { total: c.buildScore.total, complete: c.buildScore.complete, slots };
  }
  return { at: Date.now(), characters };
}

export function saveSnapshot(uid: string, data: ShowcaseData): void {
  try {
    window.localStorage.setItem(PREFIX + uid, JSON.stringify(snapshotOf(data)));
  } catch {
    // Storage unavailable; the comparison is a convenience, not a requirement.
  }
}

/** Drops the stored snapshot, so a forgotten UID leaves nothing behind. */
export function clearSnapshot(uid: string): void {
  try {
    window.localStorage.removeItem(PREFIX + uid);
  } catch {
    // Storage unavailable; there is nothing stored to clear.
  }
}

/** Drops every stored snapshot, including those of UIDs no longer in the recent list. */
export function clearAllSnapshots(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // Storage unavailable; there is nothing stored to clear.
  }
}

/** What changed for each character since `prev`, or an empty map without one. */
export function diffShowcase(prev: ShowcaseSnapshot | null, data: ShowcaseData): Map<string, BuildDelta> {
  const out = new Map<string, BuildDelta>();
  if (!prev) return out;
  for (const c of data.characters) {
    const before = prev.characters[c.id];
    if (!before) {
      out.set(c.id, { build: null, isNew: true, since: prev.at });
      continue;
    }
    const build = before.complete && c.buildScore.complete ? c.buildScore.total - before.total : null;
    out.set(c.id, { build, isNew: false, since: prev.at });
  }
  return out;
}
