import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isTabRootPath } from "@/config/section-lobby-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";
import { haptics } from "@/lib/haptics";

/**
 * زر رجوع عام واضح في كل شاشة غير الرئيسية/الغامرة —
 * بدون شرط تمرير؛ مساحة لمس ≥44px عبر CSS.
 * يُخفى في قصص الأنبياء (لها رجوع داخلي) حتى لا يزاحم المحتوى.
 */
export function GlobalBackButton() {
  const [location] = useLocation();
  const [nudge, setNudge] = useState(false);

  if (location === "/") return null;
  if (isImmersiveChromePath(location) || isTabRootPath(location)) return null;
  const path = location.replace(/\/+$/, "") || "/";
  if (path === "/prophets" || path.startsWith("/prophets/") || path.startsWith("/prophet-stories") || path.startsWith("/prophets-stories")) {
    return null;
  }
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
      className={`global-back-btn mj-pressable${nudge ? " mj-back-nudge" : ""}`}
      onClick={goBack}
      aria-label="رجوع"
      title="رجوع"
    >
      <DirectionalIcon icon={ArrowRight} size={18} strokeWidth={2.2} />
    </button>
  );
}
