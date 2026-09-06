/**
 * صيغ تشغيل الأذان: قصير (≤28ث) / تكبير فقط / صامت مع إشعار.
 * الأذان الكامل محذوف نهائيًا من المنتج — أي "full" قادم يُرحَّل إلى short.
 */

export const ADHAN_SHORT_MAX_SEC = 28;
export const ADHAN_TAKBIR_MAX_SEC = 12;

/** أوضاع قابلة للاختيار — بلا full */
export type AdhanPlaybackMode = "short" | "takbir" | "silent";

/** قبول ترحيلي لقيم قديمة مخزّنة */
export type LegacyAdhanPlaybackMode = AdhanPlaybackMode | "full";

export const ADHAN_PLAYBACK_MODES: readonly AdhanPlaybackMode[] = [
  "short",
  "takbir",
  "silent",
] as const;

export const ADHAN_PLAYBACK_MODE_LABELS: Record<AdhanPlaybackMode, string> = {
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

/** يرحّل full → short؛ لا يعيد true لـ "full". */
export function isAdhanPlaybackMode(v: unknown): v is AdhanPlaybackMode {
  return v === "short" || v === "takbir" || v === "silent";
}

/** ترحيل أي قيمة مخزّنة (بما فيها full) إلى وضع معتمد. */
export function normalizeAdhanPlaybackMode(v: unknown): AdhanPlaybackMode {
  if (v === "full") return "short";
  if (isAdhanPlaybackMode(v)) return v;
  return "short";
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
 * full (قديم) → يُعامل كـ short.
 * short/takbir بلا ملف مخصّص → المصدر مع قصّ زمني.
 */
export function resolveAdhanClip(
  sources: AdhanClipSources,
  opts: { isFajr: boolean; mode: LegacyAdhanPlaybackMode },
): ResolvedAdhanClip | null {
  const mode = normalizeAdhanPlaybackMode(opts.mode);
  if (mode === "silent") return null;

  if (opts.isFajr) {
    if (!sources.fajrUrl) return null;
  }

  const baseFull = opts.isFajr ? sources.fajrUrl! : sources.audioUrl;
  if (!baseFull) return null;

  if (mode === "short") {
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

/**
 * مقطع الإقامة: ملف مستقل إن وُجد، وإلا التكبيرات كتنبيه إقامة قصير.
 */
export function resolveIqamahClip(sources: AdhanClipSources): ResolvedAdhanClip | null {
  const url = sources.iqamahUrl || sources.takbirUrl;
  if (!url) return null;
  return {
    kind: "iqamah",
    url,
    maxMs: sources.iqamahUrl ? null : ADHAN_TAKBIR_MAX_SEC * 1000,
    truncatedFromFull: !sources.iqamahUrl,
  };
}
