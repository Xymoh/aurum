import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { BuildDetail } from "../components/builds/BuildDetail";
import { BuildIndex } from "../components/builds/BuildIndex";
import { OwnedStrip, type OwnedSlot } from "../components/builds/OwnedStrip";
import type { BuildSkin } from "../components/builds/skin";
import { NotFoundPage } from "./NotFoundPage";
import { useI18n } from "../i18n";
import { getGenshinBuild, listGenshinBuilds } from "../lib/buildTarget/genshin";
import { GENSHIN_RECENT_UIDS_KEY, readRecentUids } from "../hooks/useRecentUids";
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
};

/** The three slots whose main stat is a choice; Flower and Plume are fixed. */
const SELECTABLE: ArtifactSlot[] = ["SANDS", "GOBLET", "CIRCLET"];

export function GenshinBuildsPage() {
  const { id } = useParams();
  const { t } = useI18n();

  const listings = useMemo(() => listGenshinBuilds(t), [t]);
  const target = useMemo(() => (id ? getGenshinBuild(id, t) : null), [id, t]);

  useDocumentTitle(
    target
      ? t("builds", "documentTitleCharacter", { name: target.name, game: "Genshin Impact" })
      : t("builds", "documentTitle"),
  );

  // The last UID this visitor looked up. Read once: the comparison is a
  // convenience, and a UID typed on another tab should not retarget the page
  // underneath someone mid-read.
  const uid = useMemo(() => readRecentUids(GENSHIN_RECENT_UIDS_KEY)[0]?.uid ?? "", []);
  const { data, isLoading } = useShowcase(uid);

  const owned = useMemo(() => {
    if (!id || !data) return null;
    const character = data.characters.find((c) => String(c.avatarId) === id);
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
      showcaseHref: `/genshin/showcase/${uid}`,
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

  if (!target) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl">
      <BuildDetail
        target={target}
        basePath="/genshin/builds"
        skin={SKIN}
        owned={
          <OwnedStrip
            skin={SKIN}
            name={target.name}
            uid={uid || null}
            loading={isLoading}
            owned={owned}
            homeHref="/genshin"
          />
        }
      />
    </div>
  );
}
