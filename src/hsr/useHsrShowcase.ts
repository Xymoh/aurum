import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchHsrShowcase } from "./api";
import { parseHsrShowcase } from "./parsing";
import { buildScore, scoreCharacter } from "./scoring";
import type { HsrShowcase } from "./types";

export function isValidHsrUid(uid: string): boolean {
  return /^[1-9]\d{8}$/.test(uid);
}

export function useHsrShowcase(uid: string) {
  const queryClient = useQueryClient();

  const queryFn = useCallback(async (): Promise<HsrShowcase> => {
    const raw = await fetchHsrShowcase(uid);
    const parsed = parseHsrShowcase(raw);
    const characters = parsed.characters.map(scoreCharacter);
    // Strongest builds first, so the showcase leads with what the player is
    // proudest of rather than with whatever order Enka returned.
    characters.sort((a, b) => buildScore(b) - buildScore(a));
    return { ...parsed, characters };
  }, [uid]);

  const query = useQuery<HsrShowcase, Error>({
    queryKey: ["hsr-showcase", uid],
    queryFn,
    enabled: isValidHsrUid(uid),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["hsr-showcase", uid] });
  }, [queryClient, uid]);

  return { ...query, forceRefresh };
}
