import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n";
import { CloseIcon } from "../../components/ui/icons";
import type { ShareCardModel, ShareGame } from "./model";
import { renderShareCard, shareCardFilename } from "./render";
import { CARD_THEME } from "./theme";
import {
  canCopyImage,
  canShareFile,
  copyImage,
  copyText,
  characterLink,
  downloadBlob,
  shareFile,
  xIntentUrl,
} from "./share";
import { DiscordLogo, DownloadIcon, InstagramLogo, LinkIcon, MoreIcon, XLogo } from "./brandIcons";

interface ShareDialogProps {
  model: ShareCardModel;
  onClose: () => void;
}

/** A rendered card, held until the dialog closes. */
interface Card {
  blob: Blob;
  url: string;
  file: File;
}

type StatusKey =
  | "statusLinkCopied"
  | "statusImageCopiedPost"
  | "statusImageCopiedDiscord"
  | "statusImageSaved"
  | "statusImageSavedPost"
  | "statusImageSavedDiscord"
  | "statusImageSavedInstagram"
  | "statusCopyFailed"
  | "statusShareFailed";

/** How long the exit animation runs before the dialog leaves the tree. */
const CLOSE_MS = 190;
/** How long a status line stays up. Long enough to read twice. */
const STATUS_MS = 3400;

/**
 * Surface classes per game. The dialog is portalled into the body, outside
 * the layout that stamps data-game, so it cannot inherit a palette and has
 * to carry its own. `data-game` is restated on the wrapper so the corner
 * language in index.css still applies to the panel and the tiles.
 */
const SKIN: Record<
  ShareGame,
  {
    panel: string;
    muted: string;
    closeHover: string;
    frame: string;
    tile: string;
    tileHover: string;
    status: string;
    accentBar: string;
  }
> = {
  genshin: {
    panel: "border-dark-border bg-dark-card text-dark-text",
    muted: "text-dark-muted",
    closeHover: "hover:bg-dark-border/40",
    frame: "border-dark-border",
    tile: "border-dark-border bg-dark-bg/60 text-dark-text",
    tileHover: "group-hover:border-accent group-hover:text-accent",
    status: "border-dark-border bg-dark-bg/90 text-dark-text",
    accentBar: "bg-accent",
  },
  hsr: {
    panel: "border-hsr-border bg-hsr-panel text-hsr-text",
    muted: "text-hsr-muted",
    closeHover: "hover:bg-hsr-fill",
    frame: "border-hsr-border",
    tile: "border-hsr-line bg-hsr-fill text-hsr-text [--panel-corner:var(--hsr-line)]",
    tileHover:
      "group-hover:border-hsr-accent group-hover:text-hsr-accent group-hover:[--panel-corner:var(--hsr-accent)]",
    status: "border-hsr-border bg-hsr-bg/90 text-hsr-text",
    accentBar: "bg-hsr-accent",
  },
  zzz: {
    panel: "border-zzz-border bg-zzz-panel text-zzz-text",
    muted: "text-zzz-muted",
    closeHover: "hover:bg-zzz-fill",
    frame: "border-zzz-border",
    tile: "border-zzz-line bg-zzz-fill text-zzz-text [--panel-corner:var(--zzz-line)]",
    tileHover:
      "group-hover:border-zzz-accent group-hover:text-zzz-accent group-hover:[--panel-corner:var(--zzz-accent)]",
    status: "border-zzz-border bg-zzz-bg/90 text-zzz-text",
    accentBar: "bg-zzz-accent",
  },
};

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * The card, full size, with a row of ways to send it somewhere.
 *
 * Modelled on the share sheet HoYoverse's web events end on: the image
 * first, then a row of targets underneath. The card is drawn once when the
 * dialog opens and held for as long as it stays up, so pressing two buttons
 * in a row does not render it twice.
 *
 * What each target does depends on where the reader is. On a phone every
 * target goes through the system share sheet with the image attached, which
 * is the only way the X and Instagram apps can be handed a picture. On a
 * desktop X has an intent URL and gets the image copied alongside it;
 * Discord and Instagram have no web hand-off at all, so they leave the image
 * on the clipboard or in the downloads and say so. The status line under
 * the row is that "say so".
 */
export function ShareDialog({ model, onClose }: ShareDialogProps) {
  const { t } = useI18n();
  const skin = SKIN[model.game];
  const wordmark = CARD_THEME[model.game].wordmark;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const [card, setCard] = useState<Card | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<{ key: StatusKey; nonce: number } | null>(null);
  const statusTimer = useRef<number | null>(null);

  // ── Render the card ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setCard(null);
    setFailed(false);
    renderShareCard(model)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        const file = new File([blob], shareCardFilename(model), { type: "image/png" });
        setCard({ blob, url, file });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [model, attempt]);

  // ── Open and close ──────────────────────────────────────────────

  const requestClose = useCallback(() => {
    setClosing((already) => {
      if (!already) window.setTimeout(onClose, CLOSE_MS);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    // The page behind must not scroll, and must not shift when its scrollbar
    // goes, so the bar's width is paid back as padding for the duration.
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      restoreFocus.current?.focus?.();
    };
  }, [requestClose]);

  useEffect(
    () => () => {
      if (statusTimer.current !== null) clearTimeout(statusTimer.current);
    },
    [],
  );

  // Tab stays inside the dialog. The page underneath is inert for as long
  // as this is up, and letting focus wander onto it would be a way out that
  // sighted readers cannot see.
  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // ── Actions ─────────────────────────────────────────────────────

  const say = (key: StatusKey) => {
    if (statusTimer.current !== null) clearTimeout(statusTimer.current);
    setStatus({ key, nonce: Date.now() });
    statusTimer.current = window.setTimeout(() => setStatus(null), STATUS_MS);
  };

  const link = characterLink(model.characterId);
  const postText =
    model.score.complete ?
      t("shareCard", "postText", {
        name: model.name,
        score: `${Math.round(model.score.value)}%`,
        grade: model.score.grade,
        site: wordmark,
      })
    : t("shareCard", "postTextPartial", { name: model.name, site: wordmark });

  const save = (c: Card, said: StatusKey) => {
    downloadBlob(c.blob, c.file.name);
    say(said);
  };

  /** True when the phone's share sheet took over, so no fallback is needed. */
  const tryNativeShare = async (c: Card): Promise<boolean> => {
    if (!canShareFile(c.file)) return false;
    const result = await shareFile(c.file, wordmark, postText);
    if (result === "failed") say("statusShareFailed");
    return result !== "failed";
  };

  const onX = (c: Card) => {
    // On a phone the share sheet can hand the X app the image itself, which
    // the web intent never can. The check is synchronous, so the fallback
    // below still runs inside the click's activation.
    if (canShareFile(c.file)) {
      void tryNativeShare(c);
      return;
    }
    // The window opens before anything is awaited: Safari treats the first
    // await as the end of the click, and a window opened after it is a popup.
    const copied = canCopyImage() ? copyImage(c.blob) : Promise.resolve(false);
    window.open(xIntentUrl(postText, link), "_blank", "noopener,noreferrer");
    copied.then((ok) => {
      if (ok) say("statusImageCopiedPost");
      else save(c, "statusImageSavedPost");
    });
  };

  const onDiscord = async (c: Card) => {
    if (await tryNativeShare(c)) return;
    if (canCopyImage() && (await copyImage(c.blob))) {
      say("statusImageCopiedDiscord");
      return;
    }
    save(c, "statusImageSavedDiscord");
  };

  const onInstagram = async (c: Card) => {
    if (await tryNativeShare(c)) return;
    save(c, "statusImageSavedInstagram");
  };

  const onCopyLink = async () => {
    say((await copyText(link)) ? "statusLinkCopied" : "statusCopyFailed");
  };

  const onMore = async (c: Card) => {
    if (!(await tryNativeShare(c))) save(c, "statusImageSaved");
  };

  const ready = card !== null;
  const showMore = card !== null && canShareFile(card.file);

  // ── Layout ──────────────────────────────────────────────────────

  return createPortal(
    <div
      data-game={model.game}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      // The trigger lives next to a panel header that expands on click, and
      // React events cross portals: without this, a press in here could
      // also fold the character away underneath.
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm ${
          closing ? "animate-overlay-out" : "animate-overlay-in"
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={`game-panel relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col border shadow-2xl shadow-black/50 outline-none ${skin.panel} ${
          closing ? "animate-dialog-out" : "animate-dialog-in"
        }`}
      >
        <div className={`absolute inset-x-0 top-0 h-[3px] ${skin.accentBar}`} aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold leading-tight">
              {t("shareCard", "title")}
            </h2>
            <p className={`mt-0.5 truncate text-sm ${skin.muted}`}>
              {model.name} · {model.level} · {model.rank}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t("shareCard", "close")}
            className={`-mr-2 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:text-current ${skin.muted} ${skin.closeHover}`}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Preview. The card is always drawn dark (see theme.ts), so the frame
            behind it is the dark ground too, whatever theme the page is in. */}
        <div className="min-h-0 overflow-y-auto px-5 sm:px-6">
          <div className={`relative aspect-video w-full overflow-hidden rounded-lg border bg-[#0f1117] ${skin.frame}`}>
            {card && (
              <img
                src={card.url}
                alt={t("shareCard", "preview", { name: model.name })}
                className="animate-pop-in block h-full w-full object-cover"
              />
            )}
            {!card && !failed && (
              <div className="skeleton absolute inset-0 flex items-center justify-center rounded-none" role="status">
                <span className="rounded-md bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {t("shareCard", "rendering")}
                </span>
              </div>
            )}
            {failed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center" role="alert">
                <p className="text-sm text-white/80">{t("shareCard", "renderFailed")}</p>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="game-panel-sm border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  {t("shareCard", "retry")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3 sm:gap-x-4">
            <Target label={t("shareCard", "actionX")} skin={skin} disabled={!ready} onClick={() => card && onX(card)}>
              <XLogo className="h-[18px] w-[18px]" />
            </Target>
            <Target
              label={t("shareCard", "actionInstagram")}
              skin={skin}
              disabled={!ready}
              onClick={() => card && onInstagram(card)}
            >
              <InstagramLogo className="h-5 w-5" />
            </Target>
            <Target
              label={t("shareCard", "actionDiscord")}
              skin={skin}
              disabled={!ready}
              onClick={() => card && onDiscord(card)}
            >
              <DiscordLogo className="h-5 w-5" />
            </Target>
            <Target
              label={t("shareCard", "actionSave")}
              skin={skin}
              disabled={!ready}
              onClick={() => card && save(card, "statusImageSaved")}
            >
              <DownloadIcon className="h-5 w-5" />
            </Target>
            <Target label={t("shareCard", "actionCopyLink")} skin={skin} onClick={onCopyLink}>
              <LinkIcon className="h-5 w-5" />
            </Target>
            {showMore && (
              <Target label={t("shareCard", "actionMore")} skin={skin} onClick={() => card && onMore(card)}>
                <MoreIcon className="h-5 w-5" />
              </Target>
            )}
          </div>

          {/* Status line. Always in the tree so screen readers pick up each
              change, and given its own row rather than hung off the bottom
              edge: the Star Rail and Zenless panels are clip-pathed, and a
              toast overlapping the edge was cut in half. */}
          <div aria-live="polite" className="mt-3 flex h-7 items-center justify-center px-4">
            {status && (
              <span
                key={status.nonce}
                className={`game-panel-sm animate-pop-in inline-block max-w-full truncate border px-3 py-1 text-xs font-semibold ${skin.status}`}
              >
                {t("shareCard", status.key)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface TargetProps {
  label: string;
  skin: (typeof SKIN)[ShareGame];
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** One entry in the action row: a tile with the label underneath. */
function Target({ label, skin, disabled = false, onClick, children }: TargetProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-[4.75rem] flex-col items-center gap-1.5 rounded-lg py-1 text-[11px] font-semibold uppercase tracking-wide transition-opacity disabled:cursor-wait disabled:opacity-40 ${skin.muted}`}
    >
      <span
        className={`game-panel-sm flex h-12 w-12 items-center justify-center border transition-[transform,border-color,color,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/30 group-active:translate-y-0 group-disabled:group-hover:translate-y-0 ${skin.tile} ${skin.tileHover}`}
      >
        {children}
      </span>
      <span className="transition-colors group-hover:text-current">{label}</span>
    </button>
  );
}
