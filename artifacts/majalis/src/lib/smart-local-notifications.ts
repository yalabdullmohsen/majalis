/**
 * محرك إشعارات محلية ذكية — أذكار، صلاة، خطر فقدان السلسلة، تأخّر الختمة.
 * يعتمد على Web Notifications API وجدولة داخل Service Worker عند التوفر،
 * مع fallback لمؤقّتات داخل الصفحة. لا يغيّر واجهة الإعدادات.
 */

import {
  loadNotifPrefs,
  saveNotifPrefs,
  sendLocalNotification,
  type NotifPrefs,
} from "./local-notifications";
import { isNative } from "./capacitor-utils";
import { getUserStreak } from "./user-streak";
import {
  QURAN_DAILY_REMINDER_BODY,
  QURAN_DAILY_REMINDER_HOUR,
  QURAN_DAILY_REMINDER_MINUTE,
  QURAN_DAILY_REMINDER_TAG,
  QURAN_DAILY_REMINDER_TITLE,
  QURAN_DAILY_REMINDER_URL,
} from "./quran-daily-reminder";
import {
  DHIKR_PHRASE_REMINDER_BODY,
  DHIKR_PHRASE_REMINDER_URL,
  DHIKR_PHRASE_SLOTS,
  dhikrPhraseTag,
} from "./dhikr-phrase-reminders";
import {
  notificationBodyWithoutBrand,
  notificationTitleWithoutBrand,
} from "./notifications/copy";

export interface SmartNotifScheduleItem {
  id: string;
  kind: "adhkar" | "dhikr" | "prayer" | "streak" | "khatmah" | "flashcards" | "quran";
  title: string;
  body: string;
  /** دقائق من منتصف الليل المحلي */
  minuteOfDay: number;
  tag: string;
  url?: string;
}

export const SW_SCHEDULE_LOCAL_MSG = "MAJALIS_SCHEDULE_LOCAL_NOTIFS";
const LAST_STREAK_WARN_KEY = "majalis_last_streak_warn_day";
const PAGE_TIMERS_KEY = "__majalis_smart_notif_timers__";

function todayKey(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function minuteOfDayToDate(minuteOfDay: number): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minuteOfDay);
  if (d.getTime() <= Date.now() + 5_000) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** بناء جدول اليوم من تفضيلات المستخدم + سياق السلسلة/الختمة */
export function buildDailySmartSchedule(opts?: {
  prefs?: NotifPrefs;
  includeStreakWarn?: boolean;
  streakWarnMinute?: number;
  khatmahBehind?: boolean;
}): SmartNotifScheduleItem[] {
  const prefs = opts?.prefs ?? loadNotifPrefs();
  if (!prefs.enabled) return [];

  const items: SmartNotifScheduleItem[] = [];
  const reminderMinute = prefs.reminderHour * 60 + prefs.reminderMinute;

  // أذكار الصباح/المساء — تُفعَّل صراحة عبر adhkarReminder (لا طلب إذن تلقائي)
  if (prefs.adhkarReminder) {
    items.push({
      id: "adhkar-morning",
      kind: "adhkar",
      title: "أذكار الصباح",
      body: "حان وقت أذكار الصباح — لا تفوّت وردك.",
      minuteOfDay: 6 * 60 + 30,
      tag: "majalis-adhkar-morning",
      url: "/adhkar",
    });
    items.push({
      id: "adhkar-evening",
      kind: "adhkar",
      title: "أذكار المساء",
      body: "حان وقت أذكار المساء — اختم يومك بذكر الله.",
      minuteOfDay: 17 * 60 + 30,
      tag: "majalis-adhkar-evening",
      url: "/adhkar",
    });
  }

  if (prefs.dhikrPhraseReminder) {
    for (const slot of DHIKR_PHRASE_SLOTS) {
      items.push({
        id: `dhikr-${slot.id}`,
        kind: "dhikr",
        title: slot.phrase,
        body: DHIKR_PHRASE_REMINDER_BODY,
        minuteOfDay: slot.hour * 60,
        tag: dhikrPhraseTag(slot.id),
        url: DHIKR_PHRASE_REMINDER_URL,
      });
    }
  }

  if (prefs.prayerReminder) {
    const prayerSlots: Array<{ id: string; title: string; minute: number }> = [
      { id: "fajr", title: "صلاة الفجر", minute: 5 * 60 },
      { id: "dhuhr", title: "صلاة الظهر", minute: 12 * 60 + 15 },
      { id: "asr", title: "صلاة العصر", minute: 15 * 60 + 30 },
      { id: "maghrib", title: "صلاة المغرب", minute: 18 * 60 + 15 },
      { id: "isha", title: "صلاة العشاء", minute: 19 * 60 + 45 },
    ];
    for (const p of prayerSlots) {
      items.push({
        id: `prayer-${p.id}`,
        kind: "prayer",
        title: p.title,
        body: `تذكير: ${p.title} — حيّ على الصلاة.`,
        minuteOfDay: p.minute,
        tag: `majalis-prayer-${p.id}`,
        url: "/prayer-times",
      });
    }
  }

  if (prefs.flashcardsReminder) {
    items.push({
      id: "flashcards-daily",
      kind: "flashcards",
      title: "مراجعة البطاقات",
      body: "حان وقت مراجعة بطاقاتك المستحقة.",
      minuteOfDay: reminderMinute,
      tag: "majalis-flashcards-daily",
      url: "/flashcards",
    });
  }

  if (prefs.quranDailyReminder) {
    items.push({
      id: "quran-daily-wird",
      kind: "quran",
      title: QURAN_DAILY_REMINDER_TITLE,
      body: QURAN_DAILY_REMINDER_BODY,
      minuteOfDay: QURAN_DAILY_REMINDER_HOUR * 60 + QURAN_DAILY_REMINDER_MINUTE,
      tag: QURAN_DAILY_REMINDER_TAG,
      url: QURAN_DAILY_REMINDER_URL,
    });
  }

  if (opts?.includeStreakWarn !== false) {
    const warnMin = opts?.streakWarnMinute ?? 21 * 60;
    items.push({
      id: "streak-risk",
      kind: "streak",
      title: "سلسلتك في خطر",
      body: "لم تُسجّل نشاطًا اليوم بعد — أكمل وردًا صغيرًا للحفاظ على سلسلتك.",
      minuteOfDay: warnMin,
      tag: "majalis-streak-risk",
      url: "/quran-hub",
    });
  }

  if (opts?.khatmahBehind) {
    items.push({
      id: "khatmah-behind",
      kind: "khatmah",
      title: "ورد الختمة متأخر",
      body: "تقدمك أقل من الهدف اليومي — خصّص دقائق الآن لتعويض الصفحات.",
      minuteOfDay: 20 * 60,
      tag: "majalis-khatmah-behind",
      url: "/daily-wird",
    });
  }

  return items.sort((a, b) => a.minuteOfDay - b.minuteOfDay);
}

/** إرسال الجدول إلى Service Worker إن وُجد */
export async function pushScheduleToServiceWorker(
  items: SmartNotifScheduleItem[],
): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    const payload = items.map((it) => {
      const fireAt = minuteOfDayToDate(it.minuteOfDay).getTime();
      return {
        id: it.id,
        title: notificationTitleWithoutBrand(it.title),
        body: notificationBodyWithoutBrand(it.body),
        tag: it.tag,
        url: it.url || "/",
        fireAt,
        delayMs: Math.max(0, fireAt - Date.now()),
      };
    });
    reg.active?.postMessage({ type: SW_SCHEDULE_LOCAL_MSG, items: payload });
    return Boolean(reg.active);
  } catch {
    return false;
  }
}

/** جدولة داخل الصفحة كاحتياطي إن تعذّر الـ SW */
export function scheduleInPageFallbacks(items: SmartNotifScheduleItem[]): number {
  try {
    if (typeof window === "undefined") return 0;
    const w = window as unknown as Record<string, unknown>;
    const prev = (w[PAGE_TIMERS_KEY] as number[] | undefined) || [];
    for (const t of prev) window.clearTimeout(t);
    const next: number[] = [];
    for (const it of items) {
      const fireAt = minuteOfDayToDate(it.minuteOfDay).getTime();
      const delay = fireAt - Date.now();
      if (delay < 0 || delay > 86_400_000) continue;
      const tid = window.setTimeout(() => {
        sendLocalNotification(it.title, { body: it.body, tag: it.tag });
      }, delay);
      next.push(tid);
    }
    w[PAGE_TIMERS_KEY] = next;
    return next.length;
  } catch {
    return 0;
  }
}

/** فحص فوري: هل المستخدم على وشك فقدان السلسلة؟ */
export function isStreakAtRisk(now = new Date()): boolean {
  try {
    const streak = getUserStreak();
    if (streak.currentStreak <= 0) return false;
    const today = todayKey();
    if (streak.lastActiveDate === today) return false;
    return now.getHours() >= 18;
  } catch {
    return false;
  }
}

/** إطلاق تحذير سلسلة مرة واحدة يوميًا عند الحاجة */
export function maybeWarnStreakLoss(): boolean {
  try {
    const prefs = loadNotifPrefs();
    if (!prefs.enabled) return false;
    if (!isStreakAtRisk()) return false;
    const day = todayKey();
    if (localStorage.getItem(LAST_STREAK_WARN_KEY) === day) return false;
    sendLocalNotification("سلسلتك في خطر", {
      body: "أكمل أي نشاط سريع اليوم للحفاظ على سلسلتك.",
      tag: "majalis-streak-risk",
    });
    localStorage.setItem(LAST_STREAK_WARN_KEY, day);
    return true;
  } catch {
    return false;
  }
}

/** مزامنة الجدول اليومي مع SW + fallback الصفحة (الويب) أو Capacitor (الأصل). */
export async function syncSmartLocalNotifications(opts?: {
  khatmahBehind?: boolean;
}): Promise<{ scheduled: number; viaSw: boolean }> {
  try {
    const prefs = loadNotifPrefs();
    if (!prefs.enabled) {
      // تعطيل تفضيلات التذكيرات العامة يُلغي ورد القرآن فقط —
      // تنبيهات الصلاة لها مخزن تفضيلات منفصل (prayer-alert-preferences).
      if (isNative) {
        const { cancelNativeQuranReminder } = await import("./quran-daily-reminder");
        await cancelNativeQuranReminder();
        const { cancelNativeDhikrPhraseReminders } = await import("./dhikr-phrase-reminders");
        await cancelNativeDhikrPhraseReminders();
      }
      return { scheduled: 0, viaSw: false };
    }

    // على الأصل: لا SW — ورد القرآن والذكر عبر Capacitor؛ باقي التذكيرات وهي الصفحة مفتوحة فقط.
    if (isNative) {
      const { ensureQuranDailyReminderScheduled } = await import("./quran-daily-reminder");
      await ensureQuranDailyReminderScheduled();
      const { ensureDhikrPhraseRemindersScheduled } = await import("./dhikr-phrase-reminders");
      const dhikr = await ensureDhikrPhraseRemindersScheduled();
      maybeWarnStreakLoss();
      return {
        scheduled: (prefs.quranDailyReminder ? 1 : 0) + (dhikr.ok ? dhikr.scheduled : 0),
        viaSw: false,
      };
    }

    const items = buildDailySmartSchedule({
      prefs,
      khatmahBehind: opts?.khatmahBehind,
    });
    const viaSw = await pushScheduleToServiceWorker(items);
    if (!viaSw) scheduleInPageFallbacks(items);
    maybeWarnStreakLoss();
    return { scheduled: items.length, viaSw };
  } catch {
    return { scheduled: 0, viaSw: false };
  }
}

/** تمكين سريع للإشعارات المحلية دون تغيير شكل الواجهة */
export function enableSmartNotifDefaults(): NotifPrefs {
  const current = loadNotifPrefs();
  const next: NotifPrefs = {
    ...current,
    enabled: true,
    flashcardsReminder: true,
    resumeReminder: true,
    prayerReminder: true,
    quranDailyReminder: true,
    dhikrPhraseReminder: true,
  };
  saveNotifPrefs(next);
  void syncSmartLocalNotifications();
  return next;
}
