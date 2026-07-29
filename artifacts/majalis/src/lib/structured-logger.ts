/**
 * Structured logger — JSON lines for SRE / browser console correlation.
 * Never throws; never logs secrets.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, string | number | boolean | null | undefined>;

const SENSITIVE = /^(authorization|cookie|password|token|apikey|api_key|secret|anon.?key)$/i;

/** Exported for unit tests — redacts credential-like keys. */
export function sanitizeLogFields(fields?: LogFields): LogFields | undefined {
  if (!fields) return undefined;
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: "majalis-web",
    ...sanitizeLogFields(fields),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else if (level === "debug") {
    if (import.meta.env.DEV) console.debug(line);
  } else {
    console.info(line);
  }
}

export const structuredLog = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
