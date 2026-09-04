import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface InfoTipProps {
  /** What is always visible: the badge, chip or label the detail hangs off. */
  children: ReactNode;
  /** The detail itself. Plain text lines or small markup. */
  content: ReactNode;
  className?: string;
  /** Which edge the panel lines up with. Defaults to the trigger's left. */
  align?: "left" | "right";
  /** Accessible name for the trigger when the visible text is not enough. */
  label?: string;
  /** Surface classes for the panel, so each game can use its own palette. */
  panelClassName?: string;
}

/** Space between the trigger and the panel. */
const GAP = 6;
/** Space kept clear of the viewport edges. */
const MARGIN = 8;
/** Long enough for the pointer to cross the gap into the panel. */
const CLOSE_DELAY = 120;

interface Placement {
  top: number;
  left: number;
  maxHeight: number;
}

/**
 * A disclosure for the details behind a badge.
 *
 * Replaces `title` tooltips, which only mouse users ever saw. This opens on
 * hover, on keyboard focus, and on tap, and closes on Escape or a click
 * elsewhere. The trigger is a real button, so it is in the tab order and
 * announces its expanded state.
 *
 * The panel is rendered into the body rather than next to its trigger. Two
 * ancestors clip it otherwise, and neither can give that up: the expand
 * animation runs a grid row from 0fr to 1fr and needs overflow hidden to fold
 * against, and the character card hides overflow to mask the splash art. An
 * absolutely positioned panel near the bottom of a card was cut off halfway
 * through its text. Being in the body puts it outside both, so placement is
 * measured from the trigger instead: it opens below where there is room,
 * flips above where there is not, and scrolls inside itself when neither side
 * can hold it.
 */
export function InfoTip({
  children,
  content,
  className = "",
  align = "left",
  label,
  panelClassName = "border-dark-border bg-dark-card text-dark-text",
}: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [place, setPlace] = useState<Placement | null>(null);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const show = open || pinned;

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Hover has to survive the gap between trigger and panel. The panel is not
  // a descendant of the trigger any more, so leaving one to reach the other
  // would otherwise close it before the pointer arrives.
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // The panel counts as inside, even though it lives in the body.
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setPinned(false);
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  useLayoutEffect(() => {
    if (!show) {
      setPlace(null);
      return;
    }
    const measure = () => {
      const trigger = rootRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const t = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = panel.offsetWidth;
      // scrollHeight is the full content height even once a cap is applied,
      // so re-measuring never traps the panel at a previous size.
      const height = panel.scrollHeight;

      let left = align === "right" ? t.right - width : t.left;
      left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - width - MARGIN));

      const below = vh - t.bottom - GAP - MARGIN;
      const above = t.top - GAP - MARGIN;

      if (height <= below) {
        setPlace({ top: t.bottom + GAP, left, maxHeight: below });
      } else if (height <= above) {
        setPlace({ top: t.top - GAP - height, left, maxHeight: above });
      } else if (below >= above) {
        setPlace({ top: t.bottom + GAP, left, maxHeight: Math.max(80, below) });
      } else {
        const maxHeight = Math.max(80, above);
        setPlace({ top: Math.max(MARGIN, t.top - GAP - maxHeight), left, maxHeight });
      }
    };

    measure();
    // Capture, so scrolling any ancestor keeps the panel on its trigger.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [show, align, content]);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={show}
        aria-controls={id}
        aria-label={label}
        onClick={() => {
          setPinned((p) => !p);
          setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="block w-full cursor-help rounded text-left"
      >
        {children}
      </button>
      {show &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            ref={panelRef}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{
              top: place?.top ?? 0,
              left: place?.left ?? 0,
              maxHeight: place?.maxHeight,
              // Hidden for the frame it takes to measure, so it is never seen
              // in the corner before it lands on its trigger.
              visibility: place ? "visible" : "hidden",
            }}
            className={`fixed z-50 w-64 max-w-[calc(100vw-16px)] overflow-y-auto overscroll-contain rounded-lg border p-3 text-left text-xs leading-relaxed shadow-xl shadow-black/30 ${
              place ? "animate-pop-in" : ""
            } ${panelClassName}`}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
