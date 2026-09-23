/**
 * AppStartupController — مصدر حقيقة واحد لمسار إقلاع سُنّة (Startup PR-1).
 *
 * الحالات الوحيدة المسموحة:
 *   NATIVE_LAUNCH → BOOTSTRAPPING → MINIMUM_READY → INTERACTIVE
 *   INTERACTIVE ⇄ BACKGROUND_REFRESH
 *   * → RECOVERABLE_ERROR (ثانوي)
 *   * → FATAL_ERROR (فشل الهيكل فقط)
 *
 * لا setTimeout لتأخير الواجهة · لا reload · لا شاشات منتج هنا.
 * علامات DEV عبر markStartup عند الانتقالات الحرجة.
 */
export const APP_STARTUP_STATES = [
  "NATIVE_LAUNCH",
  "BOOTSTRAPPING",
  "MINIMUM_READY",
  "INTERACTIVE",
  "BACKGROUND_REFRESH",
  "RECOVERABLE_ERROR",
  "FATAL_ERROR",
] as const;

export type AppStartupState = (typeof APP_STARTUP_STATES)[number];

export const APP_STARTUP_EVENT = "mj:app-startup";
export const APP_STARTUP_DATASET_KEY = "appStartupState";

type Listener = (next: AppStartupState, prev: AppStartupState, reason: string) => void;

/** انتقالات مسموحة — أي مسار آخر يُرفض (لا تغيير حالة). */
const ALLOWED: Record<AppStartupState, ReadonlySet<AppStartupState>> = {
  NATIVE_LAUNCH: new Set(["BOOTSTRAPPING", "FATAL_ERROR"]),
  BOOTSTRAPPING: new Set(["MINIMUM_READY", "FATAL_ERROR", "RECOVERABLE_ERROR"]),
  MINIMUM_READY: new Set(["INTERACTIVE", "BACKGROUND_REFRESH", "RECOVERABLE_ERROR", "FATAL_ERROR"]),
  INTERACTIVE: new Set(["BACKGROUND_REFRESH", "RECOVERABLE_ERROR", "FATAL_ERROR"]),
  BACKGROUND_REFRESH: new Set(["INTERACTIVE", "RECOVERABLE_ERROR", "FATAL_ERROR"]),
  RECOVERABLE_ERROR: new Set(["INTERACTIVE", "MINIMUM_READY", "BACKGROUND_REFRESH", "FATAL_ERROR"]),
  FATAL_ERROR: new Set(["BOOTSTRAPPING"]), // إعادة محاولة فقط
};

let state: AppStartupState = "NATIVE_LAUNCH";
let lastReason = "init";
let fatalMessage: string | null = null;
const listeners = new Set<Listener>();

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

function syncDom(next: AppStartupState): void {
  if (!isBrowser()) return;
  try {
    document.documentElement.dataset[APP_STARTUP_DATASET_KEY] = next;
  } catch {
    /* ignore */
  }
}

function emit(prev: AppStartupState, next: AppStartupState, reason: string): void {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(
      new CustomEvent(APP_STARTUP_EVENT, {
        detail: { state: next, prev, reason },
      }),
    );
  } catch {
    /* ignore */
  }
  for (const fn of listeners) {
    try {
      fn(next, prev, reason);
    } catch {
      /* ignore */
    }
  }
}

/**
 * انتقال صريح. يُرجع true إن تغيّرت الحالة.
 * الانتقال إلى نفس الحالة يُعتبر نجاحًا صامتًا (idempotent).
 * علامات DEV تبقى عند نقاط الاستدعاء (main/splash/shell) — لا تكرار هنا.
 */
export function transitionAppStartup(
  next: AppStartupState,
  reason = "unspecified",
): boolean {
  if (next === state) {
    lastReason = reason;
    return true;
  }
  const allowed = ALLOWED[state];
  if (!allowed.has(next)) {
    return false;
  }
  const prev = state;
  state = next;
  lastReason = reason;
  if (next !== "FATAL_ERROR") fatalMessage = null;
  syncDom(next);
  emit(prev, next, reason);
  return true;
}

export function getAppStartupState(): AppStartupState {
  return state;
}

export function getAppStartupReason(): string {
  return lastReason;
}

export function getFatalStartupMessage(): string | null {
  return fatalMessage;
}

export function isMinimumReady(): boolean {
  return (
    state === "MINIMUM_READY" ||
    state === "INTERACTIVE" ||
    state === "BACKGROUND_REFRESH" ||
    state === "RECOVERABLE_ERROR"
  );
}

export function isInteractive(): boolean {
  return state === "INTERACTIVE" || state === "BACKGROUND_REFRESH";
}

export function isFatalStartup(): boolean {
  return state === "FATAL_ERROR";
}

export function subscribeAppStartup(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** نهاية طبقة الإطلاق الأصلية (Capacitor) — يبدأ BOOTSTRAPPING. */
export function notifyNativeLaunchEnded(reason = "native-end"): boolean {
  if (state === "NATIVE_LAUNCH") {
    return transitionAppStartup("BOOTSTRAPPING", reason);
  }
  return true;
}

/** بداية مسار JS / قبل createRoot. */
export function notifyBootstrapping(reason = "js-start"): boolean {
  if (state === "NATIVE_LAUNCH") {
    return transitionAppStartup("BOOTSTRAPPING", reason);
  }
  if (state === "BOOTSTRAPPING") {
    lastReason = reason;
    return true;
  }
  return false;
}

/** ثيم + خط أساسي + تخزين محلي / shell geometry جاهزة للعرض. */
export function notifyMinimumReady(reason = "boot-ready"): boolean {
  if (state === "NATIVE_LAUNCH") {
    transitionAppStartup("BOOTSTRAPPING", `${reason}:via-bootstrap`);
  }
  return transitionAppStartup("MINIMUM_READY", reason);
}

/** الهيكل مستقر — تنقّل وتفاعل. */
export function notifyInteractive(reason = "shell-stable"): boolean {
  if (!isMinimumReady() && state !== "MINIMUM_READY") {
    // ارفع إلى MINIMUM_READY أولًا إن فات المسار (سقف أمان / اختبارات)
    if (state === "BOOTSTRAPPING" || state === "NATIVE_LAUNCH") {
      notifyMinimumReady(`${reason}:ensure-minimum`);
    }
  }
  return transitionAppStartup("INTERACTIVE", reason);
}

/** تحديثات خلفية بلا حجب واجهة. */
export function enterBackgroundRefresh(reason = "background-refresh"): boolean {
  if (state === "MINIMUM_READY" || state === "INTERACTIVE" || state === "BACKGROUND_REFRESH") {
    return transitionAppStartup("BACKGROUND_REFRESH", reason);
  }
  return false;
}

export function exitBackgroundRefresh(reason = "background-done"): boolean {
  if (state === "BACKGROUND_REFRESH") {
    return transitionAppStartup("INTERACTIVE", reason);
  }
  return false;
}

export function reportRecoverableError(reason = "recoverable"): boolean {
  return transitionAppStartup("RECOVERABLE_ERROR", reason);
}

export function reportFatalError(message: string, reason = "fatal"): boolean {
  fatalMessage = message;
  return transitionAppStartup("FATAL_ERROR", reason);
}

/** إعادة محاولة بعد FATAL — يعود لـ BOOTSTRAPPING فقط. */
export function retryAfterFatal(reason = "retry"): boolean {
  if (state !== "FATAL_ERROR") return false;
  fatalMessage = null;
  return transitionAppStartup("BOOTSTRAPPING", reason);
}

/** للاختبارات فقط — لا يُستدعى من مسار المنتج. */
export function __resetAppStartupControllerForTests(): void {
  state = "NATIVE_LAUNCH";
  lastReason = "test-reset";
  fatalMessage = null;
  listeners.clear();
  syncDom(state);
}

// مزامنة أولية إن وُجد المستند عند التحميل
syncDom(state);
