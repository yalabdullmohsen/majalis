/**
 * Part 21 — React hook for cross-storage drift reconciliation.
 * Logic-only — no UI layouts / CSS.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getLastReconcileResult,
  runStorageReconcile,
  type ReconcileChannel,
  type ReconcileResult,
} from "@/lib/storage-reconciler";

export function useStorageReconciler(opts?: {
  /** Run once on mount (default true). */
  auto?: boolean;
  extraChannels?: ReconcileChannel[];
}) {
  const auto = opts?.auto !== false;
  const [result, setResult] = useState<ReconcileResult | null>(() => getLastReconcileResult());
  const [busy, setBusy] = useState(false);

  const reconcile = useCallback(async (extra?: ReconcileChannel[]) => {
    setBusy(true);
    try {
      const next = await runStorageReconcile(extra ?? opts?.extraChannels ?? []);
      setResult(next);
      return next;
    } finally {
      setBusy(false);
    }
  }, [opts?.extraChannels]);

  useEffect(() => {
    if (!auto) return;
    void reconcile();
  }, [auto, reconcile]);

  return { result, busy, reconcile };
}
