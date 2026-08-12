import { isNative } from "@/lib/capacitor-utils";
import { loadAdhanPrefs, PRAYER_ARABIC, PRAYER_KEYS, type PrayerKey } from "@/lib/adhan-preferences";
import { getNotificationPermissionStatus } from "@/lib/prayer-local-notifications";
import type { PrayerTimesPayload, PrayerSlot } from "@/lib/prayer-times";

export interface NotificationDiagnostics {
  permission: "granted" | "denied" | "prompt" | "unsupported";
  globalEnabled: boolean;
  serviceWorkerActive: boolean;
  nextPrayer: { key: PrayerKey; name: string; time: string } | null;
  nextPrayerEnabled: boolean;
  blockingReasons: string[];
}

const SLOT_TO_KEY: Record<string, PrayerKey> = {
  Fajr: "fajr", Dhuhr: "dhuhr", Asr: "asr", Maghrib: "maghrib", Isha: "isha",
};

function findNextPrayer(payload: PrayerTimesPayload | null): { key: PrayerKey; name: string; time: string } | null {
  if (!payload) return null;
  const nowMin = (() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuwait", hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return h * 60 + m;
  })();

  const slots = payload.prayers.filter((p: PrayerSlot) => SLOT_TO_KEY[p.key] && p.minutes != null);
  const upcoming = slots.find((p) => (p.minutes as number) >= nowMin);
  const chosen = upcoming ?? slots[0];
  if (!chosen) return null;
  const key = SLOT_TO_KEY[chosen.key];
  return { key, name: PRAYER_ARABIC[key], time: chosen.time ?? "" };
}

/**
 * يحسب تشخيصًا حيًا لسبب احتمال عدم وصول تنبيه الصلاة، من الحالة الفعلية
 * مباشرة (لا قيمة مخزَّنة) — يُستخدم في لوحة "لماذا لا تصلني تنبيهات؟".
 */
export async function computeNotificationDiagnostics(
  prayerData: PrayerTimesPayload | null,
): Promise<NotificationDiagnostics> {
  const prefs = loadAdhanPrefs();
  const permission = await getNotificationPermissionStatus();
  const serviceWorkerActive = !isNative && "serviceWorker" in navigator && !!navigator.serviceWorker.controller;
  const nextPrayer = findNextPrayer(prayerData);
  const nextPrayerEnabled = nextPrayer ? prefs.prayers[nextPrayer.key].enabled : false;

  const reasons: string[] = [];
  if (!prefs.globalEnabled) {
    reasons.push("إشعارات الأذان معطّلة كليًا من الإعدادات.");
  }
  if (permission === "denied") {
    reasons.push("إذن الإشعارات محجوب من إعدادات المتصفح أو الجهاز — يجب تفعيله يدويًا من إعدادات النظام.");
  } else if (permission === "prompt") {
    reasons.push('لم يُطلَب إذن الإشعارات بعد — اضغط "تفعيل" في بطاقة "تنبيه الصلاة القادمة".');
  } else if (permission === "unsupported") {
    reasons.push("هذا المتصفح أو الجهاز لا يدعم الإشعارات.");
  }
  if (prefs.globalEnabled && nextPrayer && !nextPrayerEnabled) {
    reasons.push(`تنبيه صلاة ${nextPrayer.name} معطّل تحديدًا (مفعّل للصلوات الأخرى فقط).`);
  }
  if (!isNative && !serviceWorkerActive && permission === "granted") {
    reasons.push("Service Worker غير نشط — قد لا تصل تنبيهات دخول الوقت إذا كان التبويب مغلقًا تمامًا (الويب فقط، لا يؤثر على التطبيق).");
  }

  return { permission, globalEnabled: prefs.globalEnabled, serviceWorkerActive, nextPrayer, nextPrayerEnabled, blockingReasons: reasons };
}

export { PRAYER_KEYS };
