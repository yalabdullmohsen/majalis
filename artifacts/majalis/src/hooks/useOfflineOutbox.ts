/**
 * React facade for the offline mutation outbox.
 * Logic-only — no UI.
 */
import { useCallback, useEffect, useState } from "react";
import {
  enqueueOutbox,
  flushOutbox,
  listPendingOutbox,
  type OutboxEntry,
  type OutboxOpType,
} from "@/lib/offline-outbox";

export function useOfflineOutbox() {
  const [pending, setPending] = useState<OutboxEntry[]>([]);

  const refresh = useCallback(() => {
    setPending(listPendingOutbox());
  }, []);

  useEffect(() => {
    refresh();
    const onOnline = () => {
      void flushOutbox(async () => true).then(refresh);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const enqueue = useCallback(
    (type: OutboxOpType, payload: Record<string, unknown>, idempotencyKey?: string) => {
      const entry = enqueueOutbox(type, payload, { idempotencyKey });
      refresh();
      return entry;
    },
    [refresh],
  );

  const flush = useCallback(
    async (apply: (entry: OutboxEntry) => Promise<boolean>) => {
      const result = await flushOutbox(apply);
      refresh();
      return result;
    },
    [refresh],
  );

  return { pending, enqueue, flush, refresh, pendingCount: pending.length };
}
