import { GRADE_THRESHOLDS } from "../../lib/constants";
import { REROLL_TIERS } from "../../lib/reroll";
import { WarningIcon, DiceIcon, RecycleIcon, CheckIcon } from "./icons";
import { useI18n } from "../../i18n";

/** Tier ids map to the verdict labels and blurbs held in the dictionaries. */
const TIER_LABEL = {
  high: "rerollNow",
  medium: "worthRerolling",
  low: "lowPriority",
} as const;

/**
 * The scoring and reroll reference, shared by the in-app methodology modal and
 * the home page. Kept in one place so the two can't drift apart, and so the
 * thresholds and tier labels are read from the same constants the scoring
 * engine uses rather than restated by hand.
 */
export function ScoringExplainer() {
  const { t } = useI18n();

  // Coarsened to one row per 10% band - the full 18-grade table is too dense to skim.
  const gradeRows = GRADE_THRESHOLDS.filter((_, i) => i % 2 === 0);

  return (
    <div className="space-y-5 text-sm text-dark-muted leading-relaxed">
      <section>
        <h3 className="text-dark-text font-semibold mb-1.5">{t("explainer", "potentialTitle")}</h3>
        <p>{t("explainer", "potentialBody")}</p>
      </section>

      <section>
        <h3 className="text-dark-text font-semibold mb-2">{t("explainer", "gradeTitle")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
        <h3 className="text-dark-text font-semibold mb-1.5">{t("explainer", "mainStatTitle")}</h3>
        <p className="flex flex-wrap items-center gap-1">
          <WarningIcon className="w-3 h-3 inline text-amber-500 align-[-2px]" />
          {t("explainer", "mainStatBody")}
        </p>
      </section>

      <section>
        <h3 className="text-dark-text font-semibold mb-1.5 flex items-center gap-1.5">
          <DiceIcon className="w-4 h-4 text-dark-text" /> {t("explainer", "rerollTitle")}
        </h3>
        <p className="mb-2.5">{t("explainer", "rerollP1")}</p>
        <p className="mb-2.5">{t("explainer", "rerollP2")}</p>
        <p className="mb-2.5">{t("explainer", "rerollP3")}</p>
        <div className="space-y-1">
          {REROLL_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold gap-2"
              style={{ backgroundColor: `${tier.color}18`, color: tier.color }}
            >
              <span className="flex items-center gap-1.5">
                <DiceIcon className="w-3 h-3 flex-shrink-0" /> {t("verdict", TIER_LABEL[tier.id])}
              </span>
              <span className="opacity-80 font-mono whitespace-nowrap">
                {t("explainer", "dustAvg", { n: tier.maxExpectedDust })}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold bg-dark-border/40 text-dark-muted gap-2">
            <span className="flex items-center gap-1.5">
              <RecycleIcon className="w-3 h-3 flex-shrink-0" /> {t("verdict", "farmReplacement")}
            </span>
            <span className="opacity-80">{t("explainer", "tierReplaceNote")}</span>
          </div>
          <div className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold bg-dark-border/40 text-dark-muted gap-2">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="w-3 h-3 flex-shrink-0" /> {t("verdict", "wellRolled")}
            </span>
            <span className="opacity-80">{t("explainer", "tierWellRolledNote")}</span>
          </div>
        </div>
        <p className="mt-2.5 text-xs">{t("explainer", "rerollP4")}</p>
        <p className="mt-2.5 text-xs">{t("explainer", "rerollP5")}</p>
      </section>

      <section>
        <h3 className="text-dark-text font-semibold mb-1.5 flex items-center gap-1.5">
          <WarningIcon className="w-4 h-4 text-amber-500" /> {t("explainer", "erTitle")}
        </h3>
        <p>{t("explainer", "erP1")}</p>
        <p className="mt-2.5">{t("explainer", "erP2")}</p>
        <p className="mt-2.5 text-xs">{t("explainer", "erP3")}</p>
      </section>
    </div>
  );
}
