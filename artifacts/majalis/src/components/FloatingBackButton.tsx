/**
 * زر الرجوع العائم العام — أسفل يمين الشاشة فوق الشريط السفلي.
 * السلوك عبر AppBackButton + goBackOrFallback.
 */
import { AppBackButton } from "@/components/common/AppBackButton";

export function FloatingBackButton() {
  return <AppBackButton variant="floating" autoHideFloating />;
}

/** توافق مع الاستيرادات القديمة */
export { FloatingBackButton as GlobalBackButton };

/** المكوّن الموحّد للرجوع في الصفحات */
export { AppBackButton } from "@/components/common/AppBackButton";
