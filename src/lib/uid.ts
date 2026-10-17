/**
 * UID rules for the three games. They live here, not beside each game's
 * query hook, so a home page can validate without importing that game's
 * whole scoring engine.
 *
 * Genshin Impact:
 *
 * Nine digits for every server, plus the ten-digit UIDs that new Asia
 * accounts have carried since late 2023: those start with 18 and are served
 * by Enka like any other. The first digit is never 0.
 */
export function isValidUid(uid: string): boolean {
  return /^[1-9]\d{8}$/.test(uid) || /^18\d{8}$/.test(uid);
}

/** Star Rail UIDs are nine digits on every server. */
export function isValidHsrUid(uid: string): boolean {
  return /^[1-9]\d{8}$/.test(uid);
}

/**
 * ZZZ UIDs run from 8 digits on the CN servers (Enka serves 10001234) to 10
 * on Asia (1300064261). Anything in that range is worth asking Enka about.
 */
export function isValidZzzUid(uid: string): boolean {
  return /^[1-9]\d{7,9}$/.test(uid);
}

/** The most digits a UID can have, so an input can cap its length. */
export const UID_MAX_LENGTH = 10;

/** Digits only, capped at the longest UID that exists. */
export function sanitizeUidInput(input: string): string {
  return input.replace(/\D/g, "").slice(0, UID_MAX_LENGTH);
}
