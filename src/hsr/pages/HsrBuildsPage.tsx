import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { BuildDetail } from "../../components/builds/BuildDetail";
import { BuildIndex } from "../../components/builds/BuildIndex";
import { OwnedStrip, type OwnedSlot } from "../../components/builds/OwnedStrip";
import type { BuildSkin } from "../../components/builds/skin";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { useI18n } from "../../i18n";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { HSR_RECENT_UIDS_KEY } from "../../hooks/useRecentUids";
import { useComparisonUid } from "../../hooks/useComparisonUid";
import { getHsrBuild, listHsrBuilds, sameHsrBuild } from "../buildTarget";
import { HSR_GUIDES } from "../guide";
import { useGuide } from "../../lib/buildTarget/guideSource";
import { isValidHsrUid, useHsrShowcase } from "../useHsrShowcase";
import { SELECTABLE_SLOTS } from "../weights";

const SKIN: BuildSkin = {
  panel: "border-hsr-border bg-hsr-panel/50",
  card: "border-hsr-border bg-hsr-card",
  cardHover: "hover:border-hsr-accent/50 hover:[--panel-corner:color-mix(in_oklab,var(--hsr-accent)_50%,transparent)]",
  text: "text-hsr-text",
  muted: "text-hsr-muted",
  accent: "text-hsr-accent",
  line: "ring-hsr-line",
  field: "border border-hsr-border bg-hsr-card text-hsr-text focus:border-hsr-accent/60",
  active: "border-hsr-accent/50 bg-hsr-accent/15 text-hsr-accent",
  bar: "border-hsr-border bg-hsr-bg/90",
};

export function HsrBuildsPage() {
  const { id } = useParams();
  const { t } = useI18n();

  const listings = useMemo(() => listHsrBuilds(t), [t]);
  const roster = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const target = useMemo(() => (id ? getHsrBuild(id, t) : null), [id, t]);
  const guide = useGuide(HSR_GUIDES, target ? id : undefined);

  useDocumentTitle(
    target
      ? t("builds", "documentTitleCharacter", { name: target.name, game: "Honkai: Star Rail" })
      : t("builds", "documentTitle"),
  );

  const uid = useComparisonUid(HSR_RECENT_UIDS_KEY, isValidHsrUid);
  const { data, isLoading, isError } = useHsrShowcase(uid, { enabled: Boolean(id) });

  const owned = useMemo(() => {
    if (!id || !data) return null;
    // The Trailblazer's page is a Path's, and a player on that Path is on it
    // whichever body they play.
    const character = data.characters.find((c) => sameHsrBuild(c.avatarId, id));
    if (!character) return null;

    // Head and Hands have fixed main stats, so only the four choices matter.
    const slots: OwnedSlot[] = SELECTABLE_SLOTS.map((slot) => {
      const relic = character.relics.find((r) => r.slot === slot);
      return {
        slot: t("hsrSlots", slot),
        stat: relic ? t("hsrStats", relic.mainStat.key) : "-",
        ok: relic?.score.mainStatOk ?? false,
      };
    });

    return {
      score: character.diagnostics.score,
      grade: character.diagnostics.grade,
      complete: character.diagnostics.complete,
      slots,
      showcaseHref: `/hsr/showcase/${uid}?c=${character.avatarId}`,
      weaponId: character.lightCone ? String(character.lightCone.id) : null,
    };
  }, [id, data, uid, t]);

  if (!id) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-hsr-text sm:text-3xl">{t("builds", "title")}</h1>
          <p className="mt-1 text-sm text-hsr-muted">{t("builds", "lead")}</p>
        </header>
        <BuildIndex listings={listings} basePath="/hsr/builds" skin={SKIN} />
      </div>
    );
  }

  if (!target) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl">
      <BuildDetail
        target={target}
        basePath="/hsr/builds"
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
            homeHref="/hsr"
          />
        }
      />
    </div>
  );
}
