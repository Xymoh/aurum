import { useEffect } from "react";
import { CloseIcon } from "./icons";
import { ScoringExplainer } from "./ScoringExplainer";

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
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <ScoringExplainer />

        <p className="mt-5 pt-3 border-t border-dark-border/60 text-xs text-dark-muted/70 leading-relaxed">
          This is a quick evaluation tool, not a definitive build guide - scores reflect general
          substat priorities and may not fit every team comp or playstyle.
        </p>
      </div>
    </div>
  );
}
