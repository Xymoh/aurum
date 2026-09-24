import { useCallback, useSyncExternalStore } from "react";

/**
 * Light/dark theme, persisted.
 *
 * The choice is stored in localStorage and applied as `data-theme` on <html>.
 * An inline script in index.html applies it before first paint so a light-mode
 * visitor never sees a dark flash; this module owns every change after that.
 * With no stored choice the OS preference wins.
 *
 * Parked for now: the light theme ships only with VITE_LIGHT_THEME=on. Off,
 * the site is dark whatever was saved or the OS prefers, and the toggle is
 * not shown. A saved "light" is left alone, for when the theme comes back.
 */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

/** Whether the light theme ships at all (see above). */
export const LIGHT_THEME = import.meta.env.VITE_LIGHT_THEME === "on";

function readStored(): Theme | null {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  if (typeof document === "undefined" || !LIGHT_THEME) return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return readStored() ?? (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

const listeners = new Set<() => void>();

export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Private mode or blocked storage: the theme still applies for this visit.
    }
  }
  listeners.forEach((l) => l());
}

export function initTheme() {
  if (typeof document === "undefined") return;
  applyTheme(currentTheme(), false);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark" as Theme);
  const toggle = useCallback(() => applyTheme(theme === "light" ? "dark" : "light"), [theme]);
  return { theme, toggle };
}
