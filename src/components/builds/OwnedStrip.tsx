import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { GradeBadge } from "../ui/GradeBadge";
import { formatScore } from "../../lib/format";
import type { BuildSkin } from "./skin";

export interface OwnedSlot {
  /** Localized slot name. */
  slot: string;
  /** The main stat actually equipped there, localized. */
  stat: string;
  /** Whether that main stat is one the target calls for. */
  ok: boolean;
}

export interface OwnedBuild {
  score: number;
  grade: string;
  complete: boolean;
  slots: OwnedSlot[];
  showcaseHref: string;
}

interface OwnedStripProps {
  skin: BuildSkin;
  name: string;
  /** The most recent UID this visitor looked up, or null if they never have. */
  uid: string | null;
  loading: boolean;
  /** Null when a UID is known but this character is not on display. */
  owned: OwnedBuild | null;
  /** Where to go to enter a UID. */
  homeHref: string;
}

/**
 * The visitor's own version of the character being described, when there is
 * one to show.
 *
 * This is the whole reason the build pages are worth having over a static
 * guide: the target on its own is something Prydwen already publishes, but
 * the target next to your own goblet is not. It reuses the last UID the
 * visitor looked up, so nothing has to be typed twice.
 */
export function OwnedStrip({ skin, name, uid, loading, owned, homeHref }: OwnedStripProps) {
  const { t } = useI18n();

  if (!uid) {
    return (
      <section className={`game-panel border p-4 ${skin.panel}`}>
        <p className={`text-sm ${skin.muted}`}>
          {t("builds", "yoursNone")}{" "}
          <Link to={homeHref} className={`no-underline hover:underline ${skin.accent}`}>
            {t("builds", "lookUp")}
          </Link>
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={`game-panel border p-4 ${skin.panel}`}>
        <p className={`text-sm ${skin.muted}`}>{t("builds", "yoursLoading")}</p>
      </section>
    );
  }

  if (!owned) {
    return (
      <section className={`game-panel border p-4 ${skin.panel}`}>
        <p className={`text-sm ${skin.muted}`}>{t("builds", "yoursMissing", { name, uid })}</p>
      </section>
    );
  }

  return (
    <section className={`game-panel border p-4 sm:p-5 ${skin.panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${skin.text}`}>
          {t("builds", "yours")}
        </h2>
        <Link
          to={owned.showcaseHref}
          className={`text-sm no-underline hover:underline ${skin.accent}`}
        >
          {t("builds", "viewInShowcase")}
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {owned.complete ? (
          <span className="flex items-baseline gap-2">
            <span className={`font-mono text-2xl font-bold tabular-nums ${skin.text}`}>
              {formatScore(owned.score)}
            </span>
            <GradeBadge grade={owned.grade} size="sm" />
          </span>
        ) : (
          <span className={`text-sm ${skin.muted}`}>{t("builds", "yoursIncomplete")}</span>
        )}

        <div className="flex flex-wrap gap-1.5">
          {owned.slots.map((slot) => (
            <span
              key={slot.slot}
              className={`game-panel-sm border px-2 py-1 text-xs ${skin.card}`}
              title={slot.ok ? t("builds", "slotOk") : t("builds", "slotOff")}
            >
              <span className={skin.muted}>{slot.slot}</span>{" "}
              <span className={slot.ok ? skin.text : "text-verdict-replace"}>
                {slot.ok ? "✓" : "✗"} {slot.stat}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
