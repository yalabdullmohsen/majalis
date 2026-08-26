/**
 * تصنيف أخطاء تشغيل التلاوة — أوفلاين أولاً ثم الشبكة.
 */
import type { PlaybackSource } from "@/lib/offline-quran-player";

export type PlaybackErrorKind = "offline_file" | "offline_missing" | "network" | "decode" | "unknown";

export function classifyPlaybackNetworkError(
  err: unknown,
  source: PlaybackSource,
  hadOfflineAttempt: boolean,
): { kind: PlaybackErrorKind; message: string } {
  if (source === "offline") {
    return {
      kind: "offline_file",
      message: "تعذّر تشغيل الملف المحلي. أعد تنزيل السورة أو جرّب قارئًا آخر.",
    };
  }

  if (hadOfflineAttempt && typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      kind: "offline_missing",
      message: "لا اتصال بالشبكة — نزّل السورة للاستماع دون اتصال.",
    };
  }

  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  if (
    typeof navigator !== "undefined" &&
    (navigator.onLine === false || lower.includes("failed to fetch") || lower.includes("network"))
  ) {
    return {
      kind: "network",
      message: hadOfflineAttempt
        ? "انقطع الاتصال — نزّل السورة للاستماع دون اتصال."
        : "فشل البث — تحقّق من الاتصال أو نزّل السورة أوفلاين.",
    };
  }

  if (lower.includes("decode") || lower.includes("format") || lower.includes("demuxer")) {
    return {
      kind: "decode",
      message: "تعذّر فك تشغيل الملف الصوتي. جرّب قارئًا آخر أو أعد التنزيل.",
    };
  }

  return {
    kind: "unknown",
    message: hadOfflineAttempt
      ? "فشل تشغيل السورة. تحقّق من الاتصال أو الملفات المحمّلة."
      : "فشل تشغيل السورة — جرّب لاحقًا أو نزّلها للاستماع دون اتصال.",
  };
}
