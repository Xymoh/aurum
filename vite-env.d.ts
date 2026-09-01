/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional self-hosted CORS proxy for the Enka API (see workers/enka-proxy.js).
   * Supports `{uid}` / `{url}` placeholders; without one, `?uid=<uid>` is appended.
   */
  readonly VITE_ENKA_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
