import { Link } from "react-router-dom";
import type { RecentUid } from "../../hooks/useRecentUids";
import { useI18n } from "../../i18n";

interface RecentLookupsProps {
  entries: RecentUid[];
  /** Where a chip leads, e.g. `/hsr/showcase/<uid>`. */
  hrefFor: (uid: string) => string;
  onForget: (uid: string) => void;
  onForgetAll: () => void;
  /** Each game's home page has its own palette; the markup is shared. */
  classes: {
    heading: string;
    /** The chip frame, holding both the link and its remove button. */
    chip: string;
    /** The "Clear" control beside the heading. */
    clear: string;
  };
  /** Center the heading and chips under a centered input. */
  centered?: boolean;
  /** Spacing around the whole block; nothing renders when the list is empty. */
  className?: string;
}

/**
 * The UIDs this browser has looked up, each with a way to take it off the
 * list. Someone checking a friend's account may not want it sitting on the
 * home page for the next person at the keyboard.
 */
export function RecentLookups({ entries, hrefFor, onForget, onForgetAll, classes, centered = false, className = "" }: RecentLookupsProps) {
  const { t } = useI18n();
  const align = centered ? "justify-center" : "";
  if (entries.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`flex items-baseline gap-3 ${align}`}>
        <h2 className={classes.heading}>{t("home", "recentLookups")}</h2>
        <button
          type="button"
          onClick={onForgetAll}
          className={`text-xs underline decoration-dotted underline-offset-4 transition-colors ${classes.clear}`}
        >
          {t("home", "clearRecent")}
        </button>
      </div>
      <ul className={`flex flex-wrap gap-2 ${align}`}>
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.uid} className={`inline-flex items-center ${classes.chip}`}>
            <Link to={hrefFor(entry.uid)} className="py-1.5 pl-3 pr-1 font-mono text-sm text-inherit no-underline">
              {entry.uid}
            </Link>
            <button
              type="button"
              onClick={() => onForget(entry.uid)}
              aria-label={t("home", "removeRecent", { uid: entry.uid })}
              title={t("home", "removeRecent", { uid: entry.uid })}
              className="flex h-7 w-7 items-center justify-center opacity-50 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
