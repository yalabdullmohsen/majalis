/**
 * أنواع الأذان المميزة المعروضة في الإعدادات — كلها قابلة للتجربة مع fallback محلي.
 */
export const FEATURED_ADHAN_STYLE_IDS = [
  "makkah",
  "alharam",
  "aqsa",
  "egypt",
  "turkey",
  "takbeerat",
  "soft",
] as const;

export type FeaturedAdhanStyleId = (typeof FEATURED_ADHAN_STYLE_IDS)[number];

export const FEATURED_ADHAN_STYLE_LABELS: Record<FeaturedAdhanStyleId, string> = {
  makkah: "الأذان الافتراضي",
  alharam: "أذان الحرم",
  aqsa: "أذان المسجد الأقصى",
  egypt: "أذان مصري",
  turkey: "أذان تركي",
  takbeerat: "أذان مختصر",
  soft: "تنبيه لطيف بدون أذان",
};
