/**
 * تسميات عربية لتصنيفات ومستويات مسار الحفظ — للواجهة فقط.
 */

import type { HifzCategory, HifzLevel } from "./types";

export const HIFZ_CATEGORY_LABELS: Readonly<Record<HifzCategory, string>> = {
  quran: "القرآن الكريم",
  "jawami-hadith": "أحاديث جامعة",
  adhkar: "الأذكار والأدعية",
  aqidah: "متون العقيدة",
  fiqh: "متون الفقه",
  "hadith-mutun": "متون الحديث",
  arabic: "متون اللغة العربية",
  "talib-ilm": "مختارات لطالب العلم",
};

export const HIFZ_LEVEL_LABELS: Readonly<Record<HifzLevel, string>> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export function hifzCategoryLabel(category: HifzCategory): string {
  return HIFZ_CATEGORY_LABELS[category] ?? category;
}

export function hifzLevelLabel(level: HifzLevel): string {
  return HIFZ_LEVEL_LABELS[level] ?? level;
}

/** هل التصنيف معروف في العقد؟ */
export function isHifzCategory(value: string): value is HifzCategory {
  return Object.prototype.hasOwnProperty.call(HIFZ_CATEGORY_LABELS, value);
}
