import { useState } from "react";
import { Link } from "react-router-dom";
import { ScoreMethodologyModal } from "../ui/ScoreMethodologyModal";
import { HelpIcon } from "../ui/icons";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useI18n } from "../../i18n";
import { GameSwitcherCompact } from "../../games/GameRail";

export function Header() {
  const [showInfo, setShowInfo] = useState(false);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-dark-border bg-dark-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/genshin" className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-dark-text no-underline">
          <span className="bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-2xl text-transparent transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110">
            ✦
          </span>
          <span className="hidden whitespace-nowrap bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent sm:inline">
            Artifact Aurum
          </span>
        </Link>
        <nav className="flex items-center gap-1.5" aria-label="Site">
          <GameSwitcherCompact current="genshin" />
          <LanguageSwitcher />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-dark-muted transition-colors hover:bg-dark-border/40 hover:text-dark-text"
            onClick={() => setShowInfo(true)}
            aria-label={t("nav", "howScoringWorks")}
            title={t("nav", "howScoringWorks")}
          >
            <HelpIcon className="h-4 w-4" />
          </button>
          <ThemeToggle
            label={t("nav", "toggleTheme")}
            className="text-dark-muted hover:bg-dark-border/40 hover:text-dark-text"
          />
        </nav>
      </div>

      {showInfo && <ScoreMethodologyModal onClose={() => setShowInfo(false)} />}
    </header>
  );
}
