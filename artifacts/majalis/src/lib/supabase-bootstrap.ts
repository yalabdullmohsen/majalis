/**
 * Runtime Supabase bootstrap — fixes auth when VITE_* vars are missing at build time
 * but available on the server (Vercel runtime env).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getEffectiveSupabaseAnonKey,
  getEffectiveSupabaseUrl,
  isEffectiveSupabaseConfigured,
  setRuntimeSupabaseConfig,
} from "./supabase-env";
import { RequestManager, REQUEST_TIMEOUT_MS } from "./request-manager";

export {
  getEffectiveSupabaseAnonKey,
  getEffectiveSupabaseUrl,
  isEffectiveSupabaseConfigured,
  setRuntimeSupabaseConfig,
} from "./supabase-env";

let bootstrapPromise: Promise<boolean> | null = null;

export async function bootstrapSupabaseFromServer(): Promise<boolean> {
  if (isEffectiveSupabaseConfigured()) return true;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const res = await RequestManager.fetch("/api/public-config", {
        credentials: "same-origin",
        label: "bootstrap:public-config",
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
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

/** مهلة أطول لاستعلامات Supabase الثقيلة (موسوعة الأحكام وغيرها) لتفادي ERR_ABORTED. */
const SUPABASE_FETCH_TIMEOUT_MS = Math.max(REQUEST_TIMEOUT_MS, 15_000);

function supabaseGlobalFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return RequestManager.fetch(input, {
    ...init,
    label: `supabase:${String(input).slice(0, 120)}`,
    timeoutMs: SUPABASE_FETCH_TIMEOUT_MS,
    retries: 1,
  });
}

function createConfiguredClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { fetch: supabaseGlobalFetch },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (client && isEffectiveSupabaseConfigured()) {
    const url = getEffectiveSupabaseUrl();
    const key = getEffectiveSupabaseAnonKey();
    // Recreate if runtime config arrived after placeholder init
    const currentUrl = (client as unknown as { supabaseUrl?: string }).supabaseUrl;
    if (currentUrl && currentUrl !== url) {
      client = createConfiguredClient(url, key);
    }
    return client;
  }

  if (isEffectiveSupabaseConfigured()) {
    client = createConfiguredClient(getEffectiveSupabaseUrl(), getEffectiveSupabaseAnonKey());
    return client;
  }

  client = createConfiguredClient(
    "https://placeholder.supabase.co",
    "placeholder-anon-key-placeholder-anon-key-placeholder-anon-key-p",
  );
  return client;
}

export function resetSupabaseClient() {
  client = null;
}
