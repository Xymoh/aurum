/**
 * Shared transport for Enka.Network, used by the Genshin, HSR and ZZZ scorers.
 *
 * Enka does NOT send CORS headers, so a browser cannot call it directly.
 * In development the Vite dev server proxies /api/proxy. In production
 * (GitHub Pages) requests go through the self-hosted Cloudflare Worker in
 * workers/enka-proxy.js, configured at build time via VITE_ENKA_PROXY. A
 * single public CORS proxy is kept as a last resort for builds without one;
 * it receives the user's UID, so it is only tried after the worker fails.
 */

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

interface CorsProxy {
  /** Builds the proxy URL for a given upstream URL. */
  url: (target: string) => string;
  /** Extracts the Enka payload from the proxy's response body. */
  extract: (body: string) => unknown;
}

const passthrough = (body: string): unknown => JSON.parse(body);

/**
 * Optional self-hosted proxy, configured at build time via VITE_ENKA_PROXY.
 * The template may contain `{uid}` or `{url}`; without either, `?uid=<uid>`
 * is appended. The game is always passed too, so one worker serves both.
 * See workers/enka-proxy.js.
 */
function customProxy(uid: string, game: EnkaGame): CorsProxy | null {
  const template = import.meta.env.VITE_ENKA_PROXY as string | undefined;
  if (!template) return null;

  return {
    url: (target) => {
      const base =
        template.includes("{uid}") || template.includes("{url}")
          ? template.replace("{uid}", encodeURIComponent(uid)).replace("{url}", encodeURIComponent(target))
          : `${template}${template.includes("?") ? "&" : "?"}uid=${encodeURIComponent(uid)}`;
      // Genshin stays on the bare URL so an older deployed worker, which
      // predates the game parameter, keeps working unchanged.
      return game === "gi" ? base : `${base}${base.includes("?") ? "&" : "?"}game=${game}`;
    },
    extract: passthrough,
  };
}

/**
 * Last-resort fallback for builds without VITE_ENKA_PROXY. Public proxies come
 * and go without notice, so only one is kept and it is always tried last.
 */
const PUBLIC_PROXIES: CorsProxy[] = [
  {
    url: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    extract: passthrough,
  },
];

/**
 * Proxies occasionally answer 408/429 or time out on the Enka leg, so the
 * list gets a second pass before we give up.
 */
const PROXY_PASSES = 2;
const PER_ATTEMPT_TIMEOUT = 10_000;

export const NOT_FOUND_MESSAGE =
  "This UID could not be found. The player may not exist or their showcase is not public.";
const MAINTENANCE_MESSAGE =
  "Enka.Network is currently undergoing maintenance. Please try again later.";
const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a moment and try again.";
const UNAVAILABLE_MESSAGE =
  "Could not reach Enka.Network right now. Please try again in a moment.";

/** Thrown when the upstream answer is final - retrying another proxy is pointless. */
class TerminalError extends Error {}

interface DevProxyResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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

async function viaDevProxy<T>(uid: string, game: EnkaGame): Promise<T> {
  const query = `uid=${encodeURIComponent(uid)}${game === "gi" ? "" : `&game=${game}`}`;
  const response = await fetchWithTimeout(`/api/proxy?${query}`);
  const json = (await response.json().catch(() => null)) as DevProxyResponse<T> | null;

  if (!response.ok || !json?.success || !json.data) {
    throw new Error(json?.error ?? NOT_FOUND_MESSAGE);
  }
  return json.data;
}

async function viaCorsProxy<T>(
  proxy: CorsProxy,
  uid: string,
  game: EnkaGame,
  isValid: (data: unknown) => boolean,
): Promise<T> {
  const response = await fetchWithTimeout(proxy.url(enkaUrl(game, uid)));

  // Enka's own status codes are forwarded by most proxies; treat the
  // conclusive ones as final so we don't hammer every proxy in the list.
  if (response.status === 400 || response.status === 404) {
    throw new TerminalError(NOT_FOUND_MESSAGE);
  }
  if (response.status === 424) {
    throw new TerminalError(MAINTENANCE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(`Proxy returned status ${response.status}.`);
  }

  const data = proxy.extract(await response.text());
  if (!isValid(data)) {
    throw new Error("Proxy did not return Enka data.");
  }
  return data as T;
}

function normalizeError(err: unknown, fallback?: string): Error {
  if (err instanceof DOMException && err.name === "AbortError") {
    return new Error("Request timed out. Please check your connection and try again.");
  }
  if (fallback) return new Error(fallback);
  return err instanceof Error ? err : new Error(UNAVAILABLE_MESSAGE);
}

/**
 * Fetches a showcase for either game.
 *
 * `isValid` is how a proxy error page is told apart from real data: each game
 * knows a field its payload must carry, and anything without it is treated as
 * a failed attempt rather than a successful empty result.
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
      throw normalizeError(err);
    }
  }

  const custom = customProxy(uid, game);
  const proxies = custom ? [custom, ...PUBLIC_PROXIES] : PUBLIC_PROXIES;

  let lastError: unknown;
  let rateLimited = false;

  for (let pass = 0; pass < PROXY_PASSES; pass++) {
    for (const proxy of proxies) {
      try {
        return await viaCorsProxy<T>(proxy, uid, game, isValid);
      } catch (err) {
        if (err instanceof TerminalError) throw new Error(err.message);
        if (err instanceof Error && /status 429/.test(err.message)) rateLimited = true;
        lastError = err;
      }
    }
  }

  if (rateLimited) throw new Error(RATE_LIMIT_MESSAGE);
  throw normalizeError(lastError, UNAVAILABLE_MESSAGE);
}
