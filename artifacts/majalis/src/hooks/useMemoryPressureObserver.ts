/**
 * Part 22 — Hook for native memory pressure observation.
 * Logic-only — no UI layouts / CSS.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getLastMemoryPressureLevel,
  purgeUnderMemoryPressure,
  readMemorySnapshot,
  startMemoryPressureObserver,
  subscribeMemoryPressure,
  type MemoryPressureLevel,
  type MemorySnapshot,
} from "@/lib/memory-pressure";

export function useMemoryPressureObserver(opts?: {
  /** Auto-start global observer (default true). */
  autoStart?: boolean;
  intervalMs?: number;
}) {
  const autoStart = opts?.autoStart !== false;
  const [snapshot, setSnapshot] = useState<MemorySnapshot | null>(() => {
    try {
      return readMemorySnapshot();
    } catch {
      return null;
    }
  });
  const [level, setLevel] = useState<MemoryPressureLevel>(() => getLastMemoryPressureLevel());

  useEffect(() => {
    if (autoStart) startMemoryPressureObserver({ intervalMs: opts?.intervalMs });
    return subscribeMemoryPressure((snap) => {
      setSnapshot(snap);
      setLevel(snap.level);
    });
  }, [autoStart, opts?.intervalMs]);

  const purge = useCallback(async (lvl?: MemoryPressureLevel) => {
    return purgeUnderMemoryPressure(lvl ?? level);
  }, [level]);

  return { snapshot, level, purge, refresh: readMemorySnapshot };
}
