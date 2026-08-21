import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { applyFocusArrival } from "@/lib/focus-arrival";
import "@/styles/components/focus-arrival.css";

/**
 * عند الدخول من بحث/رابط داخلي: موضع الهدف + إبراز خفيف.
 * يُتخطى عند الرجوع (popstate) حتى لا يُكسر حفظ التمرير.
 */
export function FocusArrival() {
  const [location] = useLocation();
  const isPopRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const isPop = isPopRef.current;
    isPopRef.current = false;
    if (isPop) return;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => applyFocusArrival(location));
    });
    return () => window.cancelAnimationFrame(id);
  }, [location]);

  return null;
}
