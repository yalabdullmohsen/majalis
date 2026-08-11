/**
 * مصدر واحد لقيم الحركة — يُمنع تعريف مدد/منحنيات خارج هذا الملف
 * (والطبقة CSS المشتقة `motion.css`).
 */

export const MOTION_DURATION_MS = {
  instant: 100,
  fast: 160,
  base: 220,
  slow: 320,
  page: 280,
  /** تلاشٍ عند prefers-reduced-motion */
  reduced: 120,
} as const;

export const MOTION_EASING = {
  /** معظم الانتقالات */
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  /** الدخول */
  decelerate: "cubic-bezier(0, 0, 0, 1)",
  /** الخروج */
  accelerate: "cubic-bezier(0.3, 0, 1, 1)",
  /** الارتداد اللطيف (شيتات) */
  spring: "cubic-bezier(0.34, 1.4, 0.64, 1)",
} as const;

/** قاعدة: الدخول أبطأ من الخروج */
export const MOTION_ENTER_MS = MOTION_DURATION_MS.base;
export const MOTION_EXIT_MS = MOTION_DURATION_MS.fast;

export const MOTION_SHEET = {
  /** معامل المطاطية فوق الحد */
  rubberBand: 0.55,
  /** نسبة ارتفاع الشيت للإغلاق */
  dismissRatio: 0.3,
  /** سرعة px/ms للإغلاق */
  dismissVelocity: 0.5,
} as const;

export const MOTION_NAV = {
  /** انزياح الشاشة السابقة أثناء الدفع */
  backPeekRatio: 0.3,
  /** تعتيم الشاشة السابقة */
  backBrightness: 0.92,
  /** نسبة عرض الشاشة لإكمال إيماءة الرجوع */
  edgeCompleteRatio: 0.35,
  /** سرعة px/ms لإكمال إيماءة الرجوع */
  edgeVelocity: 0.4,
  /** عرض حافة اللمس للرجوع (px) */
  edgeWidthPx: 24,
} as const;

export const MOTION_TOUCH = {
  minTargetPx: 44,
  hitSlopPx: 8,
  /** أقصى زمن لظهور حالة :active */
  pressFeedbackMs: 50,
  /** تجاهل نقرة ثانية على نفس الهدف */
  doubleTapGuardMs: 300,
} as const;

export type MotionDurationKey = keyof typeof MOTION_DURATION_MS;
export type MotionEasingKey = keyof typeof MOTION_EASING;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** مدة فعّالة مع احترام تقليل الحركة */
export function motionMs(key: MotionDurationKey): number {
  if (prefersReducedMotion()) return MOTION_DURATION_MS.reduced;
  return MOTION_DURATION_MS[key];
}

export function motionTransition(
  property: string,
  duration: MotionDurationKey = "base",
  easing: MotionEasingKey = "standard",
): string {
  const ms = motionMs(duration);
  const ease = prefersReducedMotion() ? "linear" : MOTION_EASING[easing];
  return `${property} ${ms}ms ${ease}`;
}

/**
 * يمنع النقر المزدوج العرضي على نفس الهدف خلال نافذة زمنية.
 * يُعيد true إن وُجِب تجاهل الحدث.
 */
export function shouldIgnoreDoubleTap(
  lastAtRef: { current: number },
  windowMs: number = MOTION_TOUCH.doubleTapGuardMs,
): boolean {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastAtRef.current < windowMs) return true;
  lastAtRef.current = now;
  return false;
}

/** CSS custom property names exported for tests / docs */
export const MOTION_CSS_VARS = [
  "--mj-motion-instant",
  "--mj-motion-fast",
  "--mj-motion-base",
  "--mj-motion-slow",
  "--mj-motion-page",
  "--mj-ease-standard",
  "--mj-ease-decelerate",
  "--mj-ease-accelerate",
  "--mj-ease-spring",
  "--mj-hit-slop",
] as const;
