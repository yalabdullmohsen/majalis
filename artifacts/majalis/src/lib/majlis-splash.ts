/**
 * ثوابت دخولية «سُنّة» — ويب + Capacitor.
 * الدخولية في index.html (#mj-launch-splash)؛ هذا الملف للتنسيق والاختبارات.
 */

export const LAUNCH_SPLASH_ID = "mj-launch-splash";

/**
 * بلا تأخير اصطناعي: إن استقر الهيكل والخطوط يُسمح بالإخفاء فورًا
 * (التلاشي فقط عبر SPLASH_FADE_OUT_MS).
 */
export const SPLASH_MIN_VISIBLE_MS = 0;

/**
 * هدف LCP الليّن: يُسمح بالإخفاء مبكرًا إذا كانت الخطوط جاهزة (boot-ready / check).
 * السقف الصلب أطول لمنع FOUT عند بطء التحميل.
 */
export const SPLASH_LCP_SOFT_MS = 480;

/** السقف الصلب — انتظار خطوط الواجهة قبل كشف النص. */
export const SPLASH_MAX_VISIBLE_MS = 1_400;

/** مدة تلاشي الخروج (متزامنة مع CSS في index.html وboot.js) — عقد البرنامج: 120–180ms. */
export const SPLASH_FADE_OUT_MS = 160;

export const SPLASH_SESSION_KEY = "mj.launch-splash.session.v4";

/** عبارة قصيرة تحت الاسم. */
export const SPLASH_TAGLINE = "رفيقك في العلم والعمل";

export const SPLASH_BG_LIGHT = "#F7F3EB";
export const SPLASH_BG_DARK = "#101614";
