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
import {
  defaultSectionsPrefs,
  type NotifSectionId,
  type NotifSectionPrefs,
} from "@/lib/notifications/sections-config";

const STORAGE_KEY = "majalis_notif_prefs_v1";

export type PrayerNotifModes = {
  /** تنبيه قبل الأذان */
  preEnabled: boolean;
  /** إشعار الأذان */
  adhanEnabled: boolean;
  /** تنبيه بعد الأذان */
  postEnabled: boolean;
};

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
  /** أقسام الإشعارات الموحّدة (الصلاة، القرآن، …) */
  sections: Record<NotifSectionId, NotifSectionPrefs>;
  /** أنماط تنبيه الصلاة داخل قسم الصلاة */
  prayerModes: PrayerNotifModes;
};

const DEFAULT_PRAYER_MODES: PrayerNotifModes = {
  preEnabled: true,
  adhanEnabled: true,
  postEnabled: true,
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
  sections: defaultSectionsPrefs(),
  prayerModes: { ...DEFAULT_PRAYER_MODES },
};

function mergeSectionPrefs(
  incoming: Partial<Record<NotifSectionId, Partial<NotifSectionPrefs>>> | undefined,
  legacy: Pick<
    NotifPrefs,
    | "prayerReminder"
    | "quranDailyReminder"
    | "adhkarReminder"
    | "flashcardsReminder"
    | "resumeReminder"
  >,
): Record<NotifSectionId, NotifSectionPrefs> {
  const base = defaultSectionsPrefs();
  if (incoming) {
    for (const id of Object.keys(base) as NotifSectionId[]) {
      const patch = incoming[id];
      if (!patch) continue;
      base[id] = {
        ...base[id],
        ...patch,
        weekdays: Array.isArray(patch.weekdays) ? [...patch.weekdays] : [...base[id].weekdays],
      };
    }
    return base;
  }
  // ترحيل من الأعلام القديمة عند غياب sections
  base.prayer.enabled = legacy.prayerReminder;
  base.quran.enabled = legacy.quranDailyReminder;
  base.adhkar.enabled = legacy.adhkarReminder;
  base.seekingKnowledge.enabled = legacy.flashcardsReminder;
  base.lessons.enabled = legacy.resumeReminder;
  return base;
}

/** مزامنة الأعلام القديمة مع أقسام الواجهة الجديدة (للتوافق مع الجدولة الحالية). */
export function syncLegacyFlagsFromSections(prefs: NotifPrefs): NotifPrefs {
  const s = prefs.sections;
  return {
    ...prefs,
    prayerReminder: s.prayer?.enabled ?? prefs.prayerReminder,
    quranDailyReminder: s.quran?.enabled ?? prefs.quranDailyReminder,
    adhkarReminder: s.adhkar?.enabled ?? prefs.adhkarReminder,
    flashcardsReminder: s.seekingKnowledge?.enabled ?? prefs.flashcardsReminder,
    resumeReminder: s.lessons?.enabled ?? prefs.resumeReminder,
  };
}

export function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, sections: defaultSectionsPrefs(), prayerModes: { ...DEFAULT_PRAYER_MODES } };
    const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
    const merged: NotifPrefs = {
      ...DEFAULTS,
      ...parsed,
      sections: mergeSectionPrefs(parsed.sections, {
        prayerReminder: parsed.prayerReminder ?? DEFAULTS.prayerReminder,
        quranDailyReminder: parsed.quranDailyReminder ?? DEFAULTS.quranDailyReminder,
        adhkarReminder: parsed.adhkarReminder ?? DEFAULTS.adhkarReminder,
        flashcardsReminder: parsed.flashcardsReminder ?? DEFAULTS.flashcardsReminder,
        resumeReminder: parsed.resumeReminder ?? DEFAULTS.resumeReminder,
      }),
      prayerModes: { ...DEFAULT_PRAYER_MODES, ...(parsed.prayerModes ?? {}) },
    };
    return syncLegacyFlagsFromSections(merged);
  } catch {
    return { ...DEFAULTS, sections: defaultSectionsPrefs(), prayerModes: { ...DEFAULT_PRAYER_MODES } };
  }
}

export function saveNotifPrefs(prefs: NotifPrefs): void {
  // ادفع الأعلام القديمة → الأقسام (مسارات Adhan/Quran التي تعدّل العلم فقط)
  // ثم أعد مزامنة الأعلام من الأقسام لضمان اتساق واحد عند القراءة.
  const baseSections = prefs.sections ?? defaultSectionsPrefs();
  const sections: Record<NotifSectionId, NotifSectionPrefs> = {
    ...baseSections,
    prayer: { ...baseSections.prayer, enabled: prefs.prayerReminder },
    quran: { ...baseSections.quran, enabled: prefs.quranDailyReminder },
    adhkar: { ...baseSections.adhkar, enabled: prefs.adhkarReminder },
    seekingKnowledge: {
      ...baseSections.seekingKnowledge,
      enabled: prefs.flashcardsReminder,
    },
    lessons: { ...baseSections.lessons, enabled: prefs.resumeReminder },
  };
  const next = syncLegacyFlagsFromSections({
    ...prefs,
    sections,
    prayerModes: prefs.prayerModes ?? { ...DEFAULT_PRAYER_MODES },
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  void import("@/lib/native-storage").then(({ storageSetSync }) => {
    storageSetSync(STORAGE_KEY, JSON.stringify(next));
  });
}

export function updateNotifSection(
  sectionId: NotifSectionId,
  patch: Partial<NotifSectionPrefs>,
): NotifPrefs {
  const current = loadNotifPrefs();
  const prev = current.sections[sectionId] ?? defaultSectionsPrefs()[sectionId];
  const section: NotifSectionPrefs = {
    ...prev,
    ...patch,
    weekdays: patch.weekdays ? [...patch.weekdays] : [...prev.weekdays],
  };
  const next: NotifPrefs = {
    ...current,
    sections: {
      ...current.sections,
      [sectionId]: section,
    },
  };
  // احفظ التفعيل في الأعلام القديمة قبل save (وإلا سيُعاد من العلم القديم)
  if (patch.enabled !== undefined) {
    if (sectionId === "prayer") next.prayerReminder = section.enabled;
    if (sectionId === "quran") next.quranDailyReminder = section.enabled;
    if (sectionId === "adhkar") next.adhkarReminder = section.enabled;
    if (sectionId === "seekingKnowledge") next.flashcardsReminder = section.enabled;
    if (sectionId === "lessons") next.resumeReminder = section.enabled;
  }
  saveNotifPrefs(next);
  return loadNotifPrefs();
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
