/**
 * MajlisOfflineAudio — تخزين تلاوات iOS في Application Support (مُستثنى من iCloud).
 * على الويب/أندرويد: fallback إلى IndexedDB في quran-audio-downloads.ts.
 */
import { isIOS, isNative } from "@/lib/capacitor-utils";

export type NativeOfflineSurahEntry = { surah: number; bytes: number };

type MajlisOfflineAudioPlugin = {
  writeSurah: (opts: {
    reciterId: string;
    surah: number;
    dataBase64: string;
  }) => Promise<{ ok: boolean; path?: string; bytes?: number }>;
  deleteSurah: (opts: { reciterId: string; surah: number }) => Promise<{ ok: boolean }>;
  deleteReciter: (opts: { reciterId: string }) => Promise<{ ok: boolean }>;
  listReciterSurahs: (opts: { reciterId: string }) => Promise<{ surahs: NativeOfflineSurahEntry[] }>;
  getSurahPlaybackUrl: (opts: {
    reciterId: string;
    surah: number;
  }) => Promise<{ url: string | null; path?: string }>;
  getStorageUsage: () => Promise<{ bytes: number; rootPath?: string }>;
};

let pluginPromise: Promise<MajlisOfflineAudioPlugin | null> | null = null;

export async function getNativeOfflineAudioPlugin(): Promise<MajlisOfflineAudioPlugin | null> {
  if (!isNative || !isIOS) return null;
  if (!pluginPromise) {
    pluginPromise = (async () => {
      const { registerPlugin } = await import("@capacitor/core");
      return registerPlugin<MajlisOfflineAudioPlugin>("MajlisOfflineAudio");
    })().catch((err: unknown) => {
      console.warn("[native-offline-audio] plugin unavailable:", err);
      pluginPromise = null;
      return null;
    });
  }
  return pluginPromise;
}

/** يحوّل مسار sandbox إلى URL قابل للتشغيل في WKWebView. */
export async function nativeOfflinePlaybackUrl(fileUrl: string): Promise<string> {
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.convertFileSrc(fileUrl.replace(/^file:\/\//, ""));
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const idx = raw.indexOf(",");
      resolve(idx >= 0 ? raw.slice(idx + 1) : raw);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
