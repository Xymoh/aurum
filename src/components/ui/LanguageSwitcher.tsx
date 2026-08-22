import { LANGUAGES, useI18n, isLanguageCode } from "../../i18n";

/**
 * A plain `<select>` rather than a custom dropdown: it gets keyboard support,
 * screen-reader labelling and native mobile pickers for free, which matters
 * more here than matching the site's styling exactly.
 */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => {
        if (isLanguageCode(e.target.value)) setLang(e.target.value);
      }}
      aria-label={t("nav", "language")}
      title={t("nav", "language")}
      className="rounded-lg bg-dark-card border border-dark-border px-2 py-1.5 text-xs text-dark-muted hover:text-dark-text focus:outline-none focus:border-accent/60 transition-colors cursor-pointer"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
