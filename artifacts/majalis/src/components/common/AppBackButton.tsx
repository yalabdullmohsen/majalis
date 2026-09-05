import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isAuthStandalonePath, isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isTabRootPath } from "@/config/section-lobby-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type AppBackVariant = "floating" | "inline" | "hero" | "legal" | "lobby" | "plain";

type AppBackButtonProps = {
  /** مسار أب صريح عند غياب تاريخ داخلي حقيقي */
  fallbackHref?: string;
  variant?: AppBackVariant;
  /** إخفاء تلقائي لنسخة floating على الجذور/الكروم الخاص */
  autoHideFloating?: boolean;
  label?: ReactNode;
  className?: string;
  "aria-label"?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "aria-label">;

const VARIANT_CLASS: Record<AppBackVariant, string> = {
  floating: "floating-back-btn global-back-btn app-back-btn app-back-btn--floating mj-pressable",
  inline: "app-back-btn app-back-btn--inline mj-pressable",
  hero: "page-hero-mj__back mj-btn mj-btn--ghost app-back-btn app-back-btn--hero mj-pressable",
  legal: "legal-back-btn app-back-btn app-back-btn--legal",
  lobby: "section-lobby__back app-back-btn app-back-btn--lobby",
  plain: "app-back-btn app-back-btn--plain mj-pressable",
};

/**
 * زر الرجوع الموحّد — كل واجهات الرجوع في التطبيق/الموقع تمر عبر goBackOrFallback.
 */
export function AppBackButton({
  fallbackHref,
  variant = "inline",
  autoHideFloating = true,
  label,
  className,
  "aria-label": ariaLabel = "رجوع",
  ...rest
}: AppBackButtonProps) {
  const [location] = useLocation();
  const [nudge, setNudge] = useState(false);

  if (variant === "floating" && autoHideFloating) {
    if (location === "/") return null;
    if (isImmersiveChromePath(location) || isTabRootPath(location)) return null;
    if (isAuthStandalonePath(location)) return null;
    const path = location.replace(/\/+$/, "") || "/";
    if (path === "/support" || path === "/contact") return null;
  }

  const goBack = () => {
    haptics.selection();
    setNudge(true);
    window.setTimeout(() => setNudge(false), 300);
    goBackOrFallback(location, fallbackHref);
  };

  const showIcon = variant === "floating" || variant === "lobby" || variant === "inline";
  const showText =
    variant === "hero" ||
    variant === "legal" ||
    variant === "lobby" ||
    variant === "inline" ||
    variant === "plain";

  return (
    <button
      type="button"
      className={cn(VARIANT_CLASS[variant], nudge && "mj-back-nudge", className)}
      data-app-back="1"
      data-back-variant={variant}
      data-floating-back={variant === "floating" ? "1" : undefined}
      data-mode="back"
      data-section-back={variant === "lobby" ? "1" : undefined}
      onClick={goBack}
      aria-label={ariaLabel}
      title={typeof label === "string" ? label : "رجوع"}
      {...rest}
    >
      {showIcon ? <DirectionalIcon icon={ArrowRight} size={18} strokeWidth={2.2} /> : null}
      {showText ? (
        <span>{label ?? (variant === "hero" || variant === "legal" ? "→ رجوع" : "رجوع")}</span>
      ) : null}
    </button>
  );
}
