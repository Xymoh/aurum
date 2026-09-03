import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchZzzShowcase } from "./api";
import { parseZzzShowcase } from "./parsing";
import { scoreAgent } from "./scoring";
import type { ZzzShowcase } from "./types";

/** ZZZ UIDs are 9 or 10 digits (1300064261 is an Asia account). */
export function isValidZzzUid(uid: string): boolean {
  return /^[1-9]\d{8,9}$/.test(uid);
}

export function useZzzShowcase(uid: string) {
  const queryClient = useQueryClient();

  const queryFn = useCallback(async (): Promise<ZzzShowcase> => {
    const raw = await fetchZzzShowcase(uid);
    const parsed = parseZzzShowcase(raw);
    const agents = parsed.agents.map(scoreAgent);
    agents.sort((a, b) => b.diagnostics.score - a.diagnostics.score);
    return { ...parsed, agents };
  }, [uid]);

  const query = useQuery<ZzzShowcase, Error>({
    queryKey: ["zzz-showcase", uid],
    queryFn,
    enabled: isValidZzzUid(uid),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["zzz-showcase", uid] });
  }, [queryClient, uid]);

  return { ...query, forceRefresh };
}
