/**
 * هيكل مسار كسول — يظهر فورًا بلا فراغ أثناء تحميل الحزمة.
 * هيكل ذاتي بلا أيقونات خارجية حتى تبقى حزمة الإقلاع خفيفة (LCP).
 */
export function LazyRouteFallback() {
  const path =
    typeof window !== "undefined" ? window.location.pathname.split("?")[0] || "/" : "/";
  const prophetsShell = /^\/(prophets|prophet-stories|prophets-stories|anbiya)(\/|$)/.test(path);
  const prophetDetail = /^\/(prophets|prophet-stories|prophets-stories|anbiya)\/[^/]+/.test(path);

  return (
    <div
      className={[
        "lrf-wrap",
        "lrf-wrap--skel",
        "lrf-wrap--instant",
        prophetsShell ? "lrf-wrap--prophets" : "",
        prophetDetail ? "lrf-wrap--prophet-detail" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-busy="true"
      aria-label="تجهيز الصفحة"
      data-prophets-shell={prophetsShell ? "1" : undefined}
      data-route-fallback="1"
    >
      <div className="lrf-skel" aria-hidden="true">
        <div className="lrf-skel__hero" />
        <div className="lrf-skel__title" />
        <div className="lrf-skel__line" />
        <div className="lrf-skel__line lrf-skel__line--short" />
        <div className="lrf-skel__cards">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="lrf-skel__card" />
          ))}
        </div>
      </div>
      <p className="lrf-label">تجهيز الصفحة…</p>
    </div>
  );
}

/** اسم مستقر للواجهات — نفس LazyRouteFallback */
export const RouteFallback = LazyRouteFallback;
