import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { PRIVACY_PATH, TERMS_PATH } from "./site";

interface LegalLinksProps {
  /** Utility classes for each link, so every game's footer keeps its own accent. */
  className: string;
}

/**
 * The Privacy and Terms links every footer carries. One component so the
 * pair can never drift apart or go missing from a game that was added later.
 */
export function LegalLinks({ className }: LegalLinksProps) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-3">
      <Link to={PRIVACY_PATH} className={className}>
        {t("legal", "privacy")}
      </Link>
      <span aria-hidden="true">·</span>
      <Link to={TERMS_PATH} className={className}>
        {t("legal", "terms")}
      </Link>
    </span>
  );
}
