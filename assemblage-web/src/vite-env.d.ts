/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAX_ACTIVE_IMAGES: string
  readonly VITE_MAX_COLLAGES: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 