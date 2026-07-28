import { useEffect, useState } from "react";
import { getNetworkSchedulerPolicy } from "@/lib/network-scheduler";

/** قيمة مؤجَّلة لتأخير البحث/الفلترة أثناء الكتابة. */
export function useDebouncedValue<T>(value: T, delayMs?: number): T {
  // Part 23: default delay tracks live RTT / jitter via network scheduler
  const resolvedDelay =
    delayMs ??
    (() => {
      try {
        return getNetworkSchedulerPolicy().searchDebounceMs;
      } catch {
        return 350;
      }
    })();
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), resolvedDelay);
    return () => window.clearTimeout(id);
  }, [value, resolvedDelay]);
  return debounced;
}
