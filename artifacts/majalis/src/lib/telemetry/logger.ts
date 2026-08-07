/**
 * Structured centralized telemetry logger (client + isomorphic helpers).
 *
 * - Emits JSON lines suitable for production log drains.
 * - Never throws; never logs secrets, tokens, cookies, or raw PII.
 * - Optional remote ship to `/api/telemetry/log` (rate-limited client-side).
 *
 * Stack note: Majalis is Vite SPA + Vercel API handlers (not Next.js App Router).
 */

export type TelemetryLevel = "debug" | "info" | "warn" | "error";

export type TelemetryPrimitive = string | number | boolean | null;

export type TelemetryFields = Record<string, TelemetryPrimitive | undefined>;

export type TelemetryEvent = {
  ts: string;
  level: TelemetryLevel;
  msg: string;
  service: "majalis-web";
  env: string;
  requestId?: string;
  route?: string;
  commit?: string;
  build?: string;
  fields?: TelemetryFields;
};

const SERVICE = "majalis-web" as const;

const SENSITIVE_KEY =
  /^(authorization|cookie|password|passwd|token|apikey|api[_-]?key|secret|anon[_-]?key|refresh[_-]?token|access[_-]?token|session|prompt|completion|transcript|user[_-]?text|email|phone|ip|ip_address|raw_ip)$/i;

const SENSITIVE_VALUE =
  /(sk-[a-zA-Z0-9]{10,}|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}|Bearer\s+[a-zA-Z0-9._~+/=-]+|postgres(ql)?:\/\/[^\s]+)/i;

const MAX_MSG = 500;
const MAX_FIELD_STRING = 400;
const MAX_FIELDS = 24;
const REMOTE_WINDOW_MS = 10_000;
const REMOTE_MAX_PER_WINDOW = 8;

let remoteCount = 0;
let remoteWindowStart = 0;

function resolveEnv(): string {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.MODE) {
      return String(import.meta.env.MODE);
    }
  } catch {
    /* ignore */
  }
  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return String(process.env.NODE_ENV);
  }
  return "unknown";
}

function resolveBuildMeta(): { commit: string; build: string } {
  let commit = "unknown";
  let build = resolveEnv();
  try {
    const env = import.meta.env as Record<string, string | undefined>;
    commit =
      env.VITE_VERCEL_GIT_COMMIT_SHA ||
      env.VITE_COMMIT_HASH ||
      env.VERCEL_GIT_COMMIT_SHA ||
      commit;
    build = env.VITE_BUILD_ID || env.VITE_APP_VERSION || build;
  } catch {
    /* ignore */
  }
  return { commit: String(commit).slice(0, 40), build: String(build).slice(0, 64) };
}

function currentRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return `${window.location.pathname}${window.location.search}`.slice(0, 300);
  } catch {
    return undefined;
  }
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Redact credential-like keys and secret-shaped values. */
export function sanitizeTelemetryFields(fields?: TelemetryFields): TelemetryFields | undefined {
  if (!fields) return undefined;
  const out: TelemetryFields = {};
  let n = 0;
  for (const [key, value] of Object.entries(fields)) {
    if (n >= MAX_FIELDS) break;
    if (value === undefined) continue;
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      n += 1;
      continue;
    }
    if (typeof value === "string") {
      let s = value.slice(0, MAX_FIELD_STRING);
      if (SENSITIVE_VALUE.test(s)) s = "[redacted]";
      out[key] = s;
    } else {
      out[key] = value;
    }
    n += 1;
  }
  return out;
}

function truncateMsg(msg: string): string {
  const cleaned = String(msg || "event").replace(/\s+/g, " ").trim();
  if (SENSITIVE_VALUE.test(cleaned)) return "[redacted-message]";
  return cleaned.slice(0, MAX_MSG);
}

function buildEvent(
  level: TelemetryLevel,
  msg: string,
  fields?: TelemetryFields,
  requestId?: string,
): TelemetryEvent {
  const meta = resolveBuildMeta();
  return {
    ts: new Date().toISOString(),
    level,
    msg: truncateMsg(msg),
    service: SERVICE,
    env: resolveEnv(),
    requestId: requestId || newRequestId(),
    route: currentRoute(),
    commit: meta.commit,
    build: meta.build,
    fields: sanitizeTelemetryFields(fields),
  };
}

function emitConsole(event: TelemetryEvent): void {
  const line = JSON.stringify(event);
  if (event.level === "error") {
    console.error(line);
  } else if (event.level === "warn") {
    console.warn(line);
  } else if (event.level === "debug") {
    if (resolveEnv() === "development" || resolveEnv() === "dev") {
      console.debug(line);
    }
  } else {
    console.info(line);
  }
}

function allowRemoteShip(): boolean {
  const now = Date.now();
  if (now - remoteWindowStart > REMOTE_WINDOW_MS) {
    remoteWindowStart = now;
    remoteCount = 0;
  }
  if (remoteCount >= REMOTE_MAX_PER_WINDOW) return false;
  remoteCount += 1;
  return true;
}

/**
 * Best-effort POST of a sanitized event to the telemetry ingestion API.
 * Uses sendBeacon when available so unloads still deliver.
 */
export function shipTelemetryEvent(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  if (event.level === "debug") return;
  if (!allowRemoteShip()) return;

  const payload = JSON.stringify({
    level: event.level,
    msg: event.msg,
    requestId: event.requestId,
    route: event.route,
    commit: event.commit,
    build: event.build,
    fields: event.fields ?? {},
    at: event.ts,
  });

  try {
    const url = "/api/telemetry/log";
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  } catch {
    /* never throw from telemetry */
  }
}

export type TelemetryLogOptions = {
  fields?: TelemetryFields;
  requestId?: string;
  /** When true, also POST to `/api/telemetry/log` (errors/warns only). Default: false for info/debug. */
  remote?: boolean;
};

function log(level: TelemetryLevel, msg: string, options?: TelemetryLogOptions): TelemetryEvent {
  const event = buildEvent(level, msg, options?.fields, options?.requestId);
  try {
    emitConsole(event);
    const shouldRemote =
      options?.remote === true ||
      (options?.remote !== false && (level === "error" || level === "warn"));
    if (shouldRemote) shipTelemetryEvent(event);
  } catch {
    /* ignore */
  }
  return event;
}

export const telemetryLogger = {
  debug: (msg: string, options?: TelemetryLogOptions) => log("debug", msg, { ...options, remote: false }),
  info: (msg: string, options?: TelemetryLogOptions) => log("info", msg, options),
  warn: (msg: string, options?: TelemetryLogOptions) => log("warn", msg, options),
  error: (msg: string, options?: TelemetryLogOptions) => log("error", msg, options),
};

/** Capture an unknown thrown value into a redacted telemetry error event. */
export function logCaughtError(
  err: unknown,
  context?: TelemetryFields,
  options?: Omit<TelemetryLogOptions, "fields">,
): TelemetryEvent {
  const name = err instanceof Error ? err.name : "Error";
  const message = err instanceof Error ? err.message : String(err);
  const stack =
    err instanceof Error && typeof err.stack === "string"
      ? err.stack.split("\n").slice(0, 8).join("\n").slice(0, MAX_FIELD_STRING)
      : undefined;

  return telemetryLogger.error(`${name}: ${message}`, {
    ...options,
    remote: options?.remote !== false,
    fields: {
      ...context,
      error_name: name.slice(0, 120),
      ...(stack ? { stack_preview: stack } : {}),
    },
  });
}

/**
 * SHA-256 hex digest for privacy-preserving fingerprints (e.g. hashed IP on the server).
 * Returns empty string when Web Crypto / Node crypto is unavailable.
 */
export async function hashTelemetryFingerprint(value: string, salt = "majalis-telemetry-v1"): Promise<string> {
  const input = `${salt}:${String(value || "")}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* fall through */
  }
  try {
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(input).digest("hex");
  } catch {
    return "";
  }
}

export type { TelemetryEvent as MajalisTelemetryEvent };
