import { Link, Outlet } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { GameRail, GameSwitcherCompact } from "../../games/GameRail";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

/**
 * Layout for the Star Rail side.
 *
 * Kept separate from the Genshin Layout on purpose: shared chrome would drag
 * both games toward one visual identity, and the whole point of a second tab
 * is that it should feel like its own tool. The controls that must behave the
 * same everywhere (game switcher, theme) are shared components, so the two
 * headers differ in look but not in what they can do.
 */
export function HsrLayout() {
  useDocumentTitle("Relic Aurum - Honkai: Star Rail relic scorer");

  return (
    <div className="flex min-h-screen flex-col bg-hsr-bg text-hsr-text lg:pl-14" data-game="hsr">
      <GameRail current="hsr" />
      <header className="sticky top-0 z-30 border-b border-hsr-border bg-hsr-panel/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/hsr" className="group flex items-center gap-2">
            <span className="text-lg text-hsr-accent transition-transform group-hover:rotate-90">
              ✧
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-hsr-text">
              Relic Aurum
            </span>
          </Link>
          <nav className="flex items-center gap-1.5" aria-label="Site">
            <GameSwitcherCompact current="hsr" />
            <ThemeToggle className="text-hsr-muted hover:bg-hsr-fill hover:text-hsr-text" />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-hsr-border bg-hsr-panel/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 text-center text-sm text-hsr-muted sm:px-6">
          <p>Relic Aurum is a fan-made tool and is not affiliated with HoYoverse.</p>
          <p className="mt-1">
            Character data from{" "}
            <a
              href="https://enka.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hsr-accent underline underline-offset-2 hover:text-hsr-text"
            >
              Enka.Network
            </a>
            , game tables from{" "}
            <a
              href="https://github.com/Mar-7th/StarRailRes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hsr-accent underline underline-offset-2 hover:text-hsr-text"
            >
              StarRailRes
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
