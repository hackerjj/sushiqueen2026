/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FB_PIXEL_ID: string;
  readonly VITE_GA_ID: string;
  readonly VITE_GTM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
