import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * يؤجّل رسم المحتوى الثقيل حتى يستقر إطار التنقّل (double-rAF + مهلة قصيرة).
 * يمنع تشغيل تخطيطات ثقيلة أثناء شريحة/تلاشي المسار.
 */
export function useNavigationPaintGate(settleMs = 120): boolean {
  const [location] = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    let raf2 = 0;
    setReady(false);

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (settleMs <= 0) {
          if (!cancelled) setReady(true);
          return;
        }
        timeoutId = window.setTimeout(() => {
          if (!cancelled) setReady(true);
        }, settleMs);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [location, settleMs]);

  return ready;
}
