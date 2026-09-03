import { Link } from "react-router-dom";
import { GAMES } from "./registry";
import { ThemeToggle } from "../components/ui/ThemeToggle";

/**
 * The root landing page: pick a game, then that game's scorer takes over with
 * its own look. Once inside, the rail on the left switches games without
 * coming back here.
 */
export function GamePickerPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-dark-bg px-4 py-16 text-dark-text">
      {/* Two soft washes, one per game's accent, so the empty page has some
          depth without a hero image it would need to license. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(50% 45% at 15% 30%, color-mix(in srgb, #d4a853 14%, transparent), transparent 70%), radial-gradient(50% 45% at 50% 80%, color-mix(in srgb, #5eead4 12%, transparent), transparent 70%), radial-gradient(50% 45% at 85% 25%, color-mix(in srgb, #d4ff00 10%, transparent), transparent 70%)",
        }}
      />

      <div className="absolute right-4 top-4">
        <ThemeToggle className="text-dark-muted hover:bg-dark-border/40 hover:text-dark-text" />
      </div>

      <div className="relative w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-teal-200 to-sky-400 bg-clip-text text-transparent">
            Aurum
          </span>
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.28em] text-dark-muted">
          Gear scoring for gacha games
        </p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-dark-muted">
          Paste a UID and find out which pieces are worth investing in, which are dead weight, and
          what a reroll is actually likely to buy you.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {GAMES.map((game) => {
            const planned = game.status === "planned";
            const card = (
              <>
                {/* The icon again, huge and blurred, as the tile's own backdrop. */}
                <img
                  src={game.icon}
                  alt=""
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-300 ${
                    planned ? "" : "group-hover:opacity-25"
                  }`}
                />
                <img
                  src={game.icon}
                  alt=""
                  width={80}
                  height={80}
                  className={`relative rounded-full transition-transform duration-300 ${
                    planned ? "opacity-40 grayscale" : "group-hover:scale-105"
                  }`}
                  style={{ boxShadow: `0 0 0 3px ${game.accent}44, 0 12px 32px -12px ${game.accent}66` }}
                />
                <div className="relative mt-4 text-center">
                  <h2 className="text-lg font-semibold text-dark-text">{game.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-dark-muted">{game.tagline}</p>
                  {planned ? (
                    <span className="mt-3 inline-block rounded-full border border-dark-border px-2 py-0.5 text-xs uppercase tracking-wider text-dark-muted">
                      Coming soon
                    </span>
                  ) : (
                    <span
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-0.5"
                      style={{ color: game.accentToken }}
                    >
                      Open scorer
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  )}
                </div>
              </>
            );

            const shell =
              "group relative flex flex-col items-center overflow-hidden rounded-2xl border bg-dark-card/60 p-7 backdrop-blur transition-all duration-300";

            return planned ? (
              <div
                key={game.id}
                className={`${shell} cursor-not-allowed border-dark-border/60`}
                aria-disabled="true"
              >
                {card}
              </div>
            ) : (
              <Link
                key={game.id}
                to={game.path}
                className={`${shell} border-dark-border no-underline hover:-translate-y-0.5 hover:bg-dark-card`}
                style={{ borderColor: `${game.accent}44` }}
              >
                {card}
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-dark-muted">
          Fan-made and not affiliated with HoYoverse. Showcase data from Enka.Network.
        </p>
      </div>
    </div>
  );
}
