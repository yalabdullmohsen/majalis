import { useCallback, useEffect, useState } from "react";
import {
  clearDiscoverySeen,
  countUnseenRemaining,
  pickUnseenBenefits,
  serveLaunchDiscovery,
  type DiscoveryItem,
  type DiscoveryKind,
} from "@/lib/unseen-benefit-discovery";

/** Smart unseen discovery — logic only. */
export function useUnseenDiscovery(opts?: {
  autoServeOnMount?: boolean;
  limit?: number;
  kinds?: DiscoveryKind[];
}) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [remaining, setRemaining] = useState(() => countUnseenRemaining(opts?.kinds));

  const refreshRemaining = useCallback(() => {
    setRemaining(countUnseenRemaining(opts?.kinds));
  }, [opts?.kinds]);

  const serve = useCallback(
    (limit?: number) => {
      const next = pickUnseenBenefits({
        kinds: opts?.kinds,
        limit: limit ?? opts?.limit ?? 3,
        markSeen: true,
      });
      setItems(next);
      refreshRemaining();
      return next;
    },
    [opts?.kinds, opts?.limit, refreshRemaining],
  );

  const serveLaunch = useCallback(() => {
    const next = serveLaunchDiscovery(opts?.limit ?? 3);
    setItems(next);
    refreshRemaining();
    return next;
  }, [opts?.limit, refreshRemaining]);

  const resetSeen = useCallback(() => {
    clearDiscoverySeen();
    refreshRemaining();
  }, [refreshRemaining]);

  useEffect(() => {
    if (opts?.autoServeOnMount) {
      serveLaunch();
    }
  }, [opts?.autoServeOnMount, serveLaunch]);

  return { items, remaining, serve, serveLaunch, resetSeen };
}
