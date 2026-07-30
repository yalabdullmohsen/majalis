import { QueryClient } from "@tanstack/react-query";
import { RequestManager, REQUEST_TIMEOUT_MS, REQUEST_MAX_RETRIES } from "@/lib/request-manager";

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /** Catalog / list pages change infrequently — fewer duplicate Supabase round-trips. */
        staleTime: 90_000,
        gcTime: 600_000,
        retry: REQUEST_MAX_RETRIES,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        throwOnError: false,
        networkMode: "online",
        meta: { timeoutMs: REQUEST_TIMEOUT_MS },
      },
      mutations: {
        // Never auto-retry mutations — avoids duplicate writes on flaky networks.
        retry: false,
        networkMode: "online",
      },
    },
  });
}

/** Standard queryFn wrapper — enforces RequestManager timeout on all TanStack queries. */
export async function timedQueryFn<T>(label: string, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  return RequestManager.run(label, fn, { dedupeKey: label });
}
