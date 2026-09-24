/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional self-hosted CORS proxy for the Enka API (see workers/enka-proxy.js).
   * Supports `{uid}` / `{url}` placeholders; without one, `?uid=<uid>` is appended.
   */
  readonly VITE_ENKA_PROXY?: string;
  /** "on" ships the languages beyond English (see src/i18n/index.ts). */
  readonly VITE_I18N?: string;
  /** "on" ships the showcase help pages and their links (see src/help/content.ts). */
  readonly VITE_SHOWCASE_HELP?: string;
  /** "on" ships the light theme and its toggle (see src/lib/theme.ts). */
  readonly VITE_LIGHT_THEME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
