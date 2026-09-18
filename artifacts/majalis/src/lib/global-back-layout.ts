/**
 * منسّق تخطيط زر الرجوع العام — أسفل يمين فوق الشريط السفلي.
 * لا يغطي أعلى الصفحة؛ ظاهر دائمًا خارج الشاشات المستثناة.
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
export const BACK_CONTROL_GAP_PX = 12;
/** كان عتبة ظهور بعد التمرير — أصبح 0 (ظاهر فورًا) مع الإبقاء على الاسم للتوافق */
export const BACK_FAB_SCROLL_SHOW_PX = 0;

export function computeBackControlBottomOffset(insets: BackAvoidanceInsets): number {
  const stack =
    Math.max(0, insets.safeAreaBottom) +
    Math.max(0, insets.bottomNavigationHeight) +
    Math.max(0, insets.miniPlayerHeight) +
    Math.max(0, insets.keyboardHeight) +
    Math.max(0, insets.activeSheetHeight);
  return stack + BACK_CONTROL_GAP_PX;
}

/** حجز سفلي للمحتوى حتى لا يغطي الزر آخر العناصر عند الظهور */
export function computeContentBottomInsetForBack(insets: BackAvoidanceInsets): number {
  return computeBackControlBottomOffset(insets) + BACK_CONTROL_SIZE_PX + BACK_CONTROL_GAP_PX;
}

/** @deprecated الشريط أصبح سفليًا — يُبقى للتوافق */
export function computeBackControlTopOffset(insets: BackTopInsets): number {
  return Math.max(0, insets.safeAreaTop) + BACK_CONTROL_GAP_PX;
}

/** @deprecated لا حجز علوي بعد نقل الشريط لأسفل */
export function computeContentTopInsetForBack(_insets: BackTopInsets): number {
  return 0;
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
