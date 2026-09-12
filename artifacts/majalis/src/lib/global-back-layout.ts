/**
 * منسّق تخطيط زر الرجوع العام — يحسب منطقة التجنب السفلية
 * حتى لا يغطي المحتوى التفاعلي أو الشريط السفلي.
 */
export type BackAvoidanceInsets = {
  safeAreaBottom: number;
  bottomNavigationHeight: number;
  miniPlayerHeight: number;
  keyboardHeight: number;
  activeSheetHeight: number;
};

export const BACK_CONTROL_SIZE_PX = 48;
export const BACK_CONTROL_GAP_PX = 12;

export function computeBackControlBottomOffset(insets: BackAvoidanceInsets): number {
  const stack =
    Math.max(0, insets.safeAreaBottom) +
    Math.max(0, insets.bottomNavigationHeight) +
    Math.max(0, insets.miniPlayerHeight) +
    Math.max(0, insets.keyboardHeight) +
    Math.max(0, insets.activeSheetHeight);
  return stack + BACK_CONTROL_GAP_PX;
}

/** حشوة أسفل المحتوى حتى يمكن تمرير آخر عنصر فوق منطقة الزر. */
export function computeContentBottomInsetForBack(insets: BackAvoidanceInsets): number {
  return computeBackControlBottomOffset(insets) + BACK_CONTROL_SIZE_PX + BACK_CONTROL_GAP_PX;
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
