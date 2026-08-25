/**
 * Generic offline write outbox — Last-Write-Wins by updatedAt.
 * Handlers registered per mutation type; flashcards keep their dedicated dirty sync.
 */

import { idbDelete, idbGetAll, idbPut, isOnline, OFFLINE_STORES } from "@/lib/offline-db";
import { computeBackoffDelayMs } from "@/lib/retry-policy";

export type OutboxMutationType =
  | "flashcard_review"
  | "favorite_toggle"
  | "preference_patch"
  | "reading_progress";

export type OutboxItem = {
  id: string;
  type: OutboxMutationType;
  payload: Record<string, unknown>;
  updatedAt: string;
  attempts: number;
  lastError?: string;
  /** epoch ms — لا تُعاد المحاولة قبل هذا الوقت (backoff) */
  nextRetryAt?: number;
};

const OUTBOX_PREFIX = "outbox:";

type FlushHandler = (item: OutboxItem) => Promise<boolean>;

const handlers = new Map<OutboxMutationType, FlushHandler>();

export function registerOutboxHandler(type: OutboxMutationType, handler: FlushHandler): void {
  handlers.set(type, handler);
}

export async function enqueueOutbox(
  type: OutboxMutationType,
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const item: OutboxItem = {
    id,
    type,
    payload,
    updatedAt: new Date().toISOString(),
    attempts: 0,
  };
  await idbPut(OFFLINE_STORES.meta, `${OUTBOX_PREFIX}${type}:${id}`, item, item.updatedAt);
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const rows = await idbGetAll<OutboxItem>(OFFLINE_STORES.meta);
  return rows
    .filter((r) => r.key.startsWith(OUTBOX_PREFIX) && r.value)
    .map((r) => r.value)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}

export async function outboxPendingCount(): Promise<number> {
  const items = await listOutbox();
  return items.length;
}

export async function flushOutbox(): Promise<{ flushed: number; remaining: number }> {
  if (!isOnline()) {
    const remaining = await outboxPendingCount();
    return { flushed: 0, remaining };
  }

  const items = await listOutbox();
  let flushed = 0;
  const now = Date.now();
  const OUTBOX_BACKOFF = { maxRetries: 8, baseDelayMs: 800, maxDelayMs: 120_000 };

  for (const item of items) {
    if (item.nextRetryAt != null && item.nextRetryAt > now) continue;
    const handler = handlers.get(item.type);
    if (!handler) continue;
    try {
      const ok = await handler(item);
      if (ok) {
        await idbDelete(OFFLINE_STORES.meta, `${OUTBOX_PREFIX}${item.type}:${item.id}`);
        flushed += 1;
      } else {
        item.attempts += 1;
        item.lastError = "handler_rejected";
        item.nextRetryAt = now + computeBackoffDelayMs(item.attempts, OUTBOX_BACKOFF);
        await idbPut(OFFLINE_STORES.meta, `${OUTBOX_PREFIX}${item.type}:${item.id}`, item, item.updatedAt);
      }
    } catch (e) {
      item.attempts += 1;
      item.lastError = e instanceof Error ? e.message : "flush_error";
      item.nextRetryAt = now + computeBackoffDelayMs(item.attempts, OUTBOX_BACKOFF);
      await idbPut(OFFLINE_STORES.meta, `${OUTBOX_PREFIX}${item.type}:${item.id}`, item, item.updatedAt);
    }
  }

  const remaining = await outboxPendingCount();
  try {
    window.dispatchEvent(
      new CustomEvent("majalis-outbox-flushed", { detail: { flushed, remaining } }),
    );
  } catch {
    /* ignore */
  }
  return { flushed, remaining };
}

/** Prefer saveData / compact density — skip heavy background warm. */
export function shouldDeferHeavySync(): boolean {
  if (typeof document !== "undefined" && document.documentElement.dataset.dataSaver === "1") {
    return true;
  }
  try {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (conn?.saveData) return true;
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return true;
  } catch {
    /* ignore */
  }
  return false;
}
