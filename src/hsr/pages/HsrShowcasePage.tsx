import { Link, useParams } from "react-router-dom";
import { useHsrShowcase } from "../useHsrShowcase";
import { CharacterPanel } from "../components/CharacterPanel";
import { BENCHMARK_ROLLS } from "../scoring";
import { efficiencyColor } from "../labels";

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
          className="mt-3 inline-block text-[11px] text-hsr-accent underline underline-offset-2"
        >
          Try another UID
        </Link>
      </div>
    );
  }

  if (!data) return null;

  // Account-level view: the same effective-vs-total split, summed. A player
  // with one immaculate carry and five neglected supports should be able to
  // see that without opening every panel.
  const totals = data.characters.reduce(
    (acc, c) => ({
      effective: acc.effective + c.diagnostics.effectiveRolls,
      total: acc.total + c.diagnostics.totalRolls,
    }),
    { effective: 0, total: 0 },
  );
  const accountEfficiency =
    totals.total > 0 ? (totals.effective / (data.characters.length * BENCHMARK_ROLLS)) * 100 : 0;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hsr-border bg-hsr-panel/50 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-hsr-text">{data.nickname}</h1>
          <p className="font-mono text-[11px] text-hsr-muted">
            {data.uid} · TL {data.level} · {data.characters.length} characters
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`font-mono text-xl font-bold ${efficiencyColor(accountEfficiency)}`}>
              {accountEfficiency.toFixed(1)}%
            </p>
            <p className="font-mono text-[10px] text-hsr-muted">
              {totals.effective}/{totals.total} rolls useful
            </p>
          </div>
          <button
            type="button"
            onClick={forceRefresh}
            className="rounded border border-hsr-border px-2.5 py-1 text-[11px] text-hsr-muted transition-colors hover:border-hsr-accent/40 hover:text-hsr-accent"
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
