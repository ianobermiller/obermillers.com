interface ImportMetaEnv {
  readonly VITE_APPLE_SERVICES_ID?: string;
  readonly VITE_POCKETBASE_URL: string;
  readonly VITE_IMGLY_BACKGROUND_REMOVAL_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
