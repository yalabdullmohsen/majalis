/**
 * AdhanAudioService — طبقة تشغيل مركزية للأذان داخل التطبيق.
 *
 * APIs مطلوبة:
 * - playAdhanPreview / stopAdhanPreview
 * - preloadAdhanSounds / validateAudioAssets / getAudioDiagnostics
 *
 * AVAudioSession (.playback) على iOS قبل التشغيل.
 * لا Critical Alerts — لا تجاوز للصامت/Focus لإشعارات النظام.
 */
import {
  playAdhanUrlAsync,
  stopAdhan as stopPlayback,
  isAdhanPlaying,
  type AdhanPlayResult,
} from "@/lib/adhan-playback";
import { getMuezzin, stopAdhan as stopCatalogAdhan } from "@/lib/adhan-audio";
import {
  getOfflineAdhanPack,
  listBundledAdhanSoundPaths,
  OFFLINE_ADHAN_CORE_PACKS,
} from "@/lib/adhan-offline-assets";
import { resolveAdhanClip, type AdhanPlaybackMode } from "@/lib/adhan-playback-modes";
import { isIOS, isNative } from "@/lib/capacitor-utils";
import { getNativeAudioMode } from "@/lib/native-playback-audio";

export const CRITICAL_ALERTS_ENTITLEMENT_PRESENT = false;

export const ADHAN_FULL_AUDIO_PATHS = {
  makkah: "/audio/adhan/adhan-makkah-full.m4a",
  madinah: "/audio/adhan/adhan-madinah-full.m4a",
  aqsa: "/audio/adhan/adhan-aqsa-full.mp3",
  egypt: "/audio/adhan/adhan-egypt-full.m4a",
  alharam: "/audio/adhan/adhan-haram-full.m4a",
  fajrMakkah: "/audio/adhan/adhan-makkah-fajr.mp3",
  soft: "/audio/adhan/adhan-soft-alert.m4a",
  takbeerat: "/audio/adhan/adhan-takbeerat-short.mp3",
} as const;

export type AdhanStyleId =
  | "makkah"
  | "madinah"
  | "aqsa"
  | "egypt"
  | "turkey"
  | "kuwait"
  | "alharam"
  | "takbeerat"
  | "soft"
  | "custom"
  | "silent";

export type AdhanCatalogEntry = {
  id: string;
  nameAr: string;
  fileFull: string | null;
  fileShort: string | null;
  fileTakbeer: string | null;
  fallback?: string;
  notificationOnlyAllowed?: boolean;
  default?: boolean;
};

/** كتالوج موحّد لأنواع الأذان في الإعدادات */
export const adhanCatalog: AdhanCatalogEntry[] = [
  ...OFFLINE_ADHAN_CORE_PACKS.map((p) => ({
    id: p.id,
    nameAr: p.labelAr,
    fileFull: p.local.general ?? null,
    fileShort: p.local.short ?? null,
    fileTakbeer: p.local.takbir ?? null,
    fallback: p.id === "makkah" ? undefined : "makkah",
    notificationOnlyAllowed: p.id === "soft",
    default: p.id === "makkah",
  })),
  {
    id: "custom",
    nameAr: "أذان مخصص",
    fileFull: null,
    fileShort: null,
    fileTakbeer: null,
    fallback: "makkah",
  },
];

export type AdhanAssetProbe = {
  soundId: string;
  filePath: string;
  exists: boolean;
  durationSec: number | null;
  playable: boolean;
};

export type AdhanAudioDiagnostics = {
  platform: "ios" | "android" | "web";
  nativeSessionMode: string;
  criticalAlertsEntitlement: boolean;
  playing: boolean;
  lastUrl: string | null;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  selectedMuezzinId: string | null;
  lastPlaybackMode: AdhanPlaybackMode | null;
  assets: AdhanAssetProbe[];
  silentModeNote: string;
  attemptLog: string[];
};

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
let lastPlaybackMode: AdhanPlaybackMode | null = null;
let lastSuccessAt: string | null = null;
let lastFailureAt: string | null = null;
const attemptLog: string[] = [];
let assetCache: AdhanAssetProbe[] | null = null;

function pushAttempt(msg: string) {
  attemptLog.unshift(`${new Date().toISOString()} — ${msg}`);
  if (attemptLog.length > 40) attemptLog.length = 40;
}

function syncAdhanMediaSessionPlaying(): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    const muezzin = lastMuezzinId ? getMuezzin(lastMuezzinId) : null;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "الأذان",
      artist: muezzin?.name ?? "المجلس العلمي",
      album: "Majlis — Adhan",
    });
    navigator.mediaSession.playbackState = "playing";

    // غالبًا iOS لا يضمن pause لنغمة الأذان داخل WKWebView، فنستخدم stop كإجراء واحد.
    navigator.mediaSession.setActionHandler("pause", () => stopAdhanPreview());
    navigator.mediaSession.setActionHandler("stop", () => stopAdhanPreview());
  } catch {
    /* ignore */
  }
}

function clearAdhanMediaSession(): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = "none";
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler("pause", null);
    navigator.mediaSession.setActionHandler("stop", null);
  } catch {
    /* ignore */
  }
}

async function ensurePlaybackSession(): Promise<{ ok: boolean; message?: string }> {
  if (!isNative) return { ok: true };
  try {
    const { ensureNativePlaybackAudioSession } = await import("@/lib/native-playback-audio");
    await ensureNativePlaybackAudioSession({
      title: "الأذان",
      artist: "المجلس العلمي",
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const ar =
      msg.includes("recording")
        ? "جلسة الصوت مشغولة بالتسجيل — أوقف التلاوة/الكلام ثم أعد المحاولة."
        : `فشل تفعيل جلسة الصوت: ${msg}`;
    console.warn("[AdhanAudioService] AVAudioSession failed:", msg);
    lastError = ar;
    lastFailureAt = new Date().toISOString();
    pushAttempt(ar);
    return { ok: false, message: ar };
  }
}

async function claimExclusiveBus(): Promise<void> {
  try {
    const { claimAudio } = await import("@/lib/exclusive-audio-bus");
    claimAudio("adhan");
  } catch (e) {
    console.warn("[AdhanAudioService] exclusive bus", e);
  }
}

export async function playAdhanFull(
  url: string,
  opts?: { volume?: number; maxMs?: number | null; fadeIn?: boolean; requireSession?: boolean },
): Promise<AdhanPlayResult> {
  lastUrl = url;
  lastError = null;
  await claimExclusiveBus();
  const session = await ensurePlaybackSession();
  if (!session.ok && opts?.requireSession !== false && isNative && isIOS) {
    return {
      ok: false,
      code: "unknown",
      message: session.message || "فشل تفعيل جلسة الصوت",
    };
  }
  pushAttempt(`play ${url}`);
  syncAdhanMediaSessionPlaying();
  const vol = Math.min(1, Math.max(0, opts?.volume ?? 1));
  if (vol <= 0) {
    const message = "مستوى الصوت في الإعدادات صفر — ارفع شريط الصوت ثم أعد التجربة.";
    lastError = message;
    lastFailureAt = new Date().toISOString();
    pushAttempt(message);
    return { ok: false, code: "unknown", message };
  }
  const result = await playAdhanUrlAsync(url, vol, {
    maxMs: opts?.maxMs ?? null,
    fadeIn: opts?.fadeIn,
  });
  if (!result.ok) {
    lastError = `${result.code}: ${result.message}`;
    lastFailureAt = new Date().toISOString();
    pushAttempt(lastError);
    console.warn("[AdhanAudioService] play failed:", lastError);
  } else {
    lastSuccessAt = new Date().toISOString();
    pushAttempt(`ok ${url}`);
  }
  return result;
}

const FALLBACK_CHAIN = [
  "/audio/adhan/adhan-makkah-full.m4a",
  "/audio/adhan/adhan-takbeerat-short.mp3",
  "/audio/adhan/adhan-soft-alert.m4a",
] as const;

async function playWithFallback(
  primary: string,
  opts: { volume: number; maxMs: number | null; fadeIn: boolean },
): Promise<AdhanPlayResult> {
  const chain = [primary, ...FALLBACK_CHAIN.filter((p) => p !== primary)];
  let last: AdhanPlayResult = {
    ok: false,
    code: "missing_file",
    message: "ملف الصوت غير موجود",
  };
  for (const url of chain) {
    const exists = await probeAdhanAssetExists(url);
    pushAttempt(`try ${url} exists=${exists}`);
    if (!exists && url.startsWith("/")) continue;
    last = await playAdhanFull(url, opts);
    if (last.ok) return last;
  }
  return last;
}

/** تجربة صوت للمؤذن/النوع مع صيغة التشغيل */
export async function playAdhanPreview(
  adhanId: string,
  playbackMode: AdhanPlaybackMode = "full",
  volume = 0.9,
): Promise<AdhanPlayResult> {
  lastMuezzinId = adhanId;
  lastPlaybackMode = playbackMode;

  if (playbackMode === "silent") {
    const message = "صيغة التشغيل «إشعار نصي صامت» — لا يُشغَّل صوت داخل التطبيق.";
    lastError = message;
    pushAttempt(message);
    return { ok: false, code: "missing_file", message };
  }

  stopAdhanPreview();

  const resolvedId = adhanId === "custom" ? "makkah" : adhanId;
  const muezzin = getMuezzin(resolvedId);
  const pack = getOfflineAdhanPack(resolvedId);
  const sources = {
    audioUrl: muezzin.audioUrl || pack?.local.general || "",
    fajrUrl: muezzin.fajrUrl || pack?.local.fajr,
    shortUrl: muezzin.shortUrl || pack?.local.short,
    takbirUrl: muezzin.takbirUrl || pack?.local.takbir,
  };

  if (!sources.audioUrl && !sources.shortUrl && !sources.takbirUrl) {
    const message = "ملف صوت هذا التسجيل غير متاح في الحزمة.";
    lastError = message;
    lastFailureAt = new Date().toISOString();
    pushAttempt(message);
    return { ok: false, code: "missing_file", message };
  }

  const clip = resolveAdhanClip(sources, { isFajr: false, mode: playbackMode });
  if (!clip?.url) {
    const message = "تعذّر تحديد مقطع الصوت لهذا التسجيل.";
    lastError = message;
    return { ok: false, code: "missing_file", message };
  }

  const maxMs =
    playbackMode === "full"
      ? null
      : clip.maxMs ?? (playbackMode === "takbir" ? 12_000 : 28_000);

  // بلا سلسلة احتياطي لأنواع أخرى — إن فشل الملف المختار يظهر الخطأ ولا يُشغَّل أذان مختلف.
  const played = await playAdhanFull(clip.url, {
    volume: Math.max(0.35, Math.min(1, volume || 0.9)),
    maxMs,
    fadeIn: false,
  });
  if (!played.ok) {
    return {
      ...played,
      message: "تعذر تشغيل الصوت، جرّب نوعًا آخر.",
    };
  }
  return played;
}

/** توافق الاسم القديم */
export async function testAdhanSound(
  muezzinId: string,
  mode: AdhanPlaybackMode = "full",
): Promise<AdhanPlayResult> {
  return playAdhanPreview(muezzinId, mode, 0.9);
}

export function stopAdhanPreview(): void {
  stopPlayback();
  stopCatalogAdhan();
  pushAttempt("stop");
  clearAdhanMediaSession();
}

export function stopAdhanAudio(): void {
  stopAdhanPreview();
}

export function stopAdhan(): void {
  stopAdhanPreview();
}

export async function preloadAdhanSounds(): Promise<void> {
  try {
    const { installNativePlaybackForegroundResume } = await import("@/lib/native-playback-audio");
    installNativePlaybackForegroundResume();
  } catch (e) {
    console.warn("[AdhanAudioService] foreground resume hook failed", e);
  }
  const paths = listBundledAdhanSoundPaths();
  await Promise.all(
    paths.map(async (path) => {
      try {
        await fetch(path, { method: "GET", headers: { Range: "bytes=0-1" }, cache: "force-cache" });
      } catch (e) {
        console.warn("[AdhanAudioService] preload failed", path, e);
      }
    }),
  );
  assetCache = await validateAudioAssets();
}

export async function probeAdhanAssetExists(path: string): Promise<boolean> {
  if (!path) return false;
  if (/^https?:\/\//i.test(path)) {
    try {
      const res = await fetch(path, { method: "HEAD", cache: "no-store" });
      return res.ok;
    } catch (e) {
      console.warn("[AdhanAudioService] remote probe failed", path, e);
      return false;
    }
  }
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

async function probeDuration(path: string): Promise<number | null> {
  if (typeof Audio === "undefined") return null;
  return new Promise((resolve) => {
    const a = new Audio();
    const done = (v: number | null) => {
      a.removeAttribute("src");
      a.load();
      resolve(v);
    };
    const t = window.setTimeout(() => done(null), 4000);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      window.clearTimeout(t);
      done(Number.isFinite(a.duration) ? a.duration : null);
    };
    a.onerror = () => {
      window.clearTimeout(t);
      done(null);
    };
    a.src = path;
  });
}

export async function validateAudioAssets(): Promise<AdhanAssetProbe[]> {
  const paths = listBundledAdhanSoundPaths();
  const out: AdhanAssetProbe[] = [];
  for (const filePath of paths) {
    const soundId = filePath.split("/").pop() || filePath;
    const exists = await probeAdhanAssetExists(filePath);
    const durationSec = exists ? await probeDuration(filePath) : null;
    out.push({
      soundId,
      filePath,
      exists,
      durationSec,
      playable: exists && (durationSec == null || durationSec > 0.2),
    });
  }
  assetCache = out;
  console.info(
    "[AdhanAudioService] validateAudioAssets",
    out.map((a) => ({ id: a.soundId, exists: a.exists, dur: a.durationSec, playable: a.playable })),
  );
  return out;
}

export function getAudioDiagnostics(): AdhanAudioDiagnostics {
  const platform = isNative ? (isIOS ? "ios" : "android") : "web";
  return {
    platform,
    nativeSessionMode: getNativeAudioMode(),
    criticalAlertsEntitlement: CRITICAL_ALERTS_ENTITLEMENT_PRESENT,
    playing: isAdhanPlaying(),
    lastUrl,
    lastError,
    lastSuccessAt,
    lastFailureAt,
    selectedMuezzinId: lastMuezzinId,
    lastPlaybackMode,
    assets: assetCache ?? [],
    silentModeNote:
      platform === "ios"
        ? "لا يمكن للتطبيق معرفة الوضع الصامت على iOS بشكل موثوق. الإشعارات قد تُكتم؛ التشغيل داخل التطبيق يعتمد على AVAudioSession playback."
        : "تحقق من مستوى صوت الجهاز والتطبيق.",
    attemptLog: [...attemptLog],
  };
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

export type AdhanStyleIdCompat = AdhanStyleId;

function resolveFullPathForStyle(style: AdhanStyleId): string | null {
  if (style === "silent") return null;
  if (style === "takbeerat") return ADHAN_FULL_AUDIO_PATHS.takbeerat;
  if (style === "soft") return ADHAN_FULL_AUDIO_PATHS.soft;
  if (style === "makkah" || style === "madinah" || style === "aqsa" || style === "egypt" || style === "alharam") {
    return ADHAN_FULL_AUDIO_PATHS[style];
  }
  return null;
}

export async function playFullAdhan(style: AdhanStyleId): Promise<AdhanPlayResult> {
  if (style === "silent") {
    return { ok: false, code: "missing_file", message: "silent style — no audio" };
  }
  const path = resolveFullPathForStyle(style);
  if (path) {
    return playWithFallback(path, { volume: 1, maxMs: null, fadeIn: true });
  }
  return playAdhanPreview(style === "custom" ? "makkah" : style, "full", 1);
}

export async function testFullAdhan(style: AdhanStyleId): Promise<AdhanPlayResult> {
  return playFullAdhan(style);
}
