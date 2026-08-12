/**
 * واجهة JS لـ Live Activity الصلاة القادمة (iOS 16.2+ فقط، عبر ActivityKit).
 * التنفيذ الفعلي في ios/App/App/PrayerLiveActivityPlugin.swift.
 * على الويب/أندرويد أو iOS < 16.2: كل الدوال تُرجع { supported: false } بأمان،
 * بلا أي خطأ — الشريط داخل التطبيق + الإشعار المحلي هما البديل الكامل هناك.
 */
import { registerPlugin } from "@capacitor/core";
import { isIOS, isNative } from "@/lib/capacitor-utils";

export type PrayerLiveActivityStartOptions = {
  /** مفتاح الصلاة: fajr | dhuhr | asr | maghrib | isha */
  prayerKey: string;
  /** اسم الصلاة بالعربية، مثل "العصر" */
  prayerName: string;
  /** الوقت الفعلي للصلاة (ISO 8601) */
  prayerTimeIso: string;
  /** اسم المدينة/المحافظة المستخدمة في حساب الأوقات، للعرض في الحالة الموسّعة */
  locationLabel?: string;
};

interface PrayerLiveActivityPlugin {
  /** هل الجهاز/الإصدار يدعم Live Activities؟ */
  areActivitiesSupported(): Promise<{ supported: boolean }>;
  /** ابدأ Live Activity جديدة للصلاة القادمة (تُنهي أي نشاط سابق أولاً — نشاط واحد كحد أقصى). */
  startActivity(options: PrayerLiveActivityStartOptions): Promise<{ started: boolean }>;
  /** حدّث النشاط الحالي (يُستخدَم عند دخول وقت الصلاة لتغيير النص). */
  updateActivity(options: { hasStarted: boolean }): Promise<{ updated: boolean }>;
  /** أنهِ النشاط الحالي فوراً (أو دعه ينتهي تلقائياً بعد المهلة المحددة عند الجدولة). */
  endActivity(): Promise<{ ended: boolean }>;
}

const NOOP_RESULT = { supported: false, started: false, updated: false, ended: false };

/** واجهة آمنة: على غير iOS الأصلي تُرجع نتائج "لا دعم" بلا استدعاء الإضافة أصلاً. */
function getPlugin(): PrayerLiveActivityPlugin | null {
  if (!isNative || !isIOS) return null;
  return registerPlugin<PrayerLiveActivityPlugin>("PrayerLiveActivity");
}

export async function areLiveActivitiesSupported(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.areActivitiesSupported();
    return res.supported;
  } catch {
    return false;
  }
}

export async function startPrayerLiveActivity(options: PrayerLiveActivityStartOptions): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return NOOP_RESULT.started;
  try {
    const res = await plugin.startActivity(options);
    return res.started;
  } catch {
    return false;
  }
}

export async function markPrayerLiveActivityEntered(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return NOOP_RESULT.updated;
  try {
    const res = await plugin.updateActivity({ hasStarted: true });
    return res.updated;
  } catch {
    return false;
  }
}

export async function endPrayerLiveActivity(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return NOOP_RESULT.ended;
  try {
    const res = await plugin.endActivity();
    return res.ended;
  } catch {
    return false;
  }
}
