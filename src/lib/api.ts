import type { EnkaResponse } from "../types/enka";

// Enka.Network does NOT allow CORS from browsers.
// In development, the Vite dev server proxies /api/proxy to Enka.
// In production (GitHub Pages) there is no backend, so requests go through a
// public CORS proxy. Those services come and go (corsproxy.io started
// answering 403 "keyless_legacy_url" to anonymous requests), so we try a list
// of them in order and use the first one that actually returns Enka data.

const ENKA_API_BASE = "https://enka.network/api/uid";

interface CorsProxy {
  /** Builds the proxy URL for a given upstream URL. */
  url: (target: string) => string;
  /** Extracts the Enka payload from the proxy's response body. */
  extract: (body: string) => unknown;
}

const passthrough = (body: string): unknown => JSON.parse(body);

/** Proxies that wrap the upstream body in { contents: "<json string>" }. */
const unwrapContents = (body: string): unknown => {
  const wrapper = JSON.parse(body) as { contents?: string };
  if (typeof wrapper.contents !== "string") {
    throw new Error("Unexpected proxy response shape.");
  }
  return JSON.parse(wrapper.contents);
};

/**
 * Optional self-hosted proxy, configured at build time via VITE_ENKA_PROXY.
 * The template may contain `{uid}` (substituted with the player UID) or
 * `{url}` (substituted with the URL-encoded Enka endpoint). Anything it
 * returns is expected to be the raw Enka JSON. See workers/enka-proxy.js.
 */
function customProxy(): CorsProxy | null {
  const template = import.meta.env.VITE_ENKA_PROXY as string | undefined;
  if (!template) return null;

  return {
    url: (target) => {
      const uid = target.slice(target.lastIndexOf("/") + 1);
      if (template.includes("{uid}") || template.includes("{url}")) {
        return template
          .replace("{uid}", encodeURIComponent(uid))
          .replace("{url}", encodeURIComponent(target));
      }
      return `${template}${template.includes("?") ? "&" : "?"}uid=${encodeURIComponent(uid)}`;
    },
    extract: passthrough,
  };
}

const PUBLIC_PROXIES: CorsProxy[] = [
  {
    url: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    extract: passthrough,
  },
  {
    url: (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
    extract: passthrough,
  },
  {
    url: (target) => `https://api.cors.lol/?url=${encodeURIComponent(target)}`,
    extract: passthrough,
  },
  {
    url: (target) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
    extract: unwrapContents,
  },
];

// The free proxies are individually unreliable (they routinely answer 408/429
// or time out on the Enka leg), so the whole list gets a second pass before we
// give up.
const PROXY_PASSES = 2;

const NOT_FOUND_MESSAGE =
  "This UID could not be found. The player may not exist or their showcase is not public.";
const MAINTENANCE_MESSAGE =
  "Enka.Network is currently undergoing maintenance. Please try again later.";
const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a moment and try again.";
const UNAVAILABLE_MESSAGE =
  "Could not reach Enka.Network right now. Please try again in a moment.";

export interface ProxyResponse {
  success: boolean;
  data?: EnkaResponse;
  error?: string;
}

/** Thrown when the upstream answer is final — retrying another proxy is pointless. */
class TerminalError extends Error {}

const PER_ATTEMPT_TIMEOUT = 10_000;

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

async function fetchViaDevProxy(uid: string): Promise<EnkaResponse> {
  const response = await fetchWithTimeout(`/api/proxy?uid=${encodeURIComponent(uid)}`);
  const json = (await response.json().catch(() => null)) as ProxyResponse | null;

  if (!response.ok || !json?.success || !json.data) {
    throw new Error(json?.error ?? NOT_FOUND_MESSAGE);
  }
  return json.data;
}

async function fetchViaCorsProxy(proxy: CorsProxy, uid: string): Promise<EnkaResponse> {
  const response = await fetchWithTimeout(proxy.url(`${ENKA_API_BASE}/${uid}`));

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

  const data = proxy.extract(await response.text()) as EnkaResponse;
  if (!data || typeof data !== "object" || !data.playerInfo) {
    throw new Error("Proxy did not return Enka data.");
  }
  return data;
}

/**
 * Fetches Genshin character showcase data.
 * - In development: uses the Vite dev server proxy at /api/proxy
 * - In production: walks a list of CORS proxies until one succeeds
 */
export async function fetchShowcase(uid: string): Promise<EnkaResponse> {
  if (import.meta.env.DEV) {
    try {
      return await fetchViaDevProxy(uid);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  const custom = customProxy();
  const proxies = custom ? [custom, ...PUBLIC_PROXIES] : PUBLIC_PROXIES;

  let lastError: unknown;
  let rateLimited = false;

  for (let pass = 0; pass < PROXY_PASSES; pass++) {
    for (const proxy of proxies) {
      try {
        return await fetchViaCorsProxy(proxy, uid);
      } catch (err) {
        if (err instanceof TerminalError) {
          throw new Error(err.message);
        }
        if (err instanceof Error && /status 429/.test(err.message)) {
          rateLimited = true;
        }
        lastError = err;
      }
    }
  }

  if (rateLimited) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }
  throw normalizeError(lastError, UNAVAILABLE_MESSAGE);
}

function normalizeError(err: unknown, fallback?: string): Error {
  if (err instanceof DOMException && err.name === "AbortError") {
    return new Error("Request timed out. Please check your connection and try again.");
  }
  if (fallback) {
    return new Error(fallback);
  }
  return err instanceof Error ? err : new Error(UNAVAILABLE_MESSAGE);
}
