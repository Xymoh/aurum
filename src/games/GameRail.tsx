import { Link, useLocation } from "react-router-dom";
import { GAMES, LIVE_GAMES, type GameId } from "./registry";

/**
 * Persistent game switcher.
 *
 * On desktop it is a fixed rail down the left edge, so whichever game you are
 * in, the others are one click away without hunting through that game's own
 * navigation. On narrow screens the rail would eat too much width, so the same
 * links render as a compact row that a layout drops into its header.
 *
 * Both variants read GAMES, so a new game appears in navigation the moment it
 * is added to the registry.
 */

function GameLink({
  game,
  current,
  size,
  tooltip = true,
}: {
  game: (typeof GAMES)[number];
  current: boolean;
  size: number;
  /**
   * Off for the compact row: the tooltip is absolutely positioned past the
   * icon, which widens the document on a narrow screen even while invisible,
   * and hover means nothing on touch anyway. The aria-label still names it.
   */
  tooltip?: boolean;
}) {
  const planned = game.status === "planned";

  const inner = (
    <>
      <img
        src={game.icon}
        alt=""
        width={size}
        height={size}
        className={`rounded-full transition-all ${
          current ? "" : "opacity-45 grayscale group-hover:opacity-90 group-hover:grayscale-0"
        }`}
        style={{
          boxShadow: current ? `0 0 0 2px ${game.accent}` : undefined,
        }}
      />
      {/* Tooltip. Rendered on hover rather than as a title attribute so it
          matches the rest of the chrome instead of the OS default. */}
      {tooltip && (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-black/90 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {game.short}
          {planned && " (soon)"}
        </span>
      )}
    </>
  );

  if (planned) {
    return (
      <span
        className="group relative flex cursor-not-allowed items-center justify-center"
        aria-disabled="true"
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      to={game.path}
      aria-label={game.name}
      aria-current={current ? "page" : undefined}
      className="group relative flex items-center justify-center"
    >
      {inner}
    </Link>
  );
}

export function GameRail({ current }: { current: GameId }) {
  return (
    <nav
      aria-label="Switch game"
      className="fixed left-0 top-0 z-40 hidden h-full w-14 flex-col items-center gap-3 border-r border-white/5 bg-black/40 pt-4 backdrop-blur lg:flex"
    >
      <Link to="/" aria-label="All games" className="group relative mb-1 text-white/40 hover:text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-black/90 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          All games
        </span>
      </Link>
      {GAMES.map((game) => (
        <GameLink key={game.id} game={game} current={game.id === current} size={34} />
      ))}
    </nav>
  );
}

/** The same switcher, for headers on screens too narrow for the rail. */
export function GameSwitcherCompact({ current }: { current: GameId }) {
  const { pathname } = useLocation();
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 lg:hidden">
      {LIVE_GAMES.map((game) => (
        <GameLink
          key={game.id}
          game={game}
          current={game.id === current || pathname.startsWith(game.path)}
          size={28}
          tooltip={false}
        />
      ))}
    </div>
  );
}
