/**
 * Adaptive retry — classify errors and schedule intelligent backoff.
 */

export const RETRY_CLASS = {
  IMMEDIATE: "immediate",
  LATER: "later",
  NEVER: "never",
};

const IMMEDIATE_PATTERNS = [
  /timeout/i, /ETIMEDOUT/i, /ECONNRESET/i, /ECONNREFUSED/i,
  /429/, /rate.?limit/i, /503/, /502/, /504/, /temporary/i,
  /network/i, /socket/i, /aborted/i,
];

const LATER_PATTERNS = [
  /500/, /501/, /505/, /unavailable/i, /maintenance/i,
  /403/, /401/, /overloaded/i, /quota/i,
];

const NEVER_PATTERNS = [
  /404/, /410/, /invalid content/i, /unsupported format/i,
  /parse.?error/i, /malformed/i, /permanent/i, /deleted source/i,
  /not found/i, /invalid_url/i, /empty_content/i,
];

export function classifyRetryError(error) {
  const msg = String(error?.message || error || "");
  if (NEVER_PATTERNS.some((p) => p.test(msg))) {
    return { class: RETRY_CLASS.NEVER, reason: "permanent_failure" };
  }
  if (IMMEDIATE_PATTERNS.some((p) => p.test(msg))) {
    return { class: RETRY_CLASS.IMMEDIATE, reason: "transient" };
  }
  if (LATER_PATTERNS.some((p) => p.test(msg))) {
    return { class: RETRY_CLASS.LATER, reason: "server_unavailable" };
  }
  return { class: RETRY_CLASS.LATER, reason: "unknown" };
}

/** Exponential backoff: immediate → 30s → 2m → 8m → 32m */
export function adaptiveRetryDelay(attempt, errorClass = RETRY_CLASS.LATER) {
  if (errorClass === RETRY_CLASS.NEVER) return null;
  if (errorClass === RETRY_CLASS.IMMEDIATE) {
    return attempt <= 1 ? 0 : Math.min(30_000 * 2 ** (attempt - 2), 120_000);
  }
  const base = 60_000;
  return Math.min(base * 4 ** (attempt - 1), 1_920_000);
}

export async function withAdaptiveRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts || 4;
  const label = options.label || "operation";
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const { class: errorClass } = classifyRetryError(err);
      if (errorClass === RETRY_CLASS.NEVER) throw err;

      const delay = adaptiveRetryDelay(attempt, errorClass);
      if (delay === null || attempt >= maxAttempts) throw err;

      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export function shouldRequeueJob(error, attempts, maxAttempts = 4) {
  const { class: errorClass } = classifyRetryError(error);
  if (errorClass === RETRY_CLASS.NEVER) return false;
  return attempts < maxAttempts;
}

export function nextJobSchedule(error, attempts) {
  const { class: errorClass } = classifyRetryError(error);
  const delay = adaptiveRetryDelay(attempts, errorClass);
  if (delay === null) return null;
  return new Date(Date.now() + delay).toISOString();
}
