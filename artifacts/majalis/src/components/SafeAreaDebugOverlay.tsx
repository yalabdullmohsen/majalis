import { useEffect, useState } from "react";
import "@/styles/components/safe-area-debug.css";

/**
 * تشخيص فقط عبر ?safe-area-debug=1 في الرابط الحالي.
 * لا يُحفَظ في localStorage حتى لا يبقى شريط أحمر دائمًا في الإنتاج.
 */
export function SafeAreaDebugOverlay() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("safe-area-debug");
      setOn(q === "1" || q === "true");
      // تنظيف بقايا المفتاح القديم إن وُجدت
      localStorage.removeItem("majalis-safe-area-debug");
    } catch {
      setOn(false);
    }
  }, []);

  if (!on) return null;

  return (
    <div className="safe-area-debug" aria-hidden="true">
      <div className="safe-area-debug__top" />
      <div className="safe-area-debug__bottom" />
      <div className="safe-area-debug__start" />
      <div className="safe-area-debug__end" />
      <div className="safe-area-debug__label">safe-area debug</div>
    </div>
  );
}
