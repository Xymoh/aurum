import type { EnkaResponse } from "../types/enka";
import { fetchFromEnka } from "./enkaProxy";
import { ShowcaseError } from "./showcaseError";

/**
 * Fetches Genshin character showcase data.
 *
 * The transport (dev proxy, self-hosted worker, public CORS proxy fallback
 * chain) lives in ./enkaProxy so the HSR scorer shares one implementation.
 */
export async function fetchShowcase(uid: string): Promise<EnkaResponse> {
  const data = await fetchFromEnka<EnkaResponse>(
    uid,
    "gi",
    // playerInfo is the field that separates a real showcase from a proxy
    // error page that happened to parse as JSON.
    (d) => !!d && typeof d === "object" && "playerInfo" in d,
  );
  if (!data.playerInfo) throw new ShowcaseError("notFound");
  return data;
}
