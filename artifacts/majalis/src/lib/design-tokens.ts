/**
 * Design Tokens — المجلس العلمي
 * مرجع الحقيقة الوحيد للهوية البصرية المُستخرج من صفحة التوحيد (المرجع)
 * لا تُغيّر هذه القيم إلا بقرار توحيد واعٍ يطال كل الصفحات.
 */

export const COLOR = {
  /* ── الأساس الزمردي 2026 ── */
  emerald:      "#176B57",              // --clr-primary
  emeraldDeep:  "#123F36",             // --clr-primary-deep
  emeraldHov:   "#125746",             // --clr-primary-hov
  emeraldSoft:  "rgba(23,107,87,0.06)", // hover خفيف
  emeraldMid:   "rgba(23,107,87,0.12)", // تظليل ناعم
  emeraldBorder:"rgba(23,107,87,0.10)", // --msk-border

  /* ── تدرّج البطاقة الرئيسية (hero) ── */
  heroGradient: "linear-gradient(135deg, #176B57 0%, #123F36 100%)",

  /* ── الخلفيات ── */
  canvas:   "#FFFFFF",   // --msk-canvas
  canvas1:  "#F8F7F3",   // --msk-canvas-1

  /* ── النصوص ── */
  ink:      "#17201D",   // --msk-text
  inkSoft:  "#5E6964",   // --msk-text-2
  inkMuted: "#89928E",   // --msk-text-3

  /* ── الوضع الداكن ── */
  dark: {
    gold:    "#3BAD8A",
    canvas:  "#111714",
    canvas1: "#1A2120",
    ink:     "#E5F0EC",
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
  ui:     '"Times New Roman", Times, serif',
  quran:  '"Amiri Quran", "Scheherazade New", "KFGQPC Hafs Uthmanic", serif',
  display:'"Times New Roman", Times, serif',
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
  "صحيح":  COLOR.emerald,
  "حسن":   COLOR.emeraldHov,
  "ضعيف":  "#B94A48",
  "موضوع": "#7f1d1d",
} as const;
