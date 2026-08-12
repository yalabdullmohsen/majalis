/**
 * تفضيلات تنبيه الصلاة القادمة (شريط داخل التطبيق + إشعار محلي + Live Activity).
 * منفصلة عن adhan-preferences.ts (تلك خاصة بتشغيل صوت الأذان لكل صلاة بدقائق
 * تحذير قابلة للتخصيص) — هذه خاصة بميزة العدّ التنازلي الموحّدة قبل الصلاة.
 * تُخزَّن في localStorage، تعمل بلا اتصال وبلا تسجيل دخول.
 */

import type { PrayerSoundProfile } from "./prayer-notification-sounds";

const STORE_KEY = "majalis-prayer-alert-prefs-v1";

/** دقائق التنبيه المسبق الافتراضية. */
export const PRE_ALERT_MINUTES = 15;

export const PRE_ALERT_MINUTE_OPTIONS = [5, 10, 15] as const;
export type PreAlertMinutes = (typeof PRE_ALERT_MINUTE_OPTIONS)[number];

/** دقائق بعد دخول الوقت لإشعار التذكير الخفيف. */
export const POST_REMINDER_MINUTES = 5;

/** مدة بقاء Live Activity بعد دخول وقت الصلاة قبل إنهائها تلقائياً. */
export const LIVE_ACTIVITY_LINGER_MINUTES = 5;

export type PrayerAlertPreferences = {
  /** مفتاح رئيسي لإشعارات الصلاة (محلي/أصلي). */
  alertsEnabled: boolean;
  /** تنبيه قبل الصلاة (شريط داخل التطبيق + إشعار محلي). */
  preAlertEnabled: boolean;
  /** دقائق التنبيه المسبق: 5 | 10 | 15. */
  preAlertMinutes: PreAlertMinutes;
  /** تنبيه عند دخول وقت الصلاة. */
  enterAlertEnabled: boolean;
  /** تذكير خفيف بعد دخول الوقت بقليل. */
  postReminderEnabled: boolean;
  /** ملف تعريف صوت الإشعار. */
  soundProfile: PrayerSoundProfile;
  /** Live Activity في Dynamic Island وشاشة القفل (iOS 16.1+ فقط). */
  liveActivitiesEnabled: boolean;
};

function isPreAlertMinutes(v: unknown): v is PreAlertMinutes {
  return v === 5 || v === 10 || v === 15;
}

function isSoundProfile(v: unknown): v is PrayerSoundProfile {
  return (
    v === "auto" ||
    v === "quiet" ||
    v === "clear" ||
    v === "soft" ||
    v === "system"
  );
}

function defaultPrefs(): PrayerAlertPreferences {
  return {
    alertsEnabled: true,
    preAlertEnabled: true,
    preAlertMinutes: PRE_ALERT_MINUTES,
    enterAlertEnabled: true,
    postReminderEnabled: false,
    soundProfile: "auto",
    liveActivitiesEnabled: true,
  };
}

export function loadPrayerAlertPrefs(): PrayerAlertPreferences {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw) as Partial<PrayerAlertPreferences>;
    const base = defaultPrefs();
    return {
      alertsEnabled: parsed.alertsEnabled ?? base.alertsEnabled,
      preAlertEnabled: parsed.preAlertEnabled ?? base.preAlertEnabled,
      preAlertMinutes: isPreAlertMinutes(parsed.preAlertMinutes)
        ? parsed.preAlertMinutes
        : base.preAlertMinutes,
      enterAlertEnabled: parsed.enterAlertEnabled ?? base.enterAlertEnabled,
      postReminderEnabled: parsed.postReminderEnabled ?? base.postReminderEnabled,
      soundProfile: isSoundProfile(parsed.soundProfile)
        ? parsed.soundProfile
        : base.soundProfile,
      liveActivitiesEnabled: parsed.liveActivitiesEnabled ?? base.liveActivitiesEnabled,
    };
  } catch {
    return defaultPrefs();
  }
}

/** يُطلَق بعد حفظ تفضيلات تنبيه الصلاة لإعادة جدولة الإشعارات الأصلية بلا تكرار. */
export const PRAYER_ALERT_PREFS_CHANGED_EVENT = "majalis:prayer-alert-prefs-changed";

export function savePrayerAlertPrefs(prefs: PrayerAlertPreferences): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch { /* تجاهل أخطاء الحصة */ }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PRAYER_ALERT_PREFS_CHANGED_EVENT));
    }
  } catch { /* ignore */ }
}

export function patchPrayerAlertPrefs(patch: Partial<PrayerAlertPreferences>): PrayerAlertPreferences {
  const next = { ...loadPrayerAlertPrefs(), ...patch };
  savePrayerAlertPrefs(next);
  return next;
}

/** هل طُلب إذن الإشعارات من قبل (لتفادي طلبه فور أول تشغيل — نشرحه أولاً). */
const PERMISSION_ASKED_KEY = "majalis-prayer-alert-permission-asked-v1";

export function hasAskedNotificationPermission(): boolean {
  try {
    return localStorage.getItem(PERMISSION_ASKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markNotificationPermissionAsked(): void {
  try {
    localStorage.setItem(PERMISSION_ASKED_KEY, "1");
  } catch { /* تجاهل */ }
}

/** آخر صلاة (بالمفتاح) عرضنا لها شريط العدّ التنازلي وأغلقه المستخدم يدوياً. */
const DISMISSED_KEY = "majalis-prayer-alert-dismissed-v1";

export function isBannerDismissedFor(prayerKey: string): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === prayerKey;
  } catch {
    return false;
  }
}

export function dismissBannerFor(prayerKey: string): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY, prayerKey);
  } catch { /* تجاهل */ }
}

/**
 * تذكير "احترام وقت الصلاة" (ضع هاتفك على الصامت) — مرة واحدة فقط لكل صلاة
 * فعلياً، وليس لكل تبويب/جلسة فقط: نستخدم localStorage (لا sessionStorage)
 * كي لا يتكرر التنبيه إن أُغلق التطبيق وأُعيد فتحه ضمن نفس نافذة الصلاة
 * (مثلاً: فُتح مرتين خلال الـ١٥ دقيقة قبل الظهر). المفتاح المخزَّن هو
 * "تاريخ_مفتاحالصلاة" بتوقيت الكويت — يُعاد تلقائياً لصلاة جديدة غدًا لأن
 * التاريخ يختلف، بلا حاجة لتنظيف يدوي.
 */
const RESPECT_REMINDER_KEY = "majalis-prayer-respect-reminder-shown-v1";

function kuwaitDateKeyForReminder(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(date);
}

export function hasShownRespectReminder(prayerKey: string): boolean {
  try {
    return localStorage.getItem(RESPECT_REMINDER_KEY) === `${kuwaitDateKeyForReminder()}_${prayerKey}`;
  } catch {
    return false;
  }
}

export function markRespectReminderShown(prayerKey: string): void {
  try {
    localStorage.setItem(RESPECT_REMINDER_KEY, `${kuwaitDateKeyForReminder()}_${prayerKey}`);
  } catch { /* تجاهل */ }
}
