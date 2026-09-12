/**
 * رموز تفاعل سُنّة — مدد/منحنيات/عتبات موحّدة.
 * ممنوع قيم عشوائية داخل الشاشات؛ استورد من هنا أو من CSS vars.
 */

export const MOTION_DURATION_MS = {
  instant: 80,
  fast: 140,
  standard: 200,
  emphasized: 280,
} as const;

export const MOTION_EASING = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  enter: "cubic-bezier(0, 0, 0, 1)",
  exit: "cubic-bezier(0.3, 0, 1, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/** نوابض خفيفة — للاستخدام مع CSS/WAAPI فقط عند الحاجة */
export const MOTION_SPRING = {
  soft: { stiffness: 320, damping: 28 },
  snappy: { stiffness: 480, damping: 36 },
} as const;

export const GESTURE_THRESHOLDS = {
  /** px — انحراف مسموح قبل إلغاء النقرة */
  tapSlopPx: 10,
  /** px — بدء السحب الأفقي */
  swipeThresholdPx: 48,
  /** px — تفعيل السحب */
  dragActivationPx: 8,
  /** px/ms — سرعة الإفلات */
  velocityThresholdPxPerMs: 0.35,
  /** ms */
  longPressMs: 420,
  /** نسبة إزاحة الورقة للإغلاق */
  sheetDismissRatio: 0.28,
  /** px — منطقة حافة الرجوع RTL/LTR */
  edgeSwipeRegionPx: 28,
} as const;

export type HapticToken = "selection" | "lightImpact" | "success" | "warning" | "error";

export const HAPTIC_POLICY = {
  /** لا اهتزاز أثناء التمرير */
  onScroll: false as const,
  /** اهتزاز عند التحديد المهم فقط */
  tokens: ["selection", "lightImpact", "success", "warning", "error"] as const satisfies readonly HapticToken[],
} as const;

export type InteractionState =
  | "idle"
  | "hovered"
  | "focused"
  | "pressed"
  | "selected"
  | "loading"
  | "disabled"
  | "success"
  | "error";

/** ميزانية إطار حسب معدل التحديث (هدف داخلي — القياس على الجهاز مطلوب) */
export const FRAME_BUDGET_MS = {
  hz60: 16.7,
  hz90: 11.1,
  hz120: 8.3,
} as const;
