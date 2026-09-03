import { Link, Outlet } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { GameRail, GameSwitcherCompact } from "../../games/GameRail";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

/**
 * Layout for the Zenless side.
 *
 * Near-black ground, acid lime for anything interactive, signal orange for
 * anything that needs attention: the palette of the game's own menus. The
 * wordmark leans on the "//" motif New Eridu's UI uses everywhere.
 */
export function ZzzLayout() {
  useDocumentTitle("Disc Aurum - Zenless Zone Zero drive disc scorer");

  return (
    <div className="flex min-h-screen flex-col bg-zzz-bg text-zzz-text lg:pl-14">
      <GameRail current="zzz" />
      <header className="sticky top-0 z-30 border-b border-zzz-border bg-zzz-panel/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/zzz" className="group flex items-center gap-2 no-underline">
            <span className="font-mono text-lg font-bold text-zzz-accent transition-transform group-hover:-skew-x-12">
              //
            </span>
            <span className="text-sm font-black uppercase tracking-[0.22em] text-zzz-text">
              Disc Aurum
            </span>
          </Link>
          <nav className="flex items-center gap-1.5" aria-label="Site">
            <GameSwitcherCompact current="zzz" />
            <ThemeToggle className="text-zzz-muted hover:bg-zzz-fill hover:text-zzz-text" />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-zzz-border bg-zzz-panel/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 text-center text-sm text-zzz-muted sm:px-6">
          <p>Disc Aurum is a fan-made tool and is not affiliated with HoYoverse.</p>
          <p className="mt-1">
            Showcase data and game tables from{" "}
            <a
              href="https://enka.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zzz-accent underline underline-offset-2 hover:text-zzz-text"
            >
              Enka.Network
            </a>
            , build priorities from{" "}
            <a
              href="https://www.prydwen.gg/zenless/characters/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zzz-accent underline underline-offset-2 hover:text-zzz-text"
            >
              Prydwen
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
