/**
 * Part 21 — IndexedDB / Dexie batch cursor traversal with chunked yielding.
 * Streams large store scans in configurable batches (default 50) so heavy
 * background searches never monopolize the main thread. Logic-only — no UI.
 */

import { yieldToMain } from "@/lib/yield-to-main";

export const IDB_CURSOR_DEFAULT_BATCH = 50;

export type CursorBatchOptions = {
  /** Records processed before yielding (default 50). */
  batchSize?: number;
  /** Abort mid-stream. */
  signal?: AbortSignal;
  /** Called after each yielded batch with cumulative count. */
  onBatch?: (processed: number) => void;
};

export type CursorStreamItem<T> = {
  key: IDBValidKey;
  value: T;
  primaryKey?: IDBValidKey;
};

function resolveBatchSize(opts?: CursorBatchOptions): number {
  const n = opts?.batchSize ?? IDB_CURSOR_DEFAULT_BATCH;
  return Math.max(1, Math.min(500, n | 0));
}

function threwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error("idb-cursor-aborted");
    err.name = "AbortError";
    throw err;
  }
}

/**
 * Walk a raw IDBObjectStore with openCursor, yielding every `batchSize` rows.
 * Does not accumulate the full store unless the consumer does.
 */
export async function streamObjectStoreCursor<T>(
  store: IDBObjectStore,
  onItem: (item: CursorStreamItem<T>) => void | Promise<void>,
  opts?: CursorBatchOptions,
): Promise<number> {
  const batchSize = resolveBatchSize(opts);
  let processed = 0;
  let sinceYield = 0;

  await new Promise<void>((resolve, reject) => {
    const req = store.openCursor();
    req.onerror = () => reject(req.error ?? new Error("idb-cursor-error"));
    req.onsuccess = () => {
      void (async () => {
        try {
          threwIfAborted(opts?.signal);
          const cursor = req.result;
          if (!cursor) {
            resolve();
            return;
          }
          await onItem({
            key: cursor.key,
            value: cursor.value as T,
            primaryKey: cursor.primaryKey,
          });
          processed += 1;
          sinceYield += 1;
          if (sinceYield >= batchSize) {
            sinceYield = 0;
            opts?.onBatch?.(processed);
            await yieldToMain();
            threwIfAborted(opts?.signal);
          }
          cursor.continue();
        } catch (err) {
          reject(err);
        }
      })();
    };
  });

  opts?.onBatch?.(processed);
  return processed;
}

/**
 * Collect cursor results in chunks (array of batches), yielding between batches.
 * Prefer this over getAll() when the consumer can process per-batch.
 */
export async function collectObjectStoreInBatches<T>(
  store: IDBObjectStore,
  opts?: CursorBatchOptions,
): Promise<T[]> {
  const out: T[] = [];
  await streamObjectStoreCursor<T>(
    store,
    (item) => {
      out.push(item.value);
    },
    opts,
  );
  return out;
}

/**
 * Dexie-friendly offset/limit page walk with yield between pages.
 * `fetchPage(offset, limit)` must return the next page (empty = done).
 */
export async function streamPagedQuery<T>(
  fetchPage: (offset: number, limit: number) => Promise<readonly T[]>,
  onBatch: (batch: readonly T[], offset: number) => void | Promise<void>,
  opts?: CursorBatchOptions,
): Promise<number> {
  const batchSize = resolveBatchSize(opts);
  let offset = 0;
  let total = 0;

  for (;;) {
    threwIfAborted(opts?.signal);
    const page = await fetchPage(offset, batchSize);
    if (!page.length) break;
    await onBatch(page, offset);
    total += page.length;
    offset += page.length;
    opts?.onBatch?.(total);
    if (page.length < batchSize) break;
    await yieldToMain();
  }

  return total;
}

/**
 * Filter a large in-memory array in chunks (e.g. Hadith CDN collections)
 * without blocking the main thread for the entire pass.
 */
export async function filterInChunks<T>(
  items: readonly T[],
  predicate: (item: T, index: number) => boolean,
  opts?: CursorBatchOptions,
): Promise<T[]> {
  const batchSize = resolveBatchSize(opts);
  const out: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    threwIfAborted(opts?.signal);
    if (i > 0) await yieldToMain();
    const end = Math.min(i + batchSize, items.length);
    for (let j = i; j < end; j++) {
      if (predicate(items[j]!, j)) out.push(items[j]!);
    }
    opts?.onBatch?.(end);
  }
  return out;
}

/** Test helper — exposed batch size clamp. */
export function clampCursorBatchSize(n: number): number {
  return resolveBatchSize({ batchSize: n });
}
