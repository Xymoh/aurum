import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sanitizeUidInput, isValidUid } from "../../lib/uid";
import { useI18n } from "../../i18n";

export function UidInput() {
  const [rawInput, setRawInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeUidInput(e.target.value);
    setRawInput(sanitized);
    if (sanitized.length > 0 && !isValidUid(sanitized) && sanitized.length === 9) {
      setError(t("uid", "invalid"));
    } else {
      setError("");
    }
  }, [t]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidUid(rawInput)) {
        setError("Please enter a valid 9-digit Genshin UID.");
        return;
      }

      setIsSubmitting(true);
      // Store in recent UIDs
      try {
        const stored = localStorage.getItem("recent-uids");
        const recent: Array<{ uid: string; timestamp: number }> = stored
          ? JSON.parse(stored)
          : [];
        const filtered = recent.filter((entry) => entry.uid !== rawInput);
        filtered.unshift({ uid: rawInput, timestamp: Date.now() });
        localStorage.setItem("recent-uids", JSON.stringify(filtered.slice(0, 10)));
      } catch {
        // Storage unavailable, ignore
      }

      navigate(`/showcase/${rawInput}`);
    },
    [rawInput, navigate],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t("uid", "placeholder")}
            value={rawInput}
            onChange={handleChange}
            maxLength={9}
            className={`flex-1 h-12 px-4 rounded-xl text-lg font-mono tracking-wider
              bg-dark-card border outline-none transition-all duration-200
              text-dark-text placeholder:text-dark-muted/50
              ${
                error
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-dark-border focus:border-accent"
              }
              ${rawInput.length === 9 && !error ? "animate-[pulse_2s_ease-in-out_1]" : ""}
            `}
            aria-label="Genshin Impact UID"
            aria-describedby={error ? "uid-error" : undefined}
          />
          <button
            type="submit"
            disabled={!isValidUid(rawInput) || isSubmitting}
            className="h-12 px-4 sm:px-6 rounded-xl bg-accent text-dark-bg font-semibold text-sm
              hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center gap-2 flex-shrink-0"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-dark-bg/40 border-t-dark-bg rounded-full animate-spin" />
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="hidden sm:inline">{t("uid", "lookUp")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p id="uid-error" className="text-xs text-red-400 pl-1" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
