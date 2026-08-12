/**
 * أنماط الأذان المعتمدة في المنتج — مكي / مدني / أقصى / مصري / شامي / تركي.
 * النسبة الشخصية للمؤذن منفصلة: لا تُعرض إلا بعد تثبّت (انظر AdhanRecording.attribution).
 */

export type AdhanPatternId =
  | "makki"
  | "madani"
  | "aqsa"
  | "egyptian"
  | "levantine"
  | "turkish";

export type AdhanPattern = {
  id: AdhanPatternId;
  /** عنوان النمط المعروض عند غياب نسبة شخصية موثّقة */
  label: string;
  shortLabel: string;
  description: string;
};

export const ADHAN_PATTERNS: readonly AdhanPattern[] = [
  {
    id: "makki",
    label: "أذان الحرم المكي",
    shortLabel: "مكي",
    description: "نمط الحرم المكي الشريف (أم القرى).",
  },
  {
    id: "madani",
    label: "أذان المسجد النبوي",
    shortLabel: "مدني",
    description: "نمط المسجد النبوي الشريف بالمدينة المنورة.",
  },
  {
    id: "aqsa",
    label: "أذان المسجد الأقصى",
    shortLabel: "الأقصى",
    description: "نمط المسجد الأقصى المبارك.",
  },
  {
    id: "egyptian",
    label: "أذان مصري",
    shortLabel: "مصري",
    description: "النمط المصري التقليدي (الأزهر وما حوله).",
  },
  {
    id: "levantine",
    label: "أذان شامي",
    shortLabel: "شامي",
    description: "النمط الشامي (بلاد الشام).",
  },
  {
    id: "turkish",
    label: "أذان تركي / عثماني",
    shortLabel: "تركي",
    description: "النمط التركي / العثماني.",
  },
] as const;

export function getAdhanPattern(id: AdhanPatternId): AdhanPattern {
  return ADHAN_PATTERNS.find((p) => p.id === id) ?? ADHAN_PATTERNS[0];
}
