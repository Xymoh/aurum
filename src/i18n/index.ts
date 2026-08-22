import { createContext, useCallback, useContext } from "react";
import { en, type Dictionary } from "./locales/en";

/**
 * English + Chinese for now. The Dictionary type check makes adding a
 * language back mechanical (every missing key is a compile error), so this
 * list expands whenever demand justifies the ongoing translation upkeep —
 * see the other locale files' git history if resurrecting one.
 */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "简体中文" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Where an explicit language choice is remembered between visits. */
export const STORAGE_KEY = "language";

/** English ships in the main bundle; the rest are fetched only when selected. */
export const LOADERS: Record<Exclude<LanguageCode, "en">, () => Promise<{ default: Dictionary }>> = {
  zh: () => import("./locales/zh"),
};

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

/**
 * Pick a starting language: an explicit past choice wins, otherwise the
 * browser's preference, falling back to English. `zh-CN`/`zh-TW` and `pt-BR`
 * style tags are matched on their base subtag.
 */
export function detectLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLanguageCode(saved)) return saved;
  } catch {
    // localStorage can throw in private mode — fall through to detection.
  }

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLanguageCode(base)) return base;
  }
  return "en";
}

interface I18nValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  dict: Dictionary;
  /** True while a newly-selected locale is still downloading. */
  loading: boolean;
}

export const I18nContext = createContext<I18nValue | null>(null);

function useI18nContext(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Substitute `{name}` placeholders; unknown names are left untouched. */
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function useI18n() {
  const { lang, setLang, dict, loading } = useI18nContext();

  const t = useCallback(
    <S extends keyof Dictionary>(
      section: S,
      key: keyof Dictionary[S],
      vars?: Record<string, string | number>,
    ): string => {
      const value = (dict[section] as Record<string, string>)[key as string];
      // Fall back to English rather than rendering a raw key if a locale is
      // ever missing an entry at runtime (e.g. a stale cached chunk).
      const text = value ?? (en[section] as Record<string, string>)[key as string] ?? String(key);
      return format(text, vars);
    },
    [dict],
  );

  return { t, lang, setLang, loading };
}
