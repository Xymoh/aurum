import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BENCHMARK_ROLLS, MAX_ROLLS, GRADE_LADDER, ROLL_VALUE } from "../scoring";
import { isValidZzzUid } from "../useZzzShowcase";
import { statLabel } from "../labels";
import { ZZZ_RECENT_UIDS_KEY, useRecentUids } from "../../hooks/useRecentUids";
import { GradeBadge } from "../../components/ui/GradeBadge";

/** Digits only, capped at ten. */
function sanitize(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function ZzzHomePage() {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { recent, remember } = useRecentUids(ZZZ_RECENT_UIDS_KEY);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = sanitize(uid);
    if (!isValidZzzUid(trimmed)) {
      setError("UID must be 9 or 10 digits.");
      return;
    }
    setError("");
    remember(trimmed);
    navigate(`/zzz/showcase/${trimmed}`);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="w-full max-w-2xl text-center">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-zzz-accent">
          // Inter-Knot Report
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-6xl">
          Disc <span className="text-zzz-accent">Aurum</span>
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-zzz-muted">
          Every roll, accounted for
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zzz-muted">
          A drive disc in Zenless has no lucky rolls: every upgrade is worth the same fixed
          amount. The only thing that varies is which stats the rolls landed on, so that is the
          only thing this scores.
        </p>

        <form onSubmit={submit} className="mt-6 flex items-center justify-center gap-2">
          <input
            value={uid}
            onChange={(e) => {
              setUid(sanitize(e.target.value));
              setError("");
            }}
            maxLength={10}
            placeholder="Enter ZZZ UID"
            inputMode="numeric"
            aria-label="Zenless Zone Zero UID"
            className="w-60 rounded-md border border-zzz-border bg-zzz-card px-3 py-2 font-mono text-sm text-zzz-text placeholder:text-zzz-muted/70 focus:border-zzz-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-zzz-accent px-4 py-2 text-sm font-black uppercase tracking-wider text-black transition-transform hover:-translate-y-0.5"
          >
            Scan
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-zzz-signal" role="alert">{error}</p>}

        {recent.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zzz-muted">Recent lookups</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {recent.slice(0, 6).map((entry) => (
                <Link
                  key={entry.uid}
                  to={`/zzz/showcase/${entry.uid}`}
                  className="rounded-lg border border-zzz-border bg-zzz-card px-3 py-1.5 font-mono text-sm text-zzz-text no-underline transition-colors hover:border-zzz-accent/60 hover:text-zzz-accent"
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
            n: "01",
            t: "Rolls are stated and fixed",
            b: "Enka reports how many rolls each substat took. In Zenless every roll of a stat is worth the same, so a disc's value is exactly rolls times a known amount.",
          },
          {
            n: "02",
            t: "Useful rolls are separated from dead ones",
            b: "Each roll is weighted for the agent wearing the disc, using Prydwen's per-agent priorities. Rolls on stats the agent does not use count as waste.",
          },
          {
            n: "03",
            t: "Six discs, one number",
            b: `Each disc is scored against the best disc its slot could hold. The build is the mean of the six, with useful rolls counted against a ${BENCHMARK_ROLLS}-roll benchmark out of ${MAX_ROLLS}.`,
          },
        ].map((c) => (
          <div key={c.n} className="rounded-xl border border-zzz-border bg-zzz-panel/50 p-4">
            <span className="font-mono text-sm font-bold text-zzz-accent">{c.n}</span>
            <h3 className="mt-2 text-base font-bold uppercase tracking-wide text-zzz-text">{c.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zzz-muted">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl rounded-xl border border-zzz-border bg-zzz-panel/50 p-5">
        <h2 className="text-base font-bold uppercase tracking-wide text-zzz-text">How a disc is graded</h2>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-zzz-muted">
          <p>
            Every substat is converted to CRIT DMG units, so one roll of anything is worth the
            same 4.8 before weighting: a CRIT Rate roll counts double, a PEN roll a little over
            half. Each point is then weighted for the agent, and the total is measured against
            the best disc the slot could hold: one roll on each of the four best stats plus the
            five upgrades all on the best, with the main stat removed from the pool because it
            cannot also roll as a substat. That optimum is 200%; 100% is half of it, and the
            ladder climbs one band every 10 points, the same ladder as the other two games.
          </p>
          <p>
            A disc whose main stat the agent has no use for keeps its percent but gets no
            letter. Flat ATK, HP and DEF rolls count for 40% of their percent stat.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {GRADE_LADDER.filter((_, i) => i % 2 === 0).map((band) => (
              <span key={band.grade} className="inline-flex items-center gap-1 rounded-md border border-zzz-line bg-zzz-inset px-2 py-0.5 font-mono text-xs">
                <GradeBadge grade={band.grade} size="xs" /> {band.min}%+
              </span>
            ))}
          </div>
          <p>One roll of each substat, as the game fixes them:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(ROLL_VALUE).map(([id, value]) => (
              <span key={id} className="rounded-md border border-zzz-line bg-zzz-inset px-2 py-0.5 font-mono text-xs text-zzz-text">
                {statLabel(Number(id))} <span className="text-zzz-accent">+{value}{Number(id) < 20000 && Number(id) % 100 === 2 ? "%" : Number(id) === 20103 || Number(id) === 21103 ? "%" : ""}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
