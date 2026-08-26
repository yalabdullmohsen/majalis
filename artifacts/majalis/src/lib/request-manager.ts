/**
 * RequestManager — central layer for all client network operations.
 * Enforces timeout, exponential backoff retry, circuit breaker, cancel, dedupe.
 */

import { measureAsync } from "@/lib/performance-monitor";
import {
  circuitKeyFromUrl,
  networkCircuitBreakers,
  CircuitOpenError,
} from "@/lib/circuit-breaker";
import {
  DEFAULT_RETRY_POLICY,
  computeBackoffDelayMs,
  isRetriableError,
  isRetriableHttpStatus,
} from "@/lib/retry-policy";
import { structuredLog } from "@/lib/structured-logger";

export { CircuitOpenError } from "@/lib/circuit-breaker";

export const REQUEST_TIMEOUT_MS = 8000;
/** Hard ceiling for page/route loading guards — never show loading longer than this. */
export const PAGE_LOAD_TIMEOUT_MS = 8000;
/** No timeout — use for long-running import job polling and batch uploads. */
export const REQUEST_NO_TIMEOUT = 0;
export const REQUEST_MAX_RETRIES = DEFAULT_RETRY_POLICY.maxRetries;

export class RequestTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`Request timed out after ${ms}ms: ${label}`);
    this.name = "RequestTimeoutError";
  }
}

function resolveTimeoutMs(timeoutMs: number | undefined): number | null {
  if (timeoutMs === REQUEST_NO_TIMEOUT || timeoutMs === Infinity) return null;
  return timeoutMs ?? REQUEST_TIMEOUT_MS;
}

type RunOptions = {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  dedupeKey?: string;
  label?: string;
  /** Disable circuit breaker for this call (default false). */
  bypassCircuit?: boolean;
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

async function backoffSleep(attempt: number, signal?: AbortSignal): Promise<void> {
  const delay = computeBackoffDelayMs(attempt, DEFAULT_RETRY_POLICY);
  if (delay <= 0) return;
  await sleep(delay, signal).catch(() => undefined);
}

export async function requestFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const label = typeof input === "string" ? input : input.toString();
  const method = (init.method || "GET").toUpperCase();
  // Dedupe identical in-flight GETs (static JSON / multi-tab spam prevention)
  const dedupeKey =
    method === "GET" || method === "HEAD"
      ? `fetch:${method}:${label}`
      : undefined;
  if (dedupeKey && inflight.has(dedupeKey)) {
    return inflight.get(dedupeKey)!.promise as Promise<Response>;
  }
  const promise = RequestManager.fetch(input, { ...init, label });
  if (dedupeKey) {
    const controller = new AbortController();
    inflight.set(dedupeKey, { promise, controller, started: Date.now() });
    void promise.finally(() => {
      if (inflight.get(dedupeKey)?.promise === promise) inflight.delete(dedupeKey);
    });
  }
  return promise;
}

export class RequestManager {
  static async fetch(
    input: RequestInfo | URL,
    init: RequestInit & {
      label?: string;
      timeoutMs?: number;
      retries?: number;
      bypassCircuit?: boolean;
    } = {},
  ): Promise<Response> {
    const label = init.label || String(input);
    const timeoutMs = resolveTimeoutMs(init.timeoutMs);
    const retries = init.retries ?? REQUEST_MAX_RETRIES;
    const circuitKey = circuitKeyFromUrl(input);
    const bypassCircuit = init.bypassCircuit === true;

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (!bypassCircuit) {
        try {
          networkCircuitBreakers.assertClosed(circuitKey);
        } catch (err) {
          if (err instanceof CircuitOpenError) {
            structuredLog.warn("circuit.open", {
              key: circuitKey,
              label,
              retryAfterMs: err.retryAfterMs,
            });
            throw err;
          }
          throw err;
        }
      }

      const controller = new AbortController();
      const timeoutId =
        timeoutMs != null ? window.setTimeout(() => controller.abort(), timeoutMs) : undefined;
      const signal = mergeSignals(init.signal ?? undefined, controller.signal);

      try {
        const res = await measureAsync("fetch", label, () => fetch(input, { ...init, signal }), {
          attempt,
        });
        if (timeoutId != null) window.clearTimeout(timeoutId);

        if (isRetriableHttpStatus(res.status)) {
          networkCircuitBreakers.recordFailure(circuitKey);
          lastError = new Error(`HTTP ${res.status} for ${label}`);
          if (attempt < retries) {
            await backoffSleep(attempt, init.signal ?? undefined);
            continue;
          }
          return res;
        }

        networkCircuitBreakers.recordSuccess(circuitKey);
        return res;
      } catch (err) {
        if (timeoutId != null) window.clearTimeout(timeoutId);
        lastError = err;
        if (err instanceof CircuitOpenError) throw err;
        networkCircuitBreakers.recordFailure(circuitKey);
        if (attempt < retries && isRetriableError(err)) {
          structuredLog.warn("fetch.retry", { label, attempt, reason: String((err as Error)?.message || err) });
          await backoffSleep(attempt, init.signal ?? undefined);
          continue;
        }
      }
    }

    if ((lastError as Error)?.name === "AbortError") {
      throw new RequestTimeoutError(label, timeoutMs ?? REQUEST_TIMEOUT_MS);
    }
    structuredLog.error("fetch.exhausted", {
      label,
      reason: String((lastError as Error)?.message || lastError),
    });
    throw lastError;
  }

  static async run<T>(label: string, fn: (signal: AbortSignal) => Promise<T>, opts: RunOptions = {}): Promise<T> {
    const timeoutMs = resolveTimeoutMs(opts.timeoutMs);
    const retries = opts.retries ?? REQUEST_MAX_RETRIES;
    const dedupeKey = opts.dedupeKey ?? label;
    const circuitKey = `run:${label.split(":")[0] || label}`;
    const bypassCircuit = opts.bypassCircuit === true;

    if (dedupeKey && inflight.has(dedupeKey)) {
      return inflight.get(dedupeKey)!.promise as Promise<T>;
    }

    const controller = new AbortController();
    const linked = mergeSignals(opts.signal, controller.signal);

    const exec = async (): Promise<T> => {
      const hardCapMs = timeoutMs ?? PAGE_LOAD_TIMEOUT_MS;
      const hardCap =
        hardCapMs != null
          ? new Promise<never>((_, reject) => {
              window.setTimeout(
                () => reject(new RequestTimeoutError(`${label}:hard-cap`, hardCapMs)),
                hardCapMs + 500,
              );
            })
          : null;

      const runAttempts = async (): Promise<T> => {
        let lastError: unknown;
        for (let attempt = 0; attempt <= retries; attempt++) {
          if (!bypassCircuit) {
            try {
              networkCircuitBreakers.assertClosed(circuitKey);
            } catch (err) {
              if (err instanceof CircuitOpenError) {
                structuredLog.warn("circuit.open", {
                  key: circuitKey,
                  label,
                  retryAfterMs: err.retryAfterMs,
                });
                throw err;
              }
              throw err;
            }
          }

          const attemptController = new AbortController();
          const timeoutId =
            timeoutMs != null ? window.setTimeout(() => attemptController.abort(), timeoutMs) : undefined;
          const signal = mergeSignals(linked, attemptController.signal);

          try {
            const result = await measureAsync("query", label, () => fn(signal!), { attempt });
            if (timeoutId != null) window.clearTimeout(timeoutId);
            networkCircuitBreakers.recordSuccess(circuitKey);
            return result;
          } catch (err) {
            if (timeoutId != null) window.clearTimeout(timeoutId);
            lastError = err;
            if (err instanceof CircuitOpenError) throw err;
            networkCircuitBreakers.recordFailure(circuitKey);
            if (attempt < retries && isRetriableError(err)) {
              structuredLog.warn("query.retry", {
                label,
                attempt,
                reason: String((err as Error)?.message || err),
              });
              await backoffSleep(attempt, linked);
              continue;
            }
          }
        }

        if ((lastError as Error)?.name === "AbortError") {
          throw new RequestTimeoutError(label, timeoutMs ?? REQUEST_TIMEOUT_MS);
        }
        throw lastError;
      };

      return hardCap ? Promise.race([runAttempts(), hardCap]) : runAttempts();
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

  /** إلغاء فوري لكل الطلبات الجارية — يُستدعى عند الرجوع السريع. */
  static cancelAllInflight(): void {
    for (const [key, pending] of inflight) {
      try {
        pending.controller.abort();
      } catch {
        /* ignore */
      }
      inflight.delete(key);
    }
  }
}

/** Wrap legacy Promise loaders — timeout + retry + guaranteed settlement (graceful failure). */
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
    structuredLog.warn("run.graceful_failure", { label, reason: message });
    if (opts.fallback !== undefined) return { data: opts.fallback, error: message };
    return { data: null, error: message };
  }
}
