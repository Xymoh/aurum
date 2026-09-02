import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { en, type Dictionary } from "./locales/en";
import { I18nContext, LOADERS, STORAGE_KEY, detectLanguage, type LanguageCode } from "./index";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(detectLanguage);
  const [dict, setDict] = useState<Dictionary>(en);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;

    if (lang === "en") {
      setDict(en);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    LOADERS[lang]()
      .then((mod) => {
        if (!cancelled) setDict(mod.default);
      })
      .catch(() => {
        // A failed chunk shouldn't blank the UI - English is always correct.
        if (!cancelled) setDict(en);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply won't persist; the session still switches.
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang, dict, loading }), [lang, setLang, dict, loading]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
