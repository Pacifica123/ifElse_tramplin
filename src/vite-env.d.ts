/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_2GIS_MAP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
