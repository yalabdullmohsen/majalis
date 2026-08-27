import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isTabRootPath } from "@/config/section-lobby-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";
import { haptics } from "@/lib/haptics";

/**
 * زر عائم عالمي للرجوع — ظاهر دائمًا بدون شرط تمرير.
 * مساحة لمس ≥44px عبر CSS؛ موضع ثابت + احترام safe-area.
 * الصعود للأعلى يبقى عبر ScrollToTop في الزاوية المقابلة.
 */
export function FloatingBackButton() {
  const [location] = useLocation();
  const [nudge, setNudge] = useState(false);

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

  return (
    <button
      type="button"
      className={`floating-back-btn global-back-btn mj-pressable${nudge ? " mj-back-nudge" : ""}`}
      data-floating-back="1"
      data-mode="back"
      onClick={goBack}
      aria-label="رجوع"
      title="رجوع"
    >
      <DirectionalIcon icon={ArrowRight} size={18} strokeWidth={2.2} />
    </button>
  );
}

/** توافق مع الاستيرادات القديمة */
export { FloatingBackButton as GlobalBackButton };
