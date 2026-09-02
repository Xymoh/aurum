import { useState } from "react";
import { Link } from "react-router-dom";
import { ScoreMethodologyModal } from "../ui/ScoreMethodologyModal";
import { HelpIcon, ThemeIcon } from "../ui/icons";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useI18n } from "../../i18n";
import { GameSwitcherCompact } from "../../games/GameRail";

export function Header() {
  const [showInfo, setShowInfo] = useState(false);
  const { t } = useI18n();

  return (
    <header className="border-b border-dark-border bg-dark-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/genshin" className="flex items-center gap-3 font-bold text-lg tracking-tight text-dark-text no-underline">
          <span className="bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent text-2xl">✦</span>
          <span className="hidden whitespace-nowrap bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent sm:inline">Artifact Aurum</span>
        </Link>
        <nav className="flex items-center gap-2">
          <GameSwitcherCompact current="genshin" />
          <LanguageSwitcher />
          <button
            type="button"
            className="rounded-lg p-2 text-dark-muted hover:text-dark-text hover:bg-dark-border/40 transition-colors"
            onClick={() => setShowInfo(true)}
            aria-label={t("nav", "howScoringWorks")}
            title={t("nav", "howScoringWorks")}
          >
            <HelpIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-dark-muted hover:text-dark-text hover:bg-dark-border/40 transition-colors"
            onClick={() => {
              const root = document.documentElement;
              const current = root.getAttribute("data-theme");
              root.setAttribute("data-theme", current === "light" ? "dark" : "light");
            }}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
        </nav>
      </div>

      {showInfo && <ScoreMethodologyModal onClose={() => setShowInfo(false)} />}
    </header>
  );
}
