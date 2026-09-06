import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useZzzShowcase } from "../useZzzShowcase";
import { AgentPanel } from "../components/AgentPanel";
import { agentPanelId } from "../panelId";
import { PROFESSION_LABELS, SLOT_LABELS, statLabel } from "../labels";
import { gradeFor } from "../scoring";
import { agentIcon } from "../images";
import type { ZzzAgent, ZzzDisc } from "../types";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { CheckIcon, ClipboardIcon, TargetIcon } from "../../components/ui/icons";
import { formatScore } from "../../lib/format";
import { ShowcaseHelp } from "../../components/ui/ShowcaseHelp";
import { gradeTextClass } from "../../lib/grade";

/**
 * Stands in for the real page while the showcase loads: the account bar, then
 * a stack of character rows. Sized to what actually arrives, so the layout
 * does not jump when it does.
 */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="flex items-center gap-3 game-panel border border-zzz-border bg-zzz-panel/50 px-4 py-3 sm:gap-4 sm:px-5">
        <div className="skeleton h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton h-3 w-52 rounded" />
        </div>
        <div className="skeleton h-8 w-16 rounded-lg" />
      </div>

      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="game-panel border border-zzz-border bg-zzz-panel/40">
            <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-7 w-14 rounded" />
            </div>
            <div className="border-t border-zzz-border/40 px-3 py-2 sm:px-4">
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CONTROL = "rounded-lg border border-zzz-border bg-zzz-card px-2.5 py-1.5 text-sm text-zzz-text focus:border-zzz-accent focus:outline-none";

type SortKey = "score-desc" | "score-asc" | "level-desc" | "name-asc";
const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "score-desc", label: "Score (high → low)" },
  { value: "score-asc", label: "Score (low → high)" },
  { value: "level-desc", label: "Level (high → low)" },
  { value: "name-asc", label: "Name (A → Z)" },
];

/** Unscored builds sort last both ways: they have no score to rank. */
function byScore(a: ZzzAgent, b: ZzzAgent, dir: 1 | -1): number {
  if (a.diagnostics.complete !== b.diagnostics.complete) {
    return a.diagnostics.complete ? -1 : 1;
  }
  return dir * (a.diagnostics.score - b.diagnostics.score);
}

function sortAgents(list: ZzzAgent[], key: SortKey): ZzzAgent[] {
  const sorted = [...list];
  switch (key) {
    case "score-desc":
      return sorted.sort((a, b) => byScore(a, b, -1));
    case "score-asc":
      return sorted.sort((a, b) => byScore(a, b, 1));
    case "level-desc":
      return sorted.sort((a, b) => b.level - a.level || byScore(a, b, -1));
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

interface WeakDisc {
  agent: ZzzAgent;
  disc: ZzzDisc;
}

/**
 * The account-wide list of discs holding a build back. Zenless has no reroll
 * mechanic, so unlike the other games the advice is only ever "farm a
 * replacement": these are the pieces where that buys the most.
 */
function WeakestDiscs({ items, onSelect }: { items: WeakDisc[]; onSelect: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <section className="game-panel border border-zzz-border bg-zzz-panel/50 p-4 sm:p-5" aria-labelledby="zzz-weakest">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="zzz-weakest" className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zzz-text">
          <TargetIcon className="h-4 w-4 text-zzz-accent" /> Replace first
        </h2>
        <span className="text-sm text-zzz-muted">The discs holding a build back the most</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ agent, disc }) => {
          const icon = agentIcon(agent.id);
          return (
            <button
              key={disc.id}
              type="button"
              onClick={() => onSelect(agent.id)}
              className="flex items-center gap-2 rounded-lg border border-zzz-border bg-zzz-card/60 px-3 py-2.5 text-left transition-colors hover:border-zzz-accent/60 hover:bg-zzz-card"
              aria-label={`Jump to ${agent.name}`}
            >
              {icon && <img src={icon} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded-full bg-zzz-inset object-cover ring-1 ring-zzz-line" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zzz-text">{agent.name}</div>
                <div className="truncate text-xs text-zzz-muted">
                  {SLOT_LABELS[disc.slot]} · {disc.score.mainStatOk ? disc.setName : `${statLabel(disc.mainStat.id)} main`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className={`font-mono text-sm font-bold tabular-nums ${disc.score.grade ? gradeTextClass(disc.score.grade) : "text-zzz-signal"}`}>
                  {formatScore(disc.score.potentialPercent)}
                </span>
                {disc.score.grade ? (
                  <GradeBadge grade={disc.score.grade} size="xs" />
                ) : (
                  <span className="rounded bg-zzz-signal/15 px-1 py-px text-[11px] font-bold uppercase text-zzz-signal">Main</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
        } catch {
          // Clipboard unavailable; the URL bar still works.
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zzz-border px-3 text-sm text-zzz-muted transition-colors hover:border-zzz-accent/60 hover:text-zzz-text"
      aria-live="polite"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-zzz-accent" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function ZzzShowcasePage() {
  const { uid = "" } = useParams();
  const { data, isLoading, error, forceRefresh } = useZzzShowcase(uid);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("score-desc");

  const agents = useMemo(() => data?.agents ?? [], [data]);
  const roles = useMemo(() => Array.from(new Set(agents.map((a) => a.profession))).sort(), [agents]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortAgents(
      agents.filter((a) => (roleFilter === "ALL" || a.profession === roleFilter) && (!q || a.name.toLowerCase().includes(q))),
      sortKey,
    );
  }, [agents, search, roleFilter, sortKey]);

  // Worst discs first: wrong mains outrank everything, then lowest percent.
  const weakest = useMemo<WeakDisc[]>(
    () =>
      agents
        .flatMap((agent) => agent.discs.map((disc) => ({ agent, disc })))
        .sort((a, b) => Number(a.disc.score.mainStatOk) - Number(b.disc.score.mainStatOk) || a.disc.score.potentialPercent - b.disc.score.potentialPercent)
        .slice(0, 6),
    [agents],
  );

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jumpTo = (id: number) => {
    setExpanded((prev) => new Set(prev).add(id));
    setSearch("");
    setRoleFilter("ALL");
    window.requestAnimationFrame(() => {
      document.getElementById(agentPanelId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-md game-panel border border-zzz-signal/30 bg-zzz-signal/10 p-5 text-center">
        <p className="text-sm text-zzz-text">{error.message}</p>
        <Link to="/zzz" className="mt-3 inline-block text-sm text-zzz-accent underline underline-offset-2">
          Try another UID
        </Link>
      </div>
    );
  }
  if (!data) return null;

  // Only fully geared agents count toward the mean: a half-built one would
  // drag the account number down for gear the player has not finished rather
  // than gear that rolled badly. The roll counters still count every disc,
  // since those upgrades were really spent.
  const totals = agents.reduce(
    (acc, a) => ({
      effective: acc.effective + a.diagnostics.effectiveRolls,
      total: acc.total + a.diagnostics.totalRolls,
      score: acc.score + (a.diagnostics.complete ? a.diagnostics.score : 0),
      scored: acc.scored + (a.diagnostics.complete ? 1 : 0),
    }),
    { effective: 0, total: 0, score: 0, scored: 0 },
  );
  const accountScore = totals.scored > 0 ? totals.score / totals.scored : 0;
  const accountGrade = gradeFor(accountScore);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3 game-panel border border-zzz-border bg-zzz-panel/60 px-4 py-3 sm:gap-4 sm:px-5">
        {data.profilePicture && (
          <img src={data.profilePicture} alt="" className="h-12 w-12 shrink-0 rounded-full bg-zzz-inset object-cover ring-2 ring-zzz-accent/40" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black uppercase tracking-wide text-zzz-text">{data.nickname}</h1>
          <p className="font-mono text-sm text-zzz-muted">
            {data.uid} · IK {data.level} · {agents.length} agents
          </p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className={`font-mono text-2xl font-black leading-none tabular-nums ${gradeTextClass(accountGrade)}`}>{formatScore(accountScore)}</p>
            <p className="mt-1 font-mono text-xs text-zzz-muted">
              {totals.effective}/{totals.total} rolls useful
            </p>
          </div>
          <GradeBadge grade={accountGrade} size="md" />
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ShareButton />
          <div className="flex-1 sm:hidden" />
          <button
            type="button"
            onClick={forceRefresh}
            className="inline-flex h-9 items-center rounded-lg bg-zzz-accent px-3 text-sm font-black uppercase tracking-wider text-black transition-transform hover:-translate-y-0.5"
          >
            Refresh
          </button>
        </div>
      </header>

      <WeakestDiscs items={weakest} onSelect={jumpTo} />

      {agents.length === 0 ? (
        <ShowcaseHelp
          title="This showcase has no agents on display"
          lead="Disc Aurum reads the agents you have made public in game, and nothing else. It never sees the rest of the account, so an empty showcase leaves it nothing to score."
          steps={[
            "In game, open the menu and select your Inter-Knot profile at the top left.",
            "Edit the profile and add agents to the showcase.",
            "Save it, then come back here and hit Refresh.",
          ]}
          footer="Already set it up? The game takes a moment to publish the change. Give it a minute and refresh again."
          slots={6}
          panelClass="border-zzz-border bg-zzz-panel/40 text-zzz-text"
          accentClass="bg-zzz-accent/20 text-zzz-accent"
          mutedClass="text-zzz-muted"
          slotClass="border-zzz-border bg-zzz-inset/60"
        />
      ) : (
        <div className="space-y-2">
          <div className="z-20 flex flex-col gap-2 rounded-lg border border-zzz-border bg-zzz-panel/90 p-3 backdrop-blur-md sm:sticky sm:top-16 sm:flex-row sm:items-center">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents…" aria-label="Search agents" className={`${CONTROL} min-w-[140px] flex-1 placeholder:text-zzz-muted/70`} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role" className={CONTROL}>
              <option value="ALL">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {PROFESSION_LABELS[r] ?? r}
                </option>
              ))}
            </select>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Sort agents" className={CONTROL}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {(search || roleFilter !== "ALL") && (
              <span className="whitespace-nowrap text-sm text-zzz-muted">
                {visible.length}/{agents.length} shown
              </span>
            )}
          </div>
          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-zzz-muted">No agents match your filters.</p>
          ) : (
            visible.map((a, i) => <AgentPanel key={a.id} agent={a} index={i} open={expanded.has(a.id)} onToggle={() => toggle(a.id)} />)
          )}
        </div>
      )}
    </div>
  );
}
