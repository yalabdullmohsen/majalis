/** Allow Vite CSS side-effect imports (static + dynamic) under tsc. */
declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_COMMIT_HASH?: string;
  readonly VITE_BUILD_ID?: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
  readonly VITE_OWNER_EMAILS?: string;
  readonly VITE_RESEARCH_DEMO?: string;
  /** Opt-in remote daily-reading sync (requires reading_sync_events). */
  readonly VITE_READING_SYNC?: string;
  readonly BASE_URL?: string;
  readonly DEV?: boolean;
  readonly MODE?: string;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
