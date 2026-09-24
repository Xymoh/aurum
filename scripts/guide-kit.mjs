/**
 * guide-kit.mjs
 * ──────────────────────────────────────────────────────────────────
 * Notices when a character's kit changes between guide builds. Shared by
 * build-genshin-guides.mjs, build-hsr-guides.mjs and build-zzz-guides.mjs.
 *
 * Guide sites catch up with a buff or rework days or weeks after the game
 * ships it, and until they do, their weapon and set picks describe the old
 * kit. The game text is the one input here that changes the moment the
 * patch does, so every guide carries a fingerprint of its kit. When a build
 * finds a different fingerprint in the file it is replacing, it records the
 * date; a guide last updated before that date is flagged on the page and in
 * the refresh summary, and the flag clears once the guide site updates.
 *
 * The date is when a build first saw the change, not when the patch
 * shipped, so running the refresh on patch day keeps the two close. The
 * first build with this in place has nothing to compare against and
 * records no change.
 *
 * --rebaseline (on any of the three builders) adopts the current kits
 * without recording a change: for after a change to how a builder formats
 * text, which would otherwise read as every kit changing at once.
 * ──────────────────────────────────────────────────────────────────
 */

import { createHash } from "node:crypto";
import fs from "node:fs";

const REBASELINE = process.argv.includes("--rebaseline");

/**
 * What the kit says and the numbers behind it: names, text, tags (Star
 * Rail's energy costs) and scaling tables. Nothing that changes without the
 * game changing.
 */
export function kitHash(kit) {
  const content = kit.map((group) => [
    group.id,
    group.entries.map((e) => [e.kind, e.name, e.text, e.tags ?? null, e.scaling ?? null]),
  ]);
  return createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 16);
}

/** Today in UTC, as YYYY-MM-DD, the same shape as the guide sites' dates. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The guide with `kitChangedAt` and `kitHash` added, compared against the
 * file the build is about to replace (absent on a character's first build).
 */
export function withKitTracking(guide, previousFile, date = today()) {
  const hash = kitHash(guide.kit);
  let previous = null;
  try {
    previous = JSON.parse(fs.readFileSync(previousFile, "utf8"));
  } catch {
    // No earlier build of this character: nothing to compare against.
  }
  let changedAt = previous?.kitChangedAt ?? null;
  if (previous?.kitHash && previous.kitHash !== hash && !REBASELINE) changedAt = date;
  return { ...guide, kitChangedAt: changedAt, kitHash: hash };
}

/**
 * Whether the guide predates the kit it is paired with. A guide with no date
 * at all counts as older: nothing says it has caught up.
 */
export function guideBehindKit(guide) {
  if (!guide.kitChangedAt || !guide.source) return false;
  return !guide.source.updated || guide.source.updated < guide.kitChangedAt;
}
