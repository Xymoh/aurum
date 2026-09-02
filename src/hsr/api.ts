import { fetchFromEnka } from "../lib/enkaProxy";
import type { RawHsrResponse } from "./parsing";

/**
 * Fetches a Honkai: Star Rail showcase.
 *
 * Same transport as the Genshin side; only the endpoint and the validity
 * check differ. HSR wraps everything in `detailInfo` rather than `playerInfo`.
 */
export async function fetchHsrShowcase(uid: string): Promise<RawHsrResponse> {
  return fetchFromEnka<RawHsrResponse>(
    uid,
    "hsr",
    (d) => !!d && typeof d === "object" && "detailInfo" in d,
  );
}
