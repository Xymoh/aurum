import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchZzzShowcase } from "./api";
import { parseZzzShowcase } from "./parsing";
import { scoreAgent } from "./scoring";
import type { ZzzShowcase } from "./types";
import { useI18n } from "../i18n";

/** ZZZ UIDs are 9 or 10 digits (1300064261 is an Asia account). */
export function isValidZzzUid(uid: string): boolean {
  return /^[1-9]\d{8,9}$/.test(uid);
}

export function useZzzShowcase(uid: string) {
  const queryClient = useQueryClient();
  const { lang } = useI18n();

  const queryFn = useCallback(async (): Promise<ZzzShowcase> => {
    const raw = await fetchZzzShowcase(uid);
    // Agent, disc set and W-Engine names are resolved during parsing, so
    // the language belongs to the query rather than the render.
    const parsed = parseZzzShowcase(raw, lang === "zh" ? "zh" : "en");
    const agents = parsed.agents.map(scoreAgent);
    agents.sort((a, b) => b.diagnostics.score - a.diagnostics.score);
    return { ...parsed, agents };
  }, [uid, lang]);

  const query = useQuery<ZzzShowcase, Error>({
    queryKey: ["zzz-showcase", uid, lang],
    queryFn,
    enabled: isValidZzzUid(uid),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["zzz-showcase", uid, lang] });
  }, [queryClient, uid, lang]);

  return { ...query, forceRefresh };
}
