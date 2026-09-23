import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { CONTACT_URL } from "../legal/site";
import { HELP_CONTENT, helpImageUrl, type HelpGame, type HelpSkin, type HelpStep } from "./content";

interface ShowcaseHelpPageProps {
  game: HelpGame;
}

/**
 * A step's screenshot. Until the real capture is dropped into
 * public/help/<game>/, the image 404s and this shows a labelled placeholder
 * instead: the file name to create and what it should show. That makes the
 * missing pictures a checklist rather than a mystery, and a visitor who
 * arrives before they exist still gets the text.
 */
function StepImage({ game, step, skin }: { game: HelpGame; step: HelpStep; skin: HelpSkin }) {
  const { t } = useI18n();
  const [missing, setMissing] = useState(false);
  const file = `public/help/${game}/${step.image}`;

  if (missing) {
    return (
      <div
        role="img"
        aria-label={t("help", "placeholderTitle")}
        className={`flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 text-center ${skin.inset}`}
      >
        <span className={`text-xs font-semibold uppercase tracking-wider ${skin.muted}`}>
          {t("help", "placeholderTitle")}
        </span>
        <span className={`text-sm leading-relaxed ${skin.text}`}>{t("help", step.capture)}</span>
        <code className={`mt-1 rounded px-1.5 py-0.5 font-mono text-[11px] ${skin.muted}`}>{file}</code>
      </div>
    );
  }

  // Game UI text is small once a 16:9 capture shrinks to the column width,
  // so the picture opens full size in a new tab. Contain rather than cover:
  // cropping could cut off the very button the step points at.
  const src = helpImageUrl(game, step.image);
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block" title={t("help", "openFull")}>
      <img
        src={src}
        alt={t("help", step.capture)}
        loading="lazy"
        decoding="async"
        className={`aspect-video w-full rounded-lg border object-contain transition-opacity hover:opacity-90 ${skin.line} ${skin.inset}`}
        onError={() => setMissing(true)}
      />
    </a>
  );
}

/**
 * The full walkthrough for one game: the in-game steps with a picture each,
 * then the checklist for a showcase that is set up and still comes back
 * empty. Every empty state, "not found" error and hidden-gear banner links
 * here, so the page has to work for someone who is mildly annoyed and has
 * not read anything else on the site.
 */
export function ShowcaseHelpPage({ game }: ShowcaseHelpPageProps) {
  const { t } = useI18n();
  const content = HELP_CONTENT[game];
  const { skin } = content;
  useDocumentTitle(`${t("help", "title")} - Aurum`);

  return (
    <div className={`mx-auto max-w-3xl space-y-8 ${skin.text}`}>
      <header>
        <p className={`text-xs font-semibold uppercase tracking-wider ${skin.accent}`}>{t("help", "navLabel")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t("help", "title")}</h1>
        <p className={`mt-3 text-base leading-relaxed ${skin.muted}`}>{t("help", content.intro)}</p>
      </header>

      <section className={`game-panel border p-5 sm:p-6 ${skin.panel}`} aria-labelledby="help-steps">
        <h2 id="help-steps" className="text-lg font-semibold">
          {t("help", "stepsHeading")}
        </h2>
        <ol className="mt-4 space-y-6">
          {content.steps.map((step, i) => (
            <li key={step.text} className="grid gap-3 sm:grid-cols-[1.5rem_1fr] sm:gap-4">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${skin.accentBg}`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 space-y-3">
                <p className="text-sm leading-relaxed sm:text-base">{t("help", step.text)}</p>
                <StepImage game={game} step={step} skin={skin} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`game-panel border p-5 sm:p-6 ${skin.panel}`} aria-labelledby="help-checks">
        <h2 id="help-checks" className="text-lg font-semibold">
          {t("help", "checksHeading")}
        </h2>
        <ul className="mt-4 space-y-3">
          {content.checks.map((check) => (
            <li key={check} className="flex gap-3">
              <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${skin.accentBg}`} aria-hidden="true" />
              <p className="text-sm leading-relaxed">{t("help", check)}</p>
            </li>
          ))}
        </ul>
        <p className={`mt-5 border-t pt-4 text-sm leading-relaxed ${skin.line} ${skin.muted}`}>
          {t("help", "checkIssue")}{" "}
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className={skin.link}>
            {t("help", "checkIssueLink")}
          </a>
        </p>
      </section>

      <p>
        <Link to={content.home} className={`text-sm ${skin.link}`}>
          {t("help", "backToLookup")}
        </Link>
      </p>
    </div>
  );
}
