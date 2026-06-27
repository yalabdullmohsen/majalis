type EnvBag = Record<string, string | boolean | undefined>;

function readEnvBag(): EnvBag {
  const bag: EnvBag = {};

  if (typeof import.meta !== "undefined" && import.meta.env) {
    Object.assign(bag, import.meta.env as EnvBag);
  }

  if (typeof process !== "undefined" && process.env) {
    Object.assign(bag, process.env as EnvBag);
  }

  return bag;
}

function pickEnv(...keys: string[]): string {
  const bag = readEnvBag();
  for (const key of keys) {
    const raw = bag[key];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value) return value;
  }
  return "";
}

/** Supabase project URL — Vite client bundle reads import.meta.env first. */
export function getSupabaseUrlEnv(): string {
  return pickEnv("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
}

/** Supabase anon (public) key — safe for browser bundles. */
export function getSupabaseAnonKeyEnv(): string {
  return pickEnv("VITE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
}
