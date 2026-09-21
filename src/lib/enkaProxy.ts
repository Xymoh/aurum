/**
 * Shared transport for Enka.Network, used by the Genshin, HSR and ZZZ scorers.
 *
 * Enka does NOT send CORS headers, so a browser cannot call it directly.
 * In development the Vite dev server proxies /api/proxy. In production
 * (GitHub Pages) requests go through the self-hosted Cloudflare Worker in
 * workers/enka-proxy.js, configured at build time via VITE_ENKA_PROXY.
 *
 * There is deliberately no public CORS proxy fallback: a request carries the
 * visitor's IP and the UID they typed, and the privacy policy promises those
 * go to our own worker and Enka.Network only. A production build without
 * VITE_ENKA_PROXY fails the lookup with a clear message instead.
 */

import { ShowcaseError } from "./showcaseError";

export type EnkaGame = "gi" | "hsr" | "zzz";

const ENKA_BASE: Record<EnkaGame, string> = {
  gi: "https://enka.network/api/uid",
  hsr: "https://enka.network/api/hsr/uid",
  zzz: "https://enka.network/api/zzz/uid",
};

/** Same shape for all three games; ZZZ 308-redirects a trailing slash away, so none is added. */
function enkaUrl(game: EnkaGame, uid: string): string {
  return `${ENKA_BASE[game]}/${uid}`;
}

/**
 * Optional self-hosted proxy, configured at build time via VITE_ENKA_PROXY.
 * The template may contain `{uid}` or `{url}`; without either, `?uid=<uid>`
 * is appended. The game is always passed too, so one worker serves all
 * three. See workers/enka-proxy.js.
 */
function proxyUrl(uid: string, game: EnkaGame): string | null {
  const template = import.meta.env.VITE_ENKA_PROXY as string | undefined;
  if (!template) return null;

  const target = enkaUrl(game, uid);
  const base =
    template.includes("{uid}") || template.includes("{url}")
      ? template.replace("{uid}", encodeURIComponent(uid)).replace("{url}", encodeURIComponent(target))
      : `${template}${template.includes("?") ? "&" : "?"}uid=${encodeURIComponent(uid)}`;
  // Genshin stays on the bare URL so an older deployed worker, which
  // predates the game parameter, keeps working unchanged.
  return game === "gi" ? base : `${base}${base.includes("?") ? "&" : "?"}game=${game}`;
}

/**
 * The worker occasionally times out on the Enka leg or answers 5xx, so a
 * retryable failure gets a second attempt before we give up. Two attempts
 * at eight seconds each keeps the worst case under twenty seconds; the old
 * budget could leave a reader staring at a skeleton for forty.
 */
const PASSES = 2;
const PER_ATTEMPT_TIMEOUT = 8_000;

/** Enka's status codes, mapped to what a reader can act on. */
function errorForStatus(status: number): ShowcaseError {
  if (status === 400 || status === 404) return new ShowcaseError("notFound", status);
  if (status === 424) return new ShowcaseError("maintenance", status);
  if (status === 429) return new ShowcaseError("rateLimited", status);
  return new ShowcaseError("unavailable", status);
}

function toShowcaseError(err: unknown): ShowcaseError {
  if (err instanceof ShowcaseError) return err;
  if (err instanceof DOMException && err.name === "AbortError") return new ShowcaseError("timeout");
  return new ShowcaseError("unavailable");
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

interface DevProxyResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * The dev plugin in vite.config.ts already maps Enka's codes onto its own
 * (404, 503 for maintenance, 429) and wraps the payload; only the status
 * matters here.
 */
async function viaDevProxy<T>(uid: string, game: EnkaGame): Promise<T> {
  const query = `uid=${encodeURIComponent(uid)}${game === "gi" ? "" : `&game=${game}`}`;
  const response = await fetchWithTimeout(`/api/proxy?${query}`);
  const json = (await response.json().catch(() => null)) as DevProxyResponse<T> | null;

  if (response.status === 503) throw new ShowcaseError("maintenance", 503);
  if (!response.ok) throw errorForStatus(response.status);
  if (!json?.success || !json.data) throw new ShowcaseError("notFound", response.status);
  return json.data;
}

async function viaWorker<T>(url: string, isValid: (data: unknown) => boolean): Promise<T> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw errorForStatus(response.status);

  const data: unknown = JSON.parse(await response.text());
  if (!isValid(data)) throw new ShowcaseError("unavailable", response.status);
  return data as T;
}

/**
 * Fetches a showcase for any of the three games.
 *
 * `isValid` is how a proxy error page is told apart from real data: each game
 * knows a field its payload must carry, and anything without it is treated as
 * a failed attempt rather than a successful empty result.
 *
 * Final answers (not found, maintenance, rate limited) are thrown at once.
 * A rate limit in particular is never retried here: Enka asks clients to
 * back off, and the query layer honours the same flag.
 */
export async function fetchFromEnka<T>(
  uid: string,
  game: EnkaGame,
  isValid: (data: unknown) => boolean,
): Promise<T> {
  if (import.meta.env.DEV) {
    try {
      return await viaDevProxy<T>(uid, game);
    } catch (err) {
      throw toShowcaseError(err);
    }
  }

  const url = proxyUrl(uid, game);
  if (!url) throw new ShowcaseError("misconfigured");

  let last: ShowcaseError | null = null;
  for (let pass = 0; pass < PASSES; pass++) {
    try {
      return await viaWorker<T>(url, isValid);
    } catch (err) {
      last = toShowcaseError(err);
      if (!last.retryable) throw last;
    }
  }
  throw last ?? new ShowcaseError("unavailable");
}
