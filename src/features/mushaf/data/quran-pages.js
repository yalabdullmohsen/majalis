/**
 * src/features/mushaf/data/quran-pages.js
 * بيانات المصحف الكاملة — 604 صفحة
 * 
 * البنية:
 * - كل صفحة: مصفوفة من 1-15 سطر
 * - كل سطر: مصفوفة من الكلمات
 * - كل كلمة: نص عثماني مشكّل
 */

// ملاحظة: هذا ملف تجريبي بقيم نموذجية
// يجب استبدال البيانات ببيانات المصحف الحقيقية من مصدر موثوق

export const MUSHAF_CONFIG = {
  TOTAL_PAGES: 604,
  LINES_PER_PAGE: 15,
  LOGICAL_WIDTH: 1000,      // وحدة
  LOGICAL_HEIGHT: 1618,     // وحدة
  CALIBRATION_PAGE: 283,    // صفحة المعايرة
  
  // سيُحسب من المرجع (aya-283.png)
  BASE_FONT_SIZE: null,     // unit (سيُحدّد بعد القياس)
  BASE_LINE_HEIGHT: null,   // unit (سيُحدّد بعد القياس)
};

/**
 * مثال: بنية صفحة
 * 
 * page = {
 *   number: 1,
 *   surah: { name: "الفاتحة", number: 1, ayahCount: 7 },
 *   juz: 1,
 *   lines: [
 *     { words: ["الحمد", "لله", "رب", "العالمين"], lineNumber: 0 },
 *     { words: [...], lineNumber: 1 },
 *     ...
 *   ],
 *   specialInfo: {
 *     hazbDescription: null,  // أو "نصف الحزب 3"
 *     isStartOfSurah: false,
 *     isEndOfSurah: false,
 *   }
 * }
 */

// سيُستورد من ملف JSON خارجي كبير
// import QURAN_DATA from './quran-pages-utf8.json';

/**
 * بيانات مؤقتة للاختبار
 * هذا تطبيق حقيقي للصفحة 2 (البسملة)
 */
export const PAGE_2_DATA = {
  number: 2,
  surah: { name: "الفاتحة", number: 1, ayahCount: 7 },
  juz: 1,
  hizb: 1,
  lines: [
    { 
      words: ["بِسْمِ", "ٱلله", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"],
      verseNumber: 1,
      lineNumber: 0,
    },
    { 
      words: ["ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ", "ٱلْعَٰلَمِينَ"],
      verseNumber: 2,
      lineNumber: 1,
    },
    { 
      words: ["ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"],
      verseNumber: 3,
      lineNumber: 2,
    },
    { 
      words: ["مَٰلِكِ", "يَوْمِ", "ٱلدِّينِ"],
      verseNumber: 4,
      lineNumber: 3,
    },
    { 
      words: ["إِيَّاكَ", "نَعْبُدُ", "وَإِيَّاكَ", "نَسْتَعِينُ"],
      verseNumber: 5,
      lineNumber: 4,
    },
    { 
      words: ["ٱهْدِنَا", "ٱلصِّرَٰطَ", "ٱلْمُسْتَقِيمَ"],
      verseNumber: 6,
      lineNumber: 5,
    },
    // ⚠️ السطر 7 — الخط الأخير الذي يُفقَد حالياً:
    { 
      words: ["هُمُ", "ٱلْمُفْلِحُونَ"],
      verseNumber: 7,
      lineNumber: 6,
    },
  ],
  specialInfo: {
    hazbDescription: null,
    isStartOfSurah: false,
    isEndOfSurah: true, // نهاية الفاتحة
  },
};

/**
 * PAGE_2_DIAGNOSTIC
 * 
 * المشكلة الحرجة: السطر 6 (الأخير) لا يظهر
 * 
 * الفرضيات:
 * 1) overflow: hidden على الحاوية يقص النص السفلي
 * 2) عدد خانات السطر < عدد الأسطر (15 > 7)
 *    → الكود يُنشئ فقط 6 خانات بدلاً من 7
 * 3) فلترة أو شرط يسقط السطر الأخير
 *    → مثل: if (lineNumber < 15) يصبح if (lineNumber < 6)
 */
export const DIAGNOSTIC_PAGE_2 = {
  expectedLineCount: 7,
  expectedWordCount: 28,
  expectedLastLine: ["هُمُ", "ٱلْمُفْلِحُونَ"],
  expectedLastVerse: 7,
};

/**
 * بيانات مؤقتة للصفحة 283 (صفحة المعايرة)
 * تُستخدم لتحديد حجم الخط الثابت
 */
export const PAGE_283_DATA = {
  number: 283,
  surah: { name: "متعدد", number: null, ayahCount: null },
  juz: 36,
  hizb: 71,
  lines: [
    // 15 سطر كاملة
    // سيُملأ من المرجع
  ],
  specialInfo: {
    calibrationPage: true,
    hazbDescription: "نصف الحزب 71",
  },
};

/**
 * قائمة السور (114 سورة)
 */
export const SURAHS = [
  { number: 1, name: "الفاتحة", ayahCount: 7, juz: 1 },
  { number: 2, name: "البقرة", ayahCount: 286, juz: 1 },
  { number: 3, name: "آل عمران", ayahCount: 200, juz: 3 },
  // ... 111 سورة أخرى
];

/**
 * معلومات الأحزاب والأرباع
 */
export const HIZBQ_INFO = [
  { juz: 1, hizb: 1, quarter: 1, page: 1 },
  { juz: 1, hizb: 1, quarter: 2, page: 2 },
  // ... 240 ربع آخر
];

export default {
  MUSHAF_CONFIG,
  PAGE_2_DATA,
  PAGE_283_DATA,
  SURAHS,
  HIZBQ_INFO,
};
