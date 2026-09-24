import { useMemo } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { BuildDetail } from "../components/builds/BuildDetail";
import { BuildIndex } from "../components/builds/BuildIndex";
import { OwnedStrip, type OwnedSlot } from "../components/builds/OwnedStrip";
import type { BuildSkin } from "../components/builds/skin";
import { NotFoundPage } from "./NotFoundPage";
import { useI18n } from "../i18n";
import { getGenshinBuild, listGenshinBuilds, movedGenshinBuild } from "../lib/buildTarget/genshin";
import { isTravelerId, parseTravelerBuildId } from "../lib/travelerBuilds";
import { GENSHIN_GUIDES } from "../lib/buildTarget/genshinGuide";
import { useGuide } from "../lib/buildTarget/guideSource";
import { GENSHIN_RECENT_UIDS_KEY } from "../hooks/useRecentUids";
import { useComparisonUid } from "../hooks/useComparisonUid";
import { isValidUid } from "../lib/uid";
import { useShowcase } from "../hooks/useShowcase";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { ArtifactSlot } from "../types/artifact";

const SKIN: BuildSkin = {
  panel: "border-dark-border bg-dark-card/50",
  card: "border-dark-border bg-dark-card",
  cardHover: "hover:border-accent/50",
  text: "text-dark-text",
  muted: "text-dark-muted",
  accent: "text-accent",
  line: "ring-dark-border",
  field: "border border-dark-border bg-dark-card text-dark-text focus:border-accent/60",
  active: "border-accent/50 bg-accent/15 text-accent",
  bar: "border-dark-border bg-dark-bg/90",
};

/** The three slots whose main stat is a choice; Flower and Plume are fixed. */
const SELECTABLE: ArtifactSlot[] = ["SANDS", "GOBLET", "CIRCLET"];

export function GenshinBuildsPage() {
  const { id } = useParams();
  const { search } = useLocation();
  const { t } = useI18n();

  const listings = useMemo(() => listGenshinBuilds(t), [t]);
  const roster = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const target = useMemo(() => (id ? getGenshinBuild(id, t) : null), [id, t]);
  const guide = useGuide(GENSHIN_GUIDES, target ? id : undefined);

  useDocumentTitle(
    target
      ? t("builds", "documentTitleCharacter", { name: target.name, game: "Genshin Impact" })
      : t("builds", "documentTitle"),
  );

  const uid = useComparisonUid(GENSHIN_RECENT_UIDS_KEY, isValidUid);
  const { data, isLoading, isError } = useShowcase(uid, { enabled: Boolean(id) });

  const owned = useMemo(() => {
    if (!id || !data) return null;
    // A Traveler page is an element's, and a player on that element is on it
    // whichever body they play.
    const traveler = parseTravelerBuildId(id);
    const character = data.characters.find((c) =>
      traveler ? isTravelerId(c.avatarId) && c.element === traveler.element : String(c.avatarId) === id,
    );
    if (!character) return null;

    const slots: OwnedSlot[] = SELECTABLE.map((slot) => {
      const piece = character.artifacts.find((a) => a.slot === slot);
      return {
        slot: t("slots", slot),
        stat: piece?.mainStat.displayName ?? "-",
        ok: piece?.mainStat.isCorrect ?? false,
      };
    });

    return {
      score: character.buildScore.total,
      grade: character.buildScore.grade,
      complete: character.buildScore.complete,
      slots,
      showcaseHref: `/genshin/showcase/${uid}?c=${character.avatarId}`,
      weaponId: character.weapon?.id != null ? String(character.weapon.id) : null,
    };
  }, [id, data, uid, t]);

  if (!id) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-dark-text sm:text-3xl">{t("builds", "title")}</h1>
          <p className="mt-1 text-sm text-dark-muted">{t("builds", "lead")}</p>
        </header>
        <BuildIndex listings={listings} basePath="/genshin/builds" skin={SKIN} />
      </div>
    );
  }

  // The Traveler had one page per body before each element had its own;
  // an old link opens the element the tables give them.
  const moved = movedGenshinBuild(id);
  if (moved) return <Navigate replace to={`/genshin/builds/${moved}${search}`} />;

  if (!target) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl">
      <BuildDetail
        target={target}
        basePath="/genshin/builds"
        skin={SKIN}
        guide={guide}
        roster={roster}
        equippedWeaponId={owned?.weaponId}
        owned={
          <OwnedStrip
            skin={SKIN}
            name={target.name}
            uid={uid || null}
            loading={isLoading}
            failed={isError}
            owned={owned}
            homeHref="/genshin"
          />
        }
      />
    </div>
  );
}
