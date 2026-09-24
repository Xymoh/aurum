import { Link, useParams } from "react-router-dom";
import { useI18n } from "../../i18n";
import { BookIcon } from "./icons";

interface GuideLinkProps {
  /** The character's build page, e.g. "/hsr/builds/1308". */
  to: string;
  name: string;
  className?: string;
}

/**
 * The jump from a showcase card to that character's build page.
 *
 * Sits beside the share button, in the row every card shows collapsed, so
 * the question "what should this character be wearing" is one click from
 * the answer to "what are they wearing". Same size and shape as the share
 * button so the two read as a pair.
 *
 * The showcase's UID rides along as ?uid=, so the build page compares
 * against the account the visitor was just looking at. Without it the page
 * falls back to the last UID typed on the home page, which is a different
 * account for anyone who arrived on a shared link.
 */
export function GuideLink({ to, name, className = "" }: GuideLinkProps) {
  const { t } = useI18n();
  const { uid } = useParams();
  return (
    <Link
      to={uid ? `${to}?uid=${encodeURIComponent(uid)}` : to}
      title={t("showcase", "buildGuideHint", { name })}
      aria-label={t("showcase", "buildGuideHint", { name })}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold no-underline transition-colors ${className}`}
    >
      <BookIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {/* Icon only on a phone: beside the share button, the label would
          squeeze the stat row it shares a line with to half its width. */}
      <span className="hidden sm:inline">{t("showcase", "buildGuide")}</span>
    </Link>
  );
}
