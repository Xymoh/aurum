import { useI18n } from "../i18n";
import type { HsrRelic } from "./types";

type Advice = HsrRelic["reroll"];

const PRIORITY_LABEL = {
  high: "rerollNow",
  medium: "worthRerolling",
  low: "lowPriority",
} as const;

const PRIORITY_BLURB = {
  high: "blurbHigh",
  medium: "blurbMedium",
  low: "blurbLow",
} as const;

/**
 * The reroll verdict, in the reader's language.
 *
 * The advice itself is produced outside React, so it carries English text for
 * anyone reading the object directly. What it also carries is the decision:
 * the action, the priority tier and the realistic ceiling. That is enough to
 * rebuild the sentence in any language, so the display text is looked up here
 * rather than translated after the fact.
 */
export function useHsrVerdict() {
  const { t } = useI18n();

  return (reroll: Advice): { label: string; reason: string } => {
    if (reroll.action === "replace") {
      return {
        label: t("hsrVerdict", "farmReplacement"),
        reason: t("hsrVerdict", "reasonReplaceWeak", {
          ceiling: reroll.realisticCeiling.toFixed(0),
        }),
      };
    }
    if (reroll.action === "none" || !reroll.priority) {
      return {
        label: t("hsrVerdict", "wellRolled"),
        reason: t("hsrVerdict", "reasonWellRolled"),
      };
    }
    return {
      label: t("hsrVerdict", PRIORITY_LABEL[reroll.priority]),
      reason: t("hsrVerdict", PRIORITY_BLURB[reroll.priority]),
    };
  };
}
