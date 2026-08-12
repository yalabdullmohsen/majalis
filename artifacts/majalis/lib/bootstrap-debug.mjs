/** Serialize errors for API responses and Vercel logs — never swallow stack traces. */

export function serializeError(error, extra = {}) {
  if (!error) {
    return { message: "Unknown error", ...extra };
  }
  if (typeof error === "string") {
    return { message: error, ...extra };
  }
  const out = {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null,
    code: error.code || undefined,
    ...extra,
  };
  if (error.cause) {
    out.cause = serializeError(error.cause);
  }
  return out;
}

export function logBootstrapError(step, error, context = {}) {
  const payload = {
    step,
    ...context,
    error: serializeError(error),
  };
  console.error("[bootstrap-database]", JSON.stringify(payload, null, 2));
  if (error?.stack) console.error(error.stack);
  return payload;
}
