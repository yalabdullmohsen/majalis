/**
 * تهيئة التشغيل الأول (≤٣ شاشات) — منفصلة عن إقلاع النظام الأصلي.
 * لا تُطلب أذونات هنا؛ التطبيق يعمل كاملًا بعد التخطي.
 *
 * مصدر الحقيقة الوحيد للعرض: onboarding-state (localStorage + cookie + ذاكرة).
 * المفتاح القديم majalis-first-run-setup-v1 يبقى للتوافق/الترحيل فقط.
 */

import {
  hasCompletedPreferences,
  hasSeenOnboarding,
  hasSeenReminderPrompt,
  markOnboardingSeen,
  markPreferencesCompleted,
  markPreferencesSkipped,
  markReminderPromptSeen,
  resetOnboardingForSettingsOnly,
  shouldShowFirstRunFlow,
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

function writeLegacyMirror(skipped: boolean): void {
  try {
    const next: FirstRunSetupState = {
      done: true,
      skipped,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIRST_RUN_SETUP_KEY, JSON.stringify(next));
  } catch {
    /* المخزن الدائم في onboarding-state هو المرجع */
  }
}

/** هل ما زال أي جزء من التهيئة مستحقًا؟ مصدر واحد فقط. */
export function isFirstRunSetupPending(): boolean {
  return shouldShowFirstRunFlow();
}

/**
 * أي خطوة تبدأ منها الواجهة بعد reload جزئي؟
 * 0 ترحيب · 1 قارئ/تفسير · 2 تذكيرات
 */
export function getFirstRunResumeStep(): 0 | 1 | 2 {
  if (!hasSeenOnboarding()) return 0;
  if (!hasCompletedPreferences()) return 1;
  if (!hasSeenReminderPrompt()) return 2;
  return 0;
}

/** وسم شاشة الترحيب فور «ابدأ» أو «تخطّي». */
export function markWelcomeStepDone(): boolean {
  return markOnboardingSeen();
}

/** وسم التفضيلات فور «متابعة» (إكمال) أو «تخطّي». */
export function markPreferencesStepDone(skipped: boolean): boolean {
  return skipped ? markPreferencesSkipped() : markPreferencesCompleted();
}

/** وسم شاشة التذكيرات فور «إنهاء» أو «تخطّي» — بلا طلب إذن نظام. */
export function markRemindersStepDone(): boolean {
  return markReminderPromptSeen();
}

/**
 * إنهاء كامل التدفق (تخطّي من أي شاشة أو إنهاء أخير).
 * يوسم *كل* الرايات المتبقية فورًا قبل إغلاق الواجهة.
 */
export function markFirstRunSetupDone(skipped: boolean): boolean {
  markOnboardingSeen();
  markReminderPromptSeen();
  const durable = skipped ? markPreferencesSkipped() : markPreferencesCompleted();
  writeLegacyMirror(skipped);
  return durable;
}

/** زر «إعادة عرض التهيئة» في الإعدادات — الطريق اليدوي الوحيد لإعادتها. */
export function resetFirstRunSetup(): void {
  resetOnboardingForSettingsOnly();
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
