/**
 * Design Tokens — المجلس العلمي
 * مرجع الحقيقة الوحيد للهوية البصرية المُستخرج من صفحة التوحيد (المرجع)
 * لا تُغيّر هذه القيم إلا بقرار توحيد واعٍ يطال كل الصفحات.
 */

export const COLOR = {
  /* ── الأساس الزمردي ── */
  emerald:     "#1F4D3A",   // --msk-gold (النهار) / --majalis-emerald
  emeraldDeep: "#0A5040",   // --msk-gold-deep
  emeraldSoft: "rgba(14,110,82,0.06)",   // hover خفيف
  emeraldMid:  "rgba(14,110,82,0.12)",   // تظليل ناعم
  emeraldBorder:"rgba(14,110,82,0.10)",  // --msk-border

  /* ── تدرّج البطاقة الرئيسية (hero) ── */
  heroGradient: "linear-gradient(135deg, #1F4D3A 0%, #0A4035 100%)",

  /* ── الخلفيات ── */
  canvas:   "#FFFFFF",   // --msk-canvas — خلفية البطاقات والصفحات
  canvas1:  "#F7FBF9",   // --msk-canvas-1 — خلفية ثانوية

  /* ── النصوص ── */
  ink:      "#1C1A18",   // --msk-text — النص الرئيسي
  inkSoft:  "#5C5550",   // --msk-text-2 — النص الثانوي
  inkMuted: "#918A85",   // --msk-text-3 — النص المخفَّف

  /* ── الوضع الداكن ── */
  dark: {
    gold:    "#1a9e75",
    canvas:  "#171C2E",
    canvas1: "#1F2540",
    ink:     "#E8E3DC",
  },
} as const;

export const RADIUS = {
  sm:  "0.375rem",   // --ds-radius-sm
  md:  "0.5rem",     // --ds-radius
  lg:  "0.625rem",   // --ds-radius-lg / بطاقات التوحيد الفرعية
  xl:  "0.75rem",    // بطاقات التوحيد الرئيسية
  "2xl":"1rem",      // بطاقات البطل (hero cards)
  full:"999px",      // شارات ورقاقات
} as const;

export const SPACING = {
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",   // card-padding الافتراضي
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
} as const;

export const SHADOW = {
  sm: "0 1px 2px rgba(22,78,60,0.05)",
  md: "0 2px 8px rgba(22,78,60,0.07)",
  lg: "0 8px 24px rgba(22,78,60,0.09)",
} as const;

export const FONT = {
  ui:     '"Almarai", "Cairo", "Tajawal", system-ui, sans-serif',
  quran:  '"Amiri Quran", "Scheherazade New", "KFGQPC Hafs Uthmanic", serif',
  display:'"Amiri Quran", "Amiri", serif',
} as const;

/**
 * نمط بطاقة الآية القرآنية الموحّد
 * يُستخدَم في: صفحة التوحيد، عارض القرآن، أي اقتباس قرآني خارج عارضه المباشر
 */
export const QURAN_QUOTE_STYLE = {
  /* داخل hero أخضر */
  onGreen: {
    background: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.lg,
    padding: "0.75rem 1rem",
    fontFamily: FONT.quran,
    fontSize: "1rem",
    lineHeight: "2",
    color: "#FFFFFF",
  },
  /* داخل بطاقة بيضاء */
  onWhite: {
    borderRight: `3px solid ${COLOR.emerald}`,
    background: COLOR.canvas1,
    borderRadius: `0 ${RADIUS.lg} ${RADIUS.lg} 0`,
    padding: "0.6rem 0.75rem",
    fontFamily: FONT.quran,
    fontSize: "0.95rem",
    lineHeight: "2",
    color: COLOR.ink,
  },
} as const;

/**
 * ألوان درجات تصنيف الحديث
 */
export const HADITH_GRADE_COLOR = {
  "صحيح":  "#15803d",
  "حسن":   COLOR.emerald,
  "ضعيف":  "#dc2626",
  "موضوع": "#7f1d1d",
} as const;
