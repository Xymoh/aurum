import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useHsrShowcase } from "../useHsrShowcase";
import { CharacterPanel } from "../components/CharacterPanel";
import { characterPanelId } from "../panelId";
import { SLOT_LABELS, gradeColor, statLabel } from "../labels";
import { gradeFor } from "../scoring";
import { PATH_LABELS } from "../weights";
import { characterIcon } from "../images";
import type { HsrCharacter, HsrRelic } from "../types";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { CheckIcon, ClipboardIcon, DiceIcon, TargetIcon } from "../../components/ui/icons";
import { formatScore } from "../../lib/format";
import { ShowcaseHelp } from "../../components/ui/ShowcaseHelp";
import { tint } from "../../lib/grade";

/**
 * Stands in for the real page while the showcase loads: the account bar, then
 * a stack of character rows. Sized to what actually arrives, so the layout
 * does not jump when it does.
 */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="flex items-center gap-3 game-panel border border-hsr-border bg-hsr-panel/50 px-4 py-3 sm:gap-4 sm:px-5">
        <div className="skeleton h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton h-3 w-52 rounded" />
        </div>
        <div className="skeleton h-8 w-16 rounded-lg" />
      </div>

      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="game-panel border border-hsr-border bg-hsr-panel/40">
            <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-7 w-14 rounded" />
            </div>
            <div className="border-t border-hsr-border/40 px-3 py-2 sm:px-4">
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CONTROL =
  "rounded-lg border border-hsr-border bg-hsr-card px-2.5 py-1.5 text-sm text-hsr-text focus:border-hsr-accent focus:outline-none";

type SortKey = "score-desc" | "score-asc" | "level-desc" | "name-asc";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "score-desc", label: "Score (high → low)" },
  { value: "score-asc", label: "Score (low → high)" },
  { value: "level-desc", label: "Level (high → low)" },
  { value: "name-asc", label: "Name (A → Z)" },
];

/** Unscored builds sort last both ways: they have no score to rank. */
function byScore(a: HsrCharacter, b: HsrCharacter, dir: 1 | -1): number {
  if (a.diagnostics.complete !== b.diagnostics.complete) {
    return a.diagnostics.complete ? -1 : 1;
  }
  return dir * (a.diagnostics.score - b.diagnostics.score);
}

function sortCharacters(list: HsrCharacter[], key: SortKey): HsrCharacter[] {
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

const VERDICT_COLOR: Record<string, string> = {
  high: "var(--verdict-high)",
  medium: "var(--verdict-medium)",
  low: "var(--verdict-low)",
};

interface NextMove {
  character: HsrCharacter;
  relic: HsrRelic;
}

/**
 * The account-wide list of dice worth spending, best odds first. The Genshin
 * side has had this from the start; here it used to exist only per character,
 * so finding the best die on the account meant opening every panel.
 */
function BestNextMoves({ moves, onSelect }: { moves: NextMove[]; onSelect: (avatarId: number) => void }) {
  if (moves.length === 0) return null;
  return (
    <section className="game-panel border border-hsr-border bg-hsr-panel/50 p-4 sm:p-5" aria-labelledby="hsr-next-moves">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="hsr-next-moves" className="flex items-center gap-2 text-sm font-semibold text-hsr-text">
          <TargetIcon className="h-4 w-4 text-hsr-accent" /> Best next moves
        </h2>
        <span className="text-sm text-hsr-muted">Across the whole showcase, best odds first</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {moves.map(({ character, relic }) => {
          const color = VERDICT_COLOR[relic.reroll.priority ?? "low"];
          return (
            <button
              key={relic.id}
              type="button"
              onClick={() => onSelect(character.avatarId)}
              className="flex flex-col gap-2 rounded-lg border border-hsr-border bg-hsr-card/60 px-3 py-2.5 text-left transition-colors hover:border-hsr-accent/50 hover:bg-hsr-card"
              aria-label={`Jump to ${character.name}`}
            >
              <div className="flex items-center gap-2">
                <img
                  src={characterIcon(character.avatarId)}
                  alt=""
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full bg-hsr-inset object-cover ring-1 ring-hsr-line"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-hsr-text">{character.name}</div>
                  <div className="text-xs text-hsr-muted">
                    {SLOT_LABELS[relic.slot]} · {relic.setName}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className={`font-mono text-sm font-bold tabular-nums ${gradeColor(relic.score.grade)}`}>
                    {formatScore(relic.score.potentialPercent)}
                  </span>
                  {relic.score.grade && <GradeBadge grade={relic.score.grade} size="xs" />}
                </div>
              </div>
              <div className="rounded-md px-2 py-1" style={{ backgroundColor: tint(color, 12), color }}>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1">
                    <DiceIcon className="h-3 w-3 shrink-0" />
                    {relic.reroll.label}
                  </span>
                  <span className="font-mono">{Math.round(relic.reroll.improveChance * 100)}% / die</span>
                </div>
                {relic.reroll.targetStats.length > 0 && (
                  <p className="mt-0.5 truncate text-[11px] opacity-90">
                    Hope for {relic.reroll.targetStats.map(statLabel).join(" or ")}
                  </p>
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
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hsr-border px-3 text-sm text-hsr-muted transition-colors hover:border-hsr-accent/40 hover:text-hsr-text"
      aria-live="polite"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-verdict-high" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function HsrShowcasePage() {
  const { uid = "" } = useParams();
  const { data, isLoading, error, forceRefresh } = useHsrShowcase(uid);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("score-desc");

  const characters = useMemo(() => data?.characters ?? [], [data]);

  const paths = useMemo(() => Array.from(new Set(characters.map((c) => c.path))).sort(), [characters]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortCharacters(
      characters.filter((c) => {
        if (pathFilter !== "ALL" && c.path !== pathFilter) return false;
        if (q && !c.name.toLowerCase().includes(q)) return false;
        return true;
      }),
      sortKey,
    );
  }, [characters, search, pathFilter, sortKey]);

  const nextMoves = useMemo<NextMove[]>(
    () =>
      characters
        .flatMap((character) =>
          character.relics
            .filter((relic) => relic.reroll.action === "reroll")
            .map((relic) => ({ character, relic })),
        )
        .sort((a, b) => b.relic.reroll.improveChance - a.relic.reroll.improveChance)
        .slice(0, 6),
    [characters],
  );

  const toggle = (avatarId: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(avatarId)) next.delete(avatarId);
      else next.add(avatarId);
      return next;
    });

  const jumpTo = (avatarId: number) => {
    setExpanded((prev) => new Set(prev).add(avatarId));
    // Clear any filter hiding the target, then scroll once it has rendered.
    setSearch("");
    setPathFilter("ALL");
    window.requestAnimationFrame(() => {
      document.getElementById(characterPanelId(avatarId))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-md game-panel border border-verdict-replace/30 bg-verdict-replace/10 p-5 text-center">
        <p className="text-sm text-hsr-text">{error.message}</p>
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
  //
  // Only fully geared characters count toward the mean. A half-built one
  // scores against six slots either way, so leaving it in would drag the
  // account number down for gear the player has not finished rather than
  // gear that rolled badly. The roll counters still count every relic,
  // since those upgrades were really spent.
  const totals = characters.reduce(
    (acc, c) => ({
      effective: acc.effective + c.diagnostics.effectiveRolls,
      total: acc.total + c.diagnostics.totalRolls,
      score: acc.score + (c.diagnostics.complete ? c.diagnostics.score : 0),
      scored: acc.scored + (c.diagnostics.complete ? 1 : 0),
    }),
    { effective: 0, total: 0, score: 0, scored: 0 },
  );
  const accountScore = totals.scored > 0 ? totals.score / totals.scored : 0;
  const accountGrade = gradeFor(accountScore);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3 game-panel border border-hsr-border bg-hsr-panel/50 px-4 py-3 sm:gap-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-hsr-text">{data.nickname}</h1>
          <p className="font-mono text-sm text-hsr-muted">
            {data.uid} · TL {data.level} · {characters.length} characters
          </p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className={`font-mono text-2xl font-bold leading-none tabular-nums ${gradeColor(accountGrade)}`}>
              {formatScore(accountScore)}
            </p>
            <p className="mt-1 font-mono text-xs text-hsr-muted">
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
            className="inline-flex h-9 items-center rounded-lg border border-hsr-accent/40 bg-hsr-accent/15 px-3 text-sm font-semibold text-hsr-accent transition-colors hover:bg-hsr-accent/25"
          >
            Refresh
          </button>
        </div>
      </header>

      <BestNextMoves moves={nextMoves} onSelect={jumpTo} />

      {characters.length === 0 ? (
        <ShowcaseHelp
          title="This showcase has no characters on display"
          lead="Relic Aurum reads the characters you have made public in game, and nothing else. It never sees the rest of the account, so an empty showcase leaves it nothing to score."
          steps={[
            "In game, open the phone menu and select your profile at the top left.",
            "Edit the profile and fill the character showcase, up to eight characters.",
            "Save it, then come back here and hit Refresh.",
          ]}
          footer="Already set it up? The game takes a moment to publish the change. Give it a minute and refresh again."
          panelClass="border-hsr-border bg-hsr-panel/40 text-hsr-text"
          accentClass="bg-hsr-accent/15 text-hsr-accent"
          mutedClass="text-hsr-muted"
          slotClass="border-hsr-border bg-hsr-inset/60"
        />
      ) : (
        <div className="space-y-2">
          <div className="z-20 flex flex-col gap-2 rounded-lg border border-hsr-border bg-hsr-panel/90 p-3 backdrop-blur-md sm:sticky sm:top-16 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search characters…"
              aria-label="Search characters"
              className={`${CONTROL} min-w-[140px] flex-1 placeholder:text-hsr-muted/70`}
            />
            <select
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              aria-label="Filter by path"
              className={CONTROL}
            >
              <option value="ALL">All paths</option>
              {paths.map((p) => (
                <option key={p} value={p}>
                  {PATH_LABELS[p] ?? p}
                </option>
              ))}
            </select>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort characters"
              className={CONTROL}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {(search || pathFilter !== "ALL") && (
              <span className="whitespace-nowrap text-sm text-hsr-muted">
                {visible.length}/{characters.length} shown
              </span>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-hsr-muted">No characters match your filters.</p>
          ) : (
            visible.map((c, i) => (
              <CharacterPanel
                key={c.avatarId}
                character={c}
                index={i}
                open={expanded.has(c.avatarId)}
                onToggle={() => toggle(c.avatarId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
