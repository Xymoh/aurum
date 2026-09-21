import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchShowcase } from "../lib/api";
import { buildShowcase } from "../lib/showcase";
import { loadGameLocale } from "../lib/gameLocale";
import { isValidUid } from "../lib/uid";
import { freshUntil, showcaseRetry, staleTimeFromTtl } from "../lib/showcaseQuery";
import { useI18n } from "../i18n";
import type { ShowcaseData } from "../types/character";

export function useShowcase(uid: string, options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const { lang } = useI18n();

  const queryFn = useCallback(async () => {
    const raw = await fetchShowcase(uid);

    // Names are resolved synchronously during parsing, so the language table
    // has to be in place first.
    await loadGameLocale(lang);

    return buildShowcase(raw);
  }, [uid, lang]);

  const queryKey = ["showcase", uid, lang];
  const query = useQuery<ShowcaseData, Error>({
    queryKey,
    queryFn,
    enabled: (options.enabled ?? true) && isValidUid(uid),
    staleTime: staleTimeFromTtl,
    retry: showcaseRetry,
  });

  const fresh = freshUntil(query.dataUpdatedAt, query.data);

  // Refresh only once Enka would actually have something new to say.
  const forceRefresh = useCallback(() => {
    if (Date.now() < fresh) return;
    queryClient.invalidateQueries({ queryKey: ["showcase", uid, lang] });
  }, [queryClient, uid, lang, fresh]);

  return { ...query, forceRefresh, freshUntil: fresh };
}
