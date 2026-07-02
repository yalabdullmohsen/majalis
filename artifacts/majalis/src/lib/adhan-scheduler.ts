/**
 * Adhan scheduler — sets timers for each prayer and triggers:
 *   1. Audio playback (adhan)
 *   2. Browser Notification
 *   3. Custom event for in-app bar
 *
 * Must be started once when the app loads. Re-schedules automatically
 * after midnight Kuwait time.
 */

import {
  type PrayerSlot,
  type PrayerTimesPayload,
} from "./prayer-times";
import {
  loadAdhanPrefs,
  PRAYER_ARABIC,
  type PrayerKey,
  getEffectiveMuezzinId,
} from "./adhan-preferences";
import { getMuezzin, playAdhan } from "./adhan-audio";

export type AdhanEvent = {
  type: "adhan" | "advance";
  prayerKey: PrayerKey;
  prayerName: string;
  minutesBefore?: number;
};

/** Fired on window when adhan or advance notification triggers */
export const ADHAN_EVENT_NAME = "majalis:adhan";

const _timers: ReturnType<typeof setTimeout>[] = [];

function clearAllTimers() {
  for (const t of _timers) clearTimeout(t);
  _timers.length = 0;
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

function prayerMs(slot: PrayerSlot): number | null {
  if (slot.minutes == null) return null;
  return slot.minutes * 60_000;
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showBrowserNotification(event: AdhanEvent) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const title = event.type === "advance"
    ? `تنبيه: ${event.prayerName} بعد ${event.minutesBefore} دقيقة`
    : `حان وقت ${event.prayerName}`;
  const body = event.type === "advance"
    ? `استعد لصلاة ${event.prayerName}`
    : "الصلاة خير من النوم — حي على الصلاة";

  try {
    new Notification(title, {
      body,
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

function scheduleForPrayer(slot: PrayerSlot, key: PrayerKey) {
  const prefs = loadAdhanPrefs();
  if (!prefs.globalEnabled) return;
  const prayerPrefs = prefs.prayers[key];
  if (!prayerPrefs.enabled) return;

  const nowMs = kuwaitNowMs();
  const slotMs = prayerMs(slot);
  if (slotMs == null) return;

  // ── Main adhan timer ──
  let adhanDelay = slotMs - nowMs;
  if (adhanDelay < 0) adhanDelay += 24 * 3600_000; // next day
  if (adhanDelay > 24 * 3600_000) return; // too far ahead

  const t1 = setTimeout(() => {
    const fresh = loadAdhanPrefs();
    if (!fresh.globalEnabled || !fresh.prayers[key].enabled) return;
    const muezzinId = getEffectiveMuezzinId(fresh, key);
    const muezzin = getMuezzin(muezzinId);
    const isFajr = key === "fajr";
    playAdhan(muezzin, isFajr);
    dispatchAdhanEvent({ type: "adhan", prayerKey: key, prayerName: slot.name });
  }, adhanDelay);
  _timers.push(t1);

  // Also register with SW for background-tab notifications
  postSwSchedule(key, PRAYER_ARABIC[key] ?? slot.name, adhanDelay);

  // ── Advance reminder timer ──
  const advMin = prayerPrefs.advanceMinutes;
  if (advMin > 0) {
    let advDelay = slotMs - nowMs - advMin * 60_000;
    if (advDelay < 0) advDelay += 24 * 3600_000;
    if (advDelay < 24 * 3600_000) {
      const t2 = setTimeout(() => {
        const fresh = loadAdhanPrefs();
        if (!fresh.globalEnabled || !fresh.prayers[key].enabled) return;
        if (fresh.prayers[key].advanceMinutes === 0) return;
        dispatchAdhanEvent({
          type: "advance",
          prayerKey: key,
          prayerName: slot.name,
          minutesBefore: fresh.prayers[key].advanceMinutes,
        });
      }, advDelay);
      _timers.push(t2);
    }
  }
}

/** Start the scheduler for the current prayer data. Call once on app load. */
export async function startAdhanScheduler(payload: PrayerTimesPayload): Promise<void> {
  clearAllTimers();
  await requestNotificationPermission();

  const SLOT_KEYS: Array<[string, PrayerKey]> = [
    ["Fajr", "fajr"],
    ["Dhuhr", "dhuhr"],
    ["Asr", "asr"],
    ["Maghrib", "maghrib"],
    ["Isha", "isha"],
  ];

  for (const [slotKey, prayerKey] of SLOT_KEYS) {
    const slot = payload.prayers.find((p) => p.key === slotKey);
    if (slot) scheduleForPrayer(slot, prayerKey);
  }

  // Re-schedule at midnight Kuwait time
  const nowMs = kuwaitNowMs();
  const midnightDelay = 24 * 3600_000 - nowMs + 5_000; // 5s after midnight
  const midnight = setTimeout(() => {
    // Fetch new prayer times and restart
    import("./prayer-times").then(({ fetchPrayerTimes }) => {
      fetchPrayerTimes().then((p) => startAdhanScheduler(p));
    });
  }, midnightDelay);
  _timers.push(midnight);
}

export function stopAdhanScheduler() {
  clearAllTimers();
}

/** Posts SCHEDULE_ADHAN to the SW so notifications fire even in background tabs. */
function postSwSchedule(prayerKey: PrayerKey, prayerArabic: string, delayMs: number) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;
  sw.postMessage({ type: "SCHEDULE_ADHAN", prayerKey, prayerArabic, delayMs });
}
