/**
 * منسّق تنبيه الصلاة القادمة: يجمع بين الإشعار المحلي الأصلي (يعمل في الخلفية)
 * وLive Activity (تعمل تفاعلياً أثناء فتح التطبيق) وحدث الشريط داخل التطبيق.
 *
 * الإشعارات المحلية تُجدوَل فوراً عبر نظام التشغيل (تنجو من إغلاق التطبيق).
 * على الأصل: تُجدوَل كل الصلوات المفروضة القادمة (اليوم + ما يلتفّ للغد) حتى
 * تصل التنبيهات بعد قتل التطبيق/إعادة التشغيل دون الاعتماد على مؤقّتات JS.
 * Live Activity وشريط التطبيق يُفعَّلان بمؤقّتات JS للصلاة التالية فقط.
 */
import {
  calendarNoonInZone,
  epochAtZoneMinutes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "./prayer-times";
import { getActivePrayerLocation } from "./prayer-location-prefs";
import { loadPrayerAlertPrefs, LIVE_ACTIVITY_LINGER_MINUTES } from "./prayer-alert-preferences";
import {
  cancelAllPrayerNativeNotifications,
  MAX_NATIVE_PRAYER_NOTIFS,
  purgePastPrayerNativeNotifications,
  schedulePrayerNativeNotifications,
  verifyPendingAgainstExpected,
} from "./prayer-local-notifications";
import { dateISOInZone } from "./prayer-notification-ids";
import { startPrayerLiveActivity, markPrayerLiveActivityEntered, endPrayerLiveActivity } from "./plugins/prayer-live-activity";
import type { PrayerSoundProfile } from "./prayer-notification-sounds";

export type PrayerAlertEvent = {
  type: "pre-alert" | "entered";
  prayerKey: string;
  prayerName: string;
  prayerTimeEpochMs: number;
  preAlertMinutes: number;
};

/** يُطلَق على window عند دخول نافذة الـ15 دقيقة، وعند دخول وقت الصلاة فعلياً. */
export const PRAYER_ALERT_EVENT_NAME = "majalis:prayer-alert";

const KEY_TO_ARABIC: Record<string, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const _timers: ReturnType<typeof setTimeout>[] = [];
/** توقيع آخر جدولة أصلية — يمنع التكرار دون حجب إعادة الجدولة عند تغيّر الوقت/التفضيلات. */
let _lastScheduleSig: string | null = null;
let _lastTimeZone: string | null = null;
let _lastDateISO: string | null = null;
let _liveActivityActiveForKey: string | null = null;

function clearAllTimers() {
  for (const t of _timers) clearTimeout(t);
  _timers.length = 0;
}

/** يُصدَّر للاختبارات والواجهات — يبني توقيع جدولة الإشعار الأصلي. */
export function buildPrayerScheduleSignature(opts: {
  prayerKey: string;
  prayerTimeEpochMs: number;
  preAlertEnabled: boolean;
  enterAlertEnabled: boolean;
  preAlertMinutes: number;
  postReminderEnabled?: boolean;
  soundProfile?: PrayerSoundProfile;
}): string {
  const minuteBucket = Math.floor(opts.prayerTimeEpochMs / 60_000);
  return [
    opts.prayerKey.toLowerCase(),
    String(minuteBucket),
    opts.preAlertEnabled ? "1" : "0",
    opts.enterAlertEnabled ? "1" : "0",
    String(opts.preAlertMinutes),
    opts.postReminderEnabled ? "1" : "0",
    opts.soundProfile ?? "auto",
  ].join("|");
}

/** امسح كاش الجدولة — يُستدعى عند تغيّر التفضيلات أو العودة للتطبيق بقوة. */
export function invalidatePrayerNativeSchedule(): void {
  _lastScheduleSig = null;
}

/**
 * لحظة مطلقة لوقت صلاة في منطقة الموقع النشط.
 * ما فات يلتفّ لليوم التالي عبر تاريخ المنطقة لا عبر Date.now()+delay الغامض.
 */
export function epochForSlot(slot: PrayerSlot, timeZone?: string): number {
  const tz = timeZone || getActivePrayerLocation().timeZone || "Asia/Kuwait";
  if (slot.minutes == null) return Date.now();
  let epoch = epochAtZoneMinutes(tz, slot.minutes);
  if (epoch <= Date.now()) {
    const tomorrowNoon = new Date(calendarNoonInZone(tz).getTime() + 24 * 3600_000);
    epoch = epochAtZoneMinutes(tz, slot.minutes, tomorrowNoon);
  }
  return epoch;
}

/**
 * كل الصلوات المفروضة مع epoch مطلق (ما فات يلتفّ لليوم التالي).
 * يُستخدم لجدولة نظام التشغيل — لا يعتمد على بقاء التطبيق مفتوحاً.
 */
export function listNativePrayerScheduleSlots(
  prayers: PrayerSlot[],
  timeZone?: string,
): Array<{ slot: PrayerSlot; epoch: number; dateISO: string }> {
  const tz = timeZone || getActivePrayerLocation().timeZone || "Asia/Kuwait";
  const obligatory = prayers.filter((p) => p.obligatory && p.minutes != null);
  return obligatory
    .map((slot) => {
      const epoch = epochForSlot(slot, tz);
      return {
        slot,
        epoch,
        dateISO: dateISOInZone(tz, new Date(epoch)),
      };
    })
    .sort((a, b) => a.epoch - b.epoch);
}

/** أقرب صلاة قادمة لم يحن وقتها بعد (تتجاهل ما فات، تلتفّ لليوم التالي إن لزم). */
export function findNextUpcomingPrayer(prayers: PrayerSlot[], timeZone?: string): PrayerSlot | null {
  const slots = listNativePrayerScheduleSlots(prayers, timeZone);
  return slots[0]?.slot ?? null;
}

function findNextUpcoming(prayers: PrayerSlot[]): PrayerSlot | null {
  return findNextUpcomingPrayer(prayers);
}

function dispatchAlert(event: PrayerAlertEvent) {
  window.dispatchEvent(new CustomEvent(PRAYER_ALERT_EVENT_NAME, { detail: event }));
}

async function fireLiveActivityStart(slot: PrayerSlot, prayerEpoch: number, locationLabel?: string) {
  const prefs = loadPrayerAlertPrefs();
  if (!prefs.liveActivitiesEnabled) return;
  if (_liveActivityActiveForKey === slot.key) return;
  const started = await startPrayerLiveActivity({
    prayerKey: slot.key.toLowerCase(),
    prayerName: KEY_TO_ARABIC[slot.key] ?? slot.name,
    prayerTimeIso: new Date(prayerEpoch).toISOString(),
    locationLabel,
  });
  if (started) _liveActivityActiveForKey = slot.key;
}

async function fireLiveActivityEnter() {
  const prefs = loadPrayerAlertPrefs();
  if (!prefs.liveActivitiesEnabled) return;
  await markPrayerLiveActivityEntered();
  const t = setTimeout(() => {
    endPrayerLiveActivity();
    _liveActivityActiveForKey = null;
  }, LIVE_ACTIVITY_LINGER_MINUTES * 60_000);
  _timers.push(t);
}

async function rescheduleAllNativePrayers(
  slots: Array<{ slot: PrayerSlot; epoch: number; dateISO: string }>,
  prefs: ReturnType<typeof loadPrayerAlertPrefs>,
): Promise<void> {
  const anyAlert =
    prefs.alertsEnabled &&
    (prefs.preAlertEnabled || prefs.enterAlertEnabled || prefs.postReminderEnabled);

  // قبل كل جدولة: إلغاء الكل ثم إعادة البناء
  await cancelAllPrayerNativeNotifications();
  await purgePastPrayerNativeNotifications();

  if (!anyAlert) return;

  const expected: Array<{ prayerKey: string; atMs: number; kind: string }> = [];
  let budget = MAX_NATIVE_PRAYER_NOTIFS;

  for (const { slot, epoch, dateISO } of slots) {
    if (budget <= 0) break;
    const scheduled = await schedulePrayerNativeNotifications({
      prayerKey: slot.key.toLowerCase(),
      prayerName: KEY_TO_ARABIC[slot.key] ?? slot.name,
      prayerTimeEpochMs: epoch,
      prayerMinutesOfDay: slot.minutes ?? undefined,
      dateISO,
      preAlertEnabled: prefs.alertsEnabled && prefs.preAlertEnabled,
      enterAlertEnabled: prefs.alertsEnabled && prefs.enterAlertEnabled,
      postReminderEnabled: prefs.alertsEnabled && prefs.postReminderEnabled,
      preAlertMinutes: prefs.preAlertMinutes,
      soundProfile: prefs.soundProfile,
    });
    budget -= scheduled.length;
    for (const s of scheduled) {
      expected.push({
        prayerKey: slot.key.toLowerCase(),
        atMs: s.atMs,
        kind: s.kind,
      });
    }
  }

  const verify = await verifyPendingAgainstExpected(expected);
  if (!verify.ok) {
    console.error("[prayer-alert] post-schedule drift", verify.diffs);
  }
}

/**
 * يُجدوِل إشعارات نظام التشغيل لكل الصلوات المفروضة القادمة، ويضبط مؤقّتات
 * الشريط/Live Activity للصلاة التالية فقط.
 */
export async function startPrayerAlertScheduler(
  payload: PrayerTimesPayload,
  opts?: { forceNativeReschedule?: boolean },
): Promise<void> {
  clearAllTimers();
  const tz = payload.timezone || getActivePrayerLocation().timeZone || "Asia/Kuwait";
  const todayISO = dateISOInZone(tz);
  if (_lastTimeZone && _lastTimeZone !== tz) {
    opts = { ...opts, forceNativeReschedule: true };
  }
  if (_lastDateISO && _lastDateISO !== todayISO) {
    opts = { ...opts, forceNativeReschedule: true };
  }
  _lastTimeZone = tz;
  _lastDateISO = todayISO;

  const slots = listNativePrayerScheduleSlots(payload.prayers, tz);
  if (!slots.length) return;

  const prefs = loadPrayerAlertPrefs();
  const preMinutes = prefs.preAlertMinutes;
  const anyAlert =
    prefs.alertsEnabled &&
    (prefs.preAlertEnabled || prefs.enterAlertEnabled || prefs.postReminderEnabled);
  const batchSig = !anyAlert
    ? "disabled"
    : [
        tz,
        todayISO,
        ...slots.map(({ slot, epoch }) =>
          buildPrayerScheduleSignature({
            prayerKey: slot.key,
            prayerTimeEpochMs: epoch,
            preAlertEnabled: prefs.alertsEnabled && prefs.preAlertEnabled,
            enterAlertEnabled: prefs.alertsEnabled && prefs.enterAlertEnabled,
            preAlertMinutes: preMinutes,
            postReminderEnabled: prefs.alertsEnabled && prefs.postReminderEnabled,
            soundProfile: prefs.soundProfile,
          }),
        ),
      ].join(";");

  if (opts?.forceNativeReschedule || batchSig !== _lastScheduleSig) {
    _lastScheduleSig = batchSig;
    try {
      await rescheduleAllNativePrayers(slots, prefs);
      const { savePrayerScheduleStatus } = await import("./prayer-schedule-status");
      savePrayerScheduleStatus({
        ok: true,
        atIso: new Date().toISOString(),
        prayerCount: slots.length,
        soundProfile: prefs.soundProfile,
        note: `${tz}|${todayISO}|${payload.method}`,
      });
    } catch (e) {
      const { savePrayerScheduleStatus } = await import("./prayer-schedule-status");
      savePrayerScheduleStatus({
        ok: false,
        atIso: new Date().toISOString(),
        prayerCount: slots.length,
        soundProfile: prefs.soundProfile,
        note: e instanceof Error ? e.message : "schedule_failed",
      });
      throw e;
    }
  }

  const next = findNextUpcoming(payload.prayers);
  if (!next) return;

  const prayerEpoch = epochForSlot(next, tz);
  const prayerName = KEY_TO_ARABIC[next.key] ?? next.name;
  const prayerKey = next.key.toLowerCase();

  const preAlertDelay = prayerEpoch - Date.now() - preMinutes * 60_000;
  const enterDelay = prayerEpoch - Date.now();

  const fireEvent: PrayerAlertEvent = {
    type: "pre-alert",
    prayerKey,
    prayerName,
    prayerTimeEpochMs: prayerEpoch,
    preAlertMinutes: preMinutes,
  };

  const preOn = prefs.alertsEnabled && prefs.preAlertEnabled;
  if (preAlertDelay <= 0 && enterDelay > 0) {
    if (preOn) dispatchAlert(fireEvent);
    void fireLiveActivityStart(next, prayerEpoch, payload.city);
  } else if (preAlertDelay > 0) {
    const t = setTimeout(() => {
      if (Date.now() >= prayerEpoch) return; // حارس: لا pre بعد دخول الوقت
      if (preOn) dispatchAlert(fireEvent);
      void fireLiveActivityStart(next, prayerEpoch, payload.city);
    }, preAlertDelay);
    _timers.push(t);
  }

  if (enterDelay > 0) {
    const t = setTimeout(() => {
      if (Date.now() - prayerEpoch > 5 * 60_000) return; // حارس: لا enter متأخر >5د
      dispatchAlert({ ...fireEvent, type: "entered" });
      void fireLiveActivityEnter();
      _lastScheduleSig = null;
      import("./prayer-times").then(({ fetchPrayerTimes }) => {
        fetchPrayerTimes().then((p) => startPrayerAlertScheduler(p));
      });
    }, enterDelay);
    _timers.push(t);
  }
}

export function stopPrayerAlertScheduler() {
  clearAllTimers();
}

/** يُستدعى عند عودة التطبيق للواجهة (resume) — يُعيد فحص النافذة الحالية فوراً. */
export async function recheckPrayerAlertWindow(
  payload: PrayerTimesPayload | null,
  opts?: { force?: boolean },
) {
  if (!payload) return;
  if (opts?.force) invalidatePrayerNativeSchedule();
  await startPrayerAlertScheduler(payload, { forceNativeReschedule: opts?.force });
}
