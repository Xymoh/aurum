import { useCallback, useEffect, useState } from "react";
import { UserIcon, ClipboardIcon, CheckIcon } from "../ui/icons";
import { useI18n } from "../../i18n";

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

type Translate = ReturnType<typeof useI18n>["t"];

function formatTimeAgo(timestamp: number, t: Translate): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t("player", "justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("player", "minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("player", "hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  return t("player", "daysAgo", { n: days });
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
    <div className="icon-dark-bg flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-border text-dark-muted ring-2 ring-accent/30 sm:h-14 sm:w-14">
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
          className="select-none text-base font-semibold text-dark-text/80 sm:text-lg"
          aria-hidden="true"
        >
          {initial}
        </span>
      ) : (
        <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
    </div>
  );
}

/**
 * Share button with feedback: the copy used to happen silently, so nothing
 * told you it worked. A two-second "Link copied" state does.
 */
function ShareButton() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Clipboard API not available
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopyUrl}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dark-border px-3 text-sm font-medium text-dark-muted transition-colors hover:border-accent/50 hover:text-dark-text"
      aria-live="polite"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-verdict-high" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      {copied ? t("showcase", "copied") : t("player", "share")}
    </button>
  );
}

export function PlayerHeader({ uid, playerInfo, characterCount, onRefresh, lastUpdated }: PlayerHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useI18n();

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  }, [onRefresh]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dark-border bg-dark-card px-4 py-3 sm:gap-4 sm:px-5">
      <PlayerAvatar iconName={playerInfo.avatarIcon} nickname={playerInfo.nickname} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold text-dark-text">{playerInfo.nickname}</h1>
          <span className="rounded-md bg-dark-border/50 px-2 py-0.5 font-mono text-sm text-dark-muted">
            {uid}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-dark-muted">
          <span>{t("player", "ar", { level: playerInfo.level })}</span>
          {playerInfo.worldLevel > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("player", "wl", { level: playerInfo.worldLevel })}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{t("player", "chars", { count: characterCount })}</span>
          {lastUpdated && lastUpdated > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatTimeAgo(lastUpdated, t)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <ShareButton />
        <div className="flex-1 sm:hidden" />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-dark-bg transition-all hover:opacity-90 disabled:opacity-50"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isRefreshing ? "animate-spin" : ""}
            aria-hidden="true"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {t("player", "refresh")}
        </button>
      </div>
    </div>
  );
}
