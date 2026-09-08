import { AppBackButton } from "@/components/common/AppBackButton";

/**
 * زر عائم عالمي للرجوع — ظاهر دائمًا بدون شرط تمرير.
 * يمر عبر AppBackButton الموحّد (goBackOrFallback) لتفادي مسار رجوع مزدوج.
 * مساحة لمس ≥44px عبر CSS؛ موضع ثابت + احترام safe-area.
 * الصعود للأعلى يبقى عبر ScrollToTop في الزاوية المقابلة.
 *
 * يُخفى في الرئيسية والمصحف وصفحات الدخول/الدعم فقط (autoHideFloating).
 */
export function FloatingBackButton() {
  return <AppBackButton variant="floating" autoHideFloating />;
}

/** توافق مع الاستيرادات القديمة */
export { FloatingBackButton as GlobalBackButton };

/** المكوّن الموحّد للرجوع في الصفحات */
export { AppBackButton } from "@/components/common/AppBackButton";
