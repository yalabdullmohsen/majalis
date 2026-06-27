import { QueryClient } from "@tanstack/react-query";
import { RequestManager, REQUEST_TIMEOUT_MS, REQUEST_MAX_RETRIES } from "@/lib/request-manager";

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: REQUEST_MAX_RETRIES,
        refetchOnWindowFocus: false,
        throwOnError: false,
        networkMode: "always",
        meta: { timeoutMs: REQUEST_TIMEOUT_MS },
      },
      mutations: {
        retry: REQUEST_MAX_RETRIES,
        networkMode: "always",
      },
    },
  });
}

/** Standard queryFn wrapper — enforces RequestManager timeout on all TanStack queries. */
export async function timedQueryFn<T>(label: string, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  return RequestManager.run(label, fn, { dedupeKey: label });
}
