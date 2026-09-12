import { useI18n } from "../../i18n";

const LINK = "text-accent underline hover:opacity-80";

/**
 * The one place third-party sites are named. Every page above this draws
 * on Enka, Genshin Optimizer and genshin.gg, but the pages themselves talk
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
        <a href="https://genshin.gg/characters/" target="_blank" rel="noopener noreferrer" className={LINK}>
          genshin.gg
        </a>
        .
      </p>
    </footer>
  );
}
