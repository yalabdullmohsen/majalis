/**
 * بروفيلات السرد — إيقاع ونبرة فقط؛ لا تغيّر المحتوى المعروض.
 */

export type ReadingMode = "standard" | "educational" | "immersive";

export type NarrationContentKind =
  | "prophet_story"
  | "scholar_bio"
  | "hadith_editorial"
  | "quran_metadata"
  | "benefits"
  | "history"
  | "lesson"
  | "aqeedah"
  | "section_description"
  | "general";

export type NarrationProsody = {
  mode: ReadingMode;
  contentKind: NarrationContentKind;
  /** معدل Web Speech / نسبي Neural */
  rate: number;
  /** مضاعف وقف SSML */
  breakScale: number;
  /** فاصل بين مقاطع الجهاز (ms) */
  deviceGapMs: number;
  /** تسمية واجهة قصيرة */
  labelAr: string;
};

const MODE_BASE: Record<ReadingMode, Pick<NarrationProsody, "rate" | "breakScale" | "deviceGapMs" | "labelAr">> = {
  standard: { rate: 0.95, breakScale: 1, deviceGapMs: 280, labelAr: "قراءة عادية" },
  educational: { rate: 0.82, breakScale: 1.45, deviceGapMs: 480, labelAr: "قراءة تعليمية" },
  immersive: { rate: 0.9, breakScale: 1.15, deviceGapMs: 360, labelAr: "قراءة غامرة" },
};

const KIND_TWEAK: Partial<
  Record<NarrationContentKind, Partial<Pick<NarrationProsody, "rate" | "breakScale" | "deviceGapMs">>>
> = {
  quran_metadata: { rate: -0.04, breakScale: 0.15, deviceGapMs: 40 },
  hadith_editorial: { rate: -0.05, breakScale: 0.2, deviceGapMs: 60 },
  scholar_bio: { rate: -0.02, breakScale: 0.1, deviceGapMs: 40 },
  benefits: { rate: -0.03, breakScale: 0.2, deviceGapMs: 80 },
  history: { rate: -0.02, breakScale: 0.1, deviceGapMs: 40 },
  lesson: { rate: -0.04, breakScale: 0.25, deviceGapMs: 80 },
  aqeedah: { rate: -0.05, breakScale: 0.2, deviceGapMs: 60 },
  prophet_story: { rate: 0, breakScale: 0.05, deviceGapMs: 20 },
  section_description: { rate: -0.03, breakScale: 0.15, deviceGapMs: 50 },
  general: {},
};

function clampRate(n: number): number {
  return Math.min(1.35, Math.max(0.7, Math.round(n * 100) / 100));
}

export function resolveNarrationProsody(input: {
  mode?: ReadingMode;
  contentKind?: NarrationContentKind;
}): NarrationProsody {
  const mode = input.mode ?? "standard";
  const contentKind = input.contentKind ?? "general";
  const base = MODE_BASE[mode];
  const tweak = KIND_TWEAK[contentKind] ?? {};
  return {
    mode,
    contentKind,
    rate: clampRate(base.rate + (tweak.rate ?? 0)),
    breakScale: Math.max(0.5, base.breakScale + (tweak.breakScale ?? 0)),
    deviceGapMs: Math.max(120, Math.round(base.deviceGapMs + (tweak.deviceGapMs ?? 0))),
    labelAr: base.labelAr,
  };
}
