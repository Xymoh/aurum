import { createContext, useCallback, useContext } from "react";
import { en, type Dictionary } from "./locales/en";

/**
 * Every language that has a complete locale file. Chinese is finished and
 * kept in step with English by the Dictionary type check, but it is not
 * shipped yet - see MULTI_LANGUAGE below.
 */
const ALL_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "简体中文" },
] as const;

export type LanguageCode = (typeof ALL_LANGUAGES)[number]["code"];

/**
 * Whether the site offers more than English. Off by default: the audience is
 * English-speaking today, and a language nobody asked for is a feature to
 * maintain rather than one to use. Set VITE_I18N=on to ship the rest.
 *
 * The gate deliberately sits on the language list rather than on the picker.
 * Hiding only the picker would leave detectLanguage() free to pick a locale
 * out of navigator.languages, stranding that visitor in a language they have
 * no control to leave.
 */
export const MULTI_LANGUAGE = import.meta.env.VITE_I18N === "on";

/** The languages actually on offer. One entry means the picker hides itself. */
export const LANGUAGES: readonly { code: LanguageCode; label: string }[] =
  MULTI_LANGUAGE ? ALL_LANGUAGES : [ALL_LANGUAGES[0]];

/** Where an explicit language choice is remembered between visits. */
export const STORAGE_KEY = "language";

/** English ships in the main bundle; the rest are fetched only when selected. */
export const LOADERS: Record<Exclude<LanguageCode, "en">, () => Promise<{ default: Dictionary }>> = {
  zh: () => import("./locales/zh"),
};

/**
 * Tests against the enabled list, not every locale that exists, so a stored
 * "zh" from an earlier visit is ignored while the flag is off instead of
 * quietly outliving it.
 */
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
    // localStorage can throw in private mode - fall through to detection.
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
