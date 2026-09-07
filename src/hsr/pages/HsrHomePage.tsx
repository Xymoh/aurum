import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BENCHMARK_ROLLS, MAX_ROLLS, GRADE_LADDER } from "../scoring";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { isValidHsrUid } from "../useHsrShowcase";
import { sanitizeUidInput } from "../../lib/uid";
import { HSR_RECENT_UIDS_KEY, useRecentUids } from "../../hooks/useRecentUids";
import { useI18n } from "../../i18n";

export function HsrHomePage() {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { recent, remember } = useRecentUids(HSR_RECENT_UIDS_KEY);
  const { t } = useI18n();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = sanitizeUidInput(uid);
    if (!isValidHsrUid(trimmed)) {
      setError(t("hsr", "uidInvalid"));
      return;
    }
    setError("");
    remember(trimmed);
    navigate(`/hsr/showcase/${trimmed}`);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="bg-gradient-to-r from-hsr-accent via-hsr-glow to-hsr-gold bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          {t("hsr", "title")}
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-hsr-muted">
          {t("hsr", "tagline")}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-hsr-muted">
          {t("hsr", "intro")}
        </p>

        <form onSubmit={submit} className="mt-6 flex items-center justify-center gap-2">
          {/* The shape lives on a wrapper, not the field: an input is a
              replaced element and never renders the pseudo-element that
              draws the border along the notch. */}
          <div className="game-panel-sm w-56 border border-hsr-border bg-hsr-card focus-within:border-hsr-accent focus-within:[--panel-corner:var(--hsr-accent)]">
            <input
              value={uid}
              // Digits only, capped at 9: the field should make an invalid UID
              // hard to type rather than only complaining after submit.
              onChange={(e) => {
                setUid(sanitizeUidInput(e.target.value));
                setError("");
              }}
              maxLength={9}
              placeholder={t("hsr", "uidPlaceholder")}
              inputMode="numeric"
              aria-label={t("hsr", "uidLabel")}
              className="w-full bg-transparent px-3 py-2 font-mono text-sm text-hsr-text placeholder:text-hsr-muted/70 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="game-panel-sm border border-hsr-accent/40 [--panel-corner:color-mix(in_oklab,var(--hsr-accent)_40%,transparent)] bg-hsr-accent/15 px-4 py-2 text-sm font-semibold text-hsr-accent transition-colors hover:bg-hsr-accent/25"
          >
            {t("hsr", "analyse")}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-verdict-replace" role="alert">{error}</p>}

        {recent.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-hsr-muted">
              {t("home", "recentLookups")}
            </h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {recent.slice(0, 6).map((entry) => (
                <Link
                  key={entry.uid}
                  to={`/hsr/showcase/${entry.uid}`}
                  className="game-panel-sm border border-hsr-border bg-hsr-card px-3 py-1.5 font-mono text-sm text-hsr-text no-underline transition-colors hover:border-hsr-accent/50 hover:[--panel-corner:color-mix(in_oklab,var(--hsr-accent)_50%,transparent)] hover:text-hsr-accent"
                >
                  {entry.uid}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
        {[
          {
            n: "1",
            t: t("hsr", "step1Title"),
            b: t("hsr", "step1Body"),
          },
          {
            n: "2",
            t: t("hsr", "step2Title"),
            b: t("hsr", "step2Body"),
          },
          {
            n: "3",
            t: t("hsr", "step3Title"),
            b: t("hsr", "step3Body", { benchmark: BENCHMARK_ROLLS, max: MAX_ROLLS }),
          },
        ].map((c) => (
          <div key={c.n} className="game-panel border border-hsr-border bg-hsr-panel/40 p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-hsr-accent/30 font-mono text-sm text-hsr-accent">
              {c.n}
            </span>
            <h3 className="mt-2 text-base font-semibold text-hsr-text">{c.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-hsr-muted">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl game-panel border border-hsr-border bg-hsr-panel/40 p-5">
        <h2 className="text-base font-semibold text-hsr-text">{t("hsr", "gradedTitle")}</h2>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-hsr-muted">
          <p>{t("hsr", "gradedP1")}</p>
          <p>{t("hsr", "gradedP2")}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {GRADE_LADDER.filter((_, i) => i % 2 === 0).map((band) => (
              <span key={band.grade} className="inline-flex items-center gap-1 rounded-md border border-hsr-line bg-hsr-inset px-2 py-0.5 font-mono text-xs">
                <GradeBadge grade={band.grade} size="xs" /> {band.min}%+
              </span>
            ))}
          </div>
          <p>{t("hsr", "gradedP3")}</p>
        </div>
      </div>

      <div className="w-full max-w-4xl game-panel border border-hsr-border bg-hsr-panel/40 p-5">
        <h2 className="text-base font-semibold text-hsr-text">{t("hsr", "disagreeTitle")}</h2>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-hsr-muted">
          <p>{t("hsr", "disagreeP1")}</p>
          <p>{t("hsr", "disagreeP2")}</p>
          <p>
            {t("hsr", "disagreeP3Prefix")}
            <a
              href="https://github.com/fribbels/hsr-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hsr-accent underline underline-offset-2 hover:text-hsr-text"
            >
              Fribbels HSR Optimizer
            </a>
            {t("hsr", "disagreeP3Suffix")}
          </p>
        </div>
      </div>
    </div>
  );
}
