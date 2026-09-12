/** الرجوع العائم معطّل — الهيدر/المضمّن فقط. */
export function FloatingBackButton() {
  return null;
}

export { FloatingBackButton as GlobalBackButton };
export { AppBackButton } from "@/components/common/AppBackButton";
export const FLOATING_BACK_DISABLED = true as const;
