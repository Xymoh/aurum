/**
 * The ways a rendered card can leave the browser.
 *
 * None of these talk to a server. X has a public intent URL; Discord and
 * Instagram have nothing of the kind on the web, so those buttons put the
 * image where the app can take it from - the clipboard, a download, or the
 * phone's own share sheet - and tell the reader what to do next. Every
 * helper reports success as a boolean rather than throwing, so the dialog
 * can pick a fallback instead of showing an error for a permission prompt
 * the reader declined.
 */

/** Short enough to read in a post, and stays clear of X's own counter. */
const X_INTENT = "https://x.com/intent/post";

/** The current page, without any in-page anchor. */
export function currentPageLink(): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}`;
}

/**
 * The current page opened straight to one character: `?c=<id>` is what the
 * showcase pages read on load to expand and scroll to them. Without an id
 * it is the plain page link.
 */
export function characterLink(characterId?: string): string {
  const url = new URL(window.location.href);
  url.hash = "";
  if (characterId) url.searchParams.set("c", characterId);
  return url.toString();
}

export function xIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `${X_INTENT}?${params.toString()}`;
}

/**
 * Whether the browser can put a PNG on the clipboard. Firefox gained
 * ClipboardItem in 127; older builds land on the download path instead.
 */
export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard?.write === "function" &&
    // Safari needs the type check; without it a PNG write throws.
    (typeof ClipboardItem.supports !== "function" || ClipboardItem.supports("image/png"))
  );
}

/**
 * Not awaited before anything that needs the click's user activation. Safari
 * drops the activation the moment an await resolves, so callers open windows
 * first and read this promise afterwards.
 */
export async function copyImage(blob: Blob): Promise<boolean> {
  if (!canCopyImage()) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyTextLegacy(text);
  }
}

/**
 * The pre-Clipboard-API route, for embedded browsers and webviews where the
 * async API is present but the permission is silently refused. A link is
 * the one thing a share sheet must always be able to hand over.
 */
function copyTextLegacy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Revoked on the next tick: Firefox cancels an in-flight download if the
  // object URL is released in the same frame as the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Whether the phone's share sheet can take the image itself, which is the
 * only route into Instagram and the nicest one into Discord on a phone.
 *
 * Deliberately phones only. Desktop Chrome on Windows also answers yes here
 * and opens the OS share pane, which lists mail and nearby devices and no
 * chat app anyone posts a build card to; the clipboard and download paths
 * are the useful ones there.
 */
export function canShareFile(file: File): boolean {
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return false;
  return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
}

export type NativeShareResult = "shared" | "cancelled" | "failed";

export async function shareFile(file: File, title: string, text: string): Promise<NativeShareResult> {
  try {
    await navigator.share({ files: [file], title, text });
    return "shared";
  } catch (error) {
    // The reader closing the sheet is not a failure and gets no message.
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    return "failed";
  }
}
