import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * يضيف صنف دخول خفيف على #main-content عند تغيّر المسار (push فقط).
 * يعتمد opacity/transform فقط — بلا ومض أبيض.
 */
export function RouteEnterMotion() {
  const [location] = useLocation();
  const isPopRef = useRef(false);
  const first = useRef(true);

  useLayoutEffect(() => {
    const onPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useLayoutEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (first.current) {
      first.current = false;
      isPopRef.current = false;
      return;
    }
    const wasPop = isPopRef.current;
    isPopRef.current = false;
    if (wasPop) return;

    main.classList.remove("mj-route-enter");
    // إجبار إعادة تشغيل الحركة
    void main.offsetWidth;
    main.classList.add("mj-route-enter");
    const t = window.setTimeout(() => main.classList.remove("mj-route-enter"), 220);
    return () => window.clearTimeout(t);
  }, [location]);

  return null;
}
