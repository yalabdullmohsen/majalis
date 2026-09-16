/**
 * منسّق تخطيط زر الرجوع العام — أعلى الشاشة (لا يغطي المحتوى السفلي).
 */
export type BackAvoidanceInsets = {
  safeAreaBottom: number;
  bottomNavigationHeight: number;
  miniPlayerHeight: number;
  keyboardHeight: number;
  activeSheetHeight: number;
};

export type BackTopInsets = {
  safeAreaTop: number;
};

export const BACK_CONTROL_SIZE_PX = 44;
export const BACK_CONTROL_GAP_PX = 8;

/** @deprecated الشريط أصبح علويًا — يُبقى للتوافق مع الاختبارات القديمة */
export function computeBackControlBottomOffset(insets: BackAvoidanceInsets): number {
  const stack =
    Math.max(0, insets.safeAreaBottom) +
    Math.max(0, insets.bottomNavigationHeight) +
    Math.max(0, insets.miniPlayerHeight) +
    Math.max(0, insets.keyboardHeight) +
    Math.max(0, insets.activeSheetHeight);
  return stack + BACK_CONTROL_GAP_PX;
}

/** @deprecated لا حاجة لحجز سفلي بعد نقل الشريط لأعلى */
export function computeContentBottomInsetForBack(insets: BackAvoidanceInsets): number {
  return computeBackControlBottomOffset(insets) + BACK_CONTROL_SIZE_PX + BACK_CONTROL_GAP_PX;
}

export function computeBackControlTopOffset(insets: BackTopInsets): number {
  return Math.max(0, insets.safeAreaTop) + BACK_CONTROL_GAP_PX;
}

export function computeContentTopInsetForBack(insets: BackTopInsets): number {
  return computeBackControlTopOffset(insets) + BACK_CONTROL_SIZE_PX + BACK_CONTROL_GAP_PX;
}

export type Rect = { left: number; top: number; right: number; bottom: number };

export function rectsOverlap(a: Rect, b: Rect, pad = 0): boolean {
  return !(
    a.right + pad <= b.left ||
    a.left - pad >= b.right ||
    a.bottom + pad <= b.top ||
    a.top - pad >= b.bottom
  );
}

/** يفشل إن تقاطع زر الرجوع مع عنصر تفاعلي. */
export function detectBackControlCollision(
  backRect: Rect,
  interactiveRects: Rect[],
  pad = 4,
): { collided: boolean; index: number } {
  for (let i = 0; i < interactiveRects.length; i += 1) {
    if (rectsOverlap(backRect, interactiveRects[i]!, pad)) {
      return { collided: true, index: i };
    }
  }
  return { collided: false, index: -1 };
}
