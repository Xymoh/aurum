import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BENCHMARK_ROLLS, MAX_ROLLS } from "../scoring";
import { isValidHsrUid } from "../useHsrShowcase";

export function HsrHomePage() {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = uid.trim();
    if (!isValidHsrUid(trimmed)) {
      setError("UID must be exactly 9 digits.");
      return;
    }
    setError("");
    navigate(`/hsr/showcase/${trimmed}`);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="bg-gradient-to-r from-hsr-accent via-hsr-glow to-hsr-gold bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Relic Aurum
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.28em] text-hsr-muted">
          Where your rolls actually went
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-hsr-muted">
          Grading relics one at a time hides the problem that matters. Six pieces can each look
          excellent while a quarter of your upgrades sit on stats the character never uses. This
          scores the whole build, not just the pieces.
        </p>

        <form onSubmit={submit} className="mt-6 flex items-center justify-center gap-2">
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Enter HSR UID"
            inputMode="numeric"
            aria-label="Honkai Star Rail UID"
            className="w-56 rounded-md border border-hsr-border bg-hsr-card px-3 py-2 font-mono text-sm text-hsr-text placeholder:text-hsr-muted/70 focus:border-hsr-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md border border-hsr-accent/40 bg-hsr-accent/15 px-4 py-2 text-sm font-semibold text-hsr-accent transition-colors hover:bg-hsr-accent/25"
          >
            Analyse
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
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
            b: `Effective rolls measured against a ${BENCHMARK_ROLLS}-roll benchmark, out of the ${MAX_ROLLS} a build can physically hold.`,
          },
        ].map((c) => (
          <div key={c.n} className="rounded-xl border border-hsr-border bg-hsr-panel/40 p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-hsr-accent/30 font-mono text-[11px] text-hsr-accent">
              {c.n}
            </span>
            <h3 className="mt-2 text-sm font-semibold text-hsr-text">{c.t}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-hsr-muted">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl rounded-xl border border-hsr-border bg-hsr-panel/40 p-5">
        <h2 className="text-sm font-semibold text-hsr-text">
          Why a DPS score and a relic grade disagree
        </h2>
        <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-hsr-muted">
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
            Weights are keyed by Path rather than per character, so someone released tomorrow still
            scores sensibly instead of falling off a hand-written table.
          </p>
        </div>
      </div>
    </div>
  );
}
