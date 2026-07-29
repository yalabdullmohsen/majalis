/**
 * Central AI error classifier — maps provider failures to stable codes.
 * Priority: provider code → HTTP status → structured type → SDK class → message fallback.
 * Never logs secrets or raw credential material.
 */

export const AI_ERROR_CODES = Object.freeze({
  credit_exhausted: "credit_exhausted",
  quota_exceeded: "quota_exceeded",
  billing_error: "billing_error",
  rate_limited: "rate_limited",
  authentication_error: "authentication_error",
  invalid_request: "invalid_request",
  provider_unavailable: "provider_unavailable",
  timeout: "timeout",
  network_error: "network_error",
  circuit_open: "circuit_open",
  daily_limit: "daily_limit",
  concurrency_limit: "concurrency_limit",
  durable_store_unavailable: "durable_store_unavailable",
  unknown: "unknown",
});

function providerCode(err, ctx) {
  return String(
    ctx.code ||
      err?.code ||
      err?.error?.code ||
      err?.type ||
      err?.error?.type ||
      "",
  ).toLowerCase();
}

/**
 * @param {unknown} err
 * @param {{ status?: number, bodyText?: string, code?: string, headers?: Record<string, string> }} [ctx]
 */
export function classifyAiError(err, ctx = {}) {
  const status = Number(ctx.status ?? err?.status ?? err?.statusCode ?? 0) || 0;
  const code = providerCode(err, ctx);
  const msg = String(
    ctx.bodyText || err?.message || err?.error?.message || err?.error || "",
  ).toLowerCase();
  const headers = ctx.headers || err?.headers || err?.response?.headers || {};
  const retryAfterHeader = headers["retry-after"] || headers["Retry-After"];

  // 1) Provider-specific codes
  if (
    code === "insufficient_quota" ||
    code === "credit_exhausted" ||
    code === "billing_not_active" ||
    code === "payment_required"
  ) {
    return { code: AI_ERROR_CODES.credit_exhausted, retryable: false, httpHint: 402, retryAfterHeader };
  }
  if (code === "rate_limit_exceeded" || code === "rate_limit_error" || code === "too_many_requests") {
    return { code: AI_ERROR_CODES.rate_limited, retryable: true, httpHint: 429, retryAfterHeader };
  }
  if (
    code === "invalid_api_key" ||
    code === "authentication_error" ||
    code === "permission_error" ||
    code === "unauthorized"
  ) {
    return { code: AI_ERROR_CODES.authentication_error, retryable: false, httpHint: 401, retryAfterHeader };
  }
  if (code === "invalid_request_error" || code === "invalid_request") {
    return { code: AI_ERROR_CODES.invalid_request, retryable: false, httpHint: 400, retryAfterHeader };
  }
  if (code === "overloaded_error" || code === "api_error" || code === "service_unavailable") {
    return { code: AI_ERROR_CODES.provider_unavailable, retryable: true, httpHint: 503, retryAfterHeader };
  }
  if (code === "quota_exceeded" || code === "daily_quota") {
    return { code: AI_ERROR_CODES.quota_exceeded, retryable: false, httpHint: 429, retryAfterHeader };
  }

  // 2) HTTP status
  if (status === 402) {
    return { code: AI_ERROR_CODES.credit_exhausted, retryable: false, httpHint: 402, retryAfterHeader };
  }
  if (status === 401 || status === 403) {
    return { code: AI_ERROR_CODES.authentication_error, retryable: false, httpHint: status, retryAfterHeader };
  }
  if (status === 429) {
    // Distinguish quota vs rate when message is clear; default rate_limited
    if (/\bquota\b/.test(msg) && !/\brate\b/.test(msg)) {
      return { code: AI_ERROR_CODES.quota_exceeded, retryable: false, httpHint: 429, retryAfterHeader };
    }
    return { code: AI_ERROR_CODES.rate_limited, retryable: true, httpHint: 429, retryAfterHeader };
  }
  if (status === 400) {
    // Narrow credit detection: require billing/credit tokens, not bare "quota"
    if (/\b(credit|billing|balance|payment)\b/.test(msg)) {
      return { code: AI_ERROR_CODES.credit_exhausted, retryable: false, httpHint: 402, retryAfterHeader };
    }
    return { code: AI_ERROR_CODES.invalid_request, retryable: false, httpHint: 400, retryAfterHeader };
  }
  if (status === 408) {
    return { code: AI_ERROR_CODES.timeout, retryable: true, httpHint: 408, retryAfterHeader };
  }
  if (status >= 500 && status < 600) {
    return { code: AI_ERROR_CODES.provider_unavailable, retryable: true, httpHint: status, retryAfterHeader };
  }

  // 3) SDK / exception class
  if (
    err?.name === "AbortError" ||
    err?.name === "TimeoutError" ||
    err?.name === "APIConnectionTimeoutError"
  ) {
    return { code: AI_ERROR_CODES.timeout, retryable: true, httpHint: 408, retryAfterHeader };
  }
  if (err?.name === "APIConnectionError") {
    return { code: AI_ERROR_CODES.network_error, retryable: true, httpHint: 503, retryAfterHeader };
  }
  if (err?.code === "durable_store_unavailable" || msg.includes("durable_store_unavailable")) {
    return {
      code: AI_ERROR_CODES.durable_store_unavailable,
      retryable: false,
      httpHint: 503,
      retryAfterHeader,
    };
  }

  // 4) Message fallback (narrow)
  if (/\b(credit balance|billing|out of credits|payment required)\b/.test(msg)) {
    return { code: AI_ERROR_CODES.credit_exhausted, retryable: false, httpHint: 402, retryAfterHeader };
  }
  if (/\binvalid[_ ]?api[_ ]?key\b|\bunauthorized\b/.test(msg)) {
    return { code: AI_ERROR_CODES.authentication_error, retryable: false, httpHint: 401, retryAfterHeader };
  }
  if (/\brate limit\b|\btoo many requests\b/.test(msg)) {
    return { code: AI_ERROR_CODES.rate_limited, retryable: true, httpHint: 429, retryAfterHeader };
  }
  if (/\btimeout\b/.test(msg)) {
    return { code: AI_ERROR_CODES.timeout, retryable: true, httpHint: 408, retryAfterHeader };
  }
  if (/\bfetch failed\b|\bnetwork\b/.test(msg)) {
    return { code: AI_ERROR_CODES.network_error, retryable: true, httpHint: 503, retryAfterHeader };
  }
  if (/\bcircuit\b|\bprovider_paused\b/.test(msg)) {
    return { code: AI_ERROR_CODES.circuit_open, retryable: false, httpHint: 503, retryAfterHeader };
  }

  return { code: AI_ERROR_CODES.unknown, retryable: false, httpHint: 500, retryAfterHeader };
}

export function isPermanentAiFailure(code) {
  return (
    code === AI_ERROR_CODES.credit_exhausted ||
    code === AI_ERROR_CODES.quota_exceeded ||
    code === AI_ERROR_CODES.billing_error ||
    code === AI_ERROR_CODES.authentication_error ||
    code === AI_ERROR_CODES.invalid_request ||
    code === AI_ERROR_CODES.circuit_open ||
    code === AI_ERROR_CODES.daily_limit ||
    code === AI_ERROR_CODES.durable_store_unavailable
  );
}

export function opensCircuitImmediately(code) {
  return (
    code === AI_ERROR_CODES.credit_exhausted ||
    code === AI_ERROR_CODES.quota_exceeded ||
    code === AI_ERROR_CODES.billing_error ||
    code === AI_ERROR_CODES.authentication_error
  );
}

export function providerPausedBody(reason, retryAfterIso) {
  return {
    status: "provider_paused",
    reason,
    retryAfter: retryAfterIso,
  };
}

/** Parse Retry-After header (seconds or HTTP date) → ISO string or null */
export function parseRetryAfterHeader(value, fallbackMs = 60_000) {
  if (value == null || value === "") {
    return new Date(Date.now() + fallbackMs).toISOString();
  }
  const asNum = Number(value);
  if (Number.isFinite(asNum) && asNum >= 0) {
    return new Date(Date.now() + asNum * 1000).toISOString();
  }
  const asDate = Date.parse(String(value));
  if (Number.isFinite(asDate)) return new Date(asDate).toISOString();
  return new Date(Date.now() + fallbackMs).toISOString();
}
