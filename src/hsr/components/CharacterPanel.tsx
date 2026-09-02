import { useState } from "react";
import type { HsrCharacter } from "../types";
import { getWeights, PATH_LABELS } from "../weights";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { RelicCard } from "./RelicCard";
import { gradeColor } from "../labels";
import { characterIcon, characterPreview, elementIcon, lightConeIcon, pathIcon } from "../images";

const ELEMENT_TINT: Record<string, string> = {
  Physical: "#d4d4d8",
  Fire: "#fb7185",
  Ice: "#7dd3fc",
  Thunder: "#c084fc",
  Wind: "#5eead4",
  Quantum: "#818cf8",
  Imaginary: "#fde047",
};

/**
 * One character.
 *
 * Collapsed, it is a row you can scan: portrait, name, one score. Everything
 * numeric beyond that score is behind the expand, because the earlier version
 * put six relics and a stat table on screen at once for every character and
 * the page became unreadable.
 */
export function CharacterPanel({ character }: { character: HsrCharacter }) {
  const [open, setOpen] = useState(false);
  const weights = getWeights(character.avatarId);
  const d = character.diagnostics;
  const tint = ELEMENT_TINT[character.element] ?? "#7d86a3";
  const path = pathIcon(character.path);

  return (
    <section
      className="overflow-hidden rounded-xl border bg-hsr-panel/50 transition-colors"
      style={{ borderColor: open ? `${tint}44` : undefined }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.03] sm:gap-4 sm:p-4"
        aria-expanded={open}
      >
        <img
          src={characterIcon(character.avatarId)}
          alt=""
          loading="lazy"
          width={56}
          height={56}
          className="h-12 w-12 shrink-0 rounded-full bg-hsr-card object-cover sm:h-14 sm:w-14"
          style={{ boxShadow: `0 0 0 2px ${tint}55` }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {path && <img src={path} alt="" width={16} height={16} className="h-4 w-4 opacity-70" />}
            <img
              src={elementIcon(character.element)}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <h2 className="truncate text-sm font-semibold text-hsr-text sm:text-base">
              {character.name}
            </h2>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-hsr-muted">
            Lv{character.level} · E{character.eidolon} ·{" "}
            {PATH_LABELS[character.path] ?? character.path}
          </p>
          {character.lightCone && (
            <div className="mt-1 flex items-center gap-1.5">
              <img
                src={lightConeIcon(character.lightCone.id)}
                alt=""
                loading="lazy"
                width={18}
                height={18}
                className="h-4 w-4 shrink-0 rounded-sm object-cover"
              />
              <p className="truncate text-[11px] text-hsr-muted">
                {character.lightCone.name}
                <span className="ml-1 text-hsr-glow/70">S{character.lightCone.superimposition}</span>
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className={`font-mono text-xl font-bold leading-none sm:text-2xl ${gradeColor(d.grade)}`}>
            {d.score.toFixed(0)}
            <span className="text-sm">%</span>
          </p>
          <p className={`mt-0.5 font-mono text-[11px] font-semibold ${gradeColor(d.grade)}`}>
            {d.grade}
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
        <div className="relative border-t" style={{ borderColor: `${tint}22` }}>
          {/* Splash art, held far back so it reads as atmosphere and never
              competes with the numbers sitting on top of it. */}
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-right-top opacity-[0.07]"
            style={{ backgroundImage: `url(${characterPreview(character.avatarId)})` }}
            aria-hidden="true"
          />
          <div className="relative space-y-4 p-3 sm:p-4">
            <DiagnosticsPanel d={d} tint={tint} />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {character.relics.map((relic) => (
                <RelicCard key={relic.id} relic={relic} weights={weights} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
