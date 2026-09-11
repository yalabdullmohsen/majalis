// Web Notifications API wrapper — إشعارات محلية في المتصفح.
// على Capacitor الأصلي: إذن العرض يُدار عبر @capacitor/local-notifications
// (انظر prayer-local-notifications.ts) — لا تعتمد على window.Notification هناك.

import { isNative } from "@/lib/capacitor-utils";
import {
  notificationBodyWithoutBrand,
  notificationTitleWithoutBrand,
} from "@/lib/notifications/copy";
import {
  SEASONAL_NOTIFICATION_POOL,
  formatNotificationMinutesPhrase,
  pickLocalizedNotification,
} from "@/lib/notifications/localization";

const STORAGE_KEY = "majalis_notif_prefs_v1";

export type NotifPrefs = {
  enabled: boolean;
  flashcardsReminder: boolean;   // مراجعة البطاقات المستحقة
  resumeReminder: boolean;       // الدرس الذي لم يُكتمل
  prayerReminder: boolean;       // قبل الصلاة بـ 10 دقائق
  /** تذكير ورد القرآن اليومي الساعة 5 مساءً (RN scheduleDailyReminder). */
  quranDailyReminder: boolean;
  /** تذكير أذكار الصباح/المساء — يُفعَّل من الإعدادات فقط (لا طلب إذن عند الإطلاق). */
  adhkarReminder: boolean;
  /** تذكيرات صوتية بعبارات الذكر (سبحان الله، الحمد لله، …) طوال ساعات اليقظة. */
  dhikrPhraseReminder: boolean;
  reminderHour: number;          // الساعة المفضلة للتذكير (0-23)
  reminderMinute: number;
};

const DEFAULTS: NotifPrefs = {
  enabled: false,
  flashcardsReminder: true,
  resumeReminder: true,
  prayerReminder: false,
  quranDailyReminder: true,
  adhkarReminder: false,
  dhikrPhraseReminder: true,
  reminderHour: 8,
  reminderMinute: 0,
};

export function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveNotifPrefs(prefs: NotifPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  void import("@/lib/native-storage").then(({ storageSetSync }) => {
    storageSetSync(STORAGE_KEY, JSON.stringify(prefs));
  });
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (isNative) {
    const { requestNotificationPermission, getNotificationPermissionStatus } = await import(
      "@/lib/prayer-local-notifications"
    );
    const granted = await requestNotificationPermission();
    if (granted) return "granted";
    const status = await getNotificationPermissionStatus();
    if (status === "denied") return "denied";
    if (status === "unsupported") return "denied";
    return "default";
  }
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** حالة متزامنة للويب فقط — على الأصل استخدم getNotificationPermissionStatus(). */
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (isNative) {
    // WKWebView قد يعرض Notification.permission بلا صلة بإذن Capacitor.
    return "default";
  }
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function sendLocalNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string },
): void {
  if (isNative) {
    // Web Notification API غير موثوق داخل WKWebView — جدول عبر Capacitor.
    void (async () => {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const {
          ensureNotificationChannels,
          CHANNEL_GENERAL,
          DEFAULT_ALERT_SOUND,
        } = await import("@/lib/notifications/channels");
        await ensureNotificationChannels();
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== "granted") return;
        const id = 99800 + (Math.abs(hashTag(options?.tag ?? title)) % 90);
        await LocalNotifications.cancel({ notifications: [{ id }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title: notificationTitleWithoutBrand(title),
              body: notificationBodyWithoutBrand(options?.body ?? ""),
              schedule: { at: new Date(Date.now() + 800), allowWhileIdle: true },
              sound: DEFAULT_ALERT_SOUND,
              channelId: CHANNEL_GENERAL,
              extra: { kind: "local-web-bridge", tag: options?.tag },
            },
          ],
        });
      } catch {
        /* ignore */
      }
    })();
    return;
  }
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(notificationTitleWithoutBrand(title), {
      body: notificationBodyWithoutBrand(options?.body ?? "") || undefined,
      icon: options?.icon ?? "/logo.png",
      tag: options?.tag,
      dir: "rtl",
      lang: "ar",
    });
  } catch {
    // Safari may throw if page is not focused
  }
}

function hashTag(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// ── جدولة التذكيرات عند تحميل الصفحة ──────────────────────────────────────

const SCHED_KEY = "majalis_notif_sched_v1";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function alreadySentToday(tag: string): boolean {
  try {
    const raw = localStorage.getItem(SCHED_KEY);
    const sent: Record<string, string> = raw ? JSON.parse(raw) : {};
    return sent[tag] === todayKey();
  } catch {
    return false;
  }
}

function markSentToday(tag: string): void {
  try {
    const raw = localStorage.getItem(SCHED_KEY);
    const sent: Record<string, string> = raw ? JSON.parse(raw) : {};
    sent[tag] = todayKey();
    localStorage.setItem(SCHED_KEY, JSON.stringify(sent));
  } catch { /* localStorage unavailable */ }
}

export function scheduleFlashcardsReminder(dueCount: number): void {
  if (dueCount === 0 || alreadySentToday("flashcards")) return;
  const copy = pickLocalizedNotification("flashcards", { count: dueCount });
  sendLocalNotification(copy.title, {
    body: copy.body,
    tag: "flashcards",
  });
  markSentToday("flashcards");
}

export function scheduleResumeReminder(title: string): void {
  if (!title || alreadySentToday("resume")) return;
  const copy = pickLocalizedNotification("lessonFollowup", { item: title });
  sendLocalNotification(copy.title, {
    body: copy.body,
    tag: "resume",
  });
  markSentToday("resume");
}

export function schedulePrayerReminder(prayerName: string, minutesLeft: number): void {
  if (minutesLeft > 12 || minutesLeft < 8) return;
  if (alreadySentToday(`prayer-${prayerName}`)) return;
  const copy = pickLocalizedNotification("prayerPre", {
    name: prayerName,
    mins: minutesLeft,
    minsPhrase: formatNotificationMinutesPhrase(minutesLeft),
  });
  sendLocalNotification(copy.title, {
    body: copy.body,
    tag: `prayer-${prayerName}`,
  });
  markSentToday(`prayer-${prayerName}`);
}

// ── تذكير العبادات الإسلامية حسب التقويم الهجري ────────────────────────────

type IslamicRemindersPool = { icon: string; title: string; body: string }[];

function getIslamicReminders(): IslamicRemindersPool {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "Asia/Kuwait",
      day: "numeric",
      month: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const month = parseInt(parts.find((p) => p.type === "month")?.value ?? "0", 10);
    const day = parseInt(parts.find((p) => p.type === "day")?.value ?? "0", 10);

    const map = (key: keyof typeof SEASONAL_NOTIFICATION_POOL) =>
      SEASONAL_NOTIFICATION_POOL[key].map((x) => ({ icon: "", title: x.title, body: x.body }));

    if (month === 9) return map(day >= 21 ? "ramadanLate" : "ramadan");
    if (month === 12 && day <= 9) return map("dhulHijjah");
    if (month === 1 && day <= 10) return map("ashura");
    if (month === 10 && day <= 6) return map("shawwal");

    const general = map("daily");
    return [general[new Date().getDay() % general.length]!];
  } catch {
    return [{ icon: "", title: "تذكير", body: "حافظ على صلواتك وأذكارك." }];
  }
}

export function scheduleIslamicReminder(): void {
  if (alreadySentToday("islamic-reminder")) return;
  const pool = getIslamicReminders();
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  sendLocalNotification(pick.title, {
    body: pick.body,
    tag: "islamic-reminder",
  });
  markSentToday("islamic-reminder");
}
