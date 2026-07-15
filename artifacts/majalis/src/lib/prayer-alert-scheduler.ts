/**
 * منسّق تنبيه الصلاة القادمة: يجمع بين الإشعار المحلي الأصلي (يعمل في الخلفية)
 * وLive Activity (تعمل تفاعلياً أثناء فتح التطبيق) وحدث الشريط داخل التطبيق.
 *
 * الإشعارات المحلية تُجدوَل فوراً عبر نظام التشغيل (تنجو من إغلاق التطبيق).
 * Live Activity وشريط التطبيق يُفعَّلان بمؤقّتات JS (تعمل فقط والتطبيق مفتوح
 * أو حديث العهد بالخلفية) — لذا نُعيد فحص النافذة أيضاً عند كل عودة للتطبيق
 * (visibilitychange) حتى لا تُفوَّت صلاة دخلت نافذتها والتطبيق كان مغلقاً.
 */
import {
  type PrayerSlot,
  type PrayerTimesPayload,
} from "./prayer-times";
import { loadPrayerAlertPrefs, PRE_ALERT_MINUTES, LIVE_ACTIVITY_LINGER_MINUTES } from "./prayer-alert-preferences";
import { schedulePrayerNativeNotifications } from "./prayer-local-notifications";
import { startPrayerLiveActivity, markPrayerLiveActivityEntered, endPrayerLiveActivity } from "./plugins/prayer-live-activity";

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
let _lastScheduledKey: string | null = null;
let _liveActivityActiveForKey: string | null = null;

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

/** أقرب صلاة قادمة لم يحن وقتها بعد (تتجاهل ما فات، تلتفّ لليوم التالي إن لزم). */
function findNextUpcoming(prayers: PrayerSlot[]): PrayerSlot | null {
  const nowMs = kuwaitNowMs();
  const obligatory = prayers.filter((p) => p.obligatory && p.minutes != null);
  let best: PrayerSlot | null = null;
  let bestDelay = Infinity;
  for (const p of obligatory) {
    const slotMs = (p.minutes as number) * 60_000;
    let delay = slotMs - nowMs;
    if (delay < 0) delay += 24 * 3600_000;
    if (delay < bestDelay) {
      bestDelay = delay;
      best = p;
    }
  }
  return best;
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

/**
 * يُجدوِل تنبيهي "قبل ١٥ دقيقة" و"دخول الوقت" لأقرب صلاة قادمة فقط (لا داعي
 * لجدولة كل الصلوات مقدَّماً — يُعاد الاستدعاء تلقائياً بعد كل صلاة ومنتصف الليل).
 */
export async function startPrayerAlertScheduler(payload: PrayerTimesPayload): Promise<void> {
  clearAllTimers();
  const next = findNextUpcoming(payload.prayers);
  if (!next) return;

  const prefs = loadPrayerAlertPrefs();
  const prayerEpoch = epochForSlot(next);
  const prayerName = KEY_TO_ARABIC[next.key] ?? next.name;

  // إشعارات محلية أصلية — تُجدوَل فوراً عبر نظام التشغيل (تعمل حتى لو أُغلق التطبيق).
  if (next.key !== _lastScheduledKey) {
    _lastScheduledKey = next.key;
    void schedulePrayerNativeNotifications({
      prayerKey: next.key.toLowerCase(),
      prayerName,
      prayerTimeEpochMs: prayerEpoch,
      preAlertEnabled: prefs.preAlertEnabled,
      enterAlertEnabled: prefs.enterAlertEnabled,
      preAlertMinutes: PRE_ALERT_MINUTES,
    });
  }

  const preAlertDelay = prayerEpoch - Date.now() - PRE_ALERT_MINUTES * 60_000;
  const enterDelay = prayerEpoch - Date.now();

  const fireEvent: PrayerAlertEvent = {
    type: "pre-alert",
    prayerKey: next.key.toLowerCase(),
    prayerName,
    prayerTimeEpochMs: prayerEpoch,
    preAlertMinutes: PRE_ALERT_MINUTES,
  };

  if (preAlertDelay <= 0 && enterDelay > 0) {
    // التطبيق فُتح بالفعل داخل نافذة الـ١٥ دقيقة — فعّل فوراً بدل انتظار مؤقّت سالب.
    if (prefs.preAlertEnabled) dispatchAlert(fireEvent);
    void fireLiveActivityStart(next, prayerEpoch, payload.city);
  } else if (preAlertDelay > 0) {
    const t = setTimeout(() => {
      if (prefs.preAlertEnabled) dispatchAlert(fireEvent);
      void fireLiveActivityStart(next, prayerEpoch, payload.city);
    }, preAlertDelay);
    _timers.push(t);
  }

  if (enterDelay > 0) {
    const t = setTimeout(() => {
      dispatchAlert({ ...fireEvent, type: "entered" });
      void fireLiveActivityEnter();
      _lastScheduledKey = null; // اسمح بجدولة الصلاة التالية عند إعادة التشغيل
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
export async function recheckPrayerAlertWindow(payload: PrayerTimesPayload | null) {
  if (!payload) return;
  await startPrayerAlertScheduler(payload);
}
