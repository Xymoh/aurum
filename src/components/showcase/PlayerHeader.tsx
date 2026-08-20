import { useCallback, useState } from "react";
import { UserIcon, ClipboardIcon } from "../ui/icons";

interface PlayerHeaderProps {
  uid: string;
  playerInfo: {
    nickname: string;
    level: number;
    worldLevel: number;
    avatarIcon: string;
    signature: string;
  };
  characterCount: number;
  onRefresh: () => void;
  lastUpdated?: number;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ENKA_UI_BASE = "https://enka.network/ui";

/**
 * The player's chosen profile picture, with a fallback for every way it can be
 * unavailable: a picture from a patch newer than our bundled id→icon table, an
 * account with none set, or the image itself failing to load. Rather than a
 * generic silhouette - which reads as "broken" - we show the player's initial,
 * the way most apps render a missing avatar. We deliberately don't substitute a
 * showcased character's portrait: that would display someone the player didn't
 * choose, which is worse than admitting we don't know.
 */
function PlayerAvatar({ iconName, nickname }: { iconName: string; nickname: string }) {
  const [failed, setFailed] = useState(false);

  const url = iconName ? `${ENKA_UI_BASE}/${iconName}.png` : null;
  // Split by code point so emoji and CJK nicknames don't get cut mid-character.
  const initial = Array.from(nickname.trim())[0] ?? "";

  return (
    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-border text-dark-muted icon-dark-bg">
      {url && !failed ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          /* Above the fold and tiny - deferring it only delays the header. */
          onError={() => setFailed(true)}
        />
      ) : initial ? (
        <span
          className="select-none text-base sm:text-lg font-semibold text-dark-text/80"
          aria-hidden="true"
        >
          {initial}
        </span>
      ) : (
        <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      )}
    </div>
  );
}

export function PlayerHeader({ uid, playerInfo, characterCount, onRefresh, lastUpdated }: PlayerHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  }, [onRefresh]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard API not available
    }
  }, []);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card px-4 py-3 sm:px-5 sm:py-4">
      {/* Top row: avatar + name + UID */}
      <div className="flex items-center gap-3">
        <PlayerAvatar
          iconName={playerInfo.avatarIcon}
          nickname={playerInfo.nickname}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="truncate text-base font-semibold text-dark-text">{playerInfo.nickname}</h2>
            <span className="rounded-md bg-dark-border/50 px-2 py-0.5 text-[11px] font-mono text-dark-muted">
              {uid}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-dark-muted flex-wrap">
            <span>AR {playerInfo.level}</span>
            {playerInfo.worldLevel > 0 && (
              <>
                <span>·</span>
                <span>WL {playerInfo.worldLevel}</span>
              </>
            )}
            <span>·</span>
            <span>{characterCount} chars</span>
            {lastUpdated && lastUpdated > 0 && (
              <>
                <span>·</span>
                <span>{formatTimeAgo(lastUpdated)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: actions */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dark-border/40">
        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-dark-muted hover:bg-dark-border/40 hover:text-dark-text transition-colors"
          title="Copy shareable URL"
        >
          <ClipboardIcon className="w-3 h-3" /> Share
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-dark-bg hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isRefreshing ? "animate-spin" : ""}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}
