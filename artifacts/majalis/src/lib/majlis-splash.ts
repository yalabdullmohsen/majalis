/**
 * ثوابت Startup Gate التقنية — ويب + Capacitor.
 * الطبقة في index.html (#mj-launch-splash / #mj-startup-gate).
 * بلا نصوص تسويقية؛ تثبيت أساسيات فقط قبل كشف الواجهة.
 */

export const LAUNCH_SPLASH_ID = "mj-launch-splash";
export const STARTUP_GATE_ID = "mj-startup-gate";

/** الحد الأدنى لثبات الإقلاع قبل كشف الواجهة. */
export const SPLASH_MIN_VISIBLE_MS = 500;

/**
 * هدف ليّن قديم — لم يعد يُستخدم لإخفاء مبكر؛ يُبقى للتوافق مع المراجع.
 * السقف الفعلي = SPLASH_MAX_VISIBLE_MS.
 */
export const SPLASH_LCP_SOFT_MS = 500;

/** السقف الصلب — افتح التطبيق ولا تعلّق المستخدم. */
export const SPLASH_MAX_VISIBLE_MS = 1_500;

/** مدة تلاشي الخروج (≤120ms). */
export const SPLASH_FADE_OUT_MS = 120;

/** @deprecated لم يعد يُتخطّى بالجلسة — كل فتح مستند يعرض البوابة القصيرة. */
export const SPLASH_SESSION_KEY = "mj.launch-splash.session.v3";

/** @deprecated عبارة تسويقية أُزيلت من Startup Gate — تُبقى للتوافق البرمجي فقط. */
export const SPLASH_TAGLINE = "علم نافع، وعمل صالح";

export const SPLASH_BG_LIGHT = "#F2F4F3";
export const SPLASH_BG_DARK = "#101614";
