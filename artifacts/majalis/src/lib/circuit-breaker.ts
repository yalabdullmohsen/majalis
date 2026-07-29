/**
 * Circuit breaker — fail-fast when a dependency is repeatedly unhealthy.
 * Closed → Open (after failureThreshold) → Half-Open (after resetTimeoutMs).
 */

export type CircuitState = "closed" | "open" | "half-open";

export type CircuitBreakerOptions = {
  failureThreshold?: number;
  successThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
};

export class CircuitOpenError extends Error {
  readonly key: string;
  readonly retryAfterMs: number;

  constructor(key: string, retryAfterMs: number) {
    super(`Circuit open for "${key}" — retry after ${retryAfterMs}ms`);
    this.name = "CircuitOpenError";
    this.key = key;
    this.retryAfterMs = retryAfterMs;
  }
}

type BreakerSlot = {
  state: CircuitState;
  failures: number;
  successes: number;
  openedAt: number;
};

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_SUCCESS_THRESHOLD = 2;
const DEFAULT_RESET_TIMEOUT_MS = 30_000;

export class CircuitBreakerRegistry {
  private readonly slots = new Map<string, BreakerSlot>();
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly now: () => number;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.successThreshold = opts.successThreshold ?? DEFAULT_SUCCESS_THRESHOLD;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS;
    this.now = opts.now ?? Date.now;
  }

  getState(key: string): CircuitState {
    return this.ensure(key).state;
  }

  /** Throws CircuitOpenError when the circuit is open and reset window has not elapsed. */
  assertClosed(key: string): void {
    const slot = this.ensure(key);
    if (slot.state !== "open") return;
    const elapsed = this.now() - slot.openedAt;
    if (elapsed >= this.resetTimeoutMs) {
      slot.state = "half-open";
      slot.successes = 0;
      return;
    }
    throw new CircuitOpenError(key, this.resetTimeoutMs - elapsed);
  }

  recordSuccess(key: string): void {
    const slot = this.ensure(key);
    if (slot.state === "half-open") {
      slot.successes += 1;
      if (slot.successes >= this.successThreshold) {
        slot.state = "closed";
        slot.failures = 0;
        slot.successes = 0;
      }
      return;
    }
    slot.failures = 0;
    slot.state = "closed";
  }

  recordFailure(key: string): void {
    const slot = this.ensure(key);
    if (slot.state === "half-open") {
      slot.state = "open";
      slot.openedAt = this.now();
      slot.failures = this.failureThreshold;
      slot.successes = 0;
      return;
    }
    slot.failures += 1;
    if (slot.failures >= this.failureThreshold) {
      slot.state = "open";
      slot.openedAt = this.now();
    }
  }

  snapshot(): Record<string, { state: CircuitState; failures: number }> {
    const out: Record<string, { state: CircuitState; failures: number }> = {};
    for (const [key, slot] of this.slots) {
      out[key] = { state: slot.state, failures: slot.failures };
    }
    return out;
  }

  reset(key?: string): void {
    if (key) {
      this.slots.delete(key);
      return;
    }
    this.slots.clear();
  }

  private ensure(key: string): BreakerSlot {
    let slot = this.slots.get(key);
    if (!slot) {
      slot = { state: "closed", failures: 0, successes: 0, openedAt: 0 };
      this.slots.set(key, slot);
    }
    return slot;
  }
}

/** Shared client-side registry for network dependencies. */
export const networkCircuitBreakers = new CircuitBreakerRegistry();

export function circuitKeyFromUrl(input: RequestInfo | URL): string {
  try {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "https://local.invalid");
    return `${url.origin}${url.pathname.split("/").slice(0, 3).join("/")}`;
  } catch {
    return "unknown";
  }
}
