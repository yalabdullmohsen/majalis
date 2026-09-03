/**
 * Adhan scheduler — sets timers for each prayer and triggers:
 *   1. Audio playback (adhan / iqamah)
 *   2. Browser Notification (web)
 *   3. Custom event for in-app bar
 *
 * Must be started once when the app loads. Re-schedules automatically
 * after midnight local prayer timezone.
 *
 * جيل جدولة (_scheduleGen) يمنع تداخل المؤقتات عند إعادة التشغيل المتزامنة.
 */

import {
  calendarNoonInZone,
  epochAtZoneMinutes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "./prayer-times";
import { getActivePrayerLocation } from "./prayer-location-prefs";
import {
  loadAdhanPrefs,
  PRAYER_ARABIC,
  PRAYER_KEYS,
  type PrayerKey,
  getEffectiveMuezzinId,
  getEffectivePlaybackMode,
  isIqamahEnabledForPrayer,
} from "./adhan-preferences";
import { getMuezzin, hasFajrAdhan, playAdhan, playIqamah } from "./adhan-audio";
import { hapticTap, isIOS, isNative } from "./capacitor-utils";
import { ADHAN_EVENT_NAME, type AdhanEvent } from "./adhan-events";
import {
  cancelAndroidFullAdhan,
  isAdhanAndroidAlarmAvailable,
  scheduleAndroidFullAdhan,
} from "./adhan-android-alarm";
import { resolveAdhanClip } from "./adhan-playback-modes";

export type { AdhanEvent };
export { ADHAN_EVENT_NAME };

function upcomingPrayerEpochs(slot: PrayerSlot): number[] {
  if (slot.minutes == null) return [];
  const tz = getActivePrayerLocation().timeZone || "Asia/Kuwait";
  const todayNoon = calendarNoonInZone(tz);
  const tomorrowNoon = new Date(todayNoon.getTime() + 24 * 3600_000);
  const now = Date.now();
  return [todayNoon, tomorrowNoon]
    .map((noon) => epochAtZoneMinutes(tz, slot.minutes!, noon))
    .filter((epoch) => epoch > now);
}

function iosFullAdhanActive(): boolean {
  return isNative && isIOS;
}

/**
 * أقصى تأخّر مسموح به قبل اعتبار المؤقّت "قديماً". مؤقّتات JS تتوقف أثناء نوم
 * الجهاز/الخلفية ثم تُطلَق متأخّرة عند الاستيقاظ — فنمنع تشغيل أذانٍ فات وقته.
 */
const STALE_TOLERANCE_MS = 2 * 60_000; // دقيقتان

const _timers: ReturnType<typeof setTimeout>[] = [];
/** جيل الجدولة — أي مؤقّت قديم يتجاهل نفسه إن تغيّر الجيل */
let _scheduleGen = 0;

function clearAllTimers() {
  for (const t of _timers) clearTimeout(t);
  _timers.length = 0;
}

function pushTimer(tid: ReturnType<typeof setTimeout>) {
  _timers.push(tid);
}

/** للاختبارات: عدد المؤقتات النشطة */
export function getAdhanSchedulerTimerCount(): number {
  return _timers.length;
}

export function getAdhanSchedulerGeneration(): number {
  return _scheduleGen;
}

function kuwaitNowMs(): number {
  const timeZone = getActivePrayerLocation().timeZone || "Asia/Kuwait";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    const s = Number(parts.find((p) => p.type === "second")?.value ?? 0);
    return (h * 3600 + m * 60 + s) * 1000;
  } catch {
    return Date.now() % 86_400_000;
  }
}

function prayerMs(slot: PrayerSlot): number | null {
  if (slot.minutes == null) return null;
  return slot.minutes * 60_000;
}

import { buildScheduledPrayerNotificationCopy } from "./prayer-notification-copy";

function showBrowserNotification(event: AdhanEvent) {
  if (isNative) return;
  if (event.type === "adhan") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const copy =
    event.type === "advance"
      ? buildScheduledPrayerNotificationCopy({
          kind: "pre",
          prayerName: event.prayerName,
          prayerTimeLabel: event.prayerTimeLabel ?? "",
          minutesBefore: event.minutesBefore,
        })
      : event.type === "iqamah"
        ? {
            title: `إقامة ${event.prayerName}`,
            body: event.prayerTimeLabel ?? "حان وقت الإقامة",
          }
        : buildScheduledPrayerNotificationCopy({
            kind: "enter",
            prayerName: event.prayerName,
            prayerTimeLabel: event.prayerTimeLabel ?? "",
          });

  try {
    new Notification(copy.title, {
      body: copy.body,
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      tag: `adhan-${event.prayerKey}-${event.type}`,
      silent: false,
    });
  } catch { /* ignore */ }
}

function dispatchAdhanEvent(event: AdhanEvent) {
  window.dispatchEvent(new CustomEvent(ADHAN_EVENT_NAME, { detail: event }));
  showBrowserNotification(event);
}

function scheduleForPrayer(
  slot: PrayerSlot,
  key: PrayerKey,
  cityName: string | undefined,
  gen: number,
) {
  const prefs = loadAdhanPrefs();
  if (!prefs.globalEnabled) return;
  const prayerPrefs = prefs.prayers[key];
  if (!prayerPrefs.enabled) return;

  const nowMs = kuwaitNowMs();
  const slotMs = prayerMs(slot);
  if (slotMs == null) return;

  let adhanDelay = slotMs - nowMs;
  if (adhanDelay < 0) adhanDelay += 24 * 3600_000;
  if (adhanDelay > 24 * 3600_000) return;

  const adhanTargetEpoch = Date.now() + adhanDelay;
  const deliveryMode = getEffectivePlaybackMode(prefs, key);

  if (isAdhanAndroidAlarmAvailable() && deliveryMode === "full") {
    void cancelAndroidFullAdhan(key);
    const muezzin = getMuezzin(getEffectiveMuezzinId(prefs, key));
    const isFajr = key === "fajr";
    const clip = resolveAdhanClip(muezzin, { isFajr, mode: "full" });
    if (clip) {
      void scheduleAndroidFullAdhan({
        atMs: adhanTargetEpoch,
        url: clip.url,
        title: `أذان ${PRAYER_ARABIC[key] ?? slot.name}`,
        prayerKey: key,
      });
    }
  }

  if (iosFullAdhanActive() && deliveryMode === "full") {
    const muezzin = getMuezzin(getEffectiveMuezzinId(prefs, key));
    const isFajr = key === "fajr";
    if (!isFajr || hasFajrAdhan(muezzin)) {
      const epochs = upcomingPrayerEpochs(slot);
      void import("./adhan-ios-segments").then(({ scheduleIosFullAdhan }) => {
        epochs.forEach((startAtMs, index) => {
          void scheduleIosFullAdhan({
            prayerKey: key,
            prayerName: PRAYER_ARABIC[key] ?? slot.name,
            recordingId: muezzin.id,
            isFajr,
            startAtMs,
            deliveryMode: index === 0 ? deliveryMode : "short",
          });
        });
      });
    }
  }

  const t1 = setTimeout(() => {
    if (gen !== _scheduleGen) return;
    if (Date.now() - adhanTargetEpoch > STALE_TOLERANCE_MS) return;
    if (Date.now() - adhanTargetEpoch > 5 * 60_000) return;
    const fresh = loadAdhanPrefs();
    if (!fresh.globalEnabled || !fresh.prayers[key].enabled) return;
    const mode = getEffectivePlaybackMode(fresh, key);
    const muezzinId = getEffectiveMuezzinId(fresh, key);
    const muezzin = getMuezzin(muezzinId);
    const isFajr = key === "fajr";

    if (mode === "full" && isAdhanAndroidAlarmAvailable()) {
      if (fresh.vibrateEnabled) void hapticTap("medium");
      dispatchAdhanEvent({
        type: "adhan",
        prayerKey: key,
        prayerName: slot.name,
        cityName,
        prayerTimeLabel: slot.time,
      });
      return;
    }

    /**
     * iOS كامل + التطبيق في الواجهة: شغّل الأذان الكامل داخل التطبيق بلا انقطاع،
     * وألغِ بقية مقاطع الإشعار. إن كانت الشاشة مقفلة فالمقاطع المتتابعة تتولى الصوت.
     */
    if (mode === "full" && iosFullAdhanActive()) {
      const inForeground =
        typeof document !== "undefined" && document.visibilityState === "visible";
      if (inForeground) {
        void import("./adhan-ios-segments").then((m) => m.cancelAdhanIosSegmentChain(key));
        const audio = playAdhan(muezzin, isFajr, "full", fresh.volume ?? 1);
        if (!audio && isFajr) return;
      }
      if (fresh.vibrateEnabled) void hapticTap("medium");
      dispatchAdhanEvent({
        type: "adhan",
        prayerKey: key,
        prayerName: slot.name,
        cityName,
        prayerTimeLabel: slot.time,
      });
      return;
    }

    const audio = playAdhan(muezzin, isFajr, mode, fresh.volume ?? 1);
    if (!audio && isFajr && mode !== "silent") return;
    if (fresh.vibrateEnabled) void hapticTap("medium");
    dispatchAdhanEvent({
      type: "adhan",
      prayerKey: key,
      prayerName: slot.name,
      cityName,
      prayerTimeLabel: slot.time,
    });
  }, adhanDelay);
  pushTimer(t1);

  postSwSchedule(
    key,
    PRAYER_ARABIC[key] ?? slot.name,
    adhanDelay,
    adhanTargetEpoch,
    cityName,
  );

  // ── Iqamah timer (بعد الأذان) ──
  if (isIqamahEnabledForPrayer(prefs, key)) {
    const iqDelayMin = prefs.iqamahDelayMinutes;
    const iqamahDelay = adhanDelay + iqDelayMin * 60_000;
    if (iqamahDelay > 0 && iqamahDelay < 24 * 3600_000) {
      const iqamahTargetEpoch = Date.now() + iqamahDelay;
      const tIq = setTimeout(() => {
        if (gen !== _scheduleGen) return;
        if (Date.now() - iqamahTargetEpoch > STALE_TOLERANCE_MS) return;
        const fresh = loadAdhanPrefs();
        if (!isIqamahEnabledForPrayer(fresh, key)) return;
        const muezzin = getMuezzin(getEffectiveMuezzinId(fresh, key));
        playIqamah(muezzin);
        if (fresh.vibrateEnabled) void hapticTap("light");
        dispatchAdhanEvent({
          type: "iqamah",
          prayerKey: key,
          prayerName: slot.name,
          minutesAfterAdhan: fresh.iqamahDelayMinutes,
          cityName,
          prayerTimeLabel: slot.time,
        });
      }, iqamahDelay);
      pushTimer(tIq);
      postSwIqamahSchedule(
        key,
        PRAYER_ARABIC[key] ?? slot.name,
        iqamahDelay,
        iqamahTargetEpoch,
        cityName,
      );
    }
  }

  // ── Advance reminder ──
  const advMin = prayerPrefs.advanceMinutes;
  if (advMin > 0) {
    const prayerDelayFromNow =
      slotMs - nowMs < 0 ? slotMs - nowMs + 24 * 3600_000 : slotMs - nowMs;
    const advDelay = prayerDelayFromNow - advMin * 60_000;
    if (advDelay > 0 && advDelay < 24 * 3600_000) {
      const advTargetEpoch = Date.now() + advDelay;
      const prayerTargetEpoch = Date.now() + prayerDelayFromNow;
      const t2 = setTimeout(() => {
        if (gen !== _scheduleGen) return;
        if (Date.now() - advTargetEpoch > STALE_TOLERANCE_MS) return;
        if (Date.now() >= prayerTargetEpoch) return;
        const fresh = loadAdhanPrefs();
        if (!fresh.globalEnabled || !fresh.prayers[key].enabled) return;
        if (fresh.prayers[key].advanceMinutes === 0) return;
        const mins = fresh.prayers[key].advanceMinutes;
        dispatchAdhanEvent({
          type: "advance",
          prayerKey: key,
          prayerName: slot.name,
          minutesBefore: mins,
          prayerTimeLabel: slot.time,
        });
      }, advDelay);
      pushTimer(t2);
    }
  }
}

/**
 * Start the scheduler for the current prayer data. Call once on app load.
 * لا يطلب إذن الإشعارات هنا أبداً.
 */
export async function startAdhanScheduler(payload: PrayerTimesPayload): Promise<void> {
  const gen = ++_scheduleGen;
  clearAllTimers();
  postSwCancelAll();

  if (isAdhanAndroidAlarmAvailable()) {
    for (const key of PRAYER_KEYS) {
      void cancelAndroidFullAdhan(key);
    }
  }

  if (iosFullAdhanActive()) {
    void import("./adhan-ios-segments").then(({ cancelAdhanIosSegmentChain }) =>
      cancelAdhanIosSegmentChain(),
    );
  }

  const SLOT_KEYS: Array<[string, PrayerKey]> = [
    ["Fajr", "fajr"],
    ["Dhuhr", "dhuhr"],
    ["Asr", "asr"],
    ["Maghrib", "maghrib"],
    ["Isha", "isha"],
  ];

  for (const [slotKey, prayerKey] of SLOT_KEYS) {
    if (gen !== _scheduleGen) return;
    const slot = payload.prayers.find((p) => p.key === slotKey);
    if (slot) scheduleForPrayer(slot, prayerKey, payload.city, gen);
  }

  if (gen !== _scheduleGen) return;

  const nowMs = kuwaitNowMs();
  const midnightDelay = 24 * 3600_000 - nowMs + 5_000;
  const midnight = setTimeout(() => {
    if (gen !== _scheduleGen) return;
    import("./prayer-times").then(({ fetchPrayerTimes }) => {
      fetchPrayerTimes().then((p) => startAdhanScheduler(p));
    });
  }, midnightDelay);
  pushTimer(midnight);
}

export function stopAdhanScheduler() {
  _scheduleGen += 1;
  clearAllTimers();
  postSwCancelAll();
  if (isAdhanAndroidAlarmAvailable()) {
    for (const key of PRAYER_KEYS) {
      void cancelAndroidFullAdhan(key);
    }
  }
  if (iosFullAdhanActive()) {
    void import("./adhan-ios-segments").then(({ cancelAdhanIosSegmentChain }) =>
      cancelAdhanIosSegmentChain(),
    );
  }
}

function postSwCancelAll() {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;
  sw.postMessage({ type: "CANCEL_ALL_ADHAN" });
}

function postSwSchedule(
  prayerKey: PrayerKey,
  prayerArabic: string,
  delayMs: number,
  fireAt: number,
  cityName?: string,
) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;
  sw.postMessage({
    type: "SCHEDULE_ADHAN",
    prayerKey,
    prayerArabic,
    delayMs,
    fireAt,
    cityName: cityName || "",
  });
}

function postSwIqamahSchedule(
  prayerKey: PrayerKey,
  prayerArabic: string,
  delayMs: number,
  fireAt: number,
  cityName?: string,
) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;
  sw.postMessage({
    type: "SCHEDULE_IQAMAH",
    prayerKey,
    prayerArabic,
    delayMs,
    fireAt,
    cityName: cityName || "",
  });
}
