/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCODE_API_KEY?: string;
  readonly VITE_OPENCODE_BACKUP_KEY?: string;
  readonly VITE_OPENCODE_BASE_URL?: string;
  readonly VITE_DEFAULT_MODEL?: string;
  readonly VITE_FEATHERLESS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
