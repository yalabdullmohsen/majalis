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
import { isNative } from "./capacitor-utils";

export type AdhanEvent = {
  type: "adhan" | "advance";
  prayerKey: PrayerKey;
  prayerName: string;
  minutesBefore?: number;
};

/** Fired on window when adhan or advance notification triggers */
export const ADHAN_EVENT_NAME = "majalis:adhan";

/**
 * أقصى تأخّر مسموح به قبل اعتبار المؤقّت "قديماً". مؤقّتات JS تتوقف أثناء نوم
 * الجهاز/الخلفية ثم تُطلَق متأخّرة عند الاستيقاظ — فنمنع تشغيل أذانٍ فات وقته
 * (مثلاً بساعة). القيمة بالملّي ثانية.
 */
const STALE_TOLERANCE_MS = 2 * 60_000; // دقيقتان

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


function showBrowserNotification(event: AdhanEvent) {
  // على iOS/Android الأصليين: إشعارات دخول الوقت والتذكير المسبق تُغطّى فعلياً
  // عبر prayer-alert-scheduler.ts (إشعارات Capacitor المحلية الحقيقية — تعمل
  // حتى مع إغلاق التطبيق). أما Notification API + Service Worker هنا فهما
  // آليتا ويب/PWA لا تعملان بشكل موثوق داخل تطبيق Capacitor الأصلي، وإطلاقهما
  // كان يُنتج إشعارًا مكرَّرًا محتملاً على الويب لو عمل أحيانًا. نقتصر هذا
  // المسار على الويب فقط لتفادي التكرار (2026-07-16).
  if (isNative) return;
  // إشعار "دخول الوقت" مُغطّى بالفعل عبر Service Worker (postSwSchedule أدناه)
  // ليعمل حتى مع تبويب في الخلفية — إطلاقه هنا أيضًا كان يُنتج إشعارًا مكرَّرًا
  // فعليًا على الويب (وسمان مختلفان: adhan-{key}-adhan هنا مقابل adhan-{key}
  // في sw.js، فلا يُدمجهما المتصفح). التنبيه المسبق (advance) لا مسار SW موازيًا
  // له، فيبقى هنا فقط (2026-07-16).
  if (event.type === "adhan") return;
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

  const adhanTargetEpoch = Date.now() + adhanDelay;
  const t1 = setTimeout(() => {
    // مؤقّت متأخّر (نوم/خلفية): لا تُشغّل أذاناً فات وقته بأكثر من المسموح
    if (Date.now() - adhanTargetEpoch > STALE_TOLERANCE_MS) return;
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
  postSwSchedule(key, PRAYER_ARABIC[key] ?? slot.name, adhanDelay, adhanTargetEpoch);

  // ── Advance reminder timer ──
  const advMin = prayerPrefs.advanceMinutes;
  if (advMin > 0) {
    let advDelay = slotMs - nowMs - advMin * 60_000;
    if (advDelay < 0) advDelay += 24 * 3600_000;
    if (advDelay < 24 * 3600_000) {
      const advTargetEpoch = Date.now() + advDelay;
      const t2 = setTimeout(() => {
        if (Date.now() - advTargetEpoch > STALE_TOLERANCE_MS) return; // تذكير متأخّر — تجاهله
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

/**
 * Start the scheduler for the current prayer data. Call once on app load.
 *
 * لا يطلب إذن الإشعارات هنا أبداً — كان يفعل ذلك تلقائياً عند كل تحميل
 * للتطبيق (أول فتح)، مخالفًا صراحةً لسياسة "اطلب الإذن في وقت منطقي بعد
 * شرح الفائدة لا عند أول فتح". طلب الإذن الفعلي يحدث فقط عبر مسار مستخدم
 * صريح في PrayerAlertSettingsCard.tsx (زر "تفعيل" بعد شارة شرح). المؤقّتات
 * هنا تعمل بصرف النظر عن الإذن — تشغيل الصوت لا يحتاج إذنًا، والإشعار
 * يُعرض فقط إن كان الإذن ممنوحًا مسبقًا (انظر showBrowserNotification).
 */
export async function startAdhanScheduler(payload: PrayerTimesPayload): Promise<void> {
  clearAllTimers();

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
function postSwSchedule(prayerKey: PrayerKey, prayerArabic: string, delayMs: number, fireAt: number) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;
  sw.postMessage({ type: "SCHEDULE_ADHAN", prayerKey, prayerArabic, delayMs, fireAt });
}
