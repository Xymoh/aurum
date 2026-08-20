import { UidInput } from "../components/ui/UidInput";
import { ScoringExplainer } from "../components/ui/ScoringExplainer";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Link } from "react-router-dom";

interface RecentUid {
  uid: string;
  timestamp: number;
}

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Enter a UID",
    body: "Your showcase is read from Enka.Network - the characters you've put on display in-game. Nothing is stored, and no login is needed.",
  },
  {
    title: "Every piece is scored",
    body: "Each artifact's substats are weighted for the character actually wearing it, so a CRIT roll counts for a DPS and an EM roll counts for a driver.",
  },
  {
    title: "You get a verdict",
    body: "Each piece is labelled reroll, replace, or leave alone - with the real odds of a Dust of Enlightenment reshape paying off.",
  },
];

export function HomePage() {
  const [recentUids] = useLocalStorage<RecentUid[]>("recent-uids", []);

  return (
    <div className="flex flex-col items-center gap-12 py-12">
      {/* Hero section */}
      <div className="text-center space-y-5 max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Artifact Aurum</span>
        </h1>
        <p className="text-dark-muted text-base font-medium tracking-wide uppercase">
          Score your artifacts like the pros
        </p>
        <p className="text-dark-muted/80 text-lg">
          Enter a UID to instantly evaluate artifact quality across your entire showcase - per
          character, per piece.
        </p>
      </div>

      {/* UID Input */}
      <div className="w-full max-w-md">
        <UidInput />
      </div>

      {/* Recent lookups - kept close to the input, since it's a shortcut into the same action */}
      {recentUids.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          <h2 className="text-dark-muted text-sm font-medium uppercase tracking-wider">
            Recent Lookups
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentUids.slice(0, 6).map((entry) => (
              <Link
                key={entry.uid}
                to={`/showcase/${entry.uid}`}
                className="rounded-lg bg-dark-card border border-dark-border px-4 py-2 text-dark-text text-sm no-underline hover:border-accent hover:text-accent transition-colors"
              >
                {entry.uid}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div className="w-full max-w-2xl space-y-3">
        <h2 className="text-dark-muted text-sm font-medium uppercase tracking-wider text-center">
          How it works
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-dark-border bg-dark-card/40 p-4 space-y-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                {i + 1}
              </span>
              <h3 className="text-dark-text text-sm font-semibold">{step.title}</h3>
              <p className="text-xs text-dark-muted leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Scoring reference (same content as the in-app "?" panel) ── */}
      <div className="w-full max-w-2xl rounded-xl border border-dark-border bg-dark-card/40 p-5 sm:p-6">
        <h2 className="text-dark-text text-base font-bold mb-4">How scoring works</h2>
        <ScoringExplainer />
      </div>

      {/* ── Where the numbers come from ── */}
      <div className="w-full max-w-2xl rounded-xl border border-dark-border bg-dark-card/40 p-5 sm:p-6 space-y-3">
        <h2 className="text-dark-text text-base font-bold">Where the data comes from</h2>
        <ul className="space-y-2 text-sm text-dark-muted leading-relaxed">
          <li>
            <span className="text-dark-text font-medium">Your showcase</span> -{" "}
            <a
              href="https://enka.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2"
            >
              Enka.Network
            </a>
            , which reads the characters you've set to display in-game. Only public showcase data
            is available, so a private profile or an empty showcase can't be scored.
          </li>
          <li>
            <span className="text-dark-text font-medium">Character stats</span> - auto-synced from{" "}
            <a
              href="https://github.com/frzyc/genshin-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2"
            >
              Genshin Optimizer
            </a>
            's open dataset.
          </li>
          <li>
            <span className="text-dark-text font-medium">Substat weights</span> - hand-curated per
            character from community theorycrafting: KQM, Game8, Prydwen and Icy Veins. These are
            a judgement call, and where guides disagree we pick the mainstream build.
          </li>
        </ul>
      </div>

      {/* ── Limitations ── */}
      <div className="w-full max-w-2xl rounded-xl border border-dark-border/50 bg-dark-card/40 px-5 py-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/80 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="space-y-1.5">
            <p className="text-xs text-dark-muted/90 leading-relaxed">
              <span className="font-medium text-dark-text/80">This is a quick evaluation tool, not a definitive build guide.</span>{" "}
              A score judges how well an artifact rolled for one character in isolation - it doesn't
              model team buffs, reaction damage, energy requirements or rotation length. A piece
              this tool rates low can still be correct for your team.
            </p>
            <p className="text-xs text-dark-muted/70 leading-relaxed">
              Use it to spot artifacts with room to improve - not as a final verdict. For precision
              optimization, consider tools like{" "}
              <a href="https://frzyc.github.io/genshin-optimizer/" target="_blank" rel="noopener noreferrer" className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2">
                Genshin Optimizer
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
