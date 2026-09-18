/**
 * موضع دعوة App Store — يُحذف بالكامل من الحزمة طالما IOS_APP_STORE_URL فارغ (DCE).
 */
import { lazy, Suspense, type ComponentType } from "react";
import { IOS_APP_STORE_URL } from "@/lib/ios-app-store";

type Variant = "strip" | "footer" | "inline";

const LazyCta: ComponentType<{ variant?: Variant; className?: string }> | null = IOS_APP_STORE_URL
  ? lazy(() => import("@/components/IosAppCta").then((m) => ({ default: m.IosAppCta })))
  : null;

export function IosAppCtaSlot({
  variant = "strip",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  if (!LazyCta) return null;
  return (
    <Suspense fallback={null}>
      <LazyCta variant={variant} className={className} />
    </Suspense>
  );
}
