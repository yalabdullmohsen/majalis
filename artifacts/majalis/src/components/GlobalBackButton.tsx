import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isImmersiveChromePath, isPrayerTimesPath } from "@/lib/immersive-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";

/**
 * زر رجوع عام يظهر في كل شاشة غير الرئيسية بعد تمرير طفيف.
 * يتضمن micro-interaction (mj-back-nudge) عند الضغط.
 */
export function GlobalBackButton() {
  const [location] = useLocation();
  const [pastThreshold, setPastThreshold] = useState(false);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    setPastThreshold(window.scrollY > 120);
    const onScroll = () => setPastThreshold(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location]);

  if (location === "/") return null;
  if (isImmersiveChromePath(location) || isPrayerTimesPath(location)) return null;
  if (!pastThreshold) return null;

  const goBack = () => {
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
