/**
 * Example offline-first query hook.
 * On network failure, serves the last cached React Query data and sets isOffline.
 * Screens can show a subtle banner when `isOffline` is true — no UI rewrite here.
 */
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  useOfflineStatus,
} from "@/lib/offline/OfflineQueryProvider";

export type OfflineQueryResult<TData, TError = Error> = UseQueryResult<
  TData,
  TError
> & {
  /** True when device appears offline — show "Offline Mode - Showing recent content" */
  isOffline: boolean;
  /** True when showing stale/cached data while offline or after a fetch error */
  showingCachedContent: boolean;
};

export function useOfflineQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): OfflineQueryResult<TData, TError> {
  const { isOffline } = useOfflineStatus();

  const query = useQuery({
    ...options,
    // Prefer cache; refetch in background when online
    networkMode: "offlineFirst",
    placeholderData: (previous) => previous,
  });

  const showingCachedContent =
    (isOffline || query.isError) && query.data !== undefined;

  return {
    ...query,
    isOffline,
    showingCachedContent,
  };
}
