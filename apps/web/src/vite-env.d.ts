/// <reference types="vite/client" />
/// <reference types="svelte" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
