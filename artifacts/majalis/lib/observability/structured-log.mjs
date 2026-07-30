/**
 * Server structured JSON logging — unified correlation fields.
 * Never logs tokens, secrets, session payloads, or user free-text content.
 */
import { randomUUID } from "node:crypto";

const REDACT_KEYS =
  /^(authorization|cookie|password|token|apikey|api_key|secret|anon.?key|refresh.?token|access.?token|session|prompt|completion|content|body|message|messages|transcript|user_text|raw)$/i;

/**
 * @param {Record<string, unknown>} [fields]
 */
export function sanitizeObsFields(fields) {
  if (!fields || typeof fields !== "object") return {};
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if (REDACT_KEYS.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    if (typeof v === "string" && v.length > 240) {
      out[k] = `${v.slice(0, 80)}…[truncated ${v.length}]`;
      continue;
    }
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = sanitizeObsFields(/** @type {Record<string, unknown>} */ (v));
      continue;
    }
    out[k] = v;
  }
  return out;
}

/**
 * @param {"debug"|"info"|"warn"|"error"} level
 * @param {string} msg
 * @param {Record<string, unknown>} [fields]
 */
export function structuredLog(level, msg, fields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "majalis-api",
    ...sanitizeObsFields(fields),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  return entry;
}

export function newRequestId() {
  return randomUUID();
}

export function newTraceId(seed) {
  return String(seed || randomUUID());
}

export function newJobRunId() {
  return randomUUID();
}

/**
 * Attach correlation ids to a log/metric payload.
 * @param {{ requestId?: string, traceId?: string, jobRunId?: string }} ctx
 * @param {Record<string, unknown>} [extra]
 */
export function withCorrelation(ctx = {}, extra = {}) {
  return sanitizeObsFields({
    request_id: ctx.requestId || ctx.request_id || undefined,
    trace_id: ctx.traceId || ctx.trace_id || undefined,
    job_run_id: ctx.jobRunId || ctx.job_run_id || undefined,
    ...extra,
  });
}
