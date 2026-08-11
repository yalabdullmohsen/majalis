/**
 * صيغ تشغيل الأذان: كامل / قصير (≤28ث) / تكبير فقط / صامت مع إشعار.
 * الإقامة اختيارية كمقطع ثالث منفصل.
 */

export const ADHAN_SHORT_MAX_SEC = 28;
export const ADHAN_TAKBIR_MAX_SEC = 12;

export type AdhanPlaybackMode = "full" | "short" | "takbir" | "silent";

export const ADHAN_PLAYBACK_MODES: readonly AdhanPlaybackMode[] = [
  "full",
  "short",
  "takbir",
  "silent",
] as const;

export const ADHAN_PLAYBACK_MODE_LABELS: Record<AdhanPlaybackMode, string> = {
  full: "أذان كامل",
  short: "قصير (≤ ٢٨ ثانية)",
  takbir: "تكبيرات فقط",
  silent: "إشعار نصي صامت",
};

export type AdhanClipKind = "full" | "short" | "takbir" | "iqamah" | "fajr";

export type ResolvedAdhanClip = {
  kind: AdhanClipKind;
  url: string;
  /** حد أقصى للتشغيل بالملّي ثانية — null = حتى نهاية الملف */
  maxMs: number | null;
  /** هل الملف مخصّص لهذه الصيغة أم اقتُطع من الكامل مؤقتًا */
  truncatedFromFull: boolean;
};

export function isAdhanPlaybackMode(v: unknown): v is AdhanPlaybackMode {
  return (
    v === "full" || v === "short" || v === "takbir" || v === "silent"
  );
}

export type AdhanClipSources = {
  audioUrl: string;
  fajrUrl?: string;
  shortUrl?: string;
  takbirUrl?: string;
  iqamahUrl?: string;
};

/**
 * يختار رابط التشغيل وحدّ المدة حسب الصيغة.
 * silent → null (إشعار فقط بلا صوت).
 * short/takbir بلا ملف مخصّص → الكامل مع قصّ زمني (إلى أن تتوفّر مقاطع قصيرة مرخّصة).
 */
export function resolveAdhanClip(
  sources: AdhanClipSources,
  opts: { isFajr: boolean; mode: AdhanPlaybackMode },
): ResolvedAdhanClip | null {
  if (opts.mode === "silent") return null;

  if (opts.isFajr) {
    if (!sources.fajrUrl) return null;
  }

  const baseFull = opts.isFajr ? sources.fajrUrl! : sources.audioUrl;
  if (!baseFull) return null;

  if (opts.mode === "full") {
    return {
      kind: opts.isFajr ? "fajr" : "full",
      url: baseFull,
      maxMs: null,
      truncatedFromFull: false,
    };
  }

  if (opts.mode === "short") {
    if (sources.shortUrl) {
      return {
        kind: "short",
        url: sources.shortUrl,
        maxMs: ADHAN_SHORT_MAX_SEC * 1000,
        truncatedFromFull: false,
      };
    }
    return {
      kind: "short",
      url: baseFull,
      maxMs: ADHAN_SHORT_MAX_SEC * 1000,
      truncatedFromFull: true,
    };
  }

  // takbir
  if (sources.takbirUrl) {
    return {
      kind: "takbir",
      url: sources.takbirUrl,
      maxMs: ADHAN_TAKBIR_MAX_SEC * 1000,
      truncatedFromFull: false,
    };
  }
  return {
    kind: "takbir",
    url: baseFull,
    maxMs: ADHAN_TAKBIR_MAX_SEC * 1000,
    truncatedFromFull: true,
  };
}

export function resolveIqamahClip(sources: AdhanClipSources): ResolvedAdhanClip | null {
  if (!sources.iqamahUrl) return null;
  return {
    kind: "iqamah",
    url: sources.iqamahUrl,
    maxMs: null,
    truncatedFromFull: false,
  };
}
