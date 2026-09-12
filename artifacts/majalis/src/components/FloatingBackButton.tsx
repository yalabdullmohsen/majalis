/**
 * الرجوع العام الثابت — شريط حديث بدل السهم العائم الدائري الملغى.
 * FLOATING_BACK_DISABLED يبقى true (لا FAB دائري).
 */
import { AppBackButton } from "@/components/common/AppBackButton";

export function FloatingBackButton() {
  return (
    <AppBackButton
      variant="bar"
      autoHideFloating
      label="رجوع"
      aria-label="رجوع"
    />
  );
}

export { FloatingBackButton as GlobalBackButton };
export { AppBackButton } from "@/components/common/AppBackButton";
export const FLOATING_BACK_DISABLED = true as const;
export const FIXED_BACK_BAR_ENABLED = true as const;
