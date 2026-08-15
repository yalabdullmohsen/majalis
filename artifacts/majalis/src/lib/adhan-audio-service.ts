/**
 * AdhanAudioService — طبقة تشغيل مركزية للأذان داخل التطبيق.
 *
 * - تفعيل AVAudioSession (.playback) على iOS قبل التشغيل حتى يستمر مع قفل الشاشة
 *   عندما بدأ التشغيل من التطبيق (Background Mode: audio).
 * - لا يتجاوز الصامت/Focus — ذلك يتطلب Critical Alerts من Apple.
 * - يعيد نتيجة واضحة عند الفشل (ملف مفقود / منع / تحميل).
 */
import {
  playAdhanUrlAsync,
  stopAdhan as stopPlayback,
  isAdhanPlaying,
  type AdhanPlayResult,
} from "@/lib/adhan-playback";
import { getMuezzin, stopAdhan as stopCatalogAdhan } from "@/lib/adhan-audio";
import { resolveAdhanClip, type AdhanPlaybackMode } from "@/lib/adhan-playback-modes";
import { isNative } from "@/lib/capacitor-utils";

/** لا entitlement فعلي — لا نقدّم تجاوزًا للصامت/Focus. */
export const CRITICAL_ALERTS_ENTITLEMENT_PRESENT = false;

/** مسارات الأذان الكامل المضمّنة في الحزمة (بدون turkey/kuwait — خارج ميزانية الحجم). */
export const ADHAN_FULL_AUDIO_PATHS = {
  makkah: "/audio/adhan/adhan-makkah-full.mp3",
  madinah: "/audio/adhan/adhan-madinah-full.mp3",
  aqsa: "/audio/adhan/adhan-aqsa-full.mp3",
  egypt: "/audio/adhan/adhan-egypt-full.mp3",
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

export type AdhanAudioDebugSnapshot = {
  playing: boolean;
  lastUrl: string | null;
  lastError: string | null;
  nativeSession: boolean;
  selectedMuezzinId: string | null;
};

let lastUrl: string | null = null;
let lastError: string | null = null;
let lastMuezzinId: string | null = null;

async function ensurePlaybackSession(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const { ensureNativePlaybackAudioSession } = await import("@/lib/native-playback-audio");
    await ensureNativePlaybackAudioSession({
      title: "الأذان",
      artist: "المجلس العلمي",
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[AdhanAudioService] AVAudioSession failed:", msg);
    lastError = msg;
    return false;
  }
}

export async function playAdhanFull(
  url: string,
  opts?: { volume?: number; maxMs?: number | null; fadeIn?: boolean },
): Promise<AdhanPlayResult> {
  lastUrl = url;
  lastError = null;
  const nativeOk = await ensurePlaybackSession();
  console.info("[AdhanAudioService] play", { url, nativeSession: nativeOk });
  const result = await playAdhanUrlAsync(url, opts?.volume ?? 1, {
    maxMs: opts?.maxMs ?? null,
    fadeIn: opts?.fadeIn,
  });
  if (!result.ok) {
    lastError = `${result.code}: ${result.message}`;
    console.warn("[AdhanAudioService] play failed:", lastError);
  }
  return result;
}

/** تشغيل تجربة صوت للمؤذن المختار (مقطع قصير أو كامل محدود). */
export async function testAdhanSound(
  muezzinId: string,
  mode: AdhanPlaybackMode = "full",
): Promise<AdhanPlayResult> {
  lastMuezzinId = muezzinId;
  const muezzin = getMuezzin(muezzinId);
  if (!muezzin.audioAvailable || !muezzin.audioUrl) {
    const message = "ملف صوت هذا التسجيل غير متاح في الحزمة.";
    lastError = message;
    console.warn("[AdhanAudioService] missing asset", muezzinId);
    return { ok: false, code: "missing_file", message };
  }
  const clip = resolveAdhanClip(muezzin, { isFajr: false, mode });
  if (!clip?.url) {
    const message = "تعذّر تحديد مقطع الصوت لهذا التسجيل.";
    lastError = message;
    return { ok: false, code: "missing_file", message };
  }
  // تجربة ≤ 20ث حتى لا تُطيل الجلسة
  const maxMs = mode === "full" ? 20_000 : clip.maxMs ?? 15_000;
  return playAdhanFull(clip.url, { volume: 0.9, maxMs, fadeIn: true });
}

export function stopAdhanAudio(): void {
  stopPlayback();
  stopCatalogAdhan();
}

/** مرادف لواجهة الإعدادات — إيقاف كل مسارات التشغيل. */
export function stopAdhan(): void {
  stopAdhanAudio();
}

export function getAdhanAudioDebugSnapshot(): AdhanAudioDebugSnapshot {
  return {
    playing: isAdhanPlaying(),
    lastUrl,
    lastError,
    nativeSession: isNative,
    selectedMuezzinId: lastMuezzinId,
  };
}

/** يتحقق من وجود مسار نسبي تحت public (ويب/Capacitor web assets). */
export async function probeAdhanAssetExists(path: string): Promise<boolean> {
  if (!path) return false;
  try {
    const res = await fetch(path, { method: "HEAD", cache: "no-store" });
    if (res.ok) return true;
    const get = await fetch(path, {
      method: "GET",
      headers: { Range: "bytes=0-1" },
      cache: "no-store",
    });
    return get.ok || get.status === 206;
  } catch (e) {
    console.warn("[AdhanAudioService] asset probe failed", path, e);
    return false;
  }
}

function resolveFullPathForStyle(style: AdhanStyleId): string | null {
  if (style === "silent") return null;
  if (style === "takbeerat") return "/sounds/adhan/takbeerat-short.mp3";
  if (style === "makkah" || style === "madinah" || style === "aqsa" || style === "egypt") {
    return ADHAN_FULL_AUDIO_PATHS[style];
  }
  // turkey/kuwait: لا ملفات كاملة في الحزمة — نعتمد كتالوج CDN عبر testAdhanSound
  return null;
}

/** تشغيل الأذان الكامل لنمط معيّن داخل التطبيق. */
export async function playFullAdhan(style: AdhanStyleId): Promise<AdhanPlayResult> {
  if (style === "silent") {
    return { ok: false, code: "missing_file", message: "silent style — no audio" };
  }
  const path = resolveFullPathForStyle(style);
  if (path) {
    const exists = await probeAdhanAssetExists(path);
    if (exists) {
      return playAdhanFull(path, { volume: 1, fadeIn: true });
    }
  }
  return testAdhanSound(style === "takbeerat" ? "makkah" : style, "full");
}

export async function testFullAdhan(style: AdhanStyleId): Promise<AdhanPlayResult> {
  console.info("[AdhanAudioService] testFullAdhan", style);
  return playFullAdhan(style);
}
