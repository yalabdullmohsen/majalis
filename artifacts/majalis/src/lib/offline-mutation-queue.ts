/**
 * Offline mutation queue — durable outbox with exponential retry on reconnect.
 * Queues bookmarks, flashcard reviews, khatmah logs while offline.
 */

import { isOnline } from "@/lib/offline-db";
import { readTieredSync, writeTieredSync, writeTieredAsync, readTieredAsync } from "@/lib/tiered-storage";
import { addSafeWindowListener } from "@/lib/safe-listeners";
import { withStorageLock } from "@/lib/storage-lock";
import { isTabHibernating, ensureHibernationBinding } from "@/lib/background-hibernation";

export type MutationKind =
  | "flashcard-sync"
  | "bookmark-sync"
  | "khatmah-log"
  | "reading-progress"
  | "generic";

export type QueuedMutation = {
  id: string;
  kind: MutationKind;
  payload: unknown;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
};

const QUEUE_KEY = "majalis-offline-mutation-queue-v1";
const MAX_QUEUE = 200;
const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 1_000;

type Handler = (item: QueuedMutation) => Promise<void>;

const handlers = new Map<MutationKind, Handler>();
let flushing = false;
let bound = false;
const queueListeners = new Set<() => void>();

function loadQueue(): QueuedMutation[] {
  const { value } = readTieredSync<QueuedMutation[]>(QUEUE_KEY, []);
  return Array.isArray(value) ? value : [];
}

function saveQueue(items: QueuedMutation[]): void {
  const trimmed = items.slice(0, MAX_QUEUE);
  writeTieredSync(QUEUE_KEY, trimmed);
  void withStorageLock(QUEUE_KEY, async () => {
    await writeTieredAsync(QUEUE_KEY, trimmed);
  });
  for (const l of queueListeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

export function subscribeMutationQueue(listener: () => void): () => void {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
}

export function getMutationQueueSnapshot(): QueuedMutation[] {
  return loadQueue();
}

export function registerMutationHandler(kind: MutationKind, handler: Handler): void {
  handlers.set(kind, handler);
}

export function enqueueMutation(
  kind: MutationKind,
  payload: unknown,
  opts?: { id?: string },
): QueuedMutation {
  const queue = loadQueue();
  const id = opts?.id ?? `${kind}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  // Dedupe by id
  const filtered = queue.filter((q) => q.id !== id);
  const item: QueuedMutation = {
    id,
    kind,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    nextAttemptAt: Date.now(),
  };
  filtered.unshift(item);
  saveQueue(filtered);
  ensureQueueBinding();
  if (isOnline()) void flushMutationQueue();
  return item;
}

function backoffMs(attempts: number): number {
  const exp = Math.min(MAX_ATTEMPTS, Math.max(0, attempts));
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(60_000, BASE_DELAY_MS * 2 ** exp) + jitter;
}

export async function flushMutationQueue(): Promise<{ processed: number; remaining: number }> {
  if (flushing) return { processed: 0, remaining: loadQueue().length };
  if (!isOnline()) return { processed: 0, remaining: loadQueue().length };
  ensureHibernationBinding();
  // Don't burn battery flushing while tab is hibernating
  if (isTabHibernating()) return { processed: 0, remaining: loadQueue().length };

  return withStorageLock("mutation-queue-flush", async () => {
  flushing = true;
  let processed = 0;
  try {
    let queue = loadQueue();
    const now = Date.now();
    const ready = queue.filter((q) => q.nextAttemptAt <= now);
    const deferred = queue.filter((q) => q.nextAttemptAt > now);

    for (const item of ready) {
      if (!isOnline() || isTabHibernating()) {
        deferred.push(item);
        continue;
      }
      const handler = handlers.get(item.kind);
      if (!handler) {
        // No handler yet — keep for later (don't burn attempts)
        deferred.push(item);
        continue;
      }
      try {
        await handler(item);
        processed++;
      } catch (err) {
        const attempts = item.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          // Drop after max attempts (avoid infinite poison pills)
          continue;
        }
        deferred.push({
          ...item,
          attempts,
          nextAttemptAt: Date.now() + backoffMs(attempts),
          lastError: String((err as Error)?.message || err),
        });
      }
    }

    // Preserve order: failed/deferred first by nextAttemptAt, then untouched future
    deferred.sort((a, b) => a.nextAttemptAt - b.nextAttemptAt);
    saveQueue(deferred);
    queue = deferred;
    return { processed, remaining: queue.length };
  } finally {
    flushing = false;
  }
  });
}

export function ensureQueueBinding(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  addSafeWindowListener("online", () => {
    void flushMutationQueue();
  });
  // Soft periodic flush while online
  const intervalId = window.setInterval(() => {
    if (isOnline() && loadQueue().length) void flushMutationQueue();
  }, 30_000);
  try {
    (intervalId as unknown as { unref?: () => void }).unref?.();
  } catch {
    /* ignore */
  }
}

/** Hydrate from durable tier + register default handlers. */
export async function initOfflineMutationQueue(): Promise<void> {
  try {
    const { value } = await readTieredAsync<QueuedMutation[]>(QUEUE_KEY, []);
    if (Array.isArray(value) && value.length) writeTieredSync(QUEUE_KEY, value);
  } catch {
    /* ignore */
  }
  ensureQueueBinding();

  // Default flashcard handler (lazy import — avoids cycle)
  registerMutationHandler("flashcard-sync", async (item) => {
    const payload = item.payload as { userId?: string };
    if (!payload?.userId) return;
    const { syncDirtyFlashcardReviews } = await import("@/lib/flashcard-service");
    await syncDirtyFlashcardReviews(payload.userId);
  });

  registerMutationHandler("khatmah-log", async (item) => {
    // Local-first: payload is already written to LS; handler is a no-op ack when online
    // Reserved for future remote sync.
    void item;
  });

  registerMutationHandler("bookmark-sync", async (item) => {
    void item;
  });

  registerMutationHandler("reading-progress", async (item) => {
    void item;
  });

  if (isOnline()) void flushMutationQueue();
}
