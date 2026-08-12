/**
 * Production content mode — when enabled, the live site reads only from Supabase.
 * Seed files remain for local dev / first-install demos only.
 */
import { isSupabaseConfigured } from "@/lib/supabase-config";

function envFlag(name: string): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;
    const v = env[name];
    if (v === "1" || v === "true") return true;
    if (v === "0" || v === "false") return false;
  }
  if (typeof process !== "undefined" && process.env?.[name]) {
    const v = process.env[name];
    return v === "1" || v === "true";
  }
  return false;
}

/** True when Supabase is configured and production content mode is active. */
export function isProductionContentMode(): boolean {
  if (!isSupabaseConfigured()) return false;
  if (envFlag("VITE_MAJALIS_PRODUCTION_CONTENT")) return true;
  if (envFlag("MAJALIS_PRODUCTION_CONTENT")) return true;
  const nodeEnv =
    (typeof import.meta !== "undefined" && import.meta.env?.MODE) ||
    (typeof process !== "undefined" && process.env?.NODE_ENV) ||
    "";
  return nodeEnv === "production";
}

/** Seed/demo data is allowed only outside production content mode. */
export function allowSeedFallback(): boolean {
  return !isProductionContentMode();
}
