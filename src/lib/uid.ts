/**
 * Genshin Impact UID rules.
 *
 * Nine digits for every server, plus the ten-digit UIDs that new Asia
 * accounts have carried since late 2023: those start with 18 and are served
 * by Enka like any other. The first digit is never 0.
 */
export function isValidUid(uid: string): boolean {
  return /^[1-9]\d{8}$/.test(uid) || /^18\d{8}$/.test(uid);
}

/** The most digits a UID can have, so an input can cap its length. */
export const UID_MAX_LENGTH = 10;

/** Digits only, capped at the longest UID that exists. */
export function sanitizeUidInput(input: string): string {
  return input.replace(/\D/g, "").slice(0, UID_MAX_LENGTH);
}
