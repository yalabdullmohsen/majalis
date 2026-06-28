import { isSupabaseConfigured, logSupabaseError } from "./supabase-config";
import { RequestManager } from "./request-manager";
import { allowSeedFallback } from "./cms/production-config";

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
    msg.includes("fetch") ||
    msg.includes("timed out") ||
    msg.includes("timeout") ||
    msg.includes("abort")
  );
}

async function timedQuery<T>(scope: string, query: () => PromiseLike<{ data: T | null; error: unknown }>) {
  return RequestManager.run(scope, async () => {
    const result = await query();
    if (result.error) throw result.error;
    return result;
  }, { dedupeKey: scope });
}

/** Wrap a Supabase `{ data, error }` query with timeout, try/catch and seed fallback. */
export async function safeSupabaseQuery<T>(
  scope: string,
  query: () => PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T,
): Promise<SafeReadResult<T>> {
  const effectiveFallback = (allowSeedFallback() ? fallback : (Array.isArray(fallback) ? [] : fallback)) as T;

  if (!isSupabaseConfigured()) {
    return { data: effectiveFallback, error: null, usingSeed: allowSeedFallback() };
  }

  try {
    const { data } = await timedQuery(scope, query);
    return { data: (data ?? effectiveFallback) as T, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError(scope, err);
    return { data: effectiveFallback, error: null, usingSeed: allowSeedFallback() };
  }
}

/** Wrap any async read with timeout, try/catch and seed fallback. */
export async function safeSupabaseRead<T>(
  scope: string,
  read: () => Promise<T>,
  fallback: T,
): Promise<SafeReadResult<T>> {
  const effectiveFallback = (allowSeedFallback() ? fallback : (Array.isArray(fallback) ? [] : fallback)) as T;

  if (!isSupabaseConfigured()) {
    return { data: effectiveFallback, error: null, usingSeed: allowSeedFallback() };
  }

  try {
    const data = await RequestManager.run(scope, () => read(), { dedupeKey: scope });
    return { data, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError(scope, err);
    return { data: effectiveFallback, error: null, usingSeed: allowSeedFallback() };
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
    const { error } = await RequestManager.run(`${scope}:write`, async () => {
      const result = await write();
      return result;
    }, { dedupeKey: `${scope}:write` });
    if (error) logSupabaseError(scope, error);
    return { error: error ?? null };
  } catch (err) {
    logSupabaseError(scope, err);
    return { error: err };
  }
}
