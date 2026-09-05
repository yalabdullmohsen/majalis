/**
 * بوابة استقرار الهيكل — لا Error/Update/Intro/Assistant فوق شاشة ناقصة.
 * مصدر حقيقة واحد لـ app-booting / أول paint.
 */

export const SHELL_STABLE_EVENT = "mj:shell-stable";
export const BOOT_READY_EVENT = "mj:boot-ready";

/** أقل مهلة بعد زوال app-booting قبل السماح بالشيتات الاختيارية */
export const SHELL_STABLE_GRACE_MS = 600;

/** لا تعتبر مهلة الصفحة فشلًا أثناء الإقلاع */
export const BOOT_ERROR_SUPPRESS_MS = 12_000;

let shellStableAt = 0;

export function isAppBooting(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  return root.classList.contains("app-booting") || root.dataset.appBooting === "1";
}

export function isDocumentPaintReady(): boolean {
  if (typeof document === "undefined") return false;
  return document.readyState !== "loading";
}

/** الهيكل الأساسي جاهز للمس/شيتات اختيارية */
export function isAppShellStable(): boolean {
  if (typeof document === "undefined") return false;
  if (isAppBooting()) return false;
  if (!isDocumentPaintReady()) return false;
  return true;
}

export function markAppShellStable(): void {
  if (typeof document === "undefined") return;
  if (!shellStableAt) shellStableAt = Date.now();
  try {
    document.documentElement.dataset.shellStable = "1";
    window.dispatchEvent(new Event(SHELL_STABLE_EVENT));
  } catch {
    /* ignore */
  }
}

export function msSinceShellStable(): number {
  if (!shellStableAt) return 0;
  return Date.now() - shellStableAt;
}

function bootEpochMs(): number {
  if (typeof performance === "undefined") return Date.now();
  if (typeof performance.timeOrigin === "number" && performance.timeOrigin > 0) {
    return performance.timeOrigin;
  }
  const nav = performance.timing?.navigationStart;
  return typeof nav === "number" && nav > 0 ? nav : Date.now();
}

/** هل ما زلنا في نافذة منع أخطاء الإقلاع الكاذبة؟ */
export function shouldSuppressBootErrors(bootStartedAt?: number): boolean {
  if (isAppBooting()) return true;
  const started = bootStartedAt ?? bootEpochMs();
  if (Date.now() - started < BOOT_ERROR_SUPPRESS_MS) return true;
  if (!isAppShellStable()) return true;
  return false;
}

/**
 * ينتظر استقرار الهيكل ثم grace قصير — للشيتات الاختيارية (تحديث/ترحيب).
 */
export function whenAppShellStable(cb: () => void, graceMs = SHELL_STABLE_GRACE_MS): () => void {
  let cancelled = false;
  let timer: number | null = null;

  const run = () => {
    if (cancelled) return;
    if (!isAppShellStable()) return;
    if (timer != null) return;
    timer = window.setTimeout(() => {
      if (!cancelled && isAppShellStable()) {
        markAppShellStable();
        cb();
      }
    }, graceMs);
  };

  run();
  document.addEventListener(BOOT_READY_EVENT, run);
  document.addEventListener(SHELL_STABLE_EVENT, run);
  window.addEventListener(BOOT_READY_EVENT, run);
  window.addEventListener(SHELL_STABLE_EVENT, run);
  window.addEventListener("load", run);
  const poll = window.setInterval(run, 400);

  return () => {
    cancelled = true;
    if (timer != null) window.clearTimeout(timer);
    window.clearInterval(poll);
    document.removeEventListener(BOOT_READY_EVENT, run);
    document.removeEventListener(SHELL_STABLE_EVENT, run);
    window.removeEventListener(BOOT_READY_EVENT, run);
    window.removeEventListener(SHELL_STABLE_EVENT, run);
    window.removeEventListener("load", run);
  };
}
