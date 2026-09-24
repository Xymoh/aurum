import { useI18n } from "../../i18n";
import { LegalLinks } from "../../legal/LegalLinks";
import { HELP_PATH } from "../../help/content";

const LINK = "text-accent underline hover:opacity-80";

/**
 * The one place third-party sites are named. Every page above this draws
 * on Enka, Genshin Optimizer and Game8, but the pages themselves talk
 * about "stats priority" and "recommended sets", not about who said so;
 * the credit belongs here, once, where every other game's footer keeps it.
 */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-dark-border py-6 text-center px-4">
      <p className="text-dark-muted text-sm">
        {t("home", "footerDisclaimer")}
        <br />
        {t("home", "footerDataPrefix")}
        <a href="https://enka.network" target="_blank" rel="noopener noreferrer" className={LINK}>
          Enka.Network
        </a>
        .
        <br />
        {t("home", "footerBuildsPrefix")}
        <a href="https://github.com/frzyc/genshin-optimizer" target="_blank" rel="noopener noreferrer" className={LINK}>
          Genshin Optimizer
        </a>
        {t("home", "footerBuildsMiddle")}
        <a href="https://game8.co/games/Genshin-Impact" target="_blank" rel="noopener noreferrer" className={LINK}>
          Game8
        </a>
        .
      </p>
      <p className="mt-2 text-dark-muted text-sm">
        <LegalLinks className={LINK} helpTo={HELP_PATH.genshin} />
      </p>
    </footer>
  );
}
