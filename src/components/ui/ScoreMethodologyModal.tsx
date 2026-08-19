import { useEffect } from "react";
import { GRADE_THRESHOLDS } from "../../lib/constants";

interface ScoreMethodologyModalProps {
  onClose: () => void;
}

export function ScoreMethodologyModal({ onClose }: ScoreMethodologyModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Grade table shown coarsest-first, deduped to one row per 10% band for readability.
  const gradeRows = GRADE_THRESHOLDS.filter((_, i) => i % 2 === 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Scoring methodology"
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-dark-border bg-dark-card p-5 sm:p-6 scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-text">How Scoring Works</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-muted hover:text-dark-text hover:bg-dark-border/40 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-sm text-dark-muted leading-relaxed">
          <section>
            <h3 className="text-dark-text font-semibold mb-1.5">Potential %</h3>
            <p>
              Each artifact's substats are weighted by how much they matter for the equipped
              character, then compared against that character's theoretical ideal roll. The result
              is a 0–200% scale: <span className="text-dark-text font-medium">100%</span> is a
              solid, usable piece (roughly 4.5 max-value rolls), and{" "}
              <span className="text-dark-text font-medium">200%</span> is a near-impossible,
              perfectly-rolled artifact. Main stats don't affect the score directly — Flower/Plume
              are fixed, and Sands/Goblet/Circlet main stat correctness is shown separately.
            </p>
          </section>

          <section>
            <h3 className="text-dark-text font-semibold mb-2">Grade Scale</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {gradeRows.map((g) => (
                <div
                  key={g.grade}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-mono font-semibold"
                  style={{ backgroundColor: `${g.color}18`, color: g.color }}
                >
                  <span>{g.grade}</span>
                  <span className="opacity-80">{g.min}%+</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-dark-text font-semibold mb-1.5">Main Stat & Set Bonus</h3>
            <p>
              A ⚠️ next to a main stat means it doesn't match the character's recommended stat for
              that slot. The Set Bonuses panel on each character card shows which 2‑piece/4‑piece
              bonuses are active and whether they match the recommended sets — both are
              informational and don't change the artifact's score.
            </p>
          </section>

          <section>
            <h3 className="text-dark-text font-semibold mb-1.5 flex items-center gap-1.5">
              <span aria-hidden="true">🎲</span> Reroll Upside
            </h3>
            <p>
              Since version 5.7, Genshin's <span className="text-dark-text font-medium">Dust of
              Enlightenment</span> lets you reshape which substats received the 5 upgrade rolls on
              a fully-leveled 5★ artifact — it can't change which 4 stats are present, only how the
              rolls are distributed among them. When a piece is eligible (level 20, 5★) and
              reshaping toward its best-weighted stat could meaningfully raise its score, a{" "}
              <span aria-hidden="true">🎲 Reroll upside</span> badge shows the estimated best-case
              gain. It's a ceiling estimate assuming favorable RNG, not a guaranteed outcome.
            </p>
          </section>

          <p className="text-xs text-dark-muted/70 pt-1 border-t border-dark-border/60">
            This is a quick evaluation tool, not a definitive build guide — scores reflect general
            substat priorities and may not fit every team comp or playstyle.
          </p>
        </div>
      </div>
    </div>
  );
}
