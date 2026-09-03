import { UidInput } from "../components/ui/UidInput";
import { ScoringExplainer } from "../components/ui/ScoringExplainer";
import { GENSHIN_RECENT_UIDS_KEY, useRecentUids } from "../hooks/useRecentUids";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

const LINK_CLASS =
  "text-accent hover:text-accent-strong underline underline-offset-2";

export function HomePage() {
  const { recent: recentUids } = useRecentUids(GENSHIN_RECENT_UIDS_KEY);
  const { t } = useI18n();

  const steps = [
    { title: t("home", "step1Title"), body: t("home", "step1Body") },
    { title: t("home", "step2Title"), body: t("home", "step2Body") },
    { title: t("home", "step3Title"), body: t("home", "step3Body") },
  ];

  return (
    <div className="flex flex-col items-center gap-12 py-12">
      {/* Hero section */}
      <div className="text-center space-y-5 max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Artifact Aurum
          </span>
        </h1>
        <p className="text-dark-muted text-base font-medium tracking-wide uppercase">
          {t("home", "tagline")}
        </p>
        <p className="text-dark-muted/80 text-lg">{t("home", "intro")}</p>
      </div>

      {/* UID Input */}
      <div className="w-full max-w-md">
        <UidInput />
      </div>

      {/* Recent lookups - kept close to the input, since it's a shortcut into the same action */}
      {recentUids.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          <h2 className="text-dark-muted text-sm font-medium uppercase tracking-wider">
            {t("home", "recentLookups")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentUids.slice(0, 6).map((entry) => (
              <Link
                key={entry.uid}
                to={`/genshin/showcase/${entry.uid}`}
                className="game-panel-sm bg-dark-card border border-dark-border px-4 py-2 text-dark-text text-sm no-underline hover:border-accent hover:text-accent transition-colors"
              >
                {entry.uid}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div className="w-full max-w-2xl space-y-3">
        <h2 className="text-dark-muted text-sm font-medium uppercase tracking-wider text-center">
          {t("home", "howItWorks")}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="game-panel border border-dark-border bg-dark-card/40 p-4 space-y-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <h3 className="text-dark-text text-sm font-semibold">{step.title}</h3>
              <p className="text-sm text-dark-muted leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Scoring reference (same content as the in-app "?" panel).
          Collapsed by default: it is six hundred words, and the three steps
          above already answer "what does this do". ── */}
      <details className="group w-full max-w-2xl game-panel border border-dark-border bg-dark-card/40 open:bg-dark-card/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-base font-bold text-dark-text">{t("nav", "howScoringWorks")}</span>
            <span className="mt-0.5 block text-sm text-dark-muted">{t("showcase", "methodologyHint")}</span>
          </span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="flex-shrink-0 text-dark-muted transition-transform duration-300 group-open:rotate-180"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="border-t border-dark-border/60 p-5 sm:p-6">
          <ScoringExplainer />
        </div>
      </details>

      {/* ── Where the numbers come from ── */}
      <div className="w-full max-w-2xl game-panel border border-dark-border bg-dark-card/40 p-5 sm:p-6 space-y-3">
        <h2 className="text-dark-text text-base font-bold">{t("home", "dataTitle")}</h2>
        <ul className="space-y-2 text-sm text-dark-muted leading-relaxed">
          <li>
            <span className="text-dark-text font-medium">{t("home", "dataShowcase")}</span> -{" "}
            <a href="https://enka.network/" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              Enka.Network
            </a>
            {t("home", "dataShowcaseBody")}
          </li>
          <li>
            <span className="text-dark-text font-medium">{t("home", "dataStats")}</span>
            {t("home", "dataStatsPrefix")}
            <a
              href="https://github.com/frzyc/genshin-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              Genshin Optimizer
            </a>
            {t("home", "dataStatsBody")}
          </li>
          <li>
            <span className="text-dark-text font-medium">{t("home", "dataWeights")}</span>
            {t("home", "dataWeightsBody")}
          </li>
        </ul>
      </div>

      {/* ── Limitations ── */}
      <div className="w-full max-w-2xl game-panel border border-dark-border/50 bg-dark-card/40 px-5 py-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="space-y-1.5">
            <p className="text-sm text-dark-muted/90 leading-relaxed">
              <span className="font-medium text-dark-text/80">{t("home", "limitTitle")}</span>{" "}
              {t("home", "limitBody")}
            </p>
            <p className="text-sm text-dark-muted/70 leading-relaxed">
              {t("home", "limitFooter")}
              <a
                href="https://frzyc.github.io/genshin-optimizer/"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                Genshin Optimizer
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
