/**
 * تهيئة التشغيل الأول (≤٣ شاشات) — منفصلة عن إقلاع النظام الأصلي.
 * لا تُطلب أذونات هنا؛ التطبيق يعمل كاملًا بعد التخطي.
 */

export const FIRST_RUN_SETUP_KEY = "majalis-first-run-setup-v1";

export type FirstRunSetupState = {
  /** اكتملت أو تُخطّيت التهيئة */
  done: boolean;
  /** هل ضغط المستخدم تخطيًا في أي شاشة */
  skipped: boolean;
  completedAt?: string;
};

export function readFirstRunSetup(): FirstRunSetupState {
  if (typeof localStorage === "undefined") return { done: true, skipped: false };
  try {
    const raw = localStorage.getItem(FIRST_RUN_SETUP_KEY);
    if (!raw) return { done: false, skipped: false };
    const parsed = JSON.parse(raw) as Partial<FirstRunSetupState>;
    return {
      done: Boolean(parsed.done),
      skipped: Boolean(parsed.skipped),
      completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : undefined,
    };
  } catch {
    return { done: false, skipped: false };
  }
}

export function isFirstRunSetupPending(): boolean {
  return !readFirstRunSetup().done;
}

export function markFirstRunSetupDone(skipped: boolean): void {
  try {
    const next: FirstRunSetupState = {
      done: true,
      skipped,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIRST_RUN_SETUP_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** للاختبارات فقط */
export function resetFirstRunSetupForTests(): void {
  try {
    localStorage.removeItem(FIRST_RUN_SETUP_KEY);
  } catch {
    /* ignore */
  }
}
