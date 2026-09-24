import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useUidQuery } from "../../hooks/useComparisonUid";
import type { BuildListing } from "../../lib/buildTarget/model";
import { CharacterFace } from "./CharacterFace";
import type { BuildSkin } from "./skin";

interface BuildIndexProps {
  listings: BuildListing[];
  /** Route prefix a row links to, e.g. "/hsr/builds". */
  basePath: string;
  skin: BuildSkin;
}

/**
 * The character picker.
 *
 * This is the page someone lands on when they have not built anything yet,
 * which is the audience the showcase pages cannot serve at all. It stays a
 * plain filtered list on purpose: the useful thing here is getting to one
 * character quickly, not browsing.
 */
export function BuildIndex({ listings: all, basePath, skin }: BuildIndexProps) {
  const { t } = useI18n();
  const query = useUidQuery();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("ALL");

  // One row per build: a second body's copy of a page (Lumine, Stelle) is
  // left out, and opened from that player's showcase or a team instead.
  const listings = useMemo(() => all.filter((l) => !l.unlisted), [all]);

  const tags = useMemo(
    () => Array.from(new Set(listings.flatMap((l) => l.tags))).sort(),
    [listings],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter(
      (l) => (tag === "ALL" || l.tags.includes(tag)) && (!q || l.name.toLowerCase().includes(q)),
    );
  }, [listings, search, tag]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("builds", "search")}
          aria-label={t("builds", "search")}
          className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none sm:w-64 ${skin.field}`}
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          aria-label={t("builds", "filter")}
          className={`rounded-lg px-2 py-2 text-sm focus:outline-none ${skin.field}`}
        >
          <option value="ALL">{t("builds", "allTags")}</option>
          {tags.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <span className={`text-sm ${skin.muted}`}>
          {t("builds", "count", { visible: visible.length, total: listings.length })}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className={`py-12 text-center text-sm ${skin.muted}`}>{t("builds", "noMatch")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((listing) => (
            <Link
              key={listing.id}
              to={`${basePath}/${listing.id}${query}`}
              title={listing.name}
              className={`game-panel-sm flex items-center gap-2.5 border px-2.5 py-2 no-underline transition-colors ${skin.card} ${skin.cardHover}`}
            >
              {listing.iconUrl && <CharacterFace listing={listing} size="h-9 w-9" className={`ring-1 ${skin.line}`} />}
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold ${skin.text}`}>
                  {listing.name}
                </span>
                <span className={`block truncate text-xs ${skin.muted}`}>
                  {listing.tags.join(" · ")}
                </span>
              </span>
              {/* Marked up front, so nobody opens a page expecting a guide and
                  finds a role default instead. */}
              {listing.generic && (
                <span className={`shrink-0 text-xs ${skin.muted}`} title={t("builds", "generic")}>
                  ~
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
