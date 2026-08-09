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
  /** لا تُعرض النسبة إن false */
  attributionVerified: boolean;
  titleAr: string;
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  streamUrl: string;
  sourceId: string;
  license: string;
  licenseUrl?: string;
  bytesEstimate?: number;
  enabled: boolean;
};

type CatalogPayload = {
  version: number;
  clips: TafsirAudioClip[];
};

const RESUME_KEY = "majalis-tafsir-audio-resume-v1";
const RATE_KEY = "mj-tafsir-playback-rate-v1";
const MAX_DOWNLOAD_BYTES = 80 * 1024 * 1024; // 80 MB سقف تنزيل اختياري

let catalogCache: TafsirAudioClip[] | null = null;
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
    catalogCache = Array.isArray(json.clips) ? json.clips : [];
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
  }

  await engine.playUrl(clip.streamUrl);
  if (startAt > 0) {
    try {
      engine.seek(startAt);
    } catch {
      /* ignore */
    }
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
}
