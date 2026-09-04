import type { ScoreGrade } from "../../types/artifact";
import { gradeVar, tint } from "../../lib/grade";
import { formatScore } from "../../lib/format";
import { useI18n } from "../../i18n";

interface BuildScoreBarProps {
  score: number;
  grade: ScoreGrade;
  /** False while slots are still empty; the meter is replaced by a note. */
  complete: boolean;
  artifactCount: number;
  correctMainStats: number;
  totalSelectableSlots: number;
}

/** Where each band starts on the 0-200 scale, for the tick labels under the bar. */
const TICKS: Array<{ label: string; at: number; minor?: boolean }> = [
  { label: "F", at: 0 },
  { label: "D", at: 20, minor: true },
  { label: "C", at: 40 },
  { label: "B", at: 60, minor: true },
  { label: "A", at: 80 },
  { label: "S", at: 100 },
  { label: "SS", at: 120, minor: true },
  { label: "SSS", at: 140, minor: true },
  { label: "WTF", at: 160 },
];

/**
 * The build's one number as a meter. Sits at the top of the expanded card so
 * it summarises what follows; it used to close the card, after a stats table
 * that repeated the collapsed strip.
 */
export function BuildScoreBar({
  score,
  grade,
  complete,
  artifactCount,
  correctMainStats,
  totalSelectableSlots,
}: BuildScoreBarProps) {
  const { t } = useI18n();
  const color = gradeVar(grade);

  // A build missing pieces gets no meter and no letter. The average runs over
  // equipped pieces only, so two good artifacts would otherwise present as a
  // finished S+ build; the artifacts below are still graded individually.
  if (!complete) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-dark-border bg-dark-card/40 p-3 sm:p-4">
        <div className="flex h-14 min-w-14 flex-shrink-0 items-center justify-center rounded-lg bg-dark-border/30 px-2 font-mono text-2xl font-bold text-dark-muted">
          &mdash;
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-dark-muted">
            {t("showcase", "buildScore")}
            <span className="mx-1.5 opacity-50" aria-hidden="true">·</span>
            {t("showcase", "mainStats", { correct: correctMainStats, total: totalSelectableSlots })}
          </div>
          <p className="mt-1 text-sm text-dark-muted/80">
            {t("showcase", "incompleteScore", { count: artifactCount })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-dark-border bg-dark-card/40 p-3 sm:p-4">
      <div
        className="flex h-14 min-w-14 flex-shrink-0 items-center justify-center rounded-lg px-2 font-mono text-2xl font-bold"
        style={{ backgroundColor: tint(color, 16), color }}
      >
        {grade}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-dark-muted">
            {t("showcase", "buildScore")}
            {artifactCount < 5 && <span className="ml-1 opacity-70">({artifactCount}/5)</span>}
            <span className="mx-1.5 opacity-50" aria-hidden="true">·</span>
            {t("showcase", "mainStats", { correct: correctMainStats, total: totalSelectableSlots })}
          </span>
          <span className="font-mono text-xl font-bold tabular-nums" style={{ color }}>
            {formatScore(score)}
          </span>
        </div>

        <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-dark-border/40">
          <div
            className="animate-bar-grow h-full rounded-full"
            style={{ width: `${Math.min(score / 2, 100)}%`, backgroundColor: color }}
          />
        </div>

        <div className="relative mt-1 h-4 text-[11px] font-medium text-dark-muted">
          {TICKS.map((tick) => (
            <span
              key={tick.label}
              // Every other tick hides on narrow screens, where nine labels
              // across a 220px bar collide into one word.
              className={`absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full ${
                tick.minor ? "hidden sm:inline" : ""
              }`}
              style={{ left: `${tick.at / 2}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
