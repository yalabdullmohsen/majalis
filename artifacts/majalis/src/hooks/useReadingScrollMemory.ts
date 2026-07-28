import { useEffect, useRef } from "react";
import {
  getScrollForSection,
  saveScrollForSection,
  type ReadingSection,
} from "@/lib/reading-progress";
import { addSafeWindowListener, addSafeDocumentListener } from "@/lib/safe-listeners";

/**
 * يستعيد موضع التمرير لقسم محتوى عند أول زيارة للصفحة،
 * ويحفظه أثناء التمرير (مع تخفيف) وعند المغادرة.
 */
export function useReadingScrollMemory(section: ReadingSection, enabled = true) {
  const restoredRef = useRef(false);
  const sectionRef = useRef(section);
  sectionRef.current = section;

  useEffect(() => {
    if (!enabled || !section) return;
    restoredRef.current = false;

    let cancelled = false;
    const tryRestore = () => {
      if (cancelled || restoredRef.current) return;
      const y = getScrollForSection(section);
      if (y == null || y <= 0) {
        restoredRef.current = true;
        return;
      }
      requestAnimationFrame(() => {
        if (cancelled) return;
        window.scrollTo({ top: y, behavior: "auto" });
        restoredRef.current = true;
      });
    };

    const t = window.setTimeout(tryRestore, 120);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        saveScrollForSection(sectionRef.current, window.scrollY);
      });
    };

    const unScroll = addSafeWindowListener("scroll", onScroll, { passive: true });
    const onHide = () => saveScrollForSection(sectionRef.current, window.scrollY);
    const unHide = addSafeWindowListener("pagehide", onHide);
    const unVis = addSafeDocumentListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      unScroll();
      unHide();
      unVis();
      saveScrollForSection(sectionRef.current, window.scrollY);
    };
  }, [section, enabled]);
}
