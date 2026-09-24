/**
 * Loading the per-character guide files.
 *
 * Each game globs its own guides directory, so every character's file is a
 * chunk of its own and a build page downloads one of them, not the roster.
 * This module turns a glob into lookups by id and wraps them in a query, so
 * a page visited twice in a session does not fetch its guide twice.
 */

import { useQuery } from "@tanstack/react-query";
import type { ShareGame } from "../shareCard/model";
import type { GuideFile, SetBonusFile } from "./guide";

type Glob<T> = Record<string, () => Promise<T>>;

export interface GuideSource {
  game: ShareGame;
  /** Resolves to null for an id with no guide file, which is a real state (a brand-new character). */
  load: (id: string) => Promise<GuideFile | null>;
  loadSetBonuses: () => Promise<SetBonusFile>;
}

/** "../../data/guides/10000046.json" -> "10000046". */
function basename(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");
}

/** A path under the site root, as opposed to a full URL or an absolute path. */
const siteRelative = (url: string | null): url is string => url !== null && !/^[a-z][a-z0-9+.-]*:|^\//i.test(url);

/**
 * The guide with its site-relative material icons ("zzz/items/IconCoin.webp",
 * shipped under public/) turned into URLs under the deployed base. Full URLs
 * are left as they are, and a guide with nothing to resolve comes back as it
 * was.
 */
function withSiteIcons(guide: GuideFile): GuideFile {
  if (!guide.materials.some((group) => group.items.some((item) => siteRelative(item.iconUrl)))) return guide;
  const resolve = (url: string | null) => (siteRelative(url) ? `${import.meta.env.BASE_URL}${url}` : url);
  return {
    ...guide,
    materials: guide.materials.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, iconUrl: resolve(item.iconUrl) })),
    })),
  };
}

/**
 * Builds a source from two globs. Taking the globs rather than paths is what
 * lets Vite see the patterns: `import.meta.glob` only works on a literal, so
 * each game writes its own and hands the result over.
 */
export function guideSource(
  game: ShareGame,
  guides: Glob<GuideFile>,
  setBonuses: Glob<SetBonusFile>,
): GuideSource {
  const byId = new Map(Object.entries(guides).map(([path, load]) => [basename(path), load]));
  const bonuses = Object.values(setBonuses)[0];
  return {
    game,
    load: async (id) => {
      const guide = await byId.get(id)?.();
      return guide ? withSiteIcons(guide) : null;
    },
    // No set-bonus file yet is an empty table, not an error: the page shows
    // set names without their effects, as it did before the file existed.
    loadSetBonuses: () => (bonuses ? bonuses() : Promise.resolve({})),
  };
}

/**
 * The guide and the set bonuses for one character. Both are static files
 * that only change on deploy, so neither goes stale within a session.
 */
export function useGuide(source: GuideSource, id: string | undefined) {
  const guide = useQuery({
    queryKey: ["guide", source.game, id],
    queryFn: () => source.load(id as string),
    enabled: Boolean(id),
    staleTime: Infinity,
    retry: 1,
  });
  const setBonuses = useQuery({
    queryKey: ["setBonuses", source.game],
    queryFn: source.loadSetBonuses,
    enabled: Boolean(id),
    staleTime: Infinity,
  });
  return {
    guide: guide.data ?? null,
    setBonuses: setBonuses.data ?? {},
    loading: guide.isLoading,
    failed: guide.isError,
  };
}
