/**
 * Runtime Supabase bootstrap — fixes auth when VITE_* vars are missing at build time
 * but available on the server (Vercel runtime env).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKeyEnv, getSupabaseUrlEnv } from "./supabase-env";

let runtimeUrl = "";
let runtimeKey = "";
let bootstrapPromise: Promise<boolean> | null = null;

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

export function getEffectiveSupabaseUrl(): string {
  return normalizeSupabaseUrl(getSupabaseUrlEnv() || runtimeUrl);
}

export function getEffectiveSupabaseAnonKey(): string {
  return getSupabaseAnonKeyEnv() || runtimeKey;
}

export function isEffectiveSupabaseConfigured(): boolean {
  return isValidConfig(getEffectiveSupabaseUrl(), getEffectiveSupabaseAnonKey());
}

export function setRuntimeSupabaseConfig(url: string, key: string) {
  runtimeUrl = normalizeSupabaseUrl(url);
  runtimeKey = key.trim();
}

export async function bootstrapSupabaseFromServer(): Promise<boolean> {
  if (isEffectiveSupabaseConfigured()) return true;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const res = await fetch("/api/public-config", { credentials: "same-origin" });
      if (!res.ok) return false;
      const json = await res.json();
      if (!json?.auth || !json.supabaseUrl || !json.supabaseAnonKey) return false;
      setRuntimeSupabaseConfig(json.supabaseUrl, json.supabaseAnonKey);
      return isEffectiveSupabaseConfigured();
    } catch {
      return false;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client && isEffectiveSupabaseConfigured()) {
    const url = getEffectiveSupabaseUrl();
    const key = getEffectiveSupabaseAnonKey();
    // Recreate if runtime config arrived after placeholder init
    const currentUrl = (client as unknown as { supabaseUrl?: string }).supabaseUrl;
    if (currentUrl && currentUrl !== url) {
      client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
    }
    return client;
  }

  if (isEffectiveSupabaseConfigured()) {
    client = createClient(getEffectiveSupabaseUrl(), getEffectiveSupabaseAnonKey(), {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return client;
  }

  client = createClient(
    "https://placeholder.supabase.co",
    "placeholder-anon-key-placeholder-anon-key-placeholder-anon-key-p",
  );
  return client;
}

export function resetSupabaseClient() {
  client = null;
}
