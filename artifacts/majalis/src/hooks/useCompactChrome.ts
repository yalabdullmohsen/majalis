import { useEffect, useState } from "react";
import {
  COMPACT_CHROME_MEDIA_QUERY,
  isCompactChromeViewport,
} from "@/lib/nav-breakpoint";

/**
 * كروم علوي مدمج (بحث + تيكّر في صفوف منفصلة) — جوال وiPad وSplit View.
 * يعتمد العرض الفعلي لا اسم الجهاز.
 */
export function useCompactChrome(): boolean {
  const [compact, setCompact] = useState(isCompactChromeViewport);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(COMPACT_CHROME_MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) => setCompact(e.matches);
    setCompact(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return compact;
}
