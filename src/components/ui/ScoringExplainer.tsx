import { GRADE_THRESHOLDS } from "../../lib/constants";
import { REROLL_TIERS } from "../../lib/reroll";
import { gradeStyle, tint } from "../../lib/grade";
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
    <div className="space-y-5 text-sm leading-relaxed text-dark-muted">
      <section>
        <h3 className="mb-1.5 font-semibold text-dark-text">{t("explainer", "potentialTitle")}</h3>
        <p>{t("explainer", "potentialBody")}</p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-dark-text">{t("explainer", "gradeTitle")}</h3>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {gradeRows.map((g) => (
            <div
              key={g.grade}
              className="flex items-center justify-between rounded-md px-2 py-1 font-mono text-sm font-semibold"
              style={gradeStyle(g.grade, 12)}
            >
              <span>{g.grade}</span>
              <span className="opacity-80">{g.min}%+</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-dark-text">{t("explainer", "mainStatTitle")}</h3>
        <p className="flex flex-wrap items-center gap-1">
          <WarningIcon className="inline h-3 w-3 align-[-2px] text-warn" />
          {t("explainer", "mainStatBody")}
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold text-dark-text">
          <DiceIcon className="h-4 w-4 text-dark-text" /> {t("explainer", "rerollTitle")}
        </h3>
        <p className="mb-2.5">{t("explainer", "rerollP1")}</p>
        <p className="mb-2.5">{t("explainer", "rerollP2")}</p>
        <p className="mb-2.5">{t("explainer", "rerollP3")}</p>
        <div className="space-y-1">
          {REROLL_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm font-semibold"
              style={{ backgroundColor: tint(tier.color, 12), color: tier.color }}
            >
              <span className="flex items-center gap-1.5">
                <DiceIcon className="h-3 w-3 flex-shrink-0" /> {t("verdict", TIER_LABEL[tier.id])}
              </span>
              <span className="whitespace-nowrap font-mono opacity-80">
                {t("explainer", "dustAvg", { n: tier.maxExpectedDust })}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 rounded-md bg-dark-border/40 px-2 py-1 text-sm font-semibold text-dark-muted">
            <span className="flex items-center gap-1.5">
              <RecycleIcon className="h-3 w-3 flex-shrink-0" /> {t("verdict", "farmReplacement")}
            </span>
            <span className="opacity-80">{t("explainer", "tierReplaceNote")}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-dark-border/40 px-2 py-1 text-sm font-semibold text-dark-muted">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3 w-3 flex-shrink-0" /> {t("verdict", "wellRolled")}
            </span>
            <span className="opacity-80">{t("explainer", "tierWellRolledNote")}</span>
          </div>
        </div>
        <p className="mt-2.5 text-sm">{t("explainer", "rerollP4")}</p>
        <p className="mt-2.5 text-sm">{t("explainer", "rerollP5")}</p>
      </section>

      <section>
        <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold text-dark-text">
          <WarningIcon className="h-4 w-4 text-warn" /> {t("explainer", "erTitle")}
        </h3>
        <p>{t("explainer", "erP1")}</p>
        <p className="mt-2.5">{t("explainer", "erP2")}</p>
        <p className="mt-2.5 text-sm">{t("explainer", "erP3")}</p>
      </section>
    </div>
  );
}
