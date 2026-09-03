import { useCallback, useState } from "react";

/**
 * Remembers the UIDs someone has looked up, per game.
 *
 * Each game passes its own storage key, so a Genshin UID never shows up as a
 * suggestion on the Star Rail page. Every access is wrapped: private windows
 * and blocked site data make localStorage throw rather than return null, and a
 * convenience feature must never take the page down with it.
 */

export interface RecentUid {
  uid: string;
  timestamp: number;
}

const MAX_REMEMBERED = 10;

export function readRecentUids(key: string): RecentUid[] {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as RecentUid[]) : [];
  } catch {
    return [];
  }
}

/** Moves `uid` to the front, keeping the list unique and bounded. */
export function rememberUid(key: string, uid: string): RecentUid[] {
  const next = [
    { uid, timestamp: Date.now() },
    ...readRecentUids(key).filter((entry) => entry.uid !== uid),
  ].slice(0, MAX_REMEMBERED);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Storage full or unavailable; the lookup still works, it just is not remembered.
  }
  return next;
}

export function useRecentUids(key: string) {
  const [recent, setRecent] = useState<RecentUid[]>(() => readRecentUids(key));

  const remember = useCallback(
    (uid: string) => {
      setRecent(rememberUid(key, uid));
    },
    [key],
  );

  return { recent, remember };
}

/** Storage keys, one per game, so suggestions never cross over. */
export const GENSHIN_RECENT_UIDS_KEY = "recent-uids";
export const HSR_RECENT_UIDS_KEY = "hsr-recent-uids";
export const ZZZ_RECENT_UIDS_KEY = "zzz-recent-uids";
