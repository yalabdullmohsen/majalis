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
  stopAdhan,
  isAdhanPlaying,
  type AdhanPlayResult,
} from "@/lib/adhan-playback";
import { getMuezzin } from "@/lib/adhan-audio";
import { resolveAdhanClip, type AdhanPlaybackMode } from "@/lib/adhan-playback-modes";
import { isNative } from "@/lib/capacitor-utils";

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
  stopAdhan();
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
    // بعض الخوادم ترفض HEAD — جرّب GET جزئي
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
