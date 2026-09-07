import { useState, type MouseEvent } from "react";
import { useI18n } from "../../i18n";
import type { ShareCardModel } from "./model";
import { renderShareCard, shareCardFilename } from "./render";

type State = "idle" | "working" | "error";

interface ShareCardButtonProps {
  /**
   * Builds the model on click rather than on render. Flattening a build walks
   * every piece, and a twelve-character showcase would pay that twelve times
   * over for a button most visitors never press.
   */
  build: () => ShareCardModel;
  className?: string;
}

/**
 * Renders the character's card and hands it to the browser as a download.
 *
 * Everything happens on the client: the canvas is drawn here, encoded here,
 * and released here. The site stays a static build with no image service
 * behind it, which is what lets it live on GitHub Pages.
 */
export function ShareCardButton({ build, className = "" }: ShareCardButtonProps) {
  const { t } = useI18n();
  const [state, setState] = useState<State>("idle");

  const save = async (event: MouseEvent) => {
    // The panels put this inside a header that expands on click; without this
    // saving a card would also fold the character away underneath it.
    event.stopPropagation();
    setState("working");
    try {
      const model = build();
      const blob = await renderShareCard(model);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = shareCardFilename(model);
      link.click();
      // Revoked on the next tick: Firefox cancels an in-flight download if
      // the object URL is released in the same frame as the click.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const label =
    state === "working" ? t("shareCard", "working")
    : state === "error" ? t("shareCard", "failed")
    : t("shareCard", "save");

  return (
    <button
      type="button"
      onClick={save}
      disabled={state === "working"}
      title={t("shareCard", "hint")}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${className}`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
  );
}
