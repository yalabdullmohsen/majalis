/**
 * React binding for ReviewHubStore.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
  createReviewHubStore,
  filterReviewItems,
  countByFilter,
  type ReviewHubStore,
  type ReviewHubSnapshot,
  type ReviewItem,
  type ReviewFilterTab,
} from "@/lib/admin-review-hub";

export type UseReviewHubResult = ReviewHubSnapshot & {
  store: ReviewHubStore;
  visibleItems: ReviewItem[];
  filterCounts: Record<ReviewFilterTab, number>;
};

export function useReviewHub(external?: ReviewHubStore): UseReviewHubResult {
  const store = useMemo(() => external ?? createReviewHubStore(), [external]);
  const snap = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getSnapshot(),
    () => store.getSnapshot(),
  );

  const visibleItems = useMemo(
    () =>
      filterReviewItems(snap.items, {
        filter: snap.filter,
        streamFocus: snap.streamFocus,
        searchQuery: snap.searchQuery,
      }),
    [snap.items, snap.filter, snap.streamFocus, snap.searchQuery],
  );

  const filterCounts = useMemo(() => {
    const tabs: ReviewFilterTab[] = [
      "pending",
      "high_priority",
      "flagged_ai",
      "approved",
      "rejected",
    ];
    const out = {} as Record<ReviewFilterTab, number>;
    for (const t of tabs) {
      out[t] = countByFilter(snap.items, t, snap.streamFocus);
    }
    return out;
  }, [snap.items, snap.streamFocus]);

  return {
    ...snap,
    store,
    visibleItems,
    filterCounts,
  };
}
