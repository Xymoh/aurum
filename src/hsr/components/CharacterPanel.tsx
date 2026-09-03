import { useId, useState } from "react";
import type { HsrCharacter } from "../types";
import { getWeights, PATH_LABELS } from "../weights";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { RelicCard } from "./RelicCard";
import { gradeColor } from "../labels";
import { characterPreview, elementIcon, lightConeIcon, pathIcon } from "../images";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { formatScore } from "../../lib/format";
import { characterPanelId } from "../panelId";

const ELEMENT_TINT: Record<string, string> = {
  Physical: "#d4d4d8",
  Fire: "#fb7185",
  Ice: "#7dd3fc",
  Thunder: "#c084fc",
  Wind: "#5eead4",
  Quantum: "#818cf8",
  Imaginary: "#fde047",
};

/** Trace levels, labelled the way the game labels them. */
function Traces({ t }: { t: NonNullable<HsrCharacter["traces"]> }) {
  const parts = [
    { label: "Basic", value: t.basic },
    { label: "Skill", value: t.skill },
    { label: "Ult", value: t.ultimate },
    { label: "Talent", value: t.talent },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {parts.map((p) => (
        <span
          key={p.label}
          className="rounded border border-hsr-line bg-hsr-inset px-1.5 py-0.5 text-xs text-hsr-muted"
        >
          {p.label} <span className="font-mono text-hsr-text">{p.value}</span>
        </span>
      ))}
      {t.bonusTotal > 0 && (
        <span
          className="rounded border border-hsr-line bg-hsr-inset px-1.5 py-0.5 text-xs text-hsr-muted"
          title="Bonus trace nodes taken"
        >
          Traces{" "}
          <span className="font-mono text-hsr-text">
            {t.bonusTaken}/{t.bonusTotal}
          </span>
        </span>
      )}
    </div>
  );
}

interface CharacterPanelProps {
  character: HsrCharacter;
  index: number;
  open: boolean;
  onToggle: () => void;
}

/**
 * One character.
 *
 * The art sits in the header as a banner masked into the card, the way the
 * Genshin cards do it. Open state is owned by the page, so the account-wide
 * "best next moves" panel can open a character it points at.
 */
export function CharacterPanel({ character, index, open, onToggle }: CharacterPanelProps) {
  // Mounted on first expand and then kept, so collapsing has something to
  // animate. Mounting six relic cards for every character up front, purely to
  // enable a fold, is a lot of DOM for a twelve-character showcase.
  const [everOpened, setEverOpened] = useState(open);
  if (open && !everOpened) setEverOpened(true);

  const bodyId = useId();
  const weights = getWeights(character.avatarId);
  const d = character.diagnostics;
  const tint = ELEMENT_TINT[character.element] ?? "#7d86a3";
  const path = pathIcon(character.path);

  return (
    <section
      id={characterPanelId(character.avatarId)}
      className="animate-fade-in-up scroll-mt-20 overflow-hidden rounded-xl border border-hsr-border bg-hsr-panel/50 transition-colors"
      style={{
        borderColor: open ? `${tint}55` : undefined,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="group relative flex w-full items-stretch gap-3 overflow-hidden p-3 text-left sm:gap-4 sm:p-4"
        aria-expanded={open}
        aria-controls={bodyId}
      >
        {/* Splash art, masked into the card so it reads as part of the surface
            rather than a picture pasted behind it.

            Contained, not cropped. The source images are 376x512 portraits and
            the face sits at a different height in each one, so any fixed crop
            beheads somebody: at 18% from the top Sparxie showed only her hat.
            Fitting the whole portrait cannot cut a face off no matter what the
            composition is. */}
        <div className="pointer-events-none absolute inset-0 flex justify-end" aria-hidden="true">
          <div
            className="relative h-full w-2/3 sm:w-1/2"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 55%)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)",
            }}
          >
            <img
              src={characterPreview(character.avatarId)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-[center_30%] opacity-60 transition-opacity duration-300 group-hover:opacity-80"
            />
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay"
              style={{ backgroundColor: tint }}
            />
          </div>
        </div>
        {/* Left wash, so the text always has a solid ground beneath it. */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-hsr-panel via-hsr-panel/95 to-transparent"
          aria-hidden="true"
        />
        {/* And a right wash: the score and the chevron sit over the brightest
            part of the art, where muted text disappears entirely. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-44 bg-gradient-to-l from-hsr-panel via-hsr-panel/85 to-transparent"
          aria-hidden="true"
        />

        <div
          className="relative w-1 shrink-0 rounded-full"
          style={{ backgroundColor: tint }}
          aria-hidden="true"
        />

        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {path && <img src={path} alt="" width={20} height={20} className="h-5 w-5 opacity-80" />}
            <img
              src={elementIcon(character.element)}
              alt={character.element}
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <h2 className="truncate text-base font-semibold text-hsr-text sm:text-lg">
              {character.name}
            </h2>
            <GradeBadge grade={d.grade} size="sm" className="hidden sm:inline-flex" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-hsr-line bg-hsr-inset px-1.5 py-0.5 font-mono text-xs text-hsr-text">
              Lv{character.level}
            </span>
            <span className="rounded border border-hsr-line bg-hsr-inset px-1.5 py-0.5 font-mono text-xs text-hsr-text">
              E{character.eidolon}
            </span>
            <span className="hidden rounded border border-hsr-line bg-hsr-inset px-1.5 py-0.5 text-xs text-hsr-muted sm:inline">
              {PATH_LABELS[character.path] ?? character.path}
            </span>
          </div>

          {character.traces && (
            <div className="mt-1.5 hidden sm:block">
              <Traces t={character.traces} />
            </div>
          )}

          {character.lightCone && (
            <div className="mt-1.5 flex items-center gap-2">
              <img
                src={lightConeIcon(character.lightCone.id)}
                alt=""
                loading="lazy"
                width={56}
                height={56}
                className="h-8 w-8 shrink-0 rounded object-cover ring-1 ring-hsr-line sm:h-11 sm:w-11"
              />
              <p className="truncate text-sm text-hsr-muted">
                {character.lightCone.name}
                <span className="ml-1 font-mono text-hsr-glow">S{character.lightCone.superimposition}</span>
              </p>
            </div>
          )}
        </div>

        <div className="relative shrink-0 self-center text-right">
          <p className={`font-mono text-2xl font-bold leading-none tabular-nums sm:text-3xl ${gradeColor(d.grade)}`}>
            {formatScore(d.score)}
          </p>
          <p className="mt-1 sm:hidden">
            <GradeBadge grade={d.grade} size="xs" />
          </p>
          <p className="mt-1 font-mono text-xs text-hsr-muted">
            {d.effectiveRolls}/{d.totalRolls} rolls
          </p>
        </div>

        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-hsr-line bg-hsr-inset text-hsr-muted transition-colors group-hover:text-hsr-text">
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expand and collapse both animate. The grid row runs 0fr to 1fr, which
          transitions cleanly without needing the content height up front. */}
      {everOpened && (
        <div
          id={bodyId}
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t p-3 sm:p-4" style={{ borderColor: `${tint}33` }}>
              <DiagnosticsPanel d={d} tint={tint} relics={character.relics} />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {character.relics.map((relic) => (
                  <RelicCard key={relic.id} relic={relic} weights={weights} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
