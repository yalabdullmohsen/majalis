/**
 * إشعارات محلية أصلية لتنبيه الصلاة (عبر @capacitor/local-notifications على iOS/أندرويد).
 * على الويب: تُستخدَم بنية adhan-scheduler.ts الحالية (window.Notification) بدلاً منها.
 *
 * لا يُطلَب إذن الإشعارات تلقائياً هنا — انظر requestPermissionIfNeeded()، يُستدعى
 * فقط بعد أن يضغط المستخدم زر "تفعيل" في شارة الشرح (PermissionPrompt).
 */
import { isNative } from "@/lib/capacitor-utils";

const PRE_ALERT_ID_BASE = 9100; // نطاق ثابت لمعرّفات إشعارات "قبل الصلاة"
const ENTER_ID_BASE = 9200; // نطاق ثابت لمعرّفات إشعارات "دخول الوقت"

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

function idFor(base: number, prayerKey: string): number {
  const idx = PRAYER_ORDER.indexOf(prayerKey as (typeof PRAYER_ORDER)[number]);
  return base + (idx >= 0 ? idx : 9);
}

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  if (!isNative) {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "prompt";
  }
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const res = await LocalNotifications.checkPermissions();
    if (res.display === "granted") return "granted";
    if (res.display === "denied") return "denied";
    return "prompt";
  } catch {
    return "unsupported";
  }
}

/** يُستدعى فقط بعد موافقة المستخدم الصريحة على شرح الفائدة — لا يُستدعى تلقائياً أبداً. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const res = await LocalNotifications.requestPermissions();
    return res.display === "granted";
  } catch {
    return false;
  }
}

/** جدولة إشعار "قبل ١٥ دقيقة" + إشعار "دخول الوقت" لصلاة واحدة، عبر النظام الأصلي مباشرة. */
export async function schedulePrayerNativeNotifications(opts: {
  prayerKey: string;
  prayerName: string;
  prayerTimeEpochMs: number;
  preAlertEnabled: boolean;
  enterAlertEnabled: boolean;
  preAlertMinutes: number;
}): Promise<void> {
  if (!isNative) return; // على الويب: adhan-scheduler.ts يتكفّل بالتنبيهات
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") return;

    // ألغِ أي جدولة سابقة لنفس الصلاة قبل إعادة الجدولة (لا تكرار).
    await cancelPrayerNativeNotifications(opts.prayerKey);

    const notifications = [];
    const preAlertEpoch = opts.prayerTimeEpochMs - opts.preAlertMinutes * 60_000;
    if (opts.preAlertEnabled && preAlertEpoch > Date.now()) {
      notifications.push({
        id: idFor(PRE_ALERT_ID_BASE, opts.prayerKey),
        title: "اقتربت الصلاة",
        body: `اقتربت صلاة ${opts.prayerName} — متبقي ${opts.preAlertMinutes} دقيقة`,
        schedule: { at: new Date(preAlertEpoch) },
      });
    }
    if (opts.enterAlertEnabled && opts.prayerTimeEpochMs > Date.now()) {
      notifications.push({
        id: idFor(ENTER_ID_BASE, opts.prayerKey),
        title: "حان وقت الصلاة",
        body: `حان الآن وقت صلاة ${opts.prayerName}`,
        schedule: { at: new Date(opts.prayerTimeEpochMs) },
      });
    }
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    /* تجاهل — الشريط داخل التطبيق يبقى يعمل بمعزل عن هذا */
  }
}

export async function cancelPrayerNativeNotifications(prayerKey: string): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({
      notifications: [
        { id: idFor(PRE_ALERT_ID_BASE, prayerKey) },
        { id: idFor(ENTER_ID_BASE, prayerKey) },
      ],
    });
  } catch { /* تجاهل */ }
}

export async function cancelAllPrayerNativeNotifications(): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const ids = PRAYER_ORDER.flatMap((key) => [
      { id: idFor(PRE_ALERT_ID_BASE, key) },
      { id: idFor(ENTER_ID_BASE, key) },
    ]);
    await LocalNotifications.cancel({ notifications: ids });
  } catch { /* تجاهل */ }
}
