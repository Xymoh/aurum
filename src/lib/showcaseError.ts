/**
 * The one error type a showcase lookup can throw.
 *
 * Every failure carries a code, so the pages can translate it and decide
 * what to do next, and a `retryable` flag, so the query layer retries a
 * flaky network but never a "not found" or a rate limit. The English
 * `message` is for logs and tests; readers see the dictionary text.
 */

export type ShowcaseErrorCode =
  /** Enka answered 400 or 404: no such player, or nothing on display. */
  | "notFound"
  /** Enka answered 424: the game's API is down for maintenance. */
  | "maintenance"
  /** Enka answered 429. Asking again straight away only makes it worse. */
  | "rateLimited"
  /** The proxy or Enka could not be reached, or answered with a server error. */
  | "unavailable"
  /** No answer within the time budget. */
  | "timeout"
  /** The build has no proxy configured, so no lookup can work. */
  | "misconfigured"
  /** The UID is not one Enka could ever answer. */
  | "invalidUid";

const MESSAGES: Record<ShowcaseErrorCode, string> = {
  notFound: "This UID could not be found. The player may not exist or their showcase is not public.",
  maintenance: "Enka.Network is currently undergoing maintenance. Please try again later.",
  rateLimited: "Too many requests. Please wait a moment and try again.",
  unavailable: "Could not reach Enka.Network right now. Please try again in a moment.",
  timeout: "Request timed out. Please check your connection and try again.",
  misconfigured:
    "This build has no showcase proxy configured, so lookups are unavailable. Set VITE_ENKA_PROXY at build time (see workers/enka-proxy.js).",
  invalidUid: "That is not a valid UID.",
};

const RETRYABLE: ReadonlySet<ShowcaseErrorCode> = new Set(["unavailable", "timeout"]);

export class ShowcaseError extends Error {
  readonly code: ShowcaseErrorCode;
  readonly retryable: boolean;
  /** The HTTP status that produced it, when there was one. */
  readonly status?: number;

  constructor(code: ShowcaseErrorCode, status?: number) {
    super(MESSAGES[code]);
    this.name = "ShowcaseError";
    this.code = code;
    this.retryable = RETRYABLE.has(code);
    this.status = status;
  }
}

/** Whether a second attempt could plausibly succeed. Unknown errors count as network trouble. */
export function isRetryableError(err: unknown): boolean {
  return err instanceof ShowcaseError ? err.retryable : true;
}

/** TanStack's retry option: one more try, and only when it could help. */
export function showcaseRetry(failureCount: number, err: unknown): boolean {
  return failureCount < 1 && isRetryableError(err);
}

/** The dictionary key that describes an error, or the generic one. */
export function errorCode(err: unknown): ShowcaseErrorCode | "generic" {
  return err instanceof ShowcaseError ? err.code : "generic";
}
