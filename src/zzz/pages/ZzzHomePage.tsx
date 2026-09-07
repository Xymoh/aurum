import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BENCHMARK_ROLLS, MAX_ROLLS, GRADE_LADDER, ROLL_VALUE } from "../scoring";
import { isValidZzzUid } from "../useZzzShowcase";
import { ZZZ_RECENT_UIDS_KEY, useRecentUids } from "../../hooks/useRecentUids";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { useI18n } from "../../i18n";

/** Digits only, capped at ten. */
function sanitize(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function ZzzHomePage() {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { recent, remember } = useRecentUids(ZZZ_RECENT_UIDS_KEY);
  const { t } = useI18n();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = sanitize(uid);
    if (!isValidZzzUid(trimmed)) {
      setError(t("zzz", "uidInvalid"));
      return;
    }
    setError("");
    remember(trimmed);
    navigate(`/zzz/showcase/${trimmed}`);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="w-full max-w-2xl text-center">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-zzz-accent">
          {t("zzz", "kicker")}
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-6xl">
          {t("zzz", "headingA")} <span className="text-zzz-accent">{t("zzz", "headingB")}</span>
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-zzz-muted">
          {t("zzz", "tagline")}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zzz-muted">
          {t("zzz", "intro")}
        </p>

        <form onSubmit={submit} className="mt-6 flex items-center justify-center gap-2">
          {/* The shape lives on a wrapper, not the field: an input is a
              replaced element and never renders the pseudo-element that
              draws the border along the bevel. */}
          <div className="game-panel-sm w-60 border border-zzz-border bg-zzz-card focus-within:border-zzz-accent focus-within:[--panel-corner:var(--zzz-accent)]">
            <input
              value={uid}
              onChange={(e) => {
                setUid(sanitize(e.target.value));
                setError("");
              }}
              maxLength={10}
              placeholder={t("zzz", "uidPlaceholder")}
              inputMode="numeric"
              aria-label={t("zzz", "uidLabel")}
              className="w-full bg-transparent px-3 py-2 font-mono text-sm text-zzz-text placeholder:text-zzz-muted/70 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            /* No border on this one, so the bevel gets no line either. */
            className="game-panel-sm [--panel-corner:transparent] bg-zzz-accent px-4 py-2 text-sm font-black uppercase tracking-wider text-black transition-transform hover:-translate-y-0.5"
          >
            {t("zzz", "scan")}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-zzz-signal" role="alert">{error}</p>}

        {recent.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zzz-muted">{t("home", "recentLookups")}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {recent.slice(0, 6).map((entry) => (
                <Link
                  key={entry.uid}
                  to={`/zzz/showcase/${entry.uid}`}
                  className="game-panel-sm border border-zzz-border bg-zzz-card px-3 py-1.5 font-mono text-sm text-zzz-text no-underline transition-colors hover:border-zzz-accent/60 hover:[--panel-corner:color-mix(in_oklab,var(--zzz-accent)_60%,transparent)] hover:text-zzz-accent"
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
            n: "01",
            t: t("zzz", "step1Title"),
            b: t("zzz", "step1Body"),
          },
          {
            n: "02",
            t: t("zzz", "step2Title"),
            b: t("zzz", "step2Body"),
          },
          {
            n: "03",
            t: t("zzz", "step3Title"),
            b: t("zzz", "step3Body", { benchmark: BENCHMARK_ROLLS, max: MAX_ROLLS }),
          },
        ].map((c) => (
          <div key={c.n} className="game-panel border border-zzz-border bg-zzz-panel/50 p-4">
            <span className="font-mono text-sm font-bold text-zzz-accent">{c.n}</span>
            <h3 className="mt-2 text-base font-bold uppercase tracking-wide text-zzz-text">{c.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zzz-muted">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl game-panel border border-zzz-border bg-zzz-panel/50 p-5">
        <h2 className="text-base font-bold uppercase tracking-wide text-zzz-text">{t("zzz", "gradedTitle")}</h2>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-zzz-muted">
          <p>{t("zzz", "gradedP1")}</p>
          <p>{t("zzz", "gradedP2")}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {GRADE_LADDER.filter((_, i) => i % 2 === 0).map((band) => (
              <span key={band.grade} className="inline-flex items-center gap-1 rounded-md border border-zzz-line bg-zzz-inset px-2 py-0.5 font-mono text-xs">
                <GradeBadge grade={band.grade} size="xs" /> {band.min}%+
              </span>
            ))}
          </div>
          <p>{t("zzz", "gradedP3")}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(ROLL_VALUE).map(([id, value]) => (
              <span key={id} className="rounded-md border border-zzz-line bg-zzz-inset px-2 py-0.5 font-mono text-xs text-zzz-text">
                {t("zzzStats", String(id) as "11101")} <span className="text-zzz-accent">+{value}{Number(id) < 20000 && Number(id) % 100 === 2 ? "%" : Number(id) === 20103 || Number(id) === 21103 ? "%" : ""}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
