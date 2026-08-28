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
  getEffectiveMuezzinId,
  getEffectivePlaybackMode,
  loadAdhanPrefs,
  PRAYER_KEYS,
  type PrayerKey,
} from "./adhan-preferences";
import {
  cancelAllPrayerNativeNotifications,
  listPendingPrayerNotifications,
  MAX_NATIVE_PRAYER_NOTIFS,
  purgePastPrayerNativeNotifications,
  schedulePrayerNativeNotifications,
  verifyPendingAgainstExpected,
} from "./prayer-local-notifications";
import { dateISOInZone } from "./prayer-notification-ids";
import { startPrayerLiveActivity, markPrayerLiveActivityEntered, endPrayerLiveActivity } from "./plugins/prayer-live-activity";
import type { PrayerSoundProfile } from "./prayer-notification-sounds";
import { PRAYER_ALERT_EVENT_NAME, type PrayerAlertEvent } from "./prayer-alert-events";
import { isIOS, isNative } from "./capacitor-utils";

export { PRAYER_ALERT_EVENT_NAME, type PrayerAlertEvent } from "./prayer-alert-events";

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
  muezzinId?: string;
  prayerEnabled?: boolean;
  iosFullHandlesEnter?: boolean;
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
    opts.muezzinId ?? "",
    opts.prayerEnabled === false ? "off" : "on",
    opts.iosFullHandlesEnter ? "ios-full" : "enter-native",
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

function asPrayerKey(slotKey: string): PrayerKey | null {
  const k = slotKey.toLowerCase();
  return (PRAYER_KEYS as readonly string[]).includes(k) ? (k as PrayerKey) : null;
}

function resolveSlotAlertOpts(
  slotKey: string,
  prefs: ReturnType<typeof loadPrayerAlertPrefs>,
) {
  const adhanPrefs = loadAdhanPrefs();
  const pk = asPrayerKey(slotKey);
  const prayerOn = pk ? adhanPrefs.prayers[pk].enabled : true;
  const preMinutes = pk ? adhanPrefs.prayers[pk].advanceMinutes : prefs.preAlertMinutes;
  const fullMode = pk ? getEffectivePlaybackMode(adhanPrefs, pk) === "full" : false;
  /**
   * على iOS الوضع الكامل: مقاطع الأذان (`scheduleIosFullAdhan`) هي إشعار الدخول.
   * لا نُجدول enter منفصلًا هنا وإلا يتكرر الإشعار.
   */
  const iosFullHandlesEnter = isNative && isIOS && fullMode;
  return {
    prayerEnabled: prayerOn,
    preAlertMinutes: preMinutes,
    preAlertEnabled: prefs.alertsEnabled && prefs.preAlertEnabled && prayerOn,
    enterAlertEnabled:
      prefs.alertsEnabled && prefs.enterAlertEnabled && prayerOn && !iosFullHandlesEnter,
    postReminderEnabled: prefs.alertsEnabled && prefs.postReminderEnabled && prayerOn,
    muezzinId: pk ? getEffectiveMuezzinId(adhanPrefs, pk) : "",
    iosFullHandlesEnter,
  };
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
    const slotOpts = resolveSlotAlertOpts(slot.key, prefs);
    if (!slotOpts.prayerEnabled) continue;
    const scheduled = await schedulePrayerNativeNotifications({
      prayerKey: slot.key.toLowerCase(),
      prayerName: KEY_TO_ARABIC[slot.key] ?? slot.name,
      prayerTimeEpochMs: epoch,
      prayerMinutesOfDay: slot.minutes ?? undefined,
      dateISO,
      preAlertEnabled: slotOpts.preAlertEnabled,
      enterAlertEnabled: slotOpts.enterAlertEnabled,
      postReminderEnabled: slotOpts.postReminderEnabled,
      preAlertMinutes: slotOpts.preAlertMinutes,
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

  const pending = await listPendingPrayerNotifications();
  console.info("[adhan/debug] pending after reschedule", {
    count: pending.count,
    items: pending.items.map((i) => ({
      id: i.id,
      kind: i.kind,
      friendlyKey: i.friendlyKey,
      at: i.at,
      sound: i.sound,
    })),
  });
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
  const anyAlert =
    prefs.alertsEnabled &&
    (prefs.preAlertEnabled || prefs.enterAlertEnabled || prefs.postReminderEnabled);
  const batchSig = !anyAlert
    ? "disabled"
    : [
        tz,
        todayISO,
        ...slots.map(({ slot, epoch }) => {
          const slotOpts = resolveSlotAlertOpts(slot.key, prefs);
          return buildPrayerScheduleSignature({
            prayerKey: slot.key,
            prayerTimeEpochMs: epoch,
            preAlertEnabled: slotOpts.preAlertEnabled,
            enterAlertEnabled: slotOpts.enterAlertEnabled,
            preAlertMinutes: slotOpts.preAlertMinutes,
            postReminderEnabled: slotOpts.postReminderEnabled,
            soundProfile: prefs.soundProfile,
            muezzinId: slotOpts.muezzinId,
            prayerEnabled: slotOpts.prayerEnabled,
            iosFullHandlesEnter: slotOpts.iosFullHandlesEnter,
          });
        }),
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

  const next =
    slots.find((s) => resolveSlotAlertOpts(s.slot.key, prefs).prayerEnabled)?.slot ?? null;
  if (!next) return;

  const prayerEpoch = epochForSlot(next, tz);
  const prayerName = KEY_TO_ARABIC[next.key] ?? next.name;
  const prayerKey = next.key.toLowerCase();
  const nextOpts = resolveSlotAlertOpts(next.key, prefs);
  const preMinutes = nextOpts.preAlertMinutes;
  const preAlertDelay = prayerEpoch - Date.now() - preMinutes * 60_000;
  const enterDelay = prayerEpoch - Date.now();

  const fireEvent: PrayerAlertEvent = {
    type: "pre-alert",
    prayerKey,
    prayerName,
    prayerTimeEpochMs: prayerEpoch,
    preAlertMinutes: preMinutes,
  };

  const preOn = nextOpts.preAlertEnabled;
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
