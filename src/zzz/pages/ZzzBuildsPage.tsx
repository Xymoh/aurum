import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { BuildDetail } from "../../components/builds/BuildDetail";
import { BuildIndex } from "../../components/builds/BuildIndex";
import { OwnedStrip, type OwnedSlot } from "../../components/builds/OwnedStrip";
import type { BuildSkin } from "../../components/builds/skin";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { useI18n } from "../../i18n";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { readRecentUids, ZZZ_RECENT_UIDS_KEY } from "../../hooks/useRecentUids";
import { getZzzBuild, listZzzBuilds } from "../buildTarget";
import { SELECTABLE_ZZZ_SLOTS } from "../types";
import { useZzzShowcase } from "../useZzzShowcase";

const SKIN: BuildSkin = {
  panel: "border-zzz-border bg-zzz-panel/50",
  card: "border-zzz-border bg-zzz-card",
  cardHover: "hover:border-zzz-accent/50 hover:[--panel-corner:color-mix(in_oklab,var(--zzz-accent)_50%,transparent)]",
  text: "text-zzz-text",
  muted: "text-zzz-muted",
  accent: "text-zzz-accent",
  line: "ring-zzz-line",
  field: "border border-zzz-border bg-zzz-card text-zzz-text focus:border-zzz-accent/60",
};

export function ZzzBuildsPage() {
  const { id } = useParams();
  const { t } = useI18n();

  const listings = useMemo(() => listZzzBuilds(t), [t]);
  const target = useMemo(() => (id ? getZzzBuild(id, t) : null), [id, t]);

  useDocumentTitle(
    target
      ? t("builds", "documentTitleCharacter", { name: target.name, game: "Zenless Zone Zero" })
      : t("builds", "documentTitle"),
  );

  const uid = useMemo(() => readRecentUids(ZZZ_RECENT_UIDS_KEY)[0]?.uid ?? "", []);
  const { data, isLoading } = useZzzShowcase(uid);

  const owned = useMemo(() => {
    if (!id || !data) return null;
    const agent = data.agents.find((a) => String(a.id) === id);
    if (!agent) return null;

    // Slots 1 to 3 have fixed main stats; only 4, 5 and 6 are a choice.
    const slots: OwnedSlot[] = SELECTABLE_ZZZ_SLOTS.map((slot) => {
      const disc = agent.discs.find((d) => d.slot === slot);
      return {
        slot: t("zzzSlots", String(slot) as "1"),
        stat: disc ? t("zzzStats", String(disc.mainStat.id) as "11101") : "-",
        ok: disc?.score.mainStatOk ?? false,
      };
    });

    return {
      score: agent.diagnostics.score,
      grade: agent.diagnostics.grade,
      complete: agent.diagnostics.complete,
      slots,
      showcaseHref: `/zzz/showcase/${uid}`,
    };
  }, [id, data, uid, t]);

  if (!id) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className="text-2xl font-black uppercase tracking-wide text-zzz-text sm:text-3xl">
            {t("builds", "title")}
          </h1>
          <p className="mt-1 text-sm text-zzz-muted">{t("builds", "lead")}</p>
        </header>
        <BuildIndex listings={listings} basePath="/zzz/builds" skin={SKIN} />
      </div>
    );
  }

  if (!target) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl">
      <BuildDetail
        target={target}
        basePath="/zzz/builds"
        skin={SKIN}
        owned={
          <OwnedStrip
            skin={SKIN}
            name={target.name}
            uid={uid || null}
            loading={isLoading}
            owned={owned}
            homeHref="/zzz"
          />
        }
      />
    </div>
  );
}
