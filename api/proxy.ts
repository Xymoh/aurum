/**
 * Vercel Edge Function - proxies requests to Enka.Network to avoid CORS restrictions.
 *
 * GET /api/proxy?uid=700600838
 *
 * Responds with:
 *   { success: true, data: <EnkaResponse> }
 * or
 *   { success: false, error: "<message>" }
 */

const ENKA_API_BASE = "https://enka.network/api/uid";

interface ProxyResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");

  // CORS headers
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" } satisfies ProxyResponse),
      { status: 405, headers },
    );
  }

  if (!uid || !/^[1-9]\d{8}$/.test(uid)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid UID. Must be exactly 9 digits starting with 1-9.",
      } satisfies ProxyResponse),
      { status: 400, headers },
    );
  }

  try {
    const enkaResponse = await fetch(`${ENKA_API_BASE}/${uid}`, {
      headers: {
        "User-Agent": "GenshinArtScore/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!enkaResponse.ok) {
      const status = enkaResponse.status;

      if (status === 400) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "This UID could not be found. The player may not exist or their showcase is not public.",
          } satisfies ProxyResponse),
          { status: 404, headers },
        );
      }

      if (status === 424) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Enka.Network is currently undergoing maintenance. Please try again later.",
          } satisfies ProxyResponse),
          { status: 503, headers },
        );
      }

      if (status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limited by Enka.Network. Please wait a moment and try again.",
          } satisfies ProxyResponse),
          { status: 429, headers },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: `Enka.Network returned status ${status}. Please try again later.`,
        } satisfies ProxyResponse),
        { status: 502, headers },
      );
    }

    const data = await enkaResponse.json();

    return new Response(
      JSON.stringify({ success: true, data } satisfies ProxyResponse),
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error connecting to Enka.Network.";
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies ProxyResponse),
      { status: 502, headers },
    );
  }
}

export const config = {
  runtime: "edge",
};
