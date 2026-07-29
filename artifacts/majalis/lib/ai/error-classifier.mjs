/**
 * Central AI error classifier — maps provider failures to stable codes.
 * Never logs secrets or raw credential material.
 */

export const AI_ERROR_CODES = Object.freeze({
  credit_exhausted: "credit_exhausted",
  rate_limited: "rate_limited",
  authentication_error: "authentication_error",
  invalid_request: "invalid_request",
  provider_unavailable: "provider_unavailable",
  timeout: "timeout",
  network_error: "network_error",
  circuit_open: "circuit_open",
  daily_limit: "daily_limit",
  concurrency_limit: "concurrency_limit",
  unknown: "unknown",
});

/**
 * @param {unknown} err
 * @param {{ status?: number, bodyText?: string }} [ctx]
 */
export function classifyAiError(err, ctx = {}) {
  const status = Number(ctx.status ?? err?.status ?? err?.statusCode ?? 0) || 0;
  const msg = String(
    ctx.bodyText || err?.message || err?.error?.message || err?.error || "",
  ).toLowerCase();

  if (status === 402 || msg.includes("credit") || msg.includes("billing") || msg.includes("balance") || msg.includes("quota")) {
    return { code: AI_ERROR_CODES.credit_exhausted, retryable: false, httpHint: 402 };
  }
  if (status === 401 || status === 403 || msg.includes("api_key") || msg.includes("invalid key") || msg.includes("unauthorized")) {
    return { code: AI_ERROR_CODES.authentication_error, retryable: false, httpHint: status || 401 };
  }
  if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests")) {
    return { code: AI_ERROR_CODES.rate_limited, retryable: true, httpHint: 429 };
  }
  if (status === 400 || msg.includes("invalid_request")) {
    return { code: AI_ERROR_CODES.invalid_request, retryable: false, httpHint: 400 };
  }
  if (status === 408 || err?.name === "AbortError" || err?.name === "TimeoutError" || err?.name === "APIConnectionTimeoutError" || msg.includes("timeout")) {
    return { code: AI_ERROR_CODES.timeout, retryable: true, httpHint: 408 };
  }
  if (status >= 500 && status < 600) {
    return { code: AI_ERROR_CODES.provider_unavailable, retryable: true, httpHint: status };
  }
  if (err?.name === "APIConnectionError" || msg.includes("fetch failed") || msg.includes("network")) {
    return { code: AI_ERROR_CODES.network_error, retryable: true, httpHint: 503 };
  }
  if (msg.includes("circuit") || msg.includes("provider_paused")) {
    return { code: AI_ERROR_CODES.circuit_open, retryable: false, httpHint: 503 };
  }
  return { code: AI_ERROR_CODES.unknown, retryable: false, httpHint: 500 };
}

export function isPermanentAiFailure(code) {
  return (
    code === AI_ERROR_CODES.credit_exhausted ||
    code === AI_ERROR_CODES.authentication_error ||
    code === AI_ERROR_CODES.invalid_request ||
    code === AI_ERROR_CODES.circuit_open ||
    code === AI_ERROR_CODES.daily_limit
  );
}

export function providerPausedBody(reason, retryAfterIso) {
  return {
    status: "provider_paused",
    reason,
    retryAfter: retryAfterIso,
  };
}
