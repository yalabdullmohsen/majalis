/**
 * الرجوع العائم الثابت أُلغي — كان يغطي المحتوى ويتداخل مع ScrollToTop.
 * الرجوع داخل تدفق الصفحة: هيدر اللوبي / SectionHero / أزرار الصفحة.
 * يُبقى المكوّن كـ no-op لتوافق الاستيرادات القديمة في App.tsx والبوابات.
 */
export function FloatingBackButton() {
  return null;
}

/** توافق مع الاستيرادات القديمة */
export { FloatingBackButton as GlobalBackButton };

/** المكوّن الموحّد للرجوع في الصفحات */
export { AppBackButton } from "@/components/common/AppBackButton";
