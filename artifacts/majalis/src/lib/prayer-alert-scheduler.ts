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
  type PrayerSlot,
  type PrayerTimesPayload,
} from "./prayer-times";
import { loadPrayerAlertPrefs, LIVE_ACTIVITY_LINGER_MINUTES } from "./prayer-alert-preferences";
import {
  cancelAllPrayerNativeNotifications,
  schedulePrayerNativeNotifications,
} from "./prayer-local-notifications";
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

function kuwaitNowMs(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const s = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  return (h * 3600 + m * 60 + s) * 1000;
}

/**
 * كل الصلوات المفروضة مع epoch مطلق (ما فات يلتفّ لليوم التالي).
 * يُستخدم لجدولة نظام التشغيل — لا يعتمد على بقاء التطبيق مفتوحاً.
 */
export function listNativePrayerScheduleSlots(
  prayers: PrayerSlot[],
): Array<{ slot: PrayerSlot; epoch: number }> {
  const obligatory = prayers.filter((p) => p.obligatory && p.minutes != null);
  return obligatory
    .map((slot) => ({ slot, epoch: epochForSlot(slot) }))
    .sort((a, b) => a.epoch - b.epoch);
}

/** أقرب صلاة قادمة لم يحن وقتها بعد (تتجاهل ما فات، تلتفّ لليوم التالي إن لزم). */
function findNextUpcoming(prayers: PrayerSlot[]): PrayerSlot | null {
  const slots = listNativePrayerScheduleSlots(prayers);
  return slots[0]?.slot ?? null;
}

function epochForSlot(slot: PrayerSlot): number {
  const nowMs = kuwaitNowMs();
  const slotMs = (slot.minutes as number) * 60_000;
  let delay = slotMs - nowMs;
  if (delay < 0) delay += 24 * 3600_000;
  return Date.now() + delay;
}

function dispatchAlert(event: PrayerAlertEvent) {
  window.dispatchEvent(new CustomEvent(PRAYER_ALERT_EVENT_NAME, { detail: event }));
}

async function fireLiveActivityStart(slot: PrayerSlot, prayerEpoch: number, locationLabel?: string) {
  const prefs = loadPrayerAlertPrefs();
  if (!prefs.liveActivitiesEnabled) return;
  if (_liveActivityActiveForKey === slot.key) return; // نشاط واحد كحد أقصى، لا تكرار لنفس الصلاة
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
  // أنهِ النشاط تلقائياً بعد مهلة قصيرة من دخول الوقت.
  const t = setTimeout(() => {
    endPrayerLiveActivity();
    _liveActivityActiveForKey = null;
  }, LIVE_ACTIVITY_LINGER_MINUTES * 60_000);
  _timers.push(t);
}

async function rescheduleAllNativePrayers(
  slots: Array<{ slot: PrayerSlot; epoch: number }>,
  prefs: ReturnType<typeof loadPrayerAlertPrefs>,
): Promise<void> {
  const anyAlert =
    prefs.alertsEnabled &&
    (prefs.preAlertEnabled || prefs.enterAlertEnabled || prefs.postReminderEnabled);
  if (!anyAlert) {
    await cancelAllPrayerNativeNotifications();
    return;
  }
  for (const { slot, epoch } of slots) {
    await schedulePrayerNativeNotifications({
      prayerKey: slot.key.toLowerCase(),
      prayerName: KEY_TO_ARABIC[slot.key] ?? slot.name,
      prayerTimeEpochMs: epoch,
      preAlertEnabled: prefs.alertsEnabled && prefs.preAlertEnabled,
      enterAlertEnabled: prefs.alertsEnabled && prefs.enterAlertEnabled,
      postReminderEnabled: prefs.alertsEnabled && prefs.postReminderEnabled,
      preAlertMinutes: prefs.preAlertMinutes,
      soundProfile: prefs.soundProfile,
    });
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
  const slots = listNativePrayerScheduleSlots(payload.prayers);
  if (!slots.length) return;

  const prefs = loadPrayerAlertPrefs();
  const preMinutes = prefs.preAlertMinutes;
  const anyAlert =
    prefs.alertsEnabled &&
    (prefs.preAlertEnabled || prefs.enterAlertEnabled || prefs.postReminderEnabled);
  const batchSig = !anyAlert
    ? "disabled"
    : slots
        .map(({ slot, epoch }) =>
          buildPrayerScheduleSignature({
            prayerKey: slot.key,
            prayerTimeEpochMs: epoch,
            preAlertEnabled: prefs.alertsEnabled && prefs.preAlertEnabled,
            enterAlertEnabled: prefs.alertsEnabled && prefs.enterAlertEnabled,
            preAlertMinutes: preMinutes,
            postReminderEnabled: prefs.alertsEnabled && prefs.postReminderEnabled,
            soundProfile: prefs.soundProfile,
          }),
        )
        .join(";");

  if (opts?.forceNativeReschedule || batchSig !== _lastScheduleSig) {
    _lastScheduleSig = batchSig;
    await rescheduleAllNativePrayers(slots, prefs);
  }

  const next = findNextUpcoming(payload.prayers);
  if (!next) return;

  const prayerEpoch = epochForSlot(next);
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
    // التطبيق فُتح بالفعل داخل نافذة التنبيه المسبق — فعّل فوراً بدل انتظار مؤقّت سالب.
    if (preOn) dispatchAlert(fireEvent);
    void fireLiveActivityStart(next, prayerEpoch, payload.city);
  } else if (preAlertDelay > 0) {
    const t = setTimeout(() => {
      if (preOn) dispatchAlert(fireEvent);
      void fireLiveActivityStart(next, prayerEpoch, payload.city);
    }, preAlertDelay);
    _timers.push(t);
  }

  if (enterDelay > 0) {
    const t = setTimeout(() => {
      dispatchAlert({ ...fireEvent, type: "entered" });
      void fireLiveActivityEnter();
      _lastScheduleSig = null; // اسمح بجدولة الصلاة التالية عند إعادة التشغيل
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
