/**
 * guide-figures.mjs
 * ──────────────────────────────────────────────────────────────────
 * Reduces a guide's stat targets to their figures, so what is imported is
 * the fact ("180%+") and not the guide's explanation of it. Shared by
 * fetch-prydwen-sets.mjs (Star Rail and Zenless endgame stats) and
 * fetch-genshin-sets.mjs (Game8's goal stat values and ER targets).
 * ──────────────────────────────────────────────────────────────────
 */

/**
 * A qualifier of a few words is a fact about the figure beside it
 * ("(Recommended)", "(Lvl 4 Core Passive)", "(EHR build)"). Anything longer
 * is the guide explaining itself, which is its prose and stays on its page.
 */
const MAX_QUALIFIER_WORDS = 4;

export function trimQualifiers(text) {
  return text
    .replace(/\s*\(([^()]*)\)/g, (whole, inner) =>
      inner.trim().split(/\s+/).length <= MAX_QUALIFIER_WORDS ? ` (${inner.trim()})` : "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * An endgame target reduced to its figures: the first sentence, qualifiers
 * trimmed, and of its "/" or "or" alternatives only those that are a figure
 * or the game's "Base" speed. "180% or above" reads as "180%+" first, so the
 * "or" there is not taken for an alternative. "1-2 Speed slower than carry
 * / 160+" keeps "160+"; "As much as is needed to outspeed..." keeps nothing
 * and is dropped.
 */
export function endgameFigure(raw) {
  const first = raw
    .split(/\.\s/)[0]
    .replace(/\s+or\s+(above|higher|more)\b/gi, "+")
    .replace(/[.,;:\s]+$/, "");
  const kept = trimQualifiers(first)
    .split(/\s+\/\s+|\s+or\s+/i)
    .map((s) => s.trim().replace(/[,;]+$/, ""))
    .filter((s) => {
      const bare = s.replace(/\([^)]*\)/g, "");
      const figure = /\d/.test(bare) || /\bbase\b/i.test(bare);
      return figure && !/[a-z]/i.test(bare.replace(/\b(base|spd|speed)\b/gi, ""));
    });
  return kept.length ? kept.join(" / ") : null;
}

/**
 * The Energy Recharge a figure asks for, as one number: the lower bound of
 * its first alternative. "180%+" is 180, "200 ~ 250% / 180%+ (Favonius)" is
 * 200, "110~130% (if Double Electro) / 130~150% (if Solo)" is 110. The
 * scorer reads it as "enough"; asking for the low end of the first case
 * never tells a player to over-build. Null for anything that is not a
 * plausible total (100% is the base every character has).
 */
export function energyTarget(figure) {
  const first = figure?.split(" / ")[0] ?? "";
  const n = Number(first.replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(n) && n > 100 && n <= 400 ? n : null;
}
