/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADS_MODE: "test" | "off" | undefined;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
