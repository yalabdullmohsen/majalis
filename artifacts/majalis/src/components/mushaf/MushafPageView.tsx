import { useEffect, useRef, useState } from "react";
import { loadMushafPageSvg, mushafPagePngUrl } from "@/lib/mushaf/mushaf-page-loader";

type Props = {
  page: number;
  theme: "light" | "dark";
  zoom: number;
};

export function MushafPageView({ page, theme, zoom }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    loadMushafPageSvg(page, theme)
      .then((content) => {
        if (!cancelled) {
          setSvg(content);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, theme]);

  return (
    <div
      ref={wrapRef}
      className="km-page-view"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
    >
      {loading && !error && (
        <div className="km-page-view__loading" aria-live="polite">
          جاري تحميل الصفحة…
        </div>
      )}
      {error ? (
        <img
          className="km-page-view__img"
          src={mushafPagePngUrl(page)}
          alt={`صفحة ${page} من المصحف`}
          loading="eager"
          decoding="async"
        />
      ) : svg ? (
        <div
          className="km-page-view__svg"
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-label={`صفحة ${page} من المصحف`}
        />
      ) : null}
    </div>
  );
}
