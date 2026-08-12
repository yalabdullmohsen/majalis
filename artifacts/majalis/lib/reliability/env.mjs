/**
 * Reliability store environment policy.
 * Production: durable PostgreSQL only — never silent Memory.
 * Tests/dev: Memory allowed only with ALLOW_IN_MEMORY_RELIABILITY_STORE=1 or NODE_ENV=test.
 */

export const DURABLE_REASONS = Object.freeze({
  database_not_configured: "database_not_configured",
  database_connection_failed: "database_connection_failed",
  queue_schema_missing: "queue_schema_missing",
  queue_column_missing: "queue_column_missing",
  /** Alias used in readiness JSON for missing queue columns. */
  missing_columns: "missing_columns",
  queue_query_failed: "queue_query_failed",
  env_mismatch: "env_mismatch",
  production_db_issue: "production_db_issue",
});

export function isProductionRuntime() {
  const vercel = String(process.env.VERCEL_ENV || "").toLowerCase();
  if (vercel === "production") return true;
  const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
  if (nodeEnv === "production" && vercel !== "preview" && vercel !== "development") {
    return true;
  }
  return false;
}

export function allowInMemoryReliabilityStore() {
  if (isProductionRuntime()) return false;
  if (String(process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE || "").trim() === "1") return true;
  if (String(process.env.NODE_ENV || "").toLowerCase() === "test") return true;
  return false;
}

/**
 * Classify a Postgres / connection error into a safe diagnostic reason (no secrets).
 * @param {unknown} err
 * @returns {keyof typeof DURABLE_REASONS}
 */
export function classifyDurablePgError(err) {
  if (!err) return DURABLE_REASONS.database_not_configured;
  const code = String(/** @type {{ code?: string }} */ (err).code || "");
  const msg = String(/** @type {{ message?: string }} */ (err).message || err);
  if (code === "42P01") return DURABLE_REASONS.queue_schema_missing;
  if (code === "42703") return DURABLE_REASONS.missing_columns;
  if (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "ECONNRESET" ||
    code === "57P01" ||
    code === "57P03" ||
    /timeout|ECONNRESET|Connection terminated|Connection refused|getaddrinfo/i.test(msg)
  ) {
    return isProductionRuntime()
      ? DURABLE_REASONS.production_db_issue
      : DURABLE_REASONS.database_connection_failed;
  }
  if (
    /password authentication failed|ssl (connection|required)|certificate verify|role .* does not exist/i.test(
      msg,
    )
  ) {
    return DURABLE_REASONS.env_mismatch;
  }
  return DURABLE_REASONS.queue_query_failed;
}

/**
 * Public readiness reason — allowlisted codes only (never secrets/stack).
 * @param {string|null|undefined} reason
 */
export function publicReadyReason(reason) {
  const r = String(reason || "");
  // Prefer the public alias over the historical internal code.
  if (r === "queue_column_missing") return DURABLE_REASONS.missing_columns;
  if (Object.prototype.hasOwnProperty.call(DURABLE_REASONS, r)) {
    return /** @type {keyof typeof DURABLE_REASONS} */ (r);
  }
  return DURABLE_REASONS.queue_query_failed;
}

/**
 * @param {string} component
 * @param {string} [reason]
 */
export function durableStoreUnavailableError(component, reason = DURABLE_REASONS.database_not_configured) {
  const safeReason = DURABLE_REASONS[reason] || DURABLE_REASONS.queue_query_failed;
  const err = new Error(`durable_store_unavailable:${component}:${safeReason}`);
  err.code = "durable_store_unavailable";
  err.component = component;
  err.reason = safeReason;
  return err;
}

export function logDurableStoreUnavailable(component, detail, reason) {
  console.error(
    JSON.stringify({
      level: "error",
      msg: "durable_store_unavailable",
      metric: "durable_store_unavailable",
      component,
      reason: reason || null,
      detail: String(detail || "")
        .replace(/postgres(ql)?:\/\/[^@\s]+@/gi, "postgres://***@")
        .replace(/password=[^&\s]+/gi, "password=***")
        .slice(0, 200),
      production: isProductionRuntime(),
      ts: new Date().toISOString(),
    }),
  );
}
