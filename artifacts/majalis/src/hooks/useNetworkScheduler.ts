/**
 * Part 23 — React hook for adaptive network scheduling.
 * Logic-only — no UI layouts / CSS.
 */

import { useEffect, useState } from "react";
import {
  getNetworkSchedulerPolicy,
  startNetworkScheduler,
  subscribeNetworkScheduler,
  type NetworkSchedulerPolicy,
} from "@/lib/network-scheduler";

export function useNetworkScheduler(opts?: { autoStart?: boolean }) {
  const autoStart = opts?.autoStart !== false;
  const [policy, setPolicy] = useState<NetworkSchedulerPolicy>(() =>
    getNetworkSchedulerPolicy(),
  );

  useEffect(() => {
    if (autoStart) startNetworkScheduler();
    return subscribeNetworkScheduler(setPolicy);
  }, [autoStart]);

  return policy;
}

/**
 * Debounce delay that tracks live RTT policy (replaces fixed 280/300/350ms).
 */
export function useNetworkAwareDebounceMs(fallback = 300): number {
  const policy = useNetworkScheduler();
  return policy.searchDebounceMs || fallback;
}
