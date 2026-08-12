/**
 * حفظ آخر نطاق تكرار (وضع الحفظ) لاستئنافه من المشغّل المصغّر.
 */
import type { AyahLoopConfig } from "@/lib/ayah-loop-controller";

export const HIFZ_PREFS_LS_KEY = "majalis-quran-loop-v1";

export type HifzPrefs = {
  surah: number;
  startAyah: number;
  endAyah: number;
  /** 1–20، أو 0 = لا نهائي */
  repeatCount: number;
  delayMs: number;
  playbackRate: number;
  updatedAt: number;
};

const RATES = [0.75, 1, 1.25] as const;

function isRate(n: unknown): n is number {
  return typeof n === "number" && RATES.some((r) => Math.abs(r - n) < 0.01);
}

export function loadHifzPrefs(): HifzPrefs | null {
  try {
    const raw = localStorage.getItem(HIFZ_PREFS_LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<HifzPrefs>;
    if (
      typeof p.surah !== "number" ||
      typeof p.startAyah !== "number" ||
      typeof p.endAyah !== "number"
    ) {
      return null;
    }
    const repeat =
      p.repeatCount === 0 || p.repeatCount === Number.POSITIVE_INFINITY
        ? 0
        : Math.max(1, Math.min(20, Math.floor(Number(p.repeatCount) || 1)));
    return {
      surah: Math.max(1, Math.min(114, Math.floor(p.surah))),
      startAyah: Math.max(1, Math.floor(p.startAyah)),
      endAyah: Math.max(1, Math.floor(p.endAyah)),
      repeatCount: repeat,
      delayMs: Math.max(0, Math.min(30_000, Math.floor(Number(p.delayMs) || 0))),
      playbackRate: isRate(p.playbackRate) ? p.playbackRate : 1,
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveHifzPrefs(prefs: Omit<HifzPrefs, "updatedAt"> & { updatedAt?: number }): void {
  try {
    const payload: HifzPrefs = {
      ...prefs,
      repeatCount:
        prefs.repeatCount === 0 || !Number.isFinite(prefs.repeatCount)
          ? 0
          : Math.max(1, Math.min(20, Math.floor(prefs.repeatCount))),
      updatedAt: prefs.updatedAt ?? Date.now(),
    };
    localStorage.setItem(HIFZ_PREFS_LS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** تحويل تفضيلات الحفظ إلى إعداد حلقة للمشغّل (Infinity داخلياً). */
export function hifzPrefsToLoopConfig(prefs: HifzPrefs): AyahLoopConfig {
  return {
    startAyah: prefs.startAyah,
    endAyah: Math.max(prefs.startAyah, prefs.endAyah),
    repeatCount: prefs.repeatCount === 0 ? Number.POSITIVE_INFINITY : prefs.repeatCount,
    delayMs: prefs.delayMs,
  };
}

export const HIFZ_PLAYBACK_RATES = RATES;
