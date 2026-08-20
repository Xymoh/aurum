import { GRADE_THRESHOLDS } from "../../lib/constants";
import { REROLL_TIERS } from "../../lib/reroll";
import { WarningIcon, DiceIcon, RecycleIcon, CheckIcon } from "./icons";

/**
 * The scoring and reroll reference, shared by the in-app methodology modal and
 * the home page. Kept in one place so the two can't drift apart, and so the
 * thresholds and tier labels are read from the same constants the scoring
 * engine uses rather than restated by hand.
 */
export function ScoringExplainer() {
  // Coarsened to one row per 10% band - the full 18-grade table is too dense to skim.
  const gradeRows = GRADE_THRESHOLDS.filter((_, i) => i % 2 === 0);

  return (
    <div className="space-y-5 text-sm text-dark-muted leading-relaxed">
      <section>
        <h3 className="text-dark-text font-semibold mb-1.5">Potential %</h3>
        <p>
          Each artifact's substats are weighted by how much they matter for the equipped
          character, then compared against that character's theoretical ideal roll. The result
          is a 0–200% scale: <span className="text-dark-text font-medium">100%</span> is a
          solid, usable piece (roughly 4.5 max-value rolls), and{" "}
          <span className="text-dark-text font-medium">200%</span> is a near-impossible,
          perfectly-rolled artifact. Main stats don't affect the score directly - Flower/Plume
          are fixed, and Sands/Goblet/Circlet main stat correctness is shown separately.
        </p>
      </section>

      <section>
        <h3 className="text-dark-text font-semibold mb-2">Grade Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {gradeRows.map((g) => (
            <div
              key={g.grade}
              className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-mono font-semibold"
              style={{ backgroundColor: `${g.color}18`, color: g.color }}
            >
              <span>{g.grade}</span>
              <span className="opacity-80">{g.min}%+</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-dark-text font-semibold mb-1.5">Main Stat &amp; Set Bonus</h3>
        <p className="flex flex-wrap items-center gap-1">
          A <WarningIcon className="w-3 h-3 inline text-amber-500 align-[-2px]" /> next to a
          main stat means it doesn't match the character's recommended stat for that slot. The
          Set Bonuses panel on each character card shows which 2‑piece/4‑piece bonuses are
          active and whether they match the recommended sets - both are informational and
          don't change the artifact's score.
        </p>
      </section>

      <section>
        <h3 className="text-dark-text font-semibold mb-1.5 flex items-center gap-1.5">
          <DiceIcon className="w-4 h-4 text-dark-text" /> Reroll Advice
        </h3>
        <p className="mb-2.5">
          Since version 5.7, <span className="text-dark-text font-medium">Dust of
          Enlightenment</span> lets you reshape a <span className="text-dark-text font-medium">+20
          5★</span> artifact - redistributing its 5 upgrade rolls across the 4 substats it
          already has. It can't change <em>which</em> stats are on the piece. You nominate two
          substats and are guaranteed at least two upgrades across that pair. You can also
          reject a bad result and keep the original, so reshaping never makes a piece worse -
          the only thing it costs is dust.
        </p>
        <p className="mb-2.5">
          Because dust is scarce, the useful question isn't "how good could this get in a
          perfect world" - it's{" "}
          <span className="text-dark-text font-medium">how likely is a reshape to actually
          improve this piece</span>. We simulate 1,500 reshapes per artifact and count how many
          beat the current roll by a worthwhile margin. That share is the{" "}
          <span className="text-dark-text font-medium">% / try</span> shown on each badge - the
          exact odds of one reshape, not an average over imagined attempts.
        </p>
        <p className="mb-2.5">
          Cost is fixed per attempt: <span className="text-dark-text font-medium">1 dust</span>{" "}
          for a Flower or Plume, <span className="text-dark-text font-medium">2 dust</span> for a
          Sands, Goblet or Circlet. Priority weighs the odds against that cost, so a cheap slot
          earns a higher priority at lower odds:
        </p>
        <div className="space-y-1">
          {REROLL_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${tier.color}18`, color: tier.color }}
            >
              <span className="flex items-center gap-1.5">
                <DiceIcon className="w-3 h-3" /> {tier.label}
              </span>
              <span className="opacity-80 font-mono">≤{tier.maxExpectedDust} dust avg.</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold bg-dark-border/40 text-dark-muted">
            <span className="flex items-center gap-1.5">
              <RecycleIcon className="w-3 h-3" /> Farm a replacement
            </span>
            <span className="opacity-80">substats too weak</span>
          </div>
          <div className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold bg-dark-border/40 text-dark-muted">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="w-3 h-3" /> Well rolled
            </span>
            <span className="opacity-80">leave it alone</span>
          </div>
        </div>
        <p className="mt-2.5 text-xs">
          <span className="text-dark-text font-medium">Well rolled</span> means the upgrades
          already landed on the stats that matter, so a reshape has little chance of beating
          what's there - often just a few percent. It isn't a gap in the analysis; it's the
          answer. Every +20 5★ piece gets one of these four verdicts.
        </p>
        <p className="mt-2.5 text-xs">
          Those dust figures are long-run averages used only for ranking - you can't spend 9
          dust on a Goblet, only 2 at a time. Hover any badge for the real numbers: your odds
          per reshape, what a given number of tries actually costs, and which two stats to
          nominate. A piece is only worth dust if its four substats can carry it somewhere good;
          if even a lucky reshape leaves it weak, it's flagged{" "}
          <span className="text-dark-text font-medium">Farm a replacement</span> instead.
        </p>
      </section>
    </div>
  );
}
