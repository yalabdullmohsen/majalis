/**
 * حارس تعطل الإقلاع — Safe Mode محدود بعد فشلين متتاليين دون مسح بيانات المستخدم.
 */
const FAIL_KEY = "mj.startup-fail-count";
const SAFE_KEY = "mj.startup-safe-mode";
const SAFE_REASON_KEY = "mj.startup-safe-reason";

export function readStartupFailCount(): number {
  try {
    return parseInt(sessionStorage.getItem(FAIL_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function recordStartupFailure(reason: string): number {
  const next = readStartupFailCount() + 1;
  try {
    sessionStorage.setItem(FAIL_KEY, String(next));
    sessionStorage.setItem(SAFE_REASON_KEY, reason.slice(0, 180));
    if (next >= 2) {
      sessionStorage.setItem(SAFE_KEY, "1");
    }
  } catch {
    /* ignore */
  }
  return next;
}

export function clearStartupFailures() {
  try {
    sessionStorage.removeItem(FAIL_KEY);
    sessionStorage.removeItem(SAFE_KEY);
    sessionStorage.removeItem(SAFE_REASON_KEY);
  } catch {
    /* ignore */
  }
}

export function isStartupSafeMode(): boolean {
  try {
    return sessionStorage.getItem(SAFE_KEY) === "1";
  } catch {
    return false;
  }
}

export function getStartupSafeReason(): string | null {
  try {
    return sessionStorage.getItem(SAFE_REASON_KEY);
  } catch {
    return null;
  }
}

/** ميزات يُسمح بتعطيلها مؤقتًا في Safe Mode */
export function isOptionalFeatureEnabledInSafeMode(feature: string): boolean {
  if (!isStartupSafeMode()) return true;
  const blocked = new Set([
    "ai-narration",
    "maps",
    "assistant",
    "recommendations",
    "remote-audio-catalog",
    "widgets",
    "background-refresh",
  ]);
  return !blocked.has(feature);
}

/** توافق تسمية البوابة */
export const isOptionalFeatureAllowedInSafeMode = isOptionalFeatureEnabledInSafeMode;
