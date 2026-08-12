/** Generate a user-facing error tracking ID: MJL-YYYYMMDD-HHMMSS-random */
export function createErrorId(prefix = "MJL"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${date}-${time}-${rand}`;
}

declare global {
  interface Window {
    __MAJALIS_USER_ID__?: string | null;
    __MAJALIS_LAST_ACTION__?: string;
  }
}

export type ClientErrorReport = {
  errorId: string;
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string | null;
  component?: string;
  route?: string;
  userAgent?: string;
  section?: string;
  userId?: string | null;
  userAction?: string;
  buildVersion?: string;
  commitHash?: string;
  deviceType?: string;
  apiResponse?: string;
  at: string;
};

const STORAGE_KEY = "majalis-error-reports-v2";
const MAX_LOCAL_REPORTS = 50;

export function getBuildMetadata() {
  const commitHash =
    (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined) ||
    (import.meta.env.VITE_COMMIT_HASH as string | undefined) ||
    "unknown";
  const buildVersion =
    (import.meta.env.VITE_BUILD_ID as string | undefined) ||
    (import.meta as { env?: { MODE?: string } }).env?.MODE ||
    "dev";
  return { commitHash, buildVersion };
}

function detectDeviceType(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Mobile/i.test(ua)) return "mobile";
  return "desktop";
}

function parseComponentFromStack(componentStack?: string | null): string | undefined {
  if (!componentStack) return undefined;
  const match = componentStack.match(/^\s*at (\w+)/m);
  return match?.[1];
}

function persistLocalReport(report: ClientErrorReport) {
  try {
    const reports: ClientErrorReport[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports.slice(0, MAX_LOCAL_REPORTS)));
  } catch {
    /* localStorage may be unavailable */
  }
}

export function lookupLocalErrorReport(errorId: string): ClientErrorReport | null {
  try {
    const reports: ClientErrorReport[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return reports.find((r) => r.errorId === errorId) ?? null;
  } catch {
    return null;
  }
}

export function setLastUserAction(action: string) {
  if (typeof window === "undefined") return;
  window.__MAJALIS_LAST_ACTION__ = action;
}

export function buildErrorReport(
  error: Error,
  extra: Partial<ClientErrorReport> = {},
): ClientErrorReport {
  const { commitHash, buildVersion } = getBuildMetadata();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  return {
    errorId: extra.errorId || createErrorId("MJL"),
    message: error.message || "Unknown error",
    name: error.name,
    stack: error.stack,
    componentStack: extra.componentStack,
    component: extra.component || parseComponentFromStack(extra.componentStack),
    route: extra.route ?? (typeof window !== "undefined" ? window.location.pathname : ""),
    userAgent: ua,
    section: extra.section,
    userId: extra.userId ?? (typeof window !== "undefined" ? window.__MAJALIS_USER_ID__ ?? null : null),
    userAction: extra.userAction ?? (typeof window !== "undefined" ? window.__MAJALIS_LAST_ACTION__ : undefined),
    buildVersion,
    commitHash,
    deviceType: detectDeviceType(ua),
    apiResponse: extra.apiResponse,
    at: new Date().toISOString(),
  };
}

export async function logClientError(report: ClientErrorReport): Promise<void> {
  persistLocalReport(report);

  if (import.meta.env?.DEV) {
    console.error("[majalis:client-error]", report);
  }

  try {
    await fetch("/api/client-error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    });
  } catch {
    /* optional endpoint — ignore network failures */
  }
}

export async function copyErrorId(errorId: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(errorId);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = errorId;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

let initialized = false;

/** Global handlers for uncaught errors outside React tree */
export function initClientErrorReporting() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    const err = event.error instanceof Error ? event.error : new Error(event.message || "Script error");
    void logClientError(buildErrorReport(err, { component: "window.onerror" }));
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));
    void logClientError(buildErrorReport(err, { component: "unhandledrejection" }));
  });

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      const label =
        target?.getAttribute("aria-label") ||
        target?.textContent?.trim().slice(0, 80) ||
        target?.tagName;
      if (label) setLastUserAction(`click:${label}`);
    },
    true,
  );
}
