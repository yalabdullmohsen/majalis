import { useEffect, useState } from "react";

/**
 * يرصد إزاحة الكيبورد عبر VisualViewport (+ keyboard-inset إن توفّر)
 * ويكتب --keyboard-inset على :root لاستعمال CSS.
 */
export function useVisualViewportOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        let kb = 0;
        if (vv) {
          kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        }
        // env(keyboard-inset-height) عبر CSS عند الدعم — نقرأ المحسوب إن وُجد
        const cssKb = getComputedStyle(root).getPropertyValue("--css-keyboard-inset").trim();
        if (cssKb && cssKb !== "0px") {
          const n = parseFloat(cssKb);
          if (!Number.isNaN(n)) kb = Math.max(kb, n);
        }
        root.style.setProperty("--keyboard-inset", `${Math.round(kb)}px`);
        setOffset(kb);
      });
    };

    measure();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      root.style.setProperty("--keyboard-inset", "0px");
    };
  }, []);

  return offset;
}

/** يركّب المستمع مرة واحدة في الشجرة (App). */
export function VisualViewportKeyboardBridge() {
  useVisualViewportOffset();
  return null;
}
