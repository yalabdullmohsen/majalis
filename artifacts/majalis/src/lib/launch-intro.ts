/**
 * توقيتات شاشة التشغيل اليومية (Launch) — منفصلة تمامًا عن Onboarding.
 * تظهر عند كل إقلاع WebView/صفحة، لا عند التنقّل الداخلي في الـSPA.
 */

/** مدة دخول الشعار (fade + scale) */
export const LAUNCH_ENTER_MS = 350;
/** مدة خروج التلاشي */
export const LAUNCH_EXIT_MS = 250;
/**
 * سقف الظهور عندما التطبيق جاهز — لا نُبقي الشاشة أطول من هذا بعد الجاهزية+الدخول.
 * (الحد الأدنى الفعلي = LAUNCH_ENTER_MS)
 */
export const LAUNCH_READY_CAP_MS = 1_200;
/** سقف مطلق مع fallback إن تأخرت الجاهزية */
export const LAUNCH_MAX_MS = 3_000;

/** توافق مع الاختبارات القديمة */
export const LAUNCH_INTRO_MIN_MS = LAUNCH_ENTER_MS;
export const LAUNCH_INTRO_MAX_MS = LAUNCH_MAX_MS;
export const LAUNCH_INTRO_FADE_MS = LAUNCH_EXIT_MS;

export const LAUNCH_TAGLINES = [
  "علمٌ نافع وتجربة هادئة",
  "بوابتك للعلم والعبادة",
] as const;

export function pickLaunchTagline(seed = Date.now()): string {
  return LAUNCH_TAGLINES[Math.abs(seed) % LAUNCH_TAGLINES.length]!;
}

/**
 * هل يُسمح بالخروج؟
 * - جاهز + مضى زمن الدخول → نعم (ولا نتجاوز READY_CAP عمليًا لأنها ≥ ENTER)
 * - وصلنا للسقف المطلق → نعم (fallback)
 */
export function canDismissLaunch(opts: {
  ready: boolean;
  elapsedMs: number;
}): boolean {
  const { ready, elapsedMs } = opts;
  if (elapsedMs >= LAUNCH_MAX_MS) return true;
  if (ready && elapsedMs >= LAUNCH_ENTER_MS) return true;
  if (ready && elapsedMs >= LAUNCH_READY_CAP_MS) return true;
  return false;
}

/** للاختبارات — لا بوابة جلسة؛ كل إقلاع صفحة جديد يعرض الشاشة */
export function __resetLaunchIntroForTests(): void {
  /* لا حالة جلسة بعد إعادة التصميم */
}
