import { useEffect, useMemo, useState } from "react";
import type { CharacterData } from "../../types/character";
import type { GenshinElement } from "../../types/character";
import { CharacterCard } from "./CharacterCard";
import charactersEmptyIcon from "../../assets/svg/ico-characters-empty.svg";
import { useI18n } from "../../i18n";

export interface FocusSignal {
  characterId: string;
  token: number;
}

interface CharacterGridProps {
  characters: CharacterData[];
  focusSignal?: FocusSignal | null;
}

type SortKey = "score-desc" | "score-asc" | "level-desc" | "name-asc";

const SORT_OPTIONS = [
  { value: "score-desc", key: "sortScoreDesc" },
  { value: "score-asc", key: "sortScoreAsc" },
  { value: "level-desc", key: "sortLevelDesc" },
  { value: "name-asc", key: "sortNameAsc" },
] as const;

/**
 * Unscored builds sort last whichever way the score sorts, including "lowest
 * first": they have no score to be lowest, and putting half-built characters
 * at the top of that list buries the ones the sort is actually asking about.
 */
function byScore(a: CharacterData, b: CharacterData, dir: 1 | -1): number {
  if (a.buildScore.complete !== b.buildScore.complete) {
    return a.buildScore.complete ? -1 : 1;
  }
  return dir * (a.buildScore.total - b.buildScore.total);
}

function sortCharacters(characters: CharacterData[], sortKey: SortKey): CharacterData[] {
  const sorted = [...characters];
  switch (sortKey) {
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

export function CharacterGrid({ characters, focusSignal }: CharacterGridProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<GenshinElement | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("score-desc");
  const { t } = useI18n();

  const elements = useMemo(() => {
    const seen = new Set<GenshinElement>();
    for (const c of characters) seen.add(c.element);
    return Array.from(seen).sort();
  }, [characters]);

  const visibleCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = characters.filter((c) => {
      if (elementFilter !== "ALL" && c.element !== elementFilter) return false;
      if (query && !c.name.toLowerCase().includes(query)) return false;
      return true;
    });
    return sortCharacters(filtered, sortKey);
  }, [characters, search, elementFilter, sortKey]);

  // External navigation (e.g. from the "Room to Improve" panel) expands + scrolls to a character.
  useEffect(() => {
    if (!focusSignal) return;
    setExpandedIds((prev) => new Set(prev).add(focusSignal.characterId));
    const el = document.getElementById(`character-${focusSignal.characterId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal?.characterId, focusSignal?.token]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
        <img src={charactersEmptyIcon} alt="" className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">{t("showcase", "noCharacters")}</p>
        <p className="text-sm mt-1 opacity-60">
          {t("showcase", "noCharactersHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search / filter / sort controls */}
      {/* Sticky from sm up only: stacked, the three controls would cover a
          third of a phone screen. */}
      <div className="z-20 flex flex-col gap-2 rounded-lg border border-dark-border bg-dark-card/90 p-3 backdrop-blur-md sm:sticky sm:top-16 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("showcase", "searchPlaceholder")}
          className="flex-1 min-w-[140px] rounded-lg bg-dark-bg border border-dark-border px-3 py-1.5 text-sm text-dark-text placeholder:text-dark-muted/60 focus:outline-none focus:border-accent/60"
        />

        <select
          value={elementFilter}
          onChange={(e) => setElementFilter(e.target.value as GenshinElement | "ALL")}
          className="rounded-lg bg-dark-bg border border-dark-border px-2.5 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent/60"
        >
          <option value="ALL">{t("showcase", "allElements")}</option>
          {elements.map((el) => (
            <option key={el} value={el}>{t("elements", el)}</option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg bg-dark-bg border border-dark-border px-2.5 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent/60"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t("showcase", opt.key)}</option>
          ))}
        </select>

        {(search || elementFilter !== "ALL") && (
          <span className="text-sm text-dark-muted whitespace-nowrap">
            {t("showcase", "shown", { visible: visibleCharacters.length, total: characters.length })}
          </span>
        )}
      </div>

      {visibleCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-dark-muted">
          <p className="text-sm">{t("showcase", "noMatch")}</p>
        </div>
      ) : (
        visibleCharacters.map((character, index) => (
          <CharacterCard
            key={character.id}
            character={character}
            index={index}
            isExpanded={expandedIds.has(character.id)}
            onToggleExpand={() => toggleExpand(character.id)}
          />
        ))
      )}
    </div>
  );
}
