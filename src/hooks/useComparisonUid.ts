import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { readRecentUids } from "./useRecentUids";

/**
 * The UID a build page compares the target against.
 *
 * A showcase card's guide link carries its UID as ?uid=, and that wins: the
 * visitor was just looking at that account, which may not be the last one
 * they typed (or they may never have typed one, arriving on a shared link).
 * Otherwise the most recent UID from the home page. Read once per link: a
 * UID typed in another tab should not retarget the page mid-read.
 *
 * `isValid` is the game's own UID rule; a malformed ?uid= is ignored rather
 * than sent to Enka.
 */
/**
 * "?uid=..." when the page was opened with one, else "". Links between build
 * pages append it, so walking from a character to their teammates keeps
 * comparing against the same account.
 */
export function useUidQuery(): string {
  const [params] = useSearchParams();
  const linked = params.get("uid");
  return linked ? `?uid=${encodeURIComponent(linked)}` : "";
}

export function useComparisonUid(recentKey: string, isValid: (uid: string) => boolean): string {
  const [params] = useSearchParams();
  const linked = params.get("uid");
  return useMemo(() => {
    if (linked && isValid(linked)) return linked;
    return readRecentUids(recentKey)[0]?.uid ?? "";
  }, [linked, recentKey, isValid]);
}
