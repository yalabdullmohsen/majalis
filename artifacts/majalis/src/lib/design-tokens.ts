/**
 * Design Tokens — المجلس العلمي
 * مرجع الحقيقة الوحيد للهوية البصرية — إعادة تصميم الهوية البصرية v3 (2026-07-19)
 * لوحة ألوان هادئة فاخرة: أخضر رمادي داكن + عاجي دافئ + ذهبي رملي مساند.
 * لا تُغيّر هذه القيم إلا بقرار توحيد واعٍ يطال كل الصفحات.
 */

export const COLOR = {
  /* ── الأساس: أخضر داكن مائل للرمادي ── */
  primary:      "#173D35",
  primaryLight: "#28584D",
  emerald:      "#173D35",              // alias توافقي مع الاستخدام القديم
  emeraldDeep:  "#173D35",
  emeraldHov:   "#28584D",
  emeraldSoft:  "rgba(23,61,53,0.06)",
  emeraldMid:   "rgba(23,61,53,0.12)",
  emeraldBorder:"rgba(23,61,53,0.10)",

  /* ── مساند ذهبي رملي هادئ (استخدام مقتصد) ── */
  gold:      "#B89452",
  goldSoft:  "rgba(184,148,82,0.10)",
  goldMid:   "rgba(184,148,82,0.18)",

  /* ── تدرّج البطاقة اليومية الرئيسية (hero) — استخدام محدود جدًا ── */
  heroGradient: "linear-gradient(135deg, #173D35 0%, #28584D 100%)",

  /* ── الخلفيات ── */
  canvas:   "#F7F4ED",   // خلفية عامة — عاجي دافئ
  canvas1:  "#FFFFFF",   // خلفية بطاقات
  border:   "#E7E2D8",   // حدود خفيفة

  /* ── النصوص ── */
  ink:      "#202725",   // نص أساسي
  inkSoft:  "#68716D",   // نص ثانوي
  inkMuted: "#5E655F",   // نص خافت

  /* ── حالات النظام ── */
  success: "#34785F",
  warning: "#B67A32",
  error:   "#B44A4A",

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
  lg:  "1rem",       // 16px — الحد الأدنى لبطاقات الهوية الجديدة
  xl:  "1.25rem",    // 20px — بطاقات قياسية
  "2xl":"1.375rem",  // 22px — الحد الأقصى لبطاقات الهوية الجديدة
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
  sm: "0 1px 2px rgba(23,61,53,0.05)",
  md: "0 2px 8px rgba(23,61,53,0.06)",
  lg: "0 8px 24px rgba(23,61,53,0.08)",
} as const;

/**
 * سلّم الطباعة الموحَّد (يطابق التكليف: عنوان صفحة 26-30، عنوان قسم 20-22،
 * عنوان بطاقة 16-18، نص أساسي 15-17، نص مساند 13-14).
 */
export const TYPE_SCALE = {
  pageTitle:    "1.5rem",    // 24px
  sectionTitle: "1.1875rem",// 19px
  cardTitle:    "1rem",     // 16px
  body:         "0.9375rem",// 15px
  support:      "0.75rem",  // 12px
} as const;

export const FONT = {
  /* الخط الموحَّد للواجهة: Alexandria — خط عربي حديث هادئ بأوزان متعددة
     مناسب لهوية فاخرة منخفضة الضجيج (اختير بدل IBM Plex Sans Arabic
     لثراء أوزانه وانسجامه مع طابع "هادئ فاخر" المطلوب — 2026-07-19). */
  ui:     '"Alexandria", "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
  quran:  '"Amiri Quran", "Scheherazade New", "KFGQPC Hafs Uthmanic", serif',
  display:'"Alexandria", "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
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
    borderRight: `3px solid ${COLOR.primary}`,
    background: COLOR.canvas,
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
  "صحيح":  COLOR.primary,
  "حسن":   COLOR.primaryLight,
  "ضعيف":  COLOR.error,
  "موضوع": "#7f1d1d",
} as const;
