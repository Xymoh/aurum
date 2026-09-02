import { Link, useParams } from "react-router-dom";
import { useHsrShowcase } from "../useHsrShowcase";
import { CharacterPanel } from "../components/CharacterPanel";
import { gradeColor } from "../labels";
import { gradeFor } from "../scoring";

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border border-hsr-border bg-hsr-panel/40" />
      ))}
    </div>
  );
}

export function HsrShowcasePage() {
  const { uid = "" } = useParams();
  const { data, isLoading, error, forceRefresh } = useHsrShowcase(uid);

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
        <p className="text-sm text-rose-200">{error.message}</p>
        <Link
          to="/hsr"
          className="mt-3 inline-block text-sm text-hsr-accent underline underline-offset-2"
        >
          Try another UID
        </Link>
      </div>
    );
  }

  if (!data) return null;

  // Account-level view: the mean build score, on the same 0-200 scale as every
  // other number on the page. A player with one immaculate carry and five
  // neglected supports should see that without opening every panel.
  const totals = data.characters.reduce(
    (acc, c) => ({
      effective: acc.effective + c.diagnostics.effectiveRolls,
      total: acc.total + c.diagnostics.totalRolls,
      score: acc.score + c.diagnostics.score,
    }),
    { effective: 0, total: 0, score: 0 },
  );
  const accountScore = data.characters.length > 0 ? totals.score / data.characters.length : 0;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hsr-border bg-hsr-panel/50 px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold text-hsr-text">{data.nickname}</h1>
          <p className="font-mono text-sm text-hsr-muted">
            {data.uid} · TL {data.level} · {data.characters.length} characters
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`font-mono text-xl font-bold ${gradeColor(gradeFor(accountScore))}`}>
              {accountScore.toFixed(0)}%
            </p>
            <p className="font-mono text-xs text-hsr-muted">
              {totals.effective}/{totals.total} rolls useful
            </p>
          </div>
          <button
            type="button"
            onClick={forceRefresh}
            className="rounded border border-hsr-border px-2.5 py-1 text-sm text-hsr-muted transition-colors hover:border-hsr-accent/40 hover:text-hsr-accent"
          >
            Refresh
          </button>
        </div>
      </header>

      {data.characters.length === 0 ? (
        <p className="rounded-xl border border-hsr-border bg-hsr-panel/40 p-5 text-center text-sm text-hsr-muted">
          This showcase has no characters on display.
        </p>
      ) : (
        <div className="space-y-2">
          {data.characters.map((c) => (
            <CharacterPanel key={c.avatarId} character={c} />
          ))}
        </div>
      )}
    </div>
  );
}
