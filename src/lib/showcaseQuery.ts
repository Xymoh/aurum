/**
 * Query settings the three showcase hooks share.
 *
 * Enka tells every client how long its answer stays valid (`ttl`, in
 * seconds; 60 for a Genshin profile). Refetching inside that window returns
 * the same bytes from Enka's cache and spends a request from a budget the
 * whole site shares, so the data is treated as fresh for exactly that long
 * and a Refresh inside it is a no-op the header can explain.
 */

import type { Query } from "@tanstack/react-query";

export { showcaseRetry } from "./showcaseError";

/** Enka's default when a payload carries no ttl. */
export const DEFAULT_TTL_SECONDS = 60;

interface WithTtl {
  ttl?: number;
}

/** staleTime as a function of the query, reading the ttl off the data. */
export function staleTimeFromTtl<T extends WithTtl>(query: Query<T, Error>): number {
  return (query.state.data?.ttl ?? DEFAULT_TTL_SECONDS) * 1000;
}

/** The moment the loaded data stops being fresh, or 0 with nothing loaded. */
export function freshUntil(dataUpdatedAt: number, data: WithTtl | undefined): number {
  if (!dataUpdatedAt || !data) return 0;
  return dataUpdatedAt + (data.ttl ?? DEFAULT_TTL_SECONDS) * 1000;
}
