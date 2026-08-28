/**
 * ثوابت دخولية «سُنّة» — ويب + Capacitor.
 * الدخولية في index.html (#mj-launch-splash)؛ هذا الملف للتنسيق والاختبارات.
 */

export const LAUNCH_SPLASH_ID = "mj-launch-splash";

/** الحد الأدنى لإحساس الدخولية — قصير جدًا حتى لا يؤخّر الدخول. */
export const SPLASH_MIN_VISIBLE_MS = 120;

/**
 * هدف LCP الليّن: يُسمح بالإخفاء مبكرًا إذا كانت الخطوط جاهزة (boot-ready / check).
 * السقف الصلب أطول لمنع FOUT عند بطء التحميل.
 */
export const SPLASH_LCP_SOFT_MS = 420;

/** السقف الصلب — انتظار خطوط الواجهة قبل كشف النص. */
export const SPLASH_MAX_VISIBLE_MS = 1_400;

/** مدة تلاشي الخروج. */
export const SPLASH_FADE_OUT_MS = 90;

export const SPLASH_SESSION_KEY = "mj.launch-splash.session.v2";

export const SPLASH_TAGLINE = "علم نافع، وعمل صالح";

export const SPLASH_BG_LIGHT = "#F2F4F3";
export const SPLASH_BG_DARK = "#101614";
