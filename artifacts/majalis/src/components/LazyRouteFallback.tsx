import { useDeferredLoading } from "@/hooks/useDeferredLoading";

/**
 * هيكل مسار كسول — يظهر بعد 80ms بلا نص تحميل ظاهر.
 * هيكل ذاتي بلا أيقونات خارجية حتى تبقى حزمة الإقلاع خفيفة (LCP).
 */
export function LazyRouteFallback() {
  const show = useDeferredLoading(true);
  const path =
    typeof window !== "undefined" ? window.location.pathname.split("?")[0] || "/" : "/";
  const prophetsShell = /^\/(prophets|prophet-stories|prophets-stories|anbiya)(\/|$)/.test(path);
  const prophetDetail = /^\/(prophets|prophet-stories|prophets-stories|anbiya)\/[^/]+/.test(path);

  if (!show) return null;

  return (
    <div
      className={[
        "lrf-wrap",
        "lrf-wrap--skel",
        prophetsShell ? "lrf-wrap--prophets" : "",
        prophetDetail ? "lrf-wrap--prophet-detail" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-busy="true"
      aria-label="تجهيز الصفحة"
      data-prophets-shell={prophetsShell ? "1" : undefined}
    >
      <div className="lrf-skel" aria-hidden="true">
        <div className="lrf-skel__hero" />
        <div className="lrf-skel__line" />
        <div className="lrf-skel__line lrf-skel__line--short" />
        <div className="lrf-skel__cards">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="lrf-skel__card" />
          ))}
        </div>
      </div>
    </div>
  );
}
