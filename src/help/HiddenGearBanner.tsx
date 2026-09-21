import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { HELP_CONTENT, SHOWCASE_HELP, type HelpGame } from "./content";

interface HiddenGearBannerProps {
  game: HelpGame;
  /** How many characters loaded, and how many of them carry no gear at all. */
  total: number;
  bare: number;
}

/**
 * Characters loaded, gear did not.
 *
 * This is the commonest confusion the site meets: the showcase is filled in
 * but the game's "show details" switch is off, so Enka publishes the names
 * and nothing to score. The cards below look broken. The empty-state help
 * never appears, because the list is not empty. So the page says what
 * happened and points at the switch, above the cards, only while every
 * character is bare: one unbuilt character among geared ones is a real
 * empty slot, not a hidden one.
 */
export function HiddenGearBanner({ game, total, bare }: HiddenGearBannerProps) {
  const { t } = useI18n();
  if (!SHOWCASE_HELP || total === 0 || bare < total) return null;
  const { skin, bannerBody, path } = HELP_CONTENT[game];

  return (
    <div role="status" className={`game-panel flex flex-col gap-2 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${skin.banner}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{t("help", "bannerTitle")}</p>
        <p className={`mt-0.5 text-sm ${skin.muted}`}>{t("help", bannerBody)}</p>
      </div>
      <Link to={path} className={`flex-shrink-0 text-sm font-medium ${skin.link}`}>
        {t("help", "bannerLink")}
      </Link>
    </div>
  );
}
