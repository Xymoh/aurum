import { useId, useState } from "react";
import type { ZzzAgent } from "../types";
import { getAgentInfo, getScoringMeta } from "../weights";
import { BuildPanel } from "./BuildPanel";
import { DiscCard } from "./DiscCard";
import { ELEMENT_LABELS, PROFESSION_LABELS } from "../labels";
import { agentImage } from "../images";
import { GradeBadge } from "../../components/ui/GradeBadge";
import { formatScore } from "../../lib/format";
import { gradeTextClass } from "../../lib/grade";
import { agentPanelId } from "../panelId";

interface AgentPanelProps {
  agent: ZzzAgent;
  index: number;
  open: boolean;
  onToggle: () => void;
}

/**
 * One agent. The header borrows the game's own accent colour for the agent
 * (Enka publishes it), so the list reads like the in-game roster rather than
 * one long grey column. Open state is owned by the page.
 */
export function AgentPanel({ agent, index, open, onToggle }: AgentPanelProps) {
  const [everOpened, setEverOpened] = useState(open);
  if (open && !everOpened) setEverOpened(true);

  const bodyId = useId();
  const meta = getScoringMeta(agent.id);
  const d = agent.diagnostics;
  const tint = getAgentInfo(agent.id)?.accent ?? "#d4ff00";
  const art = agentImage(agent.id);

  return (
    <section
      id={agentPanelId(agent.id)}
      className="animate-fade-in-up scroll-mt-20 overflow-hidden rounded-xl border border-zzz-border bg-zzz-panel/60 transition-colors"
      style={{ borderColor: open ? `${tint}66` : undefined, animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="group relative flex w-full items-stretch gap-3 overflow-hidden p-3 text-left sm:gap-4 sm:p-4"
      >
        {/* Full-body art, contained on the right and faded into the card. */}
        <div className="pointer-events-none absolute inset-0 flex justify-end" aria-hidden="true">
          <div
            className="relative h-full w-2/3 sm:w-1/2"
            style={{ maskImage: "linear-gradient(to right, transparent, black 55%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)" }}
          >
            {art && (
              <img
                src={art}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover object-[center_15%] opacity-60 transition-opacity duration-300 group-hover:opacity-80"
              />
            )}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundColor: tint }} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zzz-panel via-zzz-panel/95 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-44 bg-gradient-to-l from-zzz-panel via-zzz-panel/85 to-transparent" aria-hidden="true" />

        {/* Skewed accent bar, a nod to the game's diagonal UI. */}
        <div className="relative w-1.5 shrink-0 -skew-x-12 rounded-sm" style={{ backgroundColor: tint }} aria-hidden="true" />

        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black uppercase tracking-wide text-zzz-text sm:text-lg">{agent.name}</h2>
            <GradeBadge grade={d.grade} size="sm" className="hidden sm:inline-flex" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-zzz-line bg-zzz-inset px-1.5 py-0.5 font-mono text-xs text-zzz-text">Lv{agent.level}</span>
            <span className="rounded border border-zzz-line bg-zzz-inset px-1.5 py-0.5 font-mono text-xs text-zzz-text">M{agent.mindscape}</span>
            <span className="rounded border border-zzz-line bg-zzz-inset px-1.5 py-0.5 text-xs text-zzz-muted">
              {PROFESSION_LABELS[agent.profession] ?? agent.profession}
            </span>
            <span className="hidden rounded border border-zzz-line bg-zzz-inset px-1.5 py-0.5 text-xs text-zzz-muted sm:inline">
              {ELEMENT_LABELS[agent.element] ?? agent.element}
            </span>
          </div>
          <div className="mt-1.5 hidden flex-wrap items-center gap-1.5 sm:flex">
            {(
              [
                ["Basic", agent.skills.basic],
                ["Dodge", agent.skills.dodge],
                ["Assist", agent.skills.assist],
                ["Special", agent.skills.special],
                ["Chain", agent.skills.chain],
              ] as const
            ).map(([label, level]) => (
              <span key={label} className="rounded border border-zzz-line bg-zzz-inset px-1.5 py-0.5 text-xs text-zzz-muted">
                {label} <span className="font-mono text-zzz-text">{level}</span>
              </span>
            ))}
            <span className="rounded border border-zzz-line bg-zzz-inset px-1.5 py-0.5 text-xs text-zzz-muted">
              Core <span className="font-mono text-zzz-text">{"ABCDEF"[Math.max(0, agent.coreSkill - 1)] ?? "-"}</span>
            </span>
          </div>
          {agent.engine && (
            <div className="mt-1.5 flex items-center gap-2">
              {agent.engine.image && (
                <img src={agent.engine.image} alt="" loading="lazy" width={44} height={44} className="h-8 w-8 shrink-0 rounded object-contain ring-1 ring-zzz-line sm:h-10 sm:w-10" />
              )}
              <p className="truncate text-sm text-zzz-muted">
                {agent.engine.name}
                <span className="ml-1 font-mono text-zzz-accent">P{agent.engine.rank}</span>
              </p>
            </div>
          )}
        </div>

        <div className="relative shrink-0 self-center text-right">
          <p className={`font-mono text-2xl font-black leading-none tabular-nums sm:text-3xl ${gradeTextClass(d.grade)}`}>
            {formatScore(d.score)}
          </p>
          <p className="mt-1 sm:hidden">
            <GradeBadge grade={d.grade} size="xs" />
          </p>
          <p className="mt-1 font-mono text-xs text-zzz-muted">
            {d.effectiveRolls}/{d.totalRolls} rolls
          </p>
        </div>

        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-zzz-line bg-zzz-inset text-zzz-muted transition-colors group-hover:text-zzz-text">
          <svg className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {everOpened && (
        <div id={bodyId} className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <div className="space-y-4 border-t p-3 sm:p-4" style={{ borderColor: `${tint}33` }}>
              <BuildPanel d={d} meta={meta} tint={tint} />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {agent.discs.map((disc) => (
                  <DiscCard key={disc.id} disc={disc} weights={meta.stats} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
