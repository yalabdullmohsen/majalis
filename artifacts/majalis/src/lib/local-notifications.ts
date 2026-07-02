// Web Notifications API wrapper — إشعارات محلية في المتصفح

const STORAGE_KEY = "majalis_notif_prefs_v1";

export type NotifPrefs = {
  enabled: boolean;
  flashcardsReminder: boolean;   // مراجعة البطاقات المستحقة
  resumeReminder: boolean;       // الدرس الذي لم يُكتمل
  prayerReminder: boolean;       // قبل الصلاة بـ 10 دقائق
  reminderHour: number;          // الساعة المفضلة للتذكير (0-23)
  reminderMinute: number;
};

const DEFAULTS: NotifPrefs = {
  enabled: false,
  flashcardsReminder: true,
  resumeReminder: true,
  prayerReminder: false,
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
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function sendLocalNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string },
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body: options?.body,
      icon: options?.icon ?? "/logo.png",
      tag: options?.tag,
      dir: "rtl",
      lang: "ar",
    });
  } catch {
    // Safari may throw if page is not focused
  }
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
  sendLocalNotification("📇 لديك بطاقات مستحقة", {
    body: `${dueCount} بطاقة تنتظر مراجعتك اليوم في منصة المجالس.`,
    tag: "flashcards",
  });
  markSentToday("flashcards");
}

export function scheduleResumeReminder(title: string): void {
  if (!title || alreadySentToday("resume")) return;
  sendLocalNotification("📍 تابع من حيث توقفت", {
    body: `لم تُكمل: "${title}" — استمر الآن.`,
    tag: "resume",
  });
  markSentToday("resume");
}

export function schedulePrayerReminder(prayerName: string, minutesLeft: number): void {
  if (minutesLeft > 12 || minutesLeft < 8) return;
  if (alreadySentToday(`prayer-${prayerName}`)) return;
  sendLocalNotification(`🕌 ${prayerName} بعد ${minutesLeft} دقائق`, {
    body: "استعدّ لصلاتك.",
    tag: `prayer-${prayerName}`,
  });
  markSentToday(`prayer-${prayerName}`);
}
