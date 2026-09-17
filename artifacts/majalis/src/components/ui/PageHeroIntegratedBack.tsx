/**
 * رجوع هيرو مؤجّل — خارج entry حتى لا ينتفخ LCP للرئيسية.
 */
import { AppBackButton } from "@/components/common/AppBackButton";

export default function PageHeroIntegratedBack({
  fallbackHref = "/",
}: {
  fallbackHref?: string;
}) {
  return (
    <AppBackButton
      variant="hero"
      fallbackHref={fallbackHref}
      label="رجوع"
      data-section-back="1"
    />
  );
}
