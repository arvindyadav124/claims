/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin + prefix, e.g. `https://api.example.com` or empty string to use Vite dev proxy (`/api` → Django). */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
