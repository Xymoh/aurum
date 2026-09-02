import { Link } from "react-router-dom";
import { GAMES } from "./registry";

/**
 * The root landing page: pick a game, then that game's scorer takes over with
 * its own look. Once inside, the rail on the left switches games without
 * coming back here.
 */
export function GamePickerPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080d] px-4 py-16 text-zinc-200">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-amber-300 via-teal-200 to-sky-400 bg-clip-text text-transparent">
            Aurum
          </span>
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-zinc-500">
          Gear scoring for gacha games
        </p>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
          Paste a UID and find out which pieces are worth investing in, which are dead weight, and
          what a reroll is actually likely to buy you.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {GAMES.map((game) => {
            const planned = game.status === "planned";
            const card = (
              <>
                <img
                  src={game.icon}
                  alt=""
                  width={72}
                  height={72}
                  className={`rounded-full transition-transform duration-200 ${
                    planned ? "opacity-40 grayscale" : "group-hover:scale-105"
                  }`}
                  style={{ boxShadow: `0 0 0 2px ${game.accent}33` }}
                />
                <div className="mt-3 text-center">
                  <h2 className="text-base font-semibold text-zinc-100">{game.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{game.tagline}</p>
                  {planned && (
                    <span className="mt-2 inline-block rounded-full border border-zinc-700 px-2 py-0.5 text-xs uppercase tracking-wider text-zinc-500">
                      Coming soon
                    </span>
                  )}
                </div>
              </>
            );

            const shell =
              "group flex flex-col items-center rounded-2xl border bg-white/[0.02] p-6 transition-colors";

            return planned ? (
              <div
                key={game.id}
                className={`${shell} cursor-not-allowed border-zinc-800/60`}
                aria-disabled="true"
              >
                {card}
              </div>
            ) : (
              <Link
                key={game.id}
                to={game.path}
                className={`${shell} border-zinc-800 no-underline hover:bg-white/[0.05]`}
                style={{ borderColor: `${game.accent}33` }}
              >
                {card}
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-zinc-600">
          Fan-made and not affiliated with HoYoverse. Showcase data from Enka.Network.
        </p>
      </div>
    </div>
  );
}
