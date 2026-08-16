/**
 * توقيتات شاشة التشغيل اليومية (Launch) — منفصلة تمامًا عن Onboarding.
 * تظهر عند كل إقلاع WebView/صفحة، لا عند التنقّل الداخلي في الـSPA.
 * مدة الظهور التلقائي: ١٫٢–١٫٨ ثانية؛ التخطي فوري باللمس/السحب.
 */

/** مدة دخول الشعار (fade + scale) */
export const LAUNCH_ENTER_MS = 420;
/** مدة خروج التلاشي */
export const LAUNCH_EXIT_MS = 280;
/** الحد الأدنى للظهور التلقائي (ما لم يتخطَّ المستخدم) */
export const LAUNCH_MIN_MS = 1_200;
/** هدف الظهور المعتاد */
export const LAUNCH_TARGET_MS = 1_500;
/** سقف مطلق — لا تبقى الدخولية أطول من هذا */
export const LAUNCH_MAX_MS = 1_800;

/** توافق مع الاختبارات القديمة */
export const LAUNCH_READY_CAP_MS = LAUNCH_TARGET_MS;
export const LAUNCH_INTRO_MIN_MS = LAUNCH_ENTER_MS;
export const LAUNCH_INTRO_MAX_MS = LAUNCH_MAX_MS;
export const LAUNCH_INTRO_FADE_MS = LAUNCH_EXIT_MS;

/** عبارة ثابتة — هوية المجلس العلمي */
export const LAUNCH_TAGLINE = "منصة علمية شرعية موثوقة";

/** توافق: قائمة واحدة بالعبارة الرسمية */
export const LAUNCH_TAGLINES = [LAUNCH_TAGLINE] as const;

export function pickLaunchTagline(_seed = Date.now()): string {
  return LAUNCH_TAGLINE;
}

/**
 * هل يُسمح بالخروج؟
 * - تخطّي المستخدم → فورًا
 * - جاهز + مضى ≥ LAUNCH_MIN_MS → نعم
 * - مضى ≥ LAUNCH_TARGET_MS → نعم (حتى لو تأخرت الجاهزية)
 * - مضى ≥ LAUNCH_MAX_MS → نعم (سقف مطلق)
 */
export function canDismissLaunch(opts: {
  ready: boolean;
  elapsedMs: number;
  skipped?: boolean;
}): boolean {
  const { ready, elapsedMs, skipped = false } = opts;
  if (skipped) return true;
  if (elapsedMs >= LAUNCH_MAX_MS) return true;
  if (elapsedMs >= LAUNCH_TARGET_MS) return true;
  if (ready && elapsedMs >= LAUNCH_MIN_MS) return true;
  return false;
}

/** للاختبارات — لا بوابة جلسة؛ كل إقلاع صفحة جديد يعرض الشاشة */
export function __resetLaunchIntroForTests(): void {
  /* لا حالة جلسة بعد إعادة التصميم */
}
