/**
 * جدولة التذكيرات الدينية الموحّدة.
 * iOS/Android: Capacitor LocalNotifications بأصوات قصيرة معتمدة فقط.
 * الويب: Web Notification + مؤقّتات ذكية.
 * لا أذان كامل ولا سلاسل مقاطع — أبدًا.
 */

import { isNative } from "./capacitor-utils";
import {
  calendarNoonInZone,
  epochAtZoneMinutes,
  fetchPrayerTimes,
  type PrayerTimesPayload,
} from "./prayer-times";
import { getActivePrayerLocation } from "./prayer-location-prefs";
import { PRAYER_ARABIC, type PrayerKey, PRAYER_KEYS } from "./adhan-preferences";
import { ADHAN_PREFS_CHANGED_EVENT } from "./adhan-preferences";
import { PRAYER_ALERT_PREFS_CHANGED_EVENT } from "./prayer-alert-preferences";
import {
  DEFAULT_ALERT_SOUND_ID,
  iosNotificationSoundName,
  webPreviewUrl,
  getApprovedAlertSound,
} from "./notification-alert-catalog";
import {
  CHANNEL_GENERAL,
  CHANNEL_PRAYER,
  ensureNotificationChannels,
} from "./notifications/channels";
import {
  loadNotifRemindersPrefs,
  setLastRescheduleAt,
  markRemindersPermissionAsked,
  getPermissionAskedFlag,
  NOTIF_REMINDERS_CHANGED_EVENT,
  PRAYER_ENTER_TITLES,
  REMINDER_COPY,
  type NotifRemindersPreferences,
} from "./notification-reminders-preferences";
import {
  notificationBodyWithoutBrand,
  notificationTitleWithoutBrand,
} from "./notifications/copy";

/** نطاق معرّفات مخصّص — بعيد عن hashPrayer (200000+) وسلسلة iOS (710000+) وdhikr (9401). */
export const REMINDER_NOTIF_ID_BASE = 70_000;
export const REMINDER_NOTIF_ID_END = 79_999;

const SLOT_KEY_MAP: Array<[string, PrayerKey]> = [
  ["Fajr", "fajr"],
  ["Dhuhr", "dhuhr"],
  ["Asr", "asr"],
  ["Maghrib", "maghrib"],
  ["Isha", "isha"],
];

export type ReminderScheduleResult = {
  ok: boolean;
  scheduled: number;
  reason?: "permission" | "disabled" | "no_times" | "error" | "unsupported";
};

export type ReminderKind =
  | "prayerPreAlert"
  | "prayerEnterAlert"
  | "shortAdhan"
  | "lastThirdNight"
  | "qiyam"
  | "witr"
  | "morningAdhkar"
  | "eveningAdhkar"
  | "istighfar"
  | "dua"
  | "salawat"
  | "quranWird"
  | "kahfFriday"
  | "customGeneral";

type PlannedNotif = {
  id: number;
  title: string;
  body: string;
  atMs: number;
  soundId: string;
  kind: ReminderKind | string;
  channelId: string;
  extra?: Record<string, unknown>;
};

/** حساب بداية الثلث الأخير: maghrib + (2/3)*night — أو fajrNext − (1/3)*night. */
export function computeLastThirdNightMs(maghribMs: number, fajrNextMs: number): number {
  if (!(maghribMs > 0) || !(fajrNextMs > maghribMs)) return NaN;
  const night = fajrNextMs - maghribMs;
  return maghribMs + (2 / 3) * night;
}

/** مكافئ: fajr − night/3 */
export function computeLastThirdFromFajr(maghribMs: number, fajrNextMs: number): number {
  if (!(maghribMs > 0) || !(fajrNextMs > maghribMs)) return NaN;
  const night = fajrNextMs - maghribMs;
  return fajrNextMs - night / 3;
}

function prayerMinutes(payload: PrayerTimesPayload, key: string): number | null {
  const slot = payload.prayers.find((p) => p.key === key);
  return slot?.minutes ?? null;
}

function slotEpoch(
  timeZone: string,
  minutes: number,
  noonRef: Date,
): number {
  return epochAtZoneMinutes(timeZone, minutes, noonRef);
}

function buildDayPrayerEpochs(
  payload: PrayerTimesPayload,
  timeZone: string,
  noonRef: Date,
): Record<PrayerKey, number | null> {
  const out = {} as Record<PrayerKey, number | null>;
  for (const [slotKey, pk] of SLOT_KEY_MAP) {
    const mins = prayerMinutes(payload, slotKey);
    out[pk] = mins == null ? null : slotEpoch(timeZone, mins, noonRef);
  }
  return out;
}

/** معرّف ثابت داخل النطاق 70000–79999 */
export function reminderNotificationId(
  kindCode: number,
  dayOffset: number,
  prayerIndex = 0,
): number {
  const id = REMINDER_NOTIF_ID_BASE + kindCode * 20 + dayOffset * 5 + prayerIndex;
  return Math.min(REMINDER_NOTIF_ID_END, Math.max(REMINDER_NOTIF_ID_BASE, id));
}

/** كل المعرّفات المحتملة للإلغاء الشامل قبل إعادة الجدولة */
export function allReminderNotificationIds(): Array<{ id: number }> {
  const ids: Array<{ id: number }> = [];
  for (let kind = 0; kind <= 20; kind++) {
    for (let day = 0; day < 3; day++) {
      for (let pi = 0; pi < 5; pi++) {
        ids.push({ id: reminderNotificationId(kind, day, pi) });
      }
    }
  }
  // اختبارات التشخيص
  ids.push({ id: 79_900 });
  return ids;
}

function resolveSoundName(soundId: string): string | undefined {
  return iosNotificationSoundName(soundId) ?? iosNotificationSoundName(DEFAULT_ALERT_SOUND_ID);
}

function planEnabled(
  prefs: NotifRemindersPreferences,
  payloadToday: PrayerTimesPayload,
  payloadTomorrow: PrayerTimesPayload | null,
  timeZone: string,
): PlannedNotif[] {
  const plans: PlannedNotif[] = [];
  const now = Date.now();
  const todayNoon = calendarNoonInZone(timeZone);
  const tomorrowNoon = new Date(todayNoon.getTime() + 24 * 3600_000);
  const today = buildDayPrayerEpochs(payloadToday, timeZone, todayNoon);
  const tomorrow = payloadTomorrow
    ? buildDayPrayerEpochs(payloadTomorrow, timeZone, tomorrowNoon)
    : null;

  const push = (p: PlannedNotif) => {
    if (p.atMs > now + 2_000) plans.push(p);
  };

  const days: Array<{ offset: number; epochs: Record<PrayerKey, number | null>; fajrNext: number | null }> = [
    {
      offset: 0,
      epochs: today,
      fajrNext: tomorrow?.fajr ?? (today.fajr != null ? today.fajr + 24 * 3600_000 : null),
    },
  ];
  if (tomorrow) {
    const dayAfterNoon = new Date(tomorrowNoon.getTime() + 24 * 3600_000);
    // تقدير فجر بعد الغد من فجر الغد + 24س إن لم يتوفر payload
    days.push({
      offset: 1,
      epochs: tomorrow,
      fajrNext: tomorrow.fajr != null ? tomorrow.fajr + 24 * 3600_000 : null,
    });
    void dayAfterNoon;
  }

  for (const day of days) {
    const d = day.offset;

    // ── قبل الصلاة + دخول الوقت + أذان قصير ──
    PRAYER_KEYS.forEach((pk, pi) => {
      const at = day.epochs[pk];
      if (at == null) return;
      const name = PRAYER_ARABIC[pk];

      if (prefs.prayerPreAlert.enabled && prefs.prayerPreAlert.offsetMinutes > 0) {
        push({
          id: reminderNotificationId(0, d, pi),
          title: REMINDER_COPY.prayerPre.title(name, prefs.prayerPreAlert.offsetMinutes),
          body: REMINDER_COPY.prayerPre.body,
          atMs: at - prefs.prayerPreAlert.offsetMinutes * 60_000,
          soundId: prefs.prayerPreAlert.soundId,
          kind: "prayerPreAlert",
          channelId: CHANNEL_PRAYER,
          extra: { prayerKey: pk },
        });
      }

      if (prefs.prayerEnterAlert.enabled) {
        const custom = prefs.prayerEnterAlert.messages?.[pk];
        push({
          id: reminderNotificationId(1, d, pi),
          title: custom?.trim() || PRAYER_ENTER_TITLES[pk],
          body: `حيّ على الصلاة · ${name}`,
          atMs: at,
          soundId: prefs.prayerEnterAlert.soundId,
          kind: "prayerEnterAlert",
          channelId: CHANNEL_PRAYER,
          extra: { prayerKey: pk },
        });
      }

      if (prefs.shortAdhan.enabled) {
        push({
          id: reminderNotificationId(2, d, pi),
          title: REMINDER_COPY.shortAdhan.title(name),
          body: REMINDER_COPY.shortAdhan.body,
          // ثانية بعد دخول الوقت لتجنّب التصادم المنطقي مع enter
          atMs: at + 1_000,
          soundId: prefs.shortAdhan.soundId,
          kind: "shortAdhan",
          channelId: CHANNEL_PRAYER,
          extra: { prayerKey: pk, shortOnly: true },
        });
      }
    });

    // ── الثلث الأخير ──
    if (prefs.lastThirdNight.enabled && day.epochs.maghrib != null && day.fajrNext != null) {
      const third = computeLastThirdNightMs(day.epochs.maghrib, day.fajrNext);
      if (Number.isFinite(third)) {
        push({
          id: reminderNotificationId(3, d, 0),
          title: REMINDER_COPY.lastThirdNight.title,
          body: REMINDER_COPY.lastThirdNight.body,
          atMs: third,
          soundId: prefs.lastThirdNight.soundId,
          kind: "lastThirdNight",
          channelId: CHANNEL_GENERAL,
        });
      }
    }

    // ── قيام الليل ──
    if (prefs.qiyam.enabled) {
      let qAt: number | null = null;
      if (prefs.qiyam.mode === "after_isha" && day.epochs.isha != null) {
        qAt = day.epochs.isha + prefs.qiyam.offsetMinutes * 60_000;
      } else if (prefs.qiyam.mode === "fixed") {
        const noon = d === 0 ? todayNoon : tomorrowNoon;
        qAt = slotEpoch(timeZone, prefs.qiyam.hour * 60 + prefs.qiyam.minute, noon);
      }
      if (qAt != null) {
        push({
          id: reminderNotificationId(4, d, 0),
          title: REMINDER_COPY.qiyam.title,
          body: REMINDER_COPY.qiyam.body,
          atMs: qAt,
          soundId: prefs.qiyam.soundId,
          kind: "qiyam",
          channelId: CHANNEL_GENERAL,
        });
      }
    }

    // ── الوتر ──
    if (prefs.witr.enabled) {
      let wAt: number | null = null;
      if (prefs.witr.mode === "before_fajr" && day.fajrNext != null) {
        wAt = day.fajrNext - prefs.witr.offsetMinutes * 60_000;
      } else if (prefs.witr.mode === "before_sleep") {
        const noon = d === 0 ? todayNoon : tomorrowNoon;
        wAt = slotEpoch(timeZone, prefs.witr.hour * 60 + prefs.witr.minute, noon);
      }
      if (wAt != null) {
        push({
          id: reminderNotificationId(5, d, 0),
          title: REMINDER_COPY.witr.title,
          body: REMINDER_COPY.witr.body,
          atMs: wAt,
          soundId: prefs.witr.soundId,
          kind: "witr",
          channelId: CHANNEL_GENERAL,
        });
      }
    }

    // ── أذكار الصباح بعد الفجر ──
    if (prefs.morningAdhkar.enabled && day.epochs.fajr != null) {
      push({
        id: reminderNotificationId(6, d, 0),
        title: REMINDER_COPY.morningAdhkar.title,
        body: REMINDER_COPY.morningAdhkar.body,
        atMs: day.epochs.fajr + prefs.morningAdhkar.offsetMinutes * 60_000,
        soundId: prefs.morningAdhkar.soundId,
        kind: "morningAdhkar",
        channelId: CHANNEL_GENERAL,
      });
    }

    // ── أذكار المساء ──
    if (prefs.eveningAdhkar.enabled) {
      let eAt: number | null = null;
      if (prefs.eveningAdhkar.mode === "after_asr" && day.epochs.asr != null) {
        eAt = day.epochs.asr + prefs.eveningAdhkar.offsetMinutes * 60_000;
      } else if (prefs.eveningAdhkar.mode === "before_maghrib" && day.epochs.maghrib != null) {
        eAt = day.epochs.maghrib - prefs.eveningAdhkar.offsetMinutes * 60_000;
      }
      if (eAt != null) {
        push({
          id: reminderNotificationId(7, d, 0),
          title: REMINDER_COPY.eveningAdhkar.title,
          body: REMINDER_COPY.eveningAdhkar.body,
          atMs: eAt,
          soundId: prefs.eveningAdhkar.soundId,
          kind: "eveningAdhkar",
          channelId: CHANNEL_GENERAL,
        });
      }
    }
  }

  // ── تذكيرات يومية ثابتة (اليوم + الغد) ──
  const fixedKinds: Array<{
    code: number;
    key: keyof Pick<
      NotifRemindersPreferences,
      "istighfar" | "dua" | "salawat" | "quranWird"
    >;
    copyKey: keyof typeof REMINDER_COPY;
  }> = [
    { code: 8, key: "istighfar", copyKey: "istighfar" },
    { code: 9, key: "dua", copyKey: "dua" },
    { code: 10, key: "salawat", copyKey: "salawat" },
    { code: 11, key: "quranWird", copyKey: "quranWird" },
  ];

  for (const fk of fixedKinds) {
    const pref = prefs[fk.key];
    if (!pref.enabled) continue;
    const copy = REMINDER_COPY[fk.copyKey] as { title: string; body: string };
    for (const d of [0, 1] as const) {
      const noon = d === 0 ? todayNoon : tomorrowNoon;
      const atMs = slotEpoch(timeZone, pref.hour * 60 + pref.minute, noon);
      push({
        id: reminderNotificationId(fk.code, d, 0),
        title: copy.title,
        body: copy.body,
        atMs,
        soundId: pref.soundId,
        kind: fk.key,
        channelId: CHANNEL_GENERAL,
      });
    }
  }

  // ── سورة الكهف يوم الجمعة ──
  if (prefs.kahfFriday.enabled) {
    for (const d of [0, 1, 2, 3, 4, 5, 6]) {
      const noon = new Date(todayNoon.getTime() + d * 24 * 3600_000);
      const probe = new Date(slotEpoch(timeZone, 12 * 60, noon));
      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
      }).format(probe);
      if (weekday !== "Fri") continue;
      const atMs = slotEpoch(
        timeZone,
        prefs.kahfFriday.hour * 60 + prefs.kahfFriday.minute,
        noon,
      );
      push({
        id: reminderNotificationId(12, Math.min(d, 2), 0),
        title: REMINDER_COPY.kahfFriday.title,
        body: REMINDER_COPY.kahfFriday.body,
        atMs,
        soundId: prefs.kahfFriday.soundId,
        kind: "kahfFriday",
        channelId: CHANNEL_GENERAL,
      });
      break;
    }
  }

  // ── تذكير عام اختياري ──
  if (prefs.customGeneral.enabled) {
    for (const d of [0, 1] as const) {
      const noon = d === 0 ? todayNoon : tomorrowNoon;
      push({
        id: reminderNotificationId(13, d, 0),
        title: prefs.customGeneral.title || "تذكير",
        body: "تذكير من سُنّة",
        atMs: slotEpoch(
          timeZone,
          prefs.customGeneral.hour * 60 + prefs.customGeneral.minute,
          noon,
        ),
        soundId: prefs.customGeneral.soundId,
        kind: "customGeneral",
        channelId: CHANNEL_GENERAL,
      });
    }
  }

  // إزالة التكرار بالمعرّف (آخر واحد يفوز)
  const byId = new Map<number, PlannedNotif>();
  for (const p of plans) byId.set(p.id, p);
  return [...byId.values()].sort((a, b) => a.atMs - b.atMs);
}

async function checkPermission(requestIfNeeded: boolean): Promise<"granted" | "denied" | "prompt"> {
  if (isNative) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted" && requestIfNeeded) {
        markRemindersPermissionAsked();
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display === "granted") return "granted";
      if (perm.display === "denied") return "denied";
      return "prompt";
    } catch {
      return "denied";
    }
  }
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  if (requestIfNeeded) {
    markRemindersPermissionAsked();
    const r = await Notification.requestPermission();
    return r === "granted" ? "granted" : r === "denied" ? "denied" : "prompt";
  }
  return "prompt";
}

const _webTimers: ReturnType<typeof setTimeout>[] = [];

function clearWebTimers() {
  for (const t of _webTimers) clearTimeout(t);
  _webTimers.length = 0;
}

async function cancelNativeReminders(): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: allReminderNotificationIds() });
  } catch {
    /* ignore */
  }
}

export async function cancelAllReminders(): Promise<ReminderScheduleResult> {
  clearWebTimers();
  await cancelNativeReminders();
  return { ok: true, scheduled: 0 };
}

async function scheduleNative(plans: PlannedNotif[]): Promise<number> {
  await ensureNotificationChannels();
  await cancelNativeReminders();
  if (!plans.length) return 0;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const notifications = plans.map((p) => {
    const sound = resolveSoundName(p.soundId);
    return {
      id: p.id,
      title: notificationTitleWithoutBrand(p.title),
      body: notificationBodyWithoutBrand(p.body),
      schedule: { at: new Date(p.atMs), allowWhileIdle: true },
      sound,
      channelId: p.channelId,
      extra: {
        kind: "religious-reminder",
        reminderKind: p.kind,
        soundId: p.soundId,
        ...(p.extra ?? {}),
      },
    };
  });
  // جدولة على دفعات لتجنّب حدود المنصة
  const CHUNK = 40;
  for (let i = 0; i < notifications.length; i += CHUNK) {
    await LocalNotifications.schedule({ notifications: notifications.slice(i, i + CHUNK) });
  }
  return notifications.length;
}

function scheduleWeb(plans: PlannedNotif[]): number {
  clearWebTimers();
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return 0;
  }
  let n = 0;
  for (const p of plans) {
    const delay = p.atMs - Date.now();
    if (delay < 1_000 || delay > 36 * 3600_000) continue;
    const tid = setTimeout(() => {
      try {
        new Notification(notificationTitleWithoutBrand(p.title), {
          body: notificationBodyWithoutBrand(p.body),
          tag: `majalis-reminder-${p.id}`,
          dir: "rtl",
          lang: "ar",
          icon: "/icon-192.png",
          silent: getApprovedAlertSound(p.soundId).kind === "silent",
        });
      } catch {
        /* ignore */
      }
    }, delay);
    _webTimers.push(tid);
    n += 1;
  }
  return n;
}

async function fetchTomorrowPayload(
  timeZone: string,
): Promise<PrayerTimesPayload | null> {
  try {
    const loc = getActivePrayerLocation();
    const { computePrayerTimesForDate } = await import("./prayer-times");
    const { getPrayerCalcMethod } = await import("./prayer-calc-prefs");
    const tomorrowNoon = new Date(calendarNoonInZone(timeZone).getTime() + 24 * 3600_000);
    return await computePrayerTimesForDate(
      loc.lat,
      loc.lon,
      loc.label,
      timeZone,
      tomorrowNoon,
      getPrayerCalcMethod(),
    );
  } catch {
    return null;
  }
}

/**
 * إعادة جدولة كل التذكيرات المفعّلة.
 * يلغي السابق أولًا. لا يرمي عند رفض الإذن.
 */
export async function rescheduleAllReminders(opts?: {
  requestPermission?: boolean;
}): Promise<ReminderScheduleResult> {
  try {
    const prefs = loadNotifRemindersPrefs();
    const loc = getActivePrayerLocation();
    const timeZone = loc.timeZone || "Asia/Kuwait";

    const perm = await checkPermission(Boolean(opts?.requestPermission));
    if (perm !== "granted") {
      await cancelAllReminders();
      return { ok: false, scheduled: 0, reason: "permission" };
    }

    const today = await fetchPrayerTimes();
    if (!today.ok || !today.prayers?.length) {
      return { ok: false, scheduled: 0, reason: "no_times" };
    }
    const tomorrow = await fetchTomorrowPayload(timeZone);
    const plans = planEnabled(prefs, today, tomorrow, timeZone);

    let scheduled = 0;
    if (isNative) {
      scheduled = await scheduleNative(plans);
    } else {
      scheduled = scheduleWeb(plans);
    }

    const iso = new Date().toISOString();
    setLastRescheduleAt(iso);
    return { ok: true, scheduled };
  } catch (e) {
    console.warn("[notif-reminders] reschedule failed", e);
    return { ok: false, scheduled: 0, reason: "error" };
  }
}

export function getLastRescheduleAt(): string | null {
  return loadNotifRemindersPrefs().lastRescheduleAt;
}

/** إشعار اختبار فوري لنوع تذكير */
export async function testReminderNotification(
  kind: ReminderKind,
): Promise<ReminderScheduleResult> {
  try {
    const prefs = loadNotifRemindersPrefs();
    const copyMap: Record<string, { title: string; body: string; soundId: string }> = {
      prayerPreAlert: {
        title: REMINDER_COPY.prayerPre.title("الفجر", prefs.prayerPreAlert.offsetMinutes),
        body: REMINDER_COPY.prayerPre.body,
        soundId: prefs.prayerPreAlert.soundId,
      },
      prayerEnterAlert: {
        title: PRAYER_ENTER_TITLES.fajr,
        body: "اختبار تنبيه دخول الوقت",
        soundId: prefs.prayerEnterAlert.soundId,
      },
      shortAdhan: {
        title: REMINDER_COPY.shortAdhan.title("الفجر"),
        body: REMINDER_COPY.shortAdhan.body,
        soundId: prefs.shortAdhan.soundId,
      },
      lastThirdNight: { ...REMINDER_COPY.lastThirdNight, soundId: prefs.lastThirdNight.soundId },
      qiyam: { ...REMINDER_COPY.qiyam, soundId: prefs.qiyam.soundId },
      witr: { ...REMINDER_COPY.witr, soundId: prefs.witr.soundId },
      morningAdhkar: { ...REMINDER_COPY.morningAdhkar, soundId: prefs.morningAdhkar.soundId },
      eveningAdhkar: { ...REMINDER_COPY.eveningAdhkar, soundId: prefs.eveningAdhkar.soundId },
      istighfar: { ...REMINDER_COPY.istighfar, soundId: prefs.istighfar.soundId },
      dua: { ...REMINDER_COPY.dua, soundId: prefs.dua.soundId },
      salawat: { ...REMINDER_COPY.salawat, soundId: prefs.salawat.soundId },
      quranWird: { ...REMINDER_COPY.quranWird, soundId: prefs.quranWird.soundId },
      kahfFriday: { ...REMINDER_COPY.kahfFriday, soundId: prefs.kahfFriday.soundId },
      customGeneral: {
        title: prefs.customGeneral.title || "تذكير عام",
        body: "اختبار التذكير العام",
        soundId: prefs.customGeneral.soundId,
      },
    };
    const c = copyMap[kind];
    if (!c) return { ok: false, scheduled: 0, reason: "error" };

    const perm = await checkPermission(true);
    if (perm !== "granted") return { ok: false, scheduled: 0, reason: "permission" };

    if (isNative) {
      await ensureNotificationChannels();
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const id = 79_900;
      await LocalNotifications.cancel({ notifications: [{ id }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: notificationTitleWithoutBrand(c.title),
            body: notificationBodyWithoutBrand(c.body),
            schedule: { at: new Date(Date.now() + 900), allowWhileIdle: true },
            sound: resolveSoundName(c.soundId),
            channelId: CHANNEL_GENERAL,
            extra: { kind: "religious-reminder-test", reminderKind: kind },
          },
        ],
      });
      return { ok: true, scheduled: 1 };
    }

    new Notification(notificationTitleWithoutBrand(c.title), {
      body: notificationBodyWithoutBrand(c.body),
      tag: `majalis-reminder-test-${kind}`,
      dir: "rtl",
      lang: "ar",
      icon: "/icon-192.png",
    });
    return { ok: true, scheduled: 1 };
  } catch (e) {
    console.warn("[notif-reminders] test failed", e);
    return { ok: false, scheduled: 0, reason: "error" };
  }
}

/** معاينة صوت قصير في الواجهة (ويب) — لا يشغّل أذانًا كاملًا. */
export async function previewReminderSound(soundId: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const url = webPreviewUrl(soundId) ?? webPreviewUrl(DEFAULT_ALERT_SOUND_ID);
    if (!url) return { ok: false, reason: "unsupported" };
    const audio = new Audio(url);
    audio.volume = 1;
    await audio.play();
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/**
 * يُستدعى من إعدادات الأذان/الإشعارات أو عند تغيّر المدينة/طريقة الحساب.
 */
export async function refreshReligiousRemindersSchedule(
  opts?: { requestPermission?: boolean },
): Promise<ReminderScheduleResult> {
  return rescheduleAllReminders(opts);
}

/** للاستدعاء عند تغيّر الموقع أو طريقة الحساب من واجهات المواقيت. */
export async function onPrayerLocationOrCalcChanged(): Promise<ReminderScheduleResult> {
  return rescheduleAllReminders({ requestPermission: false });
}

let _listenersInstalled = false;

/** يستمع لأحداث التفضيلات الحالية ويعيد الجدولة بلا طلب إذن جديد. */
export function installRemindersRescheduleListeners(): void {
  if (_listenersInstalled || typeof window === "undefined") return;
  _listenersInstalled = true;
  const rerun = () => {
    void rescheduleAllReminders({ requestPermission: false });
  };
  window.addEventListener(ADHAN_PREFS_CHANGED_EVENT, rerun);
  window.addEventListener(PRAYER_ALERT_PREFS_CHANGED_EVENT, rerun);
  window.addEventListener(NOTIF_REMINDERS_CHANGED_EVENT, rerun);
}

export { getPermissionAskedFlag };
