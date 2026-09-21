import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { PRIVACY_PATH, SUPPORT_URL, TERMS_PATH } from "./site";

interface LegalLinksProps {
  /** Utility classes for each link, so every game's footer keeps its own accent. */
  className: string;
  /** That game's showcase guide, so help is one click away from every page. */
  helpTo?: string;
}

/**
 * The Privacy and Terms links every footer carries. One component so the
 * pair can never drift apart or go missing from a game that was added later.
 */
export function LegalLinks({ className, helpTo }: LegalLinksProps) {
  const { t } = useI18n();
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-3">
      {helpTo && (
        <>
          <Link to={helpTo} className={className}>
            {t("help", "navLabel")}
          </Link>
          <span aria-hidden="true">·</span>
        </>
      )}
      <Link to={PRIVACY_PATH} className={className}>
        {t("legal", "privacy")}
      </Link>
      <span aria-hidden="true">·</span>
      <Link to={TERMS_PATH} className={className}>
        {t("legal", "terms")}
      </Link>
      <span aria-hidden="true">·</span>
      {/* Donations keep the relay paid for; the link says so in its title. */}
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={t("legal", "supportHint")}
        className={className}
      >
        {t("legal", "support")}
      </a>
    </span>
  );
}
