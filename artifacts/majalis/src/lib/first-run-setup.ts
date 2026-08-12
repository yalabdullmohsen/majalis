/**
 * تهيئة التشغيل الأول (≤٣ شاشات) — منفصلة عن إقلاع النظام الأصلي.
 * لا تُطلب أذونات هنا؛ التطبيق يعمل كاملًا بعد التخطي.
 */

import {
  isOnboardingPending,
  markOnboardingSeen,
  markPreferencesCompleted,
  markPreferencesSkipped,
  markReminderPromptSeen,
  resetOnboardingForDisplay,
} from "./onboarding-state";

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
  // المصدر الموثوق الآن onboarding-state (مخزن دائم متحقَّق من الكتابة).
  // المفتاح القديم يبقى مقروءًا للتوافق فقط.
  if (isOnboardingPending() === false) return false;
  return !readFirstRunSetup().done;
}

/**
 * @returns false إن لم تنزل الحالة في مخزن دائم — يعني أنّ التهيئة *قد*
 *          تعود. الاستدعاء يقرّر ماذا يفعل (لا نُخفي الفشل بصمت كما كان).
 */
export function markFirstRunSetupDone(skipped: boolean): boolean {
  // البوابة الموحّدة أولًا: كتابة متحقَّقة + احتياط كوكي
  markOnboardingSeen();
  markReminderPromptSeen();
  const durable = skipped ? markPreferencesSkipped() : markPreferencesCompleted();

  try {
    const next: FirstRunSetupState = {
      done: true,
      skipped,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIRST_RUN_SETUP_KEY, JSON.stringify(next));
  } catch {
    /* المخزن الدائم أعلاه هو المرجع؛ هذا للتوافق الرجعي فقط */
  }
  return durable;
}

/** زر «إعادة عرض التهيئة» في الإعدادات — الطريق اليدوي الوحيد لإعادتها. */
export function resetFirstRunSetup(): void {
  resetOnboardingForDisplay();
  try {
    localStorage.removeItem(FIRST_RUN_SETUP_KEY);
  } catch {
    /* ignore */
  }
}

/** للاختبارات فقط */
export function resetFirstRunSetupForTests(): void {
  resetFirstRunSetup();
}
