/**
 * أنواع الأذان المميزة في الإعدادات — أصول متوفرة بأسماء واضحة فقط.
 */
export const FEATURED_ADHAN_STYLE_IDS = [
  "makkah",
  "aqsa",
  "kuwait",
  "takbeerat",
  "soft",
] as const;

export type FeaturedAdhanStyleId = (typeof FEATURED_ADHAN_STYLE_IDS)[number];

export const FEATURED_ADHAN_STYLE_LABELS: Record<FeaturedAdhanStyleId, string> = {
  makkah: "أذان الحرم المكي",
  aqsa: "أذان المسجد الأقصى",
  kuwait: "أذان خليجي قصير",
  takbeerat: "تنبيه قصير بدون أذان",
  soft: "تنبيه قصير بدون أذان",
};
