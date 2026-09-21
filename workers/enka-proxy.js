/**
 * Cloudflare Worker that relays Enka.Network for the site, with CORS headers
 * the browser needs and Enka does not send.
 *
 *   1. Deployed by .github/workflows/deploy-worker.yml on push to main, or by
 *      hand: npx wrangler deploy --config workers/wrangler.toml
 *   2. Build the site with VITE_ENKA_PROXY=https://enka-proxy.<subdomain>.workers.dev/
 *      (the app appends ?uid=<uid>; a `{uid}` or `{url}` placeholder also works)
 *
 * GET /?uid=707023973          ->  Genshin showcase JSON
 * GET /?uid=700600838&game=hsr ->  Honkai: Star Rail showcase JSON
 * GET /?uid=1300064261&game=zzz -> Zenless Zone Zero showcase JSON
 *
 * Only the site's own origin is served. Anything else would make this a free
 * Enka relay for whoever found the URL, spending both the Workers quota and
 * the rate budget Enka extends to this user agent. Set ALLOWED_ORIGINS (a
 * comma-separated list) as a Worker variable to change the list; it defaults
 * to the GitHub Pages origin.
 *
 * Requests are also capped per client address. The counter lives in the
 * isolate's memory, so it resets whenever Cloudflare recycles the Worker and
 * is not shared between data centres. That is enough to blunt a script
 * enumerating UIDs, which is the abuse this guards against; it is not an
 * accounting system.
 */

const ENKA_BASE = {
  gi: "https://enka.network/api/uid",
  hsr: "https://enka.network/api/hsr/uid",
  zzz: "https://enka.network/api/zzz/uid",
};

const DEFAULT_ORIGINS = ["https://xymoh.github.io"];

/** Enka asks every client to identify itself and say where to complain. */
const USER_AGENT = "Aurum/0.1 (+https://github.com/Xymoh/aurum)";

/** How long Enka's answer is cached at the edge. Matches its own ttl for a profile. */
const CACHE_SECONDS = 60;

const UPSTREAM_TIMEOUT_MS = 8000;

const RATE_LIMIT = { requests: 30, windowMs: 60_000 };
const hits = new Map();

function allowedOrigins(env) {
  const configured = env && typeof env.ALLOWED_ORIGINS === "string" ? env.ALLOWED_ORIGINS : "";
  const list = configured
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ORIGINS;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    Vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT.windowMs) {
    hits.set(ip, { start: now, count: 1 });
    // Keep the map from growing without bound between recycles.
    if (hits.size > 10_000) {
      for (const [key, value] of hits) if (now - value.start > RATE_LIMIT.windowMs) hits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.requests;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = allowedOrigins(env);
    // A request with no Origin header is not a browser page: a curl, a
    // script, or a crawler. There is nothing to relay for those.
    if (!allowed.includes(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (rateLimited(ip)) {
      return json({ error: "Too many requests. Please wait a moment and try again." }, 429, origin);
    }

    const params = new URL(request.url).searchParams;
    const uid = params.get("uid");
    const gameParam = params.get("game");
    const game = gameParam === "hsr" || gameParam === "zzz" ? gameParam : "gi";
    // Genshin and Star Rail UIDs are 9 digits (Genshin's newest Asia
    // accounts 10); Zenless runs from 8 on CN to 10 on Asia.
    if (!uid || !/^[1-9]\d{7,9}$/.test(uid)) {
      return json({ error: "Invalid UID. Must be 8 to 10 digits starting with 1-9." }, 400, origin);
    }

    let upstream;
    try {
      upstream = await fetch(`${ENKA_BASE[game]}/${uid}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
      });
    } catch (err) {
      const timedOut = err && err.name === "TimeoutError";
      return json({ error: timedOut ? "Enka.Network did not answer in time." : "Could not reach Enka.Network." }, timedOut ? 504 : 502, origin);
    }

    if (!upstream.ok) {
      return json({ error: `Enka.Network returned status ${upstream.status}.` }, upstream.status, origin);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      },
    });
  },
};
