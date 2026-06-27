/**
 * RequestManager — central layer for all client network operations.
 * Enforces timeout, single retry, cancel, dedupe, and slow-request logging.
 */

import { measureAsync } from "@/lib/performance-monitor";

export const REQUEST_TIMEOUT_MS = 3000;
export const REQUEST_MAX_RETRIES = 1;

export class RequestTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`Request timed out after ${ms}ms: ${label}`);
    this.name = "RequestTimeoutError";
  }
}

type RunOptions = {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  dedupeKey?: string;
  label?: string;
};

type Pending = { promise: Promise<unknown>; controller: AbortController; started: number };

const inflight = new Map<string, Pending>();

function mergeSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (a.aborted || b.aborted) {
    controller.abort();
    return controller.signal;
  }
  a.addEventListener("abort", abort, { once: true });
  b.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function requestFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const label = typeof input === "string" ? input : input.toString();
  return RequestManager.fetch(input, { ...init, label });
}

export class RequestManager {
  static async fetch(
    input: RequestInfo | URL,
    init: RequestInit & { label?: string; timeoutMs?: number; retries?: number } = {},
  ): Promise<Response> {
    const label = init.label || String(input);
    const timeoutMs = init.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const retries = init.retries ?? REQUEST_MAX_RETRIES;

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      const signal = mergeSignals(init.signal ?? undefined, controller.signal);

      try {
        const res = await measureAsync("fetch", label, () => fetch(input, { ...init, signal }), {
          attempt,
        });
        window.clearTimeout(timeoutId);
        return res;
      } catch (err) {
        window.clearTimeout(timeoutId);
        lastError = err;
        if (attempt < retries) {
          await sleep(200, init.signal ?? undefined).catch(() => {});
          continue;
        }
      }
    }

    if ((lastError as Error)?.name === "AbortError") {
      throw new RequestTimeoutError(label, timeoutMs);
    }
    throw lastError;
  }

  static async run<T>(label: string, fn: (signal: AbortSignal) => Promise<T>, opts: RunOptions = {}): Promise<T> {
    const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const retries = opts.retries ?? REQUEST_MAX_RETRIES;
    const dedupeKey = opts.dedupeKey ?? label;

    if (dedupeKey && inflight.has(dedupeKey)) {
      return inflight.get(dedupeKey)!.promise as Promise<T>;
    }

    const controller = new AbortController();
    const linked = mergeSignals(opts.signal, controller.signal);

    const exec = async (): Promise<T> => {
      let lastError: unknown;
      for (let attempt = 0; attempt <= retries; attempt++) {
        const attemptController = new AbortController();
        const timeoutId = window.setTimeout(() => attemptController.abort(), timeoutMs);
        const signal = mergeSignals(linked, attemptController.signal);

        try {
          const result = await measureAsync("query", label, () => fn(signal!), { attempt });
          window.clearTimeout(timeoutId);
          return result;
        } catch (err) {
          window.clearTimeout(timeoutId);
          lastError = err;
          if (attempt < retries) {
            await sleep(200, linked).catch(() => {});
            continue;
          }
        }
      }

      if ((lastError as Error)?.name === "AbortError") {
        throw new RequestTimeoutError(label, timeoutMs);
      }
      throw lastError;
    };

    const promise = exec().finally(() => {
      if (inflight.get(dedupeKey)?.promise === promise) inflight.delete(dedupeKey);
    });

    inflight.set(dedupeKey, { promise, controller, started: Date.now() });
    return promise;
  }

  static cancel(dedupeKey: string): void {
    inflight.get(dedupeKey)?.controller.abort();
    inflight.delete(dedupeKey);
  }
}

/** Wrap legacy Promise loaders — timeout + retry + guaranteed settlement. */
export async function runWithTimeout<T>(
  label: string,
  fn: () => Promise<T>,
  opts: Omit<RunOptions, "signal"> & { fallback?: T } = {},
): Promise<{ data: T; error: null } | { data: T | null; error: string }> {
  try {
    const data = await RequestManager.run(label, () => fn(), opts);
    return { data, error: null };
  } catch (err) {
    const message = String((err as Error)?.message || err);
    if (opts.fallback !== undefined) return { data: opts.fallback, error: message };
    return { data: null, error: message };
  }
}
