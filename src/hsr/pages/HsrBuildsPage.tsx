import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { BuildDetail } from "../../components/builds/BuildDetail";
import { BuildIndex } from "../../components/builds/BuildIndex";
import { OwnedStrip, type OwnedSlot } from "../../components/builds/OwnedStrip";
import type { BuildSkin } from "../../components/builds/skin";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { useI18n } from "../../i18n";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { HSR_RECENT_UIDS_KEY, readRecentUids } from "../../hooks/useRecentUids";
import { getHsrBuild, listHsrBuilds } from "../buildTarget";
import { useHsrShowcase } from "../useHsrShowcase";
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
};

export function HsrBuildsPage() {
  const { id } = useParams();
  const { t } = useI18n();

  const listings = useMemo(() => listHsrBuilds(t), [t]);
  const target = useMemo(() => (id ? getHsrBuild(id, t) : null), [id, t]);

  useDocumentTitle(
    target
      ? t("builds", "documentTitleCharacter", { name: target.name, game: "Honkai: Star Rail" })
      : t("builds", "documentTitle"),
  );

  const uid = useMemo(() => readRecentUids(HSR_RECENT_UIDS_KEY)[0]?.uid ?? "", []);
  const { data, isLoading } = useHsrShowcase(uid);

  const owned = useMemo(() => {
    if (!id || !data) return null;
    const character = data.characters.find((c) => String(c.avatarId) === id);
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
      showcaseHref: `/hsr/showcase/${uid}`,
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
        owned={
          <OwnedStrip
            skin={SKIN}
            name={target.name}
            uid={uid || null}
            loading={isLoading}
            owned={owned}
            homeHref="/hsr"
          />
        }
      />
    </div>
  );
}
