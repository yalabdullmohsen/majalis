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

function normalizeSupabaseUrl(raw: string): string {
  const v = (raw || "").trim();
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/+$/, "");
  }
}

function isValidConfig(url: string, key: string): boolean {
  if (!url.startsWith("http") || key.length <= 20) return false;
  if (/placeholder|_supabase/i.test(url) || /placeholder/i.test(key)) return false;
  try {
    const host = new URL(url).host;
    const ref = host.split(".")[0] || "";
    return host.endsWith(".supabase.co") && /^[a-z0-9-]+$/i.test(ref) && ref.length >= 8;
  } catch {
    return false;
  }
}

/** قيم /api/public-config بعد الإقلاع — بلا createClient حتى لا تدخل supabase-js حزمة الإقلاع. */
let runtimeUrl = "";
let runtimeKey = "";

export function setRuntimeSupabaseConfig(url: string, key: string) {
  runtimeUrl = normalizeSupabaseUrl(url);
  runtimeKey = key.trim();
}

export function getEffectiveSupabaseUrl(): string {
  return normalizeSupabaseUrl(getSupabaseUrlEnv() || runtimeUrl);
}

export function getEffectiveSupabaseAnonKey(): string {
  return getSupabaseAnonKeyEnv() || runtimeKey;
}

export function isEffectiveSupabaseConfigured(): boolean {
  return isValidConfig(getEffectiveSupabaseUrl(), getEffectiveSupabaseAnonKey());
}
