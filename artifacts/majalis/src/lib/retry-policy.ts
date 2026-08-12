/**
 * Retry / backoff policy — exponential backoff with full jitter.
 */

export type RetryPolicy = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 1,
  baseDelayMs: 200,
  maxDelayMs: 4_000,
};

/**
 * Full-jitter delay: random in [0, min(maxDelay, base * 2^attempt)].
 * Deterministic when `random` is injected (tests).
 */
export function computeBackoffDelayMs(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  random: () => number = Math.random,
): number {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt));
  return Math.floor(random() * exp);
}

export function isRetriableError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "AbortError") return false;
  const name = (error as Error)?.name;
  if (name === "AbortError" || name === "CircuitOpenError") return false;
  return true;
}

export function isRetriableHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}
