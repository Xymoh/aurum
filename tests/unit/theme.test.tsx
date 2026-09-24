import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "../../src/components/ui/ThemeToggle";
import { I18nProvider } from "../../src/i18n/I18nProvider";
import { LIGHT_THEME, THEME_STORAGE_KEY, currentTheme, initTheme } from "../../src/lib/theme";

// React warns about act() outside a test environment that declares it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The test DOM's storage lacks the Storage methods; see recentUids.test.ts. */
const store = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

// The shipped default: the light theme is parked unless VITE_LIGHT_THEME=on.
describe("parked light theme", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: memoryStorage, configurable: true });
  });
  afterEach(() => {
    store.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
  });

  it("is off by default", () => {
    expect(LIGHT_THEME).toBe(false);
  });

  it("keeps a visitor who saved light, on a light-mode OS, on dark", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("light") }));
    initTheme();
    expect(currentTheme()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    // Left in place, so the choice comes back with the theme.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("shows no toggle", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    act(() =>
      root.render(
        <I18nProvider>
          <ThemeToggle />
        </I18nProvider>,
      ),
    );
    expect(host.innerHTML).toBe("");
    act(() => root.unmount());
  });
});
