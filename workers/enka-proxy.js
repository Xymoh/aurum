/**
 * Cloudflare Worker that proxies Enka.Network with permissive CORS headers.
 *
 * The public CORS proxies this app falls back to are unreliable, so deploying
 * this (free tier is plenty) is the durable fix:
 *
 *   1. npx wrangler deploy workers/enka-proxy.js --name enka-proxy --compatibility-date 2024-01-01
 *   2. Build the site with VITE_ENKA_PROXY=https://enka-proxy.<subdomain>.workers.dev/
 *      (the app appends ?uid=<uid>; a `{uid}` or `{url}` placeholder also works)
 *
 * GET /?uid=707023973          ->  Genshin showcase JSON
 * GET /?uid=700600838&game=hsr ->  Honkai: Star Rail showcase JSON
 * GET /?uid=1300064261&game=zzz -> Zenless Zone Zero showcase JSON
 */

const ENKA_BASE = {
  gi: "https://enka.network/api/uid",
  hsr: "https://enka.network/api/hsr/uid",
  zzz: "https://enka.network/api/zzz/uid",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const params = new URL(request.url).searchParams;
    const uid = params.get("uid");
    const gameParam = params.get("game");
    const game = gameParam === "hsr" || gameParam === "zzz" ? gameParam : "gi";
    if (!uid || !/^[1-9]\d{8,9}$/.test(uid)) {
      return json({ error: "Invalid UID. Must be 9 or 10 digits starting with 1-9." }, 400);
    }

    const upstream = await fetch(`${ENKA_BASE[game]}/${uid}`, {
      headers: { "User-Agent": "GenshinArtScore/1.0", Accept: "application/json" },
      // Enka asks for a few minutes of caching; this also softens rate limits.
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!upstream.ok) {
      return json({ error: `Enka.Network returned status ${upstream.status}.` }, upstream.status);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  },
};
