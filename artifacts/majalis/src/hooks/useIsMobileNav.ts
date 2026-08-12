import { useEffect, useState } from "react";
import {
  MOBILE_NAV_MEDIA_QUERY,
  isMobileNavViewport,
} from "@/lib/nav-breakpoint";

/**
 * هل الشريط السفلي هو التنقّل الأساسي الآن؟
 *
 * matchMedia + حدث change بدل مستمع resize: لا يُعاد الرسم عند كل بكسل
 * أثناء تغيير الحجم أو ظهور لوحة المفاتيح على iOS، بل عند تجاوز الحد فقط.
 */
export function useIsMobileNav(): boolean {
  const [mobile, setMobile] = useState(isMobileNavViewport);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(MOBILE_NAV_MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    setMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return mobile;
}
