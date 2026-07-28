/**
 * Progressive / chunked JSON loading for large Islamic reference payloads.
 * Yields to main thread during parse of large arrays to avoid long tasks.
 */

import { yieldToMain } from "@/lib/idle-defer";

export type ProgressiveJsonOptions = {
  signal?: AbortSignal;
  /** Yield to main every N array items when walking large lists */
  yieldEvery?: number;
  timeoutMs?: number;
};

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

/**
 * Fetch JSON with abort + optional timeout. Uses arrayBuffer + TextDecoder
 * for large bodies so we can yield before JSON.parse on huge strings.
 */
export async function fetchJsonProgressive<T>(
  input: RequestInfo | URL,
  opts: ProgressiveJsonOptions = {},
): Promise<T> {
  assertNotAborted(opts.signal);

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onAbort, { once: true });

  let timer: ReturnType<typeof setTimeout> | undefined;
  if (opts.timeoutMs && opts.timeoutMs > 0) {
    timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  }

  try {
    const res = await fetch(input, { signal: controller.signal });
    assertNotAborted(opts.signal);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Prefer streaming text for large responses
    const len = Number(res.headers.get("content-length") || 0);
    if (len > 512_000 && typeof res.arrayBuffer === "function") {
      const buf = await res.arrayBuffer();
      assertNotAborted(opts.signal);
      await yieldToMain();
      const text = new TextDecoder("utf-8").decode(buf);
      await yieldToMain();
      assertNotAborted(opts.signal);
      return JSON.parse(text) as T;
    }

    return (await res.json()) as T;
  } finally {
    if (timer) clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Walk a large array in slices, yielding to the main thread between slices.
 * Useful after loading full Hadith/Tafseer JSON.
 */
export async function forEachInChunks<T>(
  items: T[],
  fn: (item: T, index: number) => void,
  opts?: { chunkSize?: number; signal?: AbortSignal },
): Promise<void> {
  const chunkSize = Math.max(8, opts?.chunkSize ?? 64);
  for (let i = 0; i < items.length; i += chunkSize) {
    assertNotAborted(opts?.signal);
    const end = Math.min(items.length, i + chunkSize);
    for (let j = i; j < end; j++) fn(items[j], j);
    if (end < items.length) await yieldToMain();
  }
}

/**
 * Map large arrays with periodic yields — returns new array.
 */
export async function mapInChunks<T, R>(
  items: T[],
  mapper: (item: T, index: number) => R,
  opts?: { chunkSize?: number; signal?: AbortSignal },
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  await forEachInChunks(
    items,
    (item, i) => {
      out[i] = mapper(item, i);
    },
    opts,
  );
  return out;
}
