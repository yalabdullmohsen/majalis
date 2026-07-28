import { useEffect, useRef, useState } from "react";
import { subscribeScrollBus } from "@/lib/scroll-raf-bus";

/**
 * Document reading progress (0–100).
 * Part 14: shared rAF scroll bus — no per-scroll allocations / duplicate listeners.
 */
export function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  const lastRef = useRef(-1);

  useEffect(() => {
    return subscribeScrollBus((sample) => {
      const pct = sample.progressPct;
      if (pct === lastRef.current) return;
      lastRef.current = pct;
      setProgress(pct);
    });
  }, []);

  return progress;
}
