import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchHsrShowcase } from "./api";
import { parseHsrShowcase } from "./parsing";
import { scoreCharacter } from "./scoring";
import type { HsrShowcase } from "./types";
import { freshUntil, showcaseRetry, staleTimeFromTtl } from "../lib/showcaseQuery";

/** Star Rail UIDs are nine digits on every server. */
export function isValidHsrUid(uid: string): boolean {
  return /^[1-9]\d{8}$/.test(uid);
}

export function useHsrShowcase(uid: string, options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const queryFn = useCallback(async (): Promise<HsrShowcase> => {
    const raw = await fetchHsrShowcase(uid);
    const parsed = parseHsrShowcase(raw);
    const characters = parsed.characters.map(scoreCharacter);
    // Strongest builds first, so the showcase leads with what the player is
    // proudest of rather than with whatever order Enka returned.
    characters.sort((a, b) => b.diagnostics.score - a.diagnostics.score);
    return { ...parsed, characters };
  }, [uid]);

  const query = useQuery<HsrShowcase, Error>({
    queryKey: ["hsr-showcase", uid],
    queryFn,
    enabled: (options.enabled ?? true) && isValidHsrUid(uid),
    staleTime: staleTimeFromTtl,
    retry: showcaseRetry,
  });

  const fresh = freshUntil(query.dataUpdatedAt, query.data);

  const forceRefresh = useCallback(() => {
    if (Date.now() < fresh) return;
    queryClient.invalidateQueries({ queryKey: ["hsr-showcase", uid] });
  }, [queryClient, uid, fresh]);

  return { ...query, forceRefresh, freshUntil: fresh };
}
