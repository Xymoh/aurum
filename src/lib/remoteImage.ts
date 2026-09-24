/**
 * Where to ask again for a picture whose first fetch failed.
 *
 * The art lives on other people's CDNs, and those fail now and then for
 * reasons that have nothing to do with the file: an edge that has not
 * cached a new character yet and times out asking GitHub for it, or a
 * dropped connection. A second request nearly always works.
 *
 * jsDelivr serves the same paths from a second network under another name,
 * so a retry there also steps around a bad edge. Anything else is asked
 * again with a query string on it, so the browser makes a real request
 * rather than answering from its memory of the failure.
 */

const JSDELIVR = "https://cdn.jsdelivr.net/";
const JSDELIVR_FASTLY = "https://fastly.jsdelivr.net/";

/** The URLs worth trying after `src` has failed, in order. */
export function retryUrls(src: string): string[] {
  if (src.startsWith(JSDELIVR)) return [JSDELIVR_FASTLY + src.slice(JSDELIVR.length)];
  // A data: or blob: URL is already in memory; asking again changes nothing.
  if (/^(data|blob):/.test(src)) return [];
  return [`${src}${src.includes("?") ? "&" : "?"}retry=1`];
}
