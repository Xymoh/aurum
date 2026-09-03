import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BENCHMARK_ROLLS, MAX_ROLLS, GRADE_LADDER } from "../scoring";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { isValidHsrUid } from "../useHsrShowcase";
import { sanitizeUidInput } from "../../lib/uid";
import { HSR_RECENT_UIDS_KEY, useRecentUids } from "../../hooks/useRecentUids";

export function HsrHomePage() {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { recent, remember } = useRecentUids(HSR_RECENT_UIDS_KEY);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = sanitizeUidInput(uid);
    if (!isValidHsrUid(trimmed)) {
      setError("UID must be exactly 9 digits.");
      return;
    }
    setError("");
    remember(trimmed);
    navigate(`/hsr/showcase/${trimmed}`);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="bg-gradient-to-r from-hsr-accent via-hsr-glow to-hsr-gold bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Relic Aurum
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-hsr-muted">
          Where your rolls actually went
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-hsr-muted">
          Grading relics one at a time hides the problem that matters. Six pieces can each look
          excellent while a quarter of your upgrades sit on stats the character never uses. This
          scores the whole build, not just the pieces.
        </p>

        <form onSubmit={submit} className="mt-6 flex items-center justify-center gap-2">
          {/* The shape lives on a wrapper, not the field: an input is a
              replaced element and never renders the pseudo-element that
              draws the border along the notch. */}
          <div className="game-panel-sm w-56 border border-hsr-border bg-hsr-card focus-within:border-hsr-accent focus-within:[--panel-corner:var(--hsr-accent)]">
            <input
              value={uid}
              // Digits only, capped at 9: the field should make an invalid UID
              // hard to type rather than only complaining after submit.
              onChange={(e) => {
                setUid(sanitizeUidInput(e.target.value));
                setError("");
              }}
              maxLength={9}
              placeholder="Enter HSR UID"
              inputMode="numeric"
              aria-label="Honkai Star Rail UID"
              className="w-full bg-transparent px-3 py-2 font-mono text-sm text-hsr-text placeholder:text-hsr-muted/70 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="game-panel-sm border border-hsr-accent/40 [--panel-corner:color-mix(in_oklab,var(--hsr-accent)_40%,transparent)] bg-hsr-accent/15 px-4 py-2 text-sm font-semibold text-hsr-accent transition-colors hover:bg-hsr-accent/25"
          >
            Analyse
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-verdict-replace" role="alert">{error}</p>}

        {recent.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-hsr-muted">
              Recent lookups
            </h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {recent.slice(0, 6).map((entry) => (
                <Link
                  key={entry.uid}
                  to={`/hsr/showcase/${entry.uid}`}
                  className="game-panel-sm border border-hsr-border bg-hsr-card px-3 py-1.5 font-mono text-sm text-hsr-text no-underline transition-colors hover:border-hsr-accent/50 hover:[--panel-corner:color-mix(in_oklab,var(--hsr-accent)_50%,transparent)] hover:text-hsr-accent"
                >
                  {entry.uid}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
        {[
          {
            n: "1",
            t: "Rolls are stated, not guessed",
            b: "Star Rail reports how many upgrades landed on each substat and how good each one was. Nothing here is inferred from a displayed number.",
          },
          {
            n: "2",
            t: "Useful rolls are separated from dead ones",
            b: `Every upgrade is weighted for the character wearing it. Rolls on stats that do nothing for their job are counted as waste, not quietly averaged away.`,
          },
          {
            n: "3",
            t: "The build gets one honest number",
            b: `Each relic is scored against the best relic its slot could hold for this character, the same way the Fribbels optimizer scores it. The build is the mean of its six pieces, with useful rolls counted against a ${BENCHMARK_ROLLS}-roll benchmark out of the ${MAX_ROLLS} a build can physically hold.`,
          },
        ].map((c) => (
          <div key={c.n} className="game-panel border border-hsr-border bg-hsr-panel/40 p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-hsr-accent/30 font-mono text-sm text-hsr-accent">
              {c.n}
            </span>
            <h3 className="mt-2 text-base font-semibold text-hsr-text">{c.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-hsr-muted">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl game-panel border border-hsr-border bg-hsr-panel/40 p-5">
        <h2 className="text-base font-semibold text-hsr-text">How a relic is graded</h2>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-hsr-muted">
          <p>
            Every substat is converted to CRIT DMG units, so one max roll of anything is worth
            the same 6.48 before weighting: a CRIT Rate roll counts double, a SPD roll two and a
            half times. Each point is then weighted for the character, and the total is measured
            against the best relic the slot could hold: one max roll on each of the four best
            stats plus the five upgrades all on the best, with the main stat removed from the
            pool because it cannot also roll as a substat. That optimum is 200%; 100% is half of
            it, and the ladder climbs one band every 10 points: S at 100, SS at 120, SSS at 140,
            WTF at 160.
          </p>
          <p>
            A relic whose main stat the character has no use for keeps its percent but gets no
            letter. The number still tells you how the substats rolled; the missing grade tells
            you the piece is not a candidate. Flat ATK, HP and DEF rolls count for 40% of their
            percent stat.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {GRADE_LADDER.filter((_, i) => i % 2 === 0).map((band) => (
              <span key={band.grade} className="inline-flex items-center gap-1 rounded-md border border-hsr-line bg-hsr-inset px-2 py-0.5 font-mono text-xs">
                <GradeBadge grade={band.grade} size="xs" /> {band.min}%+
              </span>
            ))}
          </div>
          <p>
            Rolls are shown as pips, one per roll, coloured by how good the roll was. Star Rail
            reports a stat's roll count and combined quality rather than each roll on its own,
            so every pip on a stat carries that stat's average tier; hover or tap them for the
            numbers.
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl game-panel border border-hsr-border bg-hsr-panel/40 p-5">
        <h2 className="text-base font-semibold text-hsr-text">
          Why a DPS score and a relic grade disagree
        </h2>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-hsr-muted">
          <p>
            A relic grade asks whether one piece rolled well. A DPS benchmark asks what your whole
            stat vector produces. They can disagree completely, and when they do the grade is
            usually the one being naive: every piece rolling CRIT Rate is six good grades and one
            over-capped build.
          </p>
          <p>
            This tool sits between them. It does not simulate damage, so it will never tell you a
            rotation number. It does tell you how many of your upgrades are working, which piece is
            carrying the dead weight, and whether your crit ratio and main stats are sane. That is
            arithmetic over stats we can read exactly, so it stays correct when new characters ship.
          </p>
          <p>
            Substat weights and ideal main stats come per character from the{" "}
            <a
              href="https://github.com/fribbels/hsr-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hsr-accent underline underline-offset-2 hover:text-hsr-text"
            >
              Fribbels HSR Optimizer
            </a>{" "}
            tables, cross-checked against Prydwen's build guides, so a relic graded here matches the
            grade you would see there. A character released after the last refresh falls back to a
            Path profile until the table is re-imported, so nothing goes ungraded.
          </p>
        </div>
      </div>
    </div>
  );
}
