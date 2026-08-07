import { useEffect, useState } from "react";
import "@/styles/components/safe-area-debug.css";

const KEY = "majalis-safe-area-debug";

/**
 * مفتاح مطوّر: ?safe-area-debug=1 أو localStorage majalis-safe-area-debug=1
 * يرسم مناطق الإنسِت بألوان شفافة.
 */
export function SafeAreaDebugOverlay() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("safe-area-debug");
      if (q === "1" || q === "true") {
        localStorage.setItem(KEY, "1");
      }
      if (q === "0" || q === "false") {
        localStorage.removeItem(KEY);
      }
      setOn(localStorage.getItem(KEY) === "1");
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
