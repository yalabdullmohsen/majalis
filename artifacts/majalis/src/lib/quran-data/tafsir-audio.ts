/**
 * التفسير الصوتي — بث عبر AudioEngine (نفس طبقة التلاوة)، مع ناقل حصري.
 * لا يُنسب مقطع لعالم ما لم يكن attributionVerified=true في الكتالوج.
 */
import { claimAudio, releaseAudio, registerAudioStopper } from "@/lib/exclusive-audio-bus";
import {
  isTafsirClipDisabled,
  refreshTafsirAudioRemoteConfig,
} from "@/lib/tafsir-audio-remote-config";
import { showMiniPlayer, hideMiniPlayer } from "@/lib/quran-mini-player";
import { VALID_PLAYBACK_RATES, normalizePlaybackRate } from "@/lib/quran-audio";

export type TafsirAudioClip = {
  id: string;
  scholarId: string;
  scholarLabelAr: string;
  /** اسم التفسير المعروض */
  tafsir_name?: string;
  /** لا تُعرض النسبة إن false */
  attributionVerified: boolean;
  titleAr: string;
  /** نطاق العرض: سورة / آيات / جزء — وصفي للكتالوج */
  scope?: "surah" | "ayah-range" | "juz";
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  streamUrl: string;
  /** مرادف صريح لـ streamUrl في مخطط الكتالوج */
  url?: string;
  duration?: number;
  size?: number;
  sourceId: string;
  license: string;
  licenseUrl?: string;
  /** مرجع صف في LICENSE_RISKS.md */
  license_ref?: string;
  bytesEstimate?: number;
  enabled: boolean;
};

type CatalogPayload = {
  version: number;
  clips: TafsirAudioClip[];
};

const RESUME_KEY = "majalis-tafsir-audio-resume-v1";
const RATE_KEY = "mj-tafsir-playback-rate-v1";
const MAP_URL = "/data/tafsir-audio-map.json";
const MAX_DOWNLOAD_BYTES = 80 * 1024 * 1024; // 80 MB سقف تنزيل اختياري

type TafsirAudioMapSegment = {
  ayah: number;
  startSec: number;
};

type TafsirAudioMapEntry = {
  clipId: string;
  surah: number;
  segments: TafsirAudioMapSegment[];
};

type TafsirAudioMapPayload = {
  version: number;
  maps: TafsirAudioMapEntry[];
};

let catalogCache: TafsirAudioClip[] | null = null;
let mapCache: TafsirAudioMapEntry[] | null = null;
let mapPromise: Promise<TafsirAudioMapEntry[]> | null = null;
let busRegistered = false;

function ensureBusStopper(): void {
  if (busRegistered || typeof window === "undefined") return;
  busRegistered = true;
  registerAudioStopper("tafsir", async () => {
    try {
      const { getAudioEngine } = await import("@/core/audio/AudioEngine");
      getAudioEngine().stop();
    } catch {
      /* ignore */
    }
    hideMiniPlayer();
    releaseAudio("tafsir");
  });
}

export async function loadTafsirAudioMap(): Promise<TafsirAudioMapEntry[]> {
  if (mapCache) return mapCache;
  if (mapPromise) return mapPromise;
  mapPromise = (async () => {
    try {
      const res = await fetch(MAP_URL, { credentials: "omit" });
      if (!res.ok) {
        mapCache = [];
        return mapCache;
      }
      const json = (await res.json()) as TafsirAudioMapPayload;
      mapCache = Array.isArray(json.maps) ? json.maps : [];
      return mapCache;
    } catch {
      mapCache = [];
      return mapCache;
    }
  })();
  return mapPromise;
}

/** موضع البداية (ثوانٍ) لآية داخل مقطع تفسير صوتي — null إن لم تُعرَّف. */
export async function getTafsirAyahStartSec(
  clipId: string,
  surah: number,
  ayah: number,
): Promise<number | null> {
  const maps = await loadTafsirAudioMap();
  const entry = maps.find((m) => m.clipId === clipId && m.surah === surah);
  if (!entry) return null;
  const seg = entry.segments.find((s) => s.ayah === ayah);
  return seg ? seg.startSec : null;
}

/** يُظهر واجهة التفسير الصوتي فقط عند وجود مقاطع مرخّصة في الكتالوج. */
export function hasLicensedTafsirAudioCatalog(clips: TafsirAudioClip[]): boolean {
  return clips.some(
    (c) =>
      c.enabled &&
      c.streamUrl &&
      c.attributionVerified &&
      !isTafsirClipDisabled(c.id, c.scholarId, c.sourceId),
  );
}

export async function isTafsirAudioUiEnabled(): Promise<boolean> {
  const clips = await loadTafsirAudioCatalog();
  return hasLicensedTafsirAudioCatalog(clips);
}

export async function loadTafsirAudioCatalog(): Promise<TafsirAudioClip[]> {
  if (catalogCache) return catalogCache;
  await refreshTafsirAudioRemoteConfig();
  try {
    const res = await fetch("/data/tafsir-audio-catalog.json", { credentials: "omit" });
    if (!res.ok) {
      catalogCache = [];
      return catalogCache;
    }
    const json = (await res.json()) as CatalogPayload;
    catalogCache = (Array.isArray(json.clips) ? json.clips : []).map((c) => ({
      ...c,
      streamUrl: c.streamUrl || c.url || "",
      bytesEstimate: c.bytesEstimate ?? c.size,
      scholarLabelAr: c.scholarLabelAr || (c as { scholar?: string }).scholar || "",
      titleAr: c.titleAr || c.tafsir_name || "تفسير صوتي",
    }));
  } catch {
    catalogCache = [];
  }
  return catalogCache;
}

export function findTafsirAudioForAyah(
  clips: TafsirAudioClip[],
  surah: number,
  ayah: number,
): TafsirAudioClip | null {
  for (const c of clips) {
    if (!c.enabled || !c.streamUrl) continue;
    if (isTafsirClipDisabled(c.id, c.scholarId, c.sourceId)) continue;
    if (c.surah !== surah) continue;
    if (ayah < c.ayahFrom || ayah > c.ayahTo) continue;
    return c;
  }
  return null;
}

/** أول مقطع مفعّل يغطي أي جزء من السورة. */
export function findTafsirAudioForSurah(
  clips: TafsirAudioClip[],
  surah: number,
): TafsirAudioClip | null {
  for (const c of clips) {
    if (!c.enabled || !c.streamUrl) continue;
    if (isTafsirClipDisabled(c.id, c.scholarId, c.sourceId)) continue;
    if (c.surah !== surah) continue;
    return c;
  }
  return null;
}

export function displayScholarLabel(clip: TafsirAudioClip): string {
  return clip.attributionVerified ? clip.scholarLabelAr : "تسجيل تفسير (نسبة غير موثّقة)";
}

export function readTafsirPlaybackRate(): number {
  if (typeof localStorage === "undefined") return 1;
  try {
    return normalizePlaybackRate(Number(localStorage.getItem(RATE_KEY) || 1));
  } catch {
    return 1;
  }
}

export function persistTafsirPlaybackRate(rate: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RATE_KEY, String(normalizePlaybackRate(rate)));
  } catch {
    /* ignore */
  }
}

export type TafsirResume = {
  clipId: string;
  currentTime: number;
  surah: number;
  ayah: number;
};

export function readTafsirResume(): TafsirResume | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TafsirResume;
  } catch {
    return null;
  }
}

export function writeTafsirResume(row: TafsirResume): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
}

export function clearTafsirResume(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(RESUME_KEY);
  } catch {
    /* ignore */
  }
}

export function getTafsirDownloadCapBytes(): number {
  return MAX_DOWNLOAD_BYTES;
}

export const TAFSIR_AUDIO_RATES = VALID_PLAYBACK_RATES;

/** تشغيل مقطع تفسير — يوقف التلاوة/الأذان عبر الناقل الحصري. */
export async function playTafsirAudioClip(
  clip: TafsirAudioClip,
  opts?: { ayah?: number; resume?: boolean },
): Promise<{ ok: boolean; reason?: string }> {
  ensureBusStopper();
  if (!clip.enabled || !clip.streamUrl) {
    return { ok: false, reason: "المقطع غير مفعّل" };
  }
  if (isTafsirClipDisabled(clip.id, clip.scholarId, clip.sourceId)) {
    return { ok: false, reason: "المقطع معطّل مركزياً" };
  }

  await claimAudio("tafsir");
  const { getAudioEngine } = await import("@/core/audio/AudioEngine");
  const engine = getAudioEngine();
  const rate = readTafsirPlaybackRate();
  await engine.setPlaybackRate(rate);

  let startAt = 0;
  if (opts?.resume) {
    const r = readTafsirResume();
    if (r?.clipId === clip.id) startAt = r.currentTime;
  } else if (typeof opts?.ayah === "number") {
    const ayahStart = await getTafsirAyahStartSec(clip.id, clip.surah, opts.ayah);
    if (ayahStart != null) startAt = ayahStart;
  }

  let playUrl = clip.streamUrl || clip.url || "";
  try {
    const { getOfflineTafsirObjectUrl } = await import("@/lib/quran-data/tafsir-audio-offline");
    const offline = await getOfflineTafsirObjectUrl(clip.id);
    if (offline) playUrl = offline;
  } catch {
    /* بث حي */
  }

  await engine.playUrl(playUrl);
  if (startAt > 0) {
    try {
      engine.seek(startAt);
    } catch {
      /* ignore */
    }
  }

  // Now Playing / مركز التحكم (iOS عبر Media Session داخل WKWebView)
  try {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: clip.titleAr || clip.tafsir_name || "تفسير صوتي",
        artist: displayScholarLabel(clip),
        album: "مجالس العلم — تفسير صوتي",
      });
      navigator.mediaSession.playbackState = "playing";
      const seek = (d: number) => {
        try {
          const snap = engine.getSnapshot?.();
          const t = typeof snap?.currentTime === "number" ? snap.currentTime : 0;
          engine.seek(Math.max(0, t + d));
        } catch {
          /* ignore */
        }
      };
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          void engine.playUrl(playUrl);
        });
        navigator.mediaSession.setActionHandler("pause", () => engine.pause());
        navigator.mediaSession.setActionHandler("stop", () => {
          void stopTafsirAudio();
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => seek(-15));
        navigator.mediaSession.setActionHandler("seekforward", () => seek(15));
      } catch {
        /* منصة بلا دعم لبعض الإجراءات */
      }
    }
  } catch {
    /* ignore */
  }

  showMiniPlayer();
  writeTafsirResume({
    clipId: clip.id,
    currentTime: startAt,
    surah: clip.surah,
    ayah: opts?.ayah ?? clip.ayahFrom,
  });
  return { ok: true };
}

export async function stopTafsirAudio(): Promise<void> {
  try {
    const { getAudioEngine } = await import("@/core/audio/AudioEngine");
    const engine = getAudioEngine();
    const snap = engine.getSnapshot?.();
    if (snap && typeof snap.currentTime === "number") {
      const r = readTafsirResume();
      if (r) writeTafsirResume({ ...r, currentTime: snap.currentTime });
    }
    engine.stop();
  } catch {
    /* ignore */
  }
  hideMiniPlayer();
  releaseAudio("tafsir");
}

/** للاختبارات */
export function __resetTafsirAudioCatalogForTests(): void {
  catalogCache = null;
  mapCache = null;
  mapPromise = null;
}
