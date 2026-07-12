import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * يحفظ موضع التمرير في sessionStorage عند المغادرة ويستعيده عند العودة.
 * @param key مفتاح اختياري — يُستخدم pathname افتراضياً.
 */
export function useScrollRestore(key?: string) {
  const [location] = useLocation();
  const storeKey = `scroll_${key ?? location}`;

  useEffect(() => {
    // استعادة الموضع المحفوظ عند الدخول
    const saved = sessionStorage.getItem(storeKey);
    if (saved) {
      const y = parseInt(saved, 10);
      if (!Number.isNaN(y) && y > 0) {
        // تأجير بسيط لضمان اكتمال الـ render
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
      }
    }

    // حفظ الموضع عند المغادرة
    const handleUnload = () => {
      sessionStorage.setItem(storeKey, String(window.scrollY));
    };
    window.addEventListener("beforeunload", handleUnload);

    // حفظ عند تغيير المسار (ملاحة SPA)
    return () => {
      sessionStorage.setItem(storeKey, String(window.scrollY));
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [storeKey]);
}
