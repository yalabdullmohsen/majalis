import { isSupabaseConfigured, logSupabaseError } from "./supabase-config";

export type SafeReadResult<T> = {
  data: T;
  error: null;
  usingSeed?: boolean;
};

export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  const code = e.code || "";
  const msg = (e.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42703" ||
    msg.includes("could not find") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("column")
  );
}

export function shouldUseSeed(error: unknown): boolean {
  if (!error) return false;
  if (isMissingSchemaError(error)) return true;
  const e = error as { message?: string };
  const msg = (e.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("fetch")
  );
}

/** Wrap a Supabase `{ data, error }` query with try/catch and seed fallback. */
export async function safeSupabaseQuery<T>(
  scope: string,
  query: () => PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T,
): Promise<SafeReadResult<T>> {
  if (!isSupabaseConfigured()) {
    return { data: fallback, error: null, usingSeed: true };
  }

  try {
    const { data, error } = await query();
    if (error) {
      logSupabaseError(scope, error);
      return { data: fallback, error: null, usingSeed: true };
    }
    return { data: (data ?? fallback) as T, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError(scope, err);
    return { data: fallback, error: null, usingSeed: true };
  }
}

/** Wrap any async read with try/catch and seed fallback. */
export async function safeSupabaseRead<T>(
  scope: string,
  read: () => Promise<T>,
  fallback: T,
): Promise<SafeReadResult<T>> {
  if (!isSupabaseConfigured()) {
    return { data: fallback, error: null, usingSeed: true };
  }

  try {
    const data = await read();
    return { data, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError(scope, err);
    return { data: fallback, error: null, usingSeed: true };
  }
}

/** Run a Supabase mutation safely — never throws to callers. */
export async function safeSupabaseWrite(
  scope: string,
  write: () => PromiseLike<{ error: unknown }>,
): Promise<{ error: unknown | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await write();
    if (error) logSupabaseError(scope, error);
    return { error: error ?? null };
  } catch (err) {
    logSupabaseError(scope, err);
    return { error: err };
  }
}
