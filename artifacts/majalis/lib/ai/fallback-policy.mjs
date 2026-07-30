/**
 * Provider fallback policy — never escalate to a more expensive provider
 * unless allowExpensiveFallback is explicitly true.
 */
import { providerCostTier } from "./spend-governance.mjs";

/**
 * @param {string} primary
 * @param {string[]} candidates
 * @param {{ allowExpensiveFallback?: boolean }} [policy]
 * @returns {string[]} ordered fallbacks excluding primary
 */
export function resolveProviderFallbacks(primary, candidates = [], policy = {}) {
  const allowExpensive = policy.allowExpensiveFallback === true;
  const primaryTier = providerCostTier(primary);
  const out = [];
  for (const c of candidates) {
    if (!c || c === primary) continue;
    const tier = providerCostTier(c);
    if (!allowExpensive && tier > primaryTier) continue;
    out.push(c);
  }
  // Prefer cheaper / equal tiers first
  out.sort((a, b) => providerCostTier(a) - providerCostTier(b));
  return out;
}

/**
 * Decide whether a classified error should consume a retry attempt.
 * credit_exhausted / auth / invalid / spend limits → never retry.
 * rate_limit / network / timeout / provider_unavailable → limited retry.
 */
export function shouldRetryAiError(code, { attempt = 0, maxRetries = 1 } = {}) {
  const noRetry = new Set([
    "credit_exhausted",
    "quota_exceeded",
    "billing_error",
    "authentication_error",
    "invalid_request",
    "circuit_open",
    "daily_limit",
    "daily_spend_limit",
    "monthly_spend_limit",
    "monthly_limit",
    "concurrency_limit",
    "durable_store_unavailable",
    "duplicate_content",
  ]);
  if (noRetry.has(code)) return false;
  const retryable = new Set(["rate_limited", "network_error", "timeout", "provider_unavailable"]);
  if (!retryable.has(code)) return false;
  return attempt < maxRetries;
}
