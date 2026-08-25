import { useEffect, useState } from "react";
import { ArrowRight, ChevronUp } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isTabRootPath } from "@/config/section-lobby-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";
import { haptics } from "@/lib/haptics";

const DEEP_SCROLL_PX = 400;

/**
 * زر عائم عالمي للخروج السريع والرجوع للأعلى في الصفحات الطويلة.
 * يظهر بدون شرط تمرير للرجوع؛ مساحة لمس ≥44px عبر CSS.
 * - قرب أعلى الصفحة: رجوع (`goBackOrFallback`)
 * - بعد تمرير عميق: تمرير سلس للأعلى
 * موضع ثابت + احترام safe-area عبر CSS.
 */
export function FloatingBackButton() {
  const [location] = useLocation();
  const [nudge, setNudge] = useState(false);
  const [deepScroll, setDeepScroll] = useState(false);

  useEffect(() => {
    let ticking = false;
    const measure = () => {
      setDeepScroll(window.scrollY > DEEP_SCROLL_PX);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location]);

  if (location === "/") return null;
  if (isImmersiveChromePath(location) || isTabRootPath(location)) return null;
  const path = location.replace(/\/+$/, "") || "/";
  /* صفحات الدعم/التواصل لها زر رجوع أعلى الصفحة — تجنب التداخل مع المحتوى */
  if (path === "/support" || path === "/contact") {
    return null;
  }

  const goBack = () => {
    haptics.selection();
    setNudge(true);
    window.setTimeout(() => setNudge(false), 300);
    goBackOrFallback(location);
  };

  const onClick = () => {
    if (deepScroll) {
      haptics.selection();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    goBack();
  };

  const mode = deepScroll ? "top" : "back";
  const label = deepScroll ? "العودة إلى الأعلى" : "رجوع";

  return (
    <button
      type="button"
      className={`floating-back-btn global-back-btn mj-pressable${nudge ? " mj-back-nudge" : ""}${deepScroll ? " floating-back-btn--top" : ""}`}
      data-floating-back="1"
      data-mode={mode}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {deepScroll ? (
        <ChevronUp size={18} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <DirectionalIcon icon={ArrowRight} size={18} strokeWidth={2.2} />
      )}
    </button>
  );
}

/** توافق مع الاستيرادات القديمة */
export { FloatingBackButton as GlobalBackButton };
