import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { MOTION_DURATION_MS, prefersReducedMotion } from "@/design/motion";
import "@/design/motion.css";

const IMMERSIVE =
  /^\/(mushaf|quran\/reader|prayer-times|adhan|tasbeeh|car-mode|family-mode)(\/|$)/i;

type Mode = "enter" | "back-enter" | "none";

/**
 * انتقال خفيف لشاشات wouter — قابل للمقاطعة (يُستبدل فور تغيّر المسار).
 * يُتخطّى في المسارات الغامرة (مصحف/مواقيت) وعند تقليل الحركة.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const prev = useRef(location);
  const stack = useRef<string[]>([location]);
  const [mode, setMode] = useState<Mode>("none");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location === prev.current) return;
    const reduced = prefersReducedMotion();
    const immersive = IMMERSIVE.test(location) || IMMERSIVE.test(prev.current);

    let nextMode: Mode = "enter";
    const idx = stack.current.lastIndexOf(location);
    if (idx >= 0 && idx < stack.current.length - 1) {
      stack.current = stack.current.slice(0, idx + 1);
      nextMode = "back-enter";
    } else {
      stack.current.push(location);
      if (stack.current.length > 32) stack.current = stack.current.slice(-24);
    }

    prev.current = location;
    if (reduced || immersive) {
      setMode("none");
      return;
    }

    setMode(nextMode);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMode("none"), MOTION_DURATION_MS.page + 40);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [location]);

  const cls =
    mode === "enter"
      ? "mj-route-stage mj-route-stage--enter"
      : mode === "back-enter"
        ? "mj-route-stage mj-route-stage--back-enter"
        : "mj-route-stage";

  return (
    <div className={cls} data-route={location}>
      <div className="mj-route-stage__layer">{children}</div>
    </div>
  );
}
