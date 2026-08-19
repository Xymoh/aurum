import { UidInput } from "../components/ui/UidInput";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Link } from "react-router-dom";

interface RecentUid {
  uid: string;
  timestamp: number;
}

export function HomePage() {
  const [recentUids] = useLocalStorage<RecentUid[]>("recent-uids", []);

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-12">
      {/* Hero section */}
      <div className="text-center space-y-5 max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Artifact Aurum</span>
        </h1>
        <p className="text-dark-muted text-base font-medium tracking-wide uppercase">
          Score your artifacts like the pros
        </p>
        <p className="text-dark-muted/80 text-lg">
          Enter a UID to instantly evaluate artifact quality across your entire showcase — per
          character, per piece.
        </p>
      </div>

      {/* UID Input */}
      <div className="w-full max-w-md">
        <UidInput />
      </div>

      {/* Disclaimer */}
      <div className="w-full max-w-md rounded-lg border border-dark-border/50 bg-dark-card/40 px-5 py-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/80 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="space-y-1.5">
            <p className="text-xs text-dark-muted/90 leading-relaxed">
              <span className="font-medium text-dark-text/80">This is a quick evaluation tool, not a definitive build guide.</span>{" "}
              Scores are based on general substat priorities and may not reflect optimal builds for every team comp or playstyle.
            </p>
            <p className="text-xs text-dark-muted/70 leading-relaxed">
              Use it to spot artifacts with room to improve - not as a final verdict. For precision optimization, consider tools like{" "}
              <a href="https://frzyc.github.io/genshin-optimizer/" target="_blank" rel="noopener noreferrer" className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2">
                Genshin Optimizer
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* Recent lookups */}
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
    </div>
  );
}
