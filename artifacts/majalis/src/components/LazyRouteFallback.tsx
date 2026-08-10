import { useEffect, useState } from "react";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

/**
 * هيكل تحميل خفيف — يُشعر بالفورية بدل شاشة انتظار فارغة.
 */
export function LazyRouteFallback() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), Math.min(PAGE_LOAD_TIMEOUT_MS, 2_400));
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="lrf-wrap lrf-wrap--skel" role="status" aria-label="جارٍ تحميل الصفحة…">
      <div className="lrf-skel" aria-hidden="true">
        <div className="lrf-skel__hero skeleton-base" />
        <div className="lrf-skel__line skeleton-base" />
        <div className="lrf-skel__line lrf-skel__line--short skeleton-base" />
        <div className="lrf-skel__cards">
          <div className="lrf-skel__card skeleton-base" />
          <div className="lrf-skel__card skeleton-base" />
          <div className="lrf-skel__card skeleton-base" />
        </div>
      </div>
      {slow ? <p className="lrf-label">جارٍ تحميل الصفحة…</p> : null}
    </div>
  );
}
