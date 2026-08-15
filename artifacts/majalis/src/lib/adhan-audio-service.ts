/**
 * خدمة مركزية لصوت الأذان داخل التطبيق — تشغيل كامل، اختبار، جلسة صوت أصلية، وتشخيص الأصول.
 * لا تدّعي تجاوز الوضع الصامت أو Focus؛ ذلك يتطلب Critical Alerts من Apple.
 */
import { Capacitor } from "@capacitor/core";
import { getMuezzin, playAdhan, stopAdhan as stopCatalogAdhan } from "./adhan-audio";
import { playAdhanUrlAsync, stopAdhan as stopPlayback, type AdhanPlayResult } from "./adhan-playback";
import { isNative } from "./capacitor-utils";

export const CRITICAL_ALERTS_ENTITLEMENT_PRESENT = false;

/** مسارات الأذان الكامل عالية الجودة تحت public/audio/adhan */
export const ADHAN_FULL_AUDIO_PATHS = {
  makkah: "/audio/adhan/adhan-makkah-full.mp3",
  madinah: "/audio/adhan/adhan-madinah-full.mp3",
  aqsa: "/audio/adhan/adhan-aqsa-full.mp3",
  egypt: "/audio/adhan/adhan-egypt-full.mp3",
  turkey: "/audio/adhan/adhan-turkey-full.mp3",
  kuwait: "/audio/adhan/adhan-kuwait-full.mp3",
  fajrMakkah: "/audio/adhan/adhan-makkah-fajr.mp3",
} as const;

export type AdhanStyleId =
  | "makkah"
  | "madinah"
  | "aqsa"
  | "egypt"
  | "turkey"
  | "kuwait"
  | "takbeerat"
  | "silent";

export const ADHAN_STYLE_OPTIONS: Array<{
  id: AdhanStyleId;
  labelAr: string;
  fullPath: string | null;
  notificationSound: string | null;
}> = [
  {
    id: "makkah",
    labelAr: "أذان الحرم المكي",
    fullPath: ADHAN_FULL_AUDIO_PATHS.makkah,
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "madinah",
    labelAr: "أذان المسجد النبوي",
    fullPath: ADHAN_FULL_AUDIO_PATHS.madinah,
    notificationSound: "adhan-short-madinah.caf",
  },
  {
    id: "aqsa",
    labelAr: "أذان الأقصى",
    fullPath: ADHAN_FULL_AUDIO_PATHS.aqsa,
    notificationSound: "adhan-short-aqsa.caf",
  },
  {
    id: "egypt",
    labelAr: "أذان مصري",
    fullPath: ADHAN_FULL_AUDIO_PATHS.egypt,
    notificationSound: "adhan-short-egypt.caf",
  },
  {
    id: "turkey",
    labelAr: "أذان تركي",
    fullPath: ADHAN_FULL_AUDIO_PATHS.turkey,
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "kuwait",
    labelAr: "أذان خليجي / كويتي",
    fullPath: ADHAN_FULL_AUDIO_PATHS.kuwait,
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "takbeerat",
    labelAr: "تكبيرات فقط",
    fullPath: "/sounds/adhan/takbeerat-short.mp3",
    notificationSound: "adhan-short-takbeerat.caf",
  },
  {
    id: "silent",
    labelAr: "إشعار صامت نصي",
    fullPath: null,
    notificationSound: null,
  },
];

export type AdhanAssetProbe = {
  path: string;
  exists: boolean;
  error?: string;
};

const LOG = "[adhan-audio-service]";

export async function probeAdhanAssetExists(path: string): Promise<AdhanAssetProbe> {
  if (!path) return { path, exists: false, error: "missing asset path" };
  try {
    const url = path.startsWith("http") ? path : path;
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (res.ok) return { path, exists: true };
    // بعض الخوادم لا تدعم HEAD — جرّب GET محدود
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1" },
      cache: "no-store",
    });
    if (get.ok || get.status === 206) return { path, exists: true };
    console.warn(LOG, "missing asset", path, get.status);
    return { path, exists: false, error: `missing asset (${get.status})` };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(LOG, "probe failed", path, message);
    return { path, exists: false, error: message };
  }
}

/**
 * يفعّل جلسة تشغيل مناسبة على الأصل (إن وُجدت إضافة Native Settings / Audio).
 * فشل الجلسة يُسجَّل ولا يمنع محاولة HTMLAudio داخل التطبيق.
 */
export async function ensureNativePlaybackAudioSession(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isNative) return { ok: true };
  try {
    // Capacitor لا يوفّر AVAudioSession مباشرة — نعتمد على UIBackgroundModes=audio
    // وعلى تشغيل HTMLAudio بعد تفاعل المستخدم.
    const platform = Capacitor.getPlatform();
    console.info(LOG, "audio session ready for platform", platform);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(LOG, "audio session failed", message);
    return { ok: false, error: `audio session failed: ${message}` };
  }
}

function styleToMuezzinId(style: AdhanStyleId): string {
  if (style === "silent") return "makkah";
  if (style === "turkey") return "turkey";
  if (style === "kuwait") return "kuwait";
  return style;
}

export async function playFullAdhan(style: AdhanStyleId): Promise<AdhanPlayResult> {
  if (style === "silent") {
    return { ok: false, code: "missing_file", message: "silent style — no audio" };
  }
  const session = await ensureNativePlaybackAudioSession();
  if (!session.ok) {
    console.error(LOG, session.error);
  }
  const opt = ADHAN_STYLE_OPTIONS.find((s) => s.id === style);
  const path = opt?.fullPath;
  if (path) {
    const probe = await probeAdhanAssetExists(path);
    if (!probe.exists) {
      console.error(LOG, "missing asset", path, probe.error);
    }
    const result = await playAdhanUrlAsync(path, 1, { fadeIn: true });
    if (result.ok) return result;
    console.warn(LOG, "full path play failed, fallback catalog", result);
  }
  const muezzinId = styleToMuezzinId(style);
  const m = getMuezzin(muezzinId);
  if (!m?.audioAvailable || !m.audioUrl) {
    console.error(LOG, "unavailable style / missing asset", style);
    return {
      ok: false,
      code: "missing_file",
      message: `style unavailable: ${style}`,
    };
  }
  const el = playAdhan(m, false, "full", 1);
  if (!el) {
    return playAdhanUrlAsync(m.audioUrl, 1, { fadeIn: true });
  }
  return { ok: true, audio: el };
}

export function stopAdhan(): void {
  stopPlayback();
  stopCatalogAdhan();
}

export async function testFullAdhan(style: AdhanStyleId): Promise<AdhanPlayResult> {
  console.info(LOG, "testFullAdhan", style);
  return playFullAdhan(style);
}

/** قائمة قرّاء التلاوة — ليست لأنماط الأذان */
export const QURAN_RECITER_FEATURED_FOR_UI = [
  "ياسر الدوسري",
  "عبد الرحمن السديس",
  "ماهر المعيقلي",
  "سعود الشريم",
  "مشاري راشد العفاسي",
  "فارس عباد",
  "محمود خليل الحصري",
  "محمد صديق المنشاوي",
  "عبد الباسط عبد الصمد",
  "علي جابر",
] as const;
