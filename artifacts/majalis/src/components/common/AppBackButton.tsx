import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isAuthStandalonePath, isImmersiveChromePath, isPrayerTimesPath } from "@/lib/immersive-chrome";
import {
  getPreviousInternalRoute,
  goBackOrFallback,
  normalizeNavPath,
  sectionAwareFallback,
  sectionRootEscape,
} from "@/lib/navigation-back";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type AppBackVariant = "floating" | "inline" | "hero" | "legal" | "lobby" | "plain";

type AppBackButtonProps = {
  /** مسار أب صريح عند غياب تاريخ داخلي حقيقي */
  fallbackHref?: string;
  variant?: AppBackVariant;
  /** إخفاء تلقائي لنسخة floating على الرئيسية/المصحف/الدخول */
  autoHideFloating?: boolean;
  label?: ReactNode;
  className?: string;
  "aria-label"?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "onPointerDown" | "type" | "aria-label">;

const VARIANT_CLASS: Record<AppBackVariant, string> = {
  floating: "floating-back-btn global-back-btn app-back-btn app-back-btn--floating mj-pressable",
  inline: "app-back-btn app-back-btn--inline mj-pressable",
  hero: "page-hero-mj__back mj-btn mj-btn--ghost app-back-btn app-back-btn--hero mj-pressable",
  legal: "legal-back-btn app-back-btn app-back-btn--legal",
  lobby: "section-lobby__back app-back-btn app-back-btn--lobby",
  plain: "app-back-btn app-back-btn--plain mj-pressable",
};

/**
 * زر الرجوع الموحّد — العائم العام هو المسار الرسمي؛ inline/hero/lobby للتوافق فقط.
 * الرجوع فوري عبر onPointerDown بلا debounce ولا تأخير قبل التنقّل.
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
  const firedRef = useRef(false);

  if (variant === "floating" && autoHideFloating) {
    const path = normalizeNavPath(location);
    if (path === "/") return null;
    if (isImmersiveChromePath(location)) return null;
    if (isPrayerTimesPath(location)) return null;
    if (isAuthStandalonePath(location)) return null;
    if (path === "/support" || path === "/contact") return null;
    const prev = getPreviousInternalRoute(location);
    let fallback = normalizeNavPath(fallbackHref || sectionAwareFallback(location));
    if (fallback === path) fallback = normalizeNavPath(sectionRootEscape(path));
    if (!prev && fallback === path) return null;
  }

  const goBack = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    haptics.selection();
    goBackOrFallback(location, fallbackHref);
    // يسمح بضغطة لاحقة إن بقي المكوّن بعد فشل نادر
    queueMicrotask(() => {
      firedRef.current = false;
    });
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
      className={cn(VARIANT_CLASS[variant], className)}
      data-app-back="1"
      data-back-variant={variant}
      data-floating-back={variant === "floating" ? "1" : undefined}
      data-mode="back"
      data-section-back={variant === "lobby" ? "1" : undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        goBack();
      }}
      onClick={(e) => {
        e.preventDefault();
        goBack();
      }}
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
