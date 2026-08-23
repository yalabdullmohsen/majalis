/**
 * ثوابت دخولية «المجلس العلمي» — ويب + Capacitor.
 * الدخولية في index.html (#mj-launch-splash)؛ هذا الملف للتنسيق والاختبارات.
 */

export const LAUNCH_SPLASH_ID = "mj-launch-splash";

/** الحد الأدنى لإحساس الدخولية — قصير حتى لا يؤخّر LCP. */
export const SPLASH_MIN_VISIBLE_MS = 280;

/** الحد الأقصى — لا انتظار تحميل بيانات أو مصحف. */
export const SPLASH_MAX_VISIBLE_MS = 700;

/** مدة تلاشي الخروج. */
export const SPLASH_FADE_OUT_MS = 180;

export const SPLASH_SESSION_KEY = "mj.launch-splash.session.v2";

export const SPLASH_TAGLINE = "علم نافع، وعمل صالح";

export const SPLASH_BG_LIGHT = "#F2F4F3";
export const SPLASH_BG_DARK = "#101614";
