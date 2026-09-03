import { fetchFromEnka } from "../lib/enkaProxy";
import type { RawZzzResponse } from "./parsing";

/**
 * Fetches a Zenless Zone Zero showcase.
 *
 * Same transport as the other two games; only the endpoint and the validity
 * check differ. ZZZ wraps everything in `PlayerInfo`.
 */
export async function fetchZzzShowcase(uid: string): Promise<RawZzzResponse> {
  return fetchFromEnka<RawZzzResponse>(
    uid,
    "zzz",
    (d) => !!d && typeof d === "object" && "PlayerInfo" in d,
  );
}
