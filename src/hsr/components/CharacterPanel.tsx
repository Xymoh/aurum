import { useState } from "react";
import type { HsrCharacter } from "../types";
import { getWeights, PATH_LABELS } from "../weights";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { RelicCard } from "./RelicCard";
import { efficiencyColor } from "../labels";

const PATH_COLOR: Record<string, string> = {
  Warrior: "text-path-warrior",
  Rogue: "text-path-rogue",
  Mage: "text-path-mage",
  Knight: "text-path-knight",
  Priest: "text-path-priest",
  Shaman: "text-path-shaman",
  Warlock: "text-path-warlock",
  Memory: "text-path-memory",
  Elation: "text-path-elation",
};

const ELEMENT_COLOR: Record<string, string> = {
  Physical: "text-hsrel-physical",
  Fire: "text-hsrel-fire",
  Ice: "text-hsrel-ice",
  Thunder: "text-hsrel-thunder",
  Wind: "text-hsrel-wind",
  Quantum: "text-hsrel-quantum",
  Imaginary: "text-hsrel-imaginary",
};

export function CharacterPanel({ character }: { character: HsrCharacter }) {
  const [open, setOpen] = useState(false);
  const weights = getWeights(character.avatarId);
  const d = character.diagnostics;

  return (
    <section className="overflow-hidden rounded-xl border border-hsr-border bg-hsr-panel/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hsr-card/50"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="truncate text-base font-semibold text-hsr-text">{character.name}</h2>
            <span className={`text-[11px] ${ELEMENT_COLOR[character.element] ?? "text-hsr-muted"}`}>
              {character.element}
            </span>
            <span className={`text-[11px] ${PATH_COLOR[character.path] ?? "text-hsr-muted"}`}>
              {PATH_LABELS[character.path] ?? character.path}
            </span>
            <span className="font-mono text-[11px] text-hsr-muted">
              Lv{character.level} E{character.eidolon}
            </span>
          </div>
          {character.lightCone && (
            <p className="mt-0.5 truncate text-[11px] text-hsr-muted">
              {character.lightCone.name}
              <span className="ml-1.5 font-mono text-hsr-glow/70">
                S{character.lightCone.superimposition}
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className={`font-mono text-lg font-bold ${efficiencyColor(d.efficiency)}`}>
            {d.efficiency.toFixed(0)}%
          </p>
          <p className="font-mono text-[10px] text-hsr-muted">
            {d.effectiveRolls}/{d.totalRolls} rolls
          </p>
        </div>

        <svg
          className={`h-4 w-4 shrink-0 text-hsr-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 border-t border-hsr-border px-4 py-4">
          <DiagnosticsPanel d={d} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {character.relics.map((relic) => (
              <RelicCard key={relic.id} relic={relic} weights={weights} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
