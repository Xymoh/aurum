import { useState, type MouseEvent } from "react";
import { useI18n } from "../../i18n";
import type { ShareCardModel } from "./model";
import { ShareDialog } from "./ShareDialog";
import { ShareIcon } from "./brandIcons";

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
 * Opens the share dialog for one character.
 *
 * The model is built here, once, and handed to the dialog as a stable value.
 * Rebuilding it on every render would give the dialog a new object each
 * time and re-render the card for nothing. Everything stays on the client:
 * the canvas is drawn in the dialog, encoded there, and released when it
 * closes, which keeps the site a static build with no image service behind
 * it.
 */
export function ShareCardButton({ build, className = "" }: ShareCardButtonProps) {
  const { t } = useI18n();
  const [model, setModel] = useState<ShareCardModel | null>(null);

  const open = (event: MouseEvent) => {
    // The panels put this beside a header that expands on click; without this
    // opening the dialog would also fold the character away underneath it.
    event.stopPropagation();
    setModel(build());
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        title={t("shareCard", "hint")}
        aria-haspopup="dialog"
        aria-expanded={model !== null}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${className}`}
      >
        <ShareIcon className="h-3.5 w-3.5" />
        {t("shareCard", "share")}
      </button>
      {model && <ShareDialog model={model} onClose={() => setModel(null)} />}
    </>
  );
}
