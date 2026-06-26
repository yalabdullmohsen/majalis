import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

function normalizeSupabaseUrl(raw: string): string {
  const value = (raw || "").trim();
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

export function isSupabaseConfiguredServer(): boolean {
  const url = normalizeSupabaseUrl(SUPABASE_URL);
  const key = SUPABASE_ANON_KEY.trim();
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.includes("placeholder")) return false;
  return true;
}

/** Cookie-aware Supabase client for Server Components and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    normalizeSupabaseUrl(SUPABASE_URL),
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — cookie writes are ignored.
          }
        },
      },
    },
  );
}

/** Static/build-time Supabase client for sitemap and generateStaticParams. */
export function createStaticClient() {
  return createSupabaseClient(
    normalizeSupabaseUrl(SUPABASE_URL),
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
