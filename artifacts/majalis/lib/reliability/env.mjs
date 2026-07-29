/**
 * Reliability store environment policy.
 * Production: durable PostgreSQL only — never silent Memory.
 * Tests/dev: Memory allowed only with ALLOW_IN_MEMORY_RELIABILITY_STORE=1 or NODE_ENV=test.
 */

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

export function durableStoreUnavailableError(component) {
  const err = new Error(`durable_store_unavailable:${component}`);
  err.code = "durable_store_unavailable";
  err.component = component;
  return err;
}

export function logDurableStoreUnavailable(component, detail) {
  console.error(
    JSON.stringify({
      level: "error",
      msg: "durable_store_unavailable",
      metric: "durable_store_unavailable",
      component,
      detail: String(detail || "").slice(0, 200),
      production: isProductionRuntime(),
      ts: new Date().toISOString(),
    }),
  );
}
