/// <reference types="vite/client" />
/// <reference types="svelte" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_EVE_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
