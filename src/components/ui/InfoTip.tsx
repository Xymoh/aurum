import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface InfoTipProps {
  /** What is always visible: the badge, chip or label the detail hangs off. */
  children: ReactNode;
  /** The detail itself. Plain text lines or small markup. */
  content: ReactNode;
  className?: string;
  /** Where the panel opens. Defaults to below, aligned left. */
  align?: "left" | "right";
  /** Accessible name for the trigger when the visible text is not enough. */
  label?: string;
  /** Surface classes for the panel, so each game can use its own palette. */
  panelClassName?: string;
}

/**
 * A disclosure for the details behind a badge.
 *
 * Replaces `title` tooltips, which only mouse users ever saw. This opens on
 * hover, on keyboard focus, and on tap, and closes on Escape or a click
 * elsewhere. The trigger is a real button, so it is in the tab order and
 * announces its expanded state.
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
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
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

  const show = open || pinned;

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
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
      {show && (
        <div
          id={id}
          role="tooltip"
          className={`animate-pop-in absolute top-full z-30 mt-1.5 w-64 max-w-[80vw] rounded-lg border p-3 text-left text-xs leading-relaxed shadow-xl shadow-black/30 ${panelClassName} ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
