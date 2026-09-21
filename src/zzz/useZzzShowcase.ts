import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchZzzShowcase } from "./api";
import { parseZzzShowcase } from "./parsing";
import { scoreAgent } from "./scoring";
import type { ZzzShowcase } from "./types";
import { useI18n } from "../i18n";
import { freshUntil, showcaseRetry, staleTimeFromTtl } from "../lib/showcaseQuery";

/**
 * ZZZ UIDs run from 8 digits on the CN servers (Enka serves 10001234) to 10
 * on Asia (1300064261). Anything in that range is worth asking Enka about.
 */
export function isValidZzzUid(uid: string): boolean {
  return /^[1-9]\d{7,9}$/.test(uid);
}

export function useZzzShowcase(uid: string, options: { enabled?: boolean } = {}) {
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
    enabled: (options.enabled ?? true) && isValidZzzUid(uid),
    staleTime: staleTimeFromTtl,
    retry: showcaseRetry,
  });

  const fresh = freshUntil(query.dataUpdatedAt, query.data);

  const forceRefresh = useCallback(() => {
    if (Date.now() < fresh) return;
    queryClient.invalidateQueries({ queryKey: ["zzz-showcase", uid, lang] });
  }, [queryClient, uid, lang, fresh]);

  return { ...query, forceRefresh, freshUntil: fresh };
}
