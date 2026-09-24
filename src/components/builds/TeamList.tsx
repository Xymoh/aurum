import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useUidQuery } from "../../hooks/useComparisonUid";
import type { GuideTeam } from "../../lib/buildTarget/guide";
import type { BuildListing } from "../../lib/buildTarget/model";
import { CharacterFace } from "./CharacterFace";
import { SubHeading } from "./Section";
import type { BuildSkin } from "./skin";

interface TeamListProps {
  teams: GuideTeam[];
  synergies: string[];
  /** Every character the game's build pages know, to name and picture members. */
  roster: ReadonlyMap<string, BuildListing>;
  /** The page's own character, marked rather than linked. */
  selfId: string;
  accent: string;
  basePath: string;
  skin: BuildSkin;
}

/**
 * The guide's teams, and the partners it singles out. Every member links to
 * their own build page, so planning a team is a walk through its members
 * rather than a search.
 */
export function TeamList({ teams, synergies, roster, selfId, accent, basePath, skin }: TeamListProps) {
  const { t } = useI18n();
  const query = useUidQuery();

  const member = (id: string) => {
    const listing = roster.get(id);
    const name = listing?.name ?? t("guide", "unknownMember");
    const body = (
      <>
        <CharacterFace listing={listing} size="h-12 w-12 sm:h-14 sm:w-14" ring={id === selfId ? accent : undefined} />
        <span className={`mt-1 block w-full truncate text-center text-[11px] ${skin.text}`}>{listing?.name ?? "?"}</span>
      </>
    );
    if (id === selfId) {
      return (
        <span className="flex w-full min-w-0 flex-col items-center" aria-label={t("guide", "you", { name })}>
          {body}
        </span>
      );
    }
    if (!listing) {
      return (
        <span className="flex w-full min-w-0 flex-col items-center opacity-60" title={name}>
          {body}
        </span>
      );
    }
    return (
      <Link to={`${basePath}/${id}${query}`} className="flex w-full min-w-0 flex-col items-center no-underline transition-opacity hover:opacity-80" title={name}>
        {body}
      </Link>
    );
  };

  /**
   * One slot: the pick, and under it the guide's alternatives for the slot
   * as small linked faces, for a visitor who does not own the pick. Three at
   * most, which is all a quarter of a card fits.
   */
  const slot = (id: string, alternates: string[]) => {
    const known = alternates.filter((alt) => roster.has(alt));
    const pickName = roster.get(id)?.name ?? t("guide", "unknownMember");
    return (
      <div key={id} className="flex min-w-0 flex-col items-center">
        {member(id)}
        {known.length > 0 && (
          <div
            className="mt-1 flex items-center justify-center gap-0.5"
            role="group"
            aria-label={t("guide", "alternatives", { name: pickName, names: known.map((alt) => roster.get(alt)?.name).join(", ") })}
          >
            <span className={`mr-0.5 text-[10px] ${skin.muted}`} aria-hidden="true">
              {t("guide", "or")}
            </span>
            {known.slice(0, 3).map((alt) => (
              <Link
                key={alt}
                to={`${basePath}/${alt}${query}`}
                title={roster.get(alt)?.name}
                className="rounded-full no-underline transition-opacity hover:opacity-80"
              >
                <CharacterFace listing={roster.get(alt)} size="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {teams.length > 0 && (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {teams.map((team, i) => (
            <li key={i} className={`game-panel-sm border p-3 ${skin.card}`}>
              {team.name && (
                <p className={`mb-2 truncate text-xs font-semibold uppercase tracking-wide ${skin.muted}`}>{team.name}</p>
              )}
              <div className="grid grid-cols-4 gap-2">
                {team.members.map((id, i) => slot(id, team.alternates?.[i] ?? []))}
              </div>
            </li>
          ))}
        </ol>
      )}

      {synergies.length > 0 && (
        <div>
          <SubHeading skin={skin}>{t("guide", "synergies")}</SubHeading>
          <div className="flex flex-wrap gap-1.5">
            {synergies.map((id) => {
              const listing = roster.get(id);
              if (!listing) return null;
              return (
                <Link
                  key={id}
                  to={`${basePath}/${id}${query}`}
                  className={`game-panel-sm inline-flex items-center gap-2 border py-1 pl-1 pr-2.5 text-sm no-underline transition-colors ${skin.card} ${skin.cardHover} ${skin.text}`}
                >
                  <CharacterFace listing={listing} size="h-7 w-7" />
                  {listing.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
