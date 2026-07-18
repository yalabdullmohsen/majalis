/**
 * تفضيلات تنبيه الصلاة القادمة (شريط داخل التطبيق + إشعار محلي + Live Activity).
 * منفصلة عن adhan-preferences.ts (تلك خاصة بتشغيل صوت الأذان لكل صلاة بدقائق
 * تحذير قابلة للتخصيص) — هذه خاصة بميزة العدّ التنازلي الموحّدة قبل ١٥ دقيقة.
 * تُخزَّن في localStorage، تعمل بلا اتصال وبلا تسجيل دخول.
 */

const STORE_KEY = "majalis-prayer-alert-prefs-v1";

/** دقائق التنبيه المسبق قبل الصلاة — ثابتة حسب المواصفة. */
export const PRE_ALERT_MINUTES = 15;

/** مدة بقاء Live Activity بعد دخول وقت الصلاة قبل إنهائها تلقائياً. */
export const LIVE_ACTIVITY_LINGER_MINUTES = 5;

export type PrayerAlertPreferences = {
  /** تنبيه قبل الصلاة بـ15 دقيقة (شريط داخل التطبيق + إشعار محلي). */
  preAlertEnabled: boolean;
  /** تنبيه عند دخول وقت الصلاة. */
  enterAlertEnabled: boolean;
  /** Live Activity في Dynamic Island وشاشة القفل (iOS 16.1+ فقط). */
  liveActivitiesEnabled: boolean;
};

function defaultPrefs(): PrayerAlertPreferences {
  return {
    preAlertEnabled: true,
    enterAlertEnabled: true,
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
      preAlertEnabled: parsed.preAlertEnabled ?? base.preAlertEnabled,
      enterAlertEnabled: parsed.enterAlertEnabled ?? base.enterAlertEnabled,
      liveActivitiesEnabled: parsed.liveActivitiesEnabled ?? base.liveActivitiesEnabled,
    };
  } catch {
    return defaultPrefs();
  }
}

export function savePrayerAlertPrefs(prefs: PrayerAlertPreferences): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch { /* تجاهل أخطاء الحصة */ }
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
