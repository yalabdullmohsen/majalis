/** Generate a user-facing error tracking ID: ERR-YYYYMMDD-HHMMSS-random */
export function createErrorId(prefix = "ERR"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${date}-${time}-${rand}`;
}

export type ClientErrorReport = {
  errorId: string;
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string | null;
  route?: string;
  userAgent?: string;
  section?: string;
  at: string;
};

export async function logClientError(report: ClientErrorReport): Promise<void> {
  if (import.meta.env?.DEV) {
    console.error("[majalis:client-error]", report);
  }

  try {
    const key = "majalis-error-reports-v1";
    const reports = JSON.parse(window.localStorage.getItem(key) || "[]");
    reports.unshift(report);
    window.localStorage.setItem(key, JSON.stringify(reports.slice(0, 10)));
  } catch {
    /* localStorage may be unavailable */
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
