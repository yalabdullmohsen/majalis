import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  type RecContentType,
  type RecContext,
  type RecommendedItem,
  CONTENT_TYPE_COLOR,
  CONTENT_TYPE_LABEL,
  fetchRecommendations,
  fetchRelated,
  getItemHref,
  getItemTitle,
  trackEvent,
} from "@/lib/recommendation-service";

// ── مكوّن بطاقة توصية مفردة ────────────────────────────────────────────────

function RecCard({ item }: { item: RecommendedItem }) {
  const color = CONTENT_TYPE_COLOR[item.content_type] || "#065f46";
  const label = CONTENT_TYPE_LABEL[item.content_type] || item.content_type;
  const title = getItemTitle(item);
  const href = getItemHref(item);

  const handleClick = () => {
    trackEvent({ event_type: "view", content_id: item.id, content_type: item.content_type });
  };

  return (
    <Link href={href} onClick={handleClick} className="block group"
      style={{ "--rw-color": color } as React.CSSProperties}>
      <div className="relative p-4 bg-[var(--majalis-panel)] rounded-xl border border-[var(--majalis-line)] hover:border-[var(--majalis-emerald)] hover:shadow-md transition-all duration-200 h-full">
        {/* شريط ملوَّن */}
        <div className="absolute top-0 right-0 h-full w-1 rounded-r-xl rw-color-bg" />

        <div className="pr-2">
          {/* الوسم */}
          <div className="flex items-center justify-between mb-2">
            <span className="px-1.5 py-0.5 rounded text-xs text-white font-medium rw-color-bg">
              {label}
            </span>
            {item.category && (
              <span className="text-xs text-[var(--majalis-ink-soft)] opacity-70">{item.category}</span>
            )}
          </div>

          {/* العنوان */}
          <p className="text-sm font-medium text-[var(--majalis-ink)] leading-snug line-clamp-2 group-hover:text-[var(--majalis-emerald)] transition-colors">
            {title}
          </p>

          {/* معلومات إضافية */}
          {(item.author || item.collection) && (
            <p className="text-xs text-[var(--majalis-ink-soft)] opacity-70 mt-1">
              {item.author || item.collection}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── الواجهة الرئيسية ─────────────────────────────────────────────────────────

interface RecommendationWidgetProps {
  /** السياق: home / lesson / hadith / scholar / search */
  context?: RecContext;
  /** المحتوى الحالي المعروض (لاستبعاده من التوصيات) */
  contentId?: string;
  contentType?: RecContentType;
  /** عمق الرسم البياني (1-3) */
  depth?: number;
  /** عدد التوصيات */
  limit?: number;
  /** العنوان المعروض */
  title?: string;
  /** عرض كالشبكة (grid) أو الشريط الأفقي */
  layout?: "grid" | "row" | "list";
  className?: string;
  /** إذا كان true، يستخدم fetchRelated بدلاً من fetchRecommendations */
  useRelated?: boolean;
}

export function RecommendationWidget({
  context = "home",
  contentId,
  contentType,
  depth = 1,
  limit = 6,
  title,
  layout = "grid",
  className = "",
  useRelated = false,
}: RecommendationWidgetProps) {
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetch = useRelated && contentId && contentType
      ? fetchRelated({ id: contentId, type: contentType, depth, limit })
          .then((r) => ({ ok: r.ok, recommendations: r.related || [] }))
      : fetchRecommendations({ context, contentId, contentType, depth, limit });

    fetch
      .then((r) => {
        if (r.ok && r.recommendations?.length) {
          setItems(r.recommendations);
        } else {
          setEmpty(true);
        }
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div role="status" aria-label="جارٍ التحميل" className={`space-y-3 ${className}`}>
        <span className="sr-only">جارٍ التحميل…</span>
        {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
          <div key={i} className="h-20 ds-skeleton rounded-xl" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (empty || items.length === 0) return null;

  const sectionTitle = title || (context === "home" ? "مخصص لك" : "محتوى ذو صلة");

  return (
    <section dir="rtl" className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[var(--majalis-ink)] flex items-center gap-2">
          <span className="text-[var(--majalis-emerald)]">✦</span>
          {sectionTitle}
        </h2>
        <span className="text-xs text-[var(--majalis-ink-soft)] opacity-60">
          {items.length} محتوى
        </span>
      </div>

      {layout === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <RecCard key={`${item.id}::${item.content_type}`} item={item} />
          ))}
        </div>
      )}

      {layout === "row" && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {items.map((item) => (
            <div key={`${item.id}::${item.content_type}`} className="min-w-[220px] max-w-[260px] snap-start flex-shrink-0">
              <RecCard item={item} />
            </div>
          ))}
        </div>
      )}

      {layout === "list" && (
        <div className="space-y-2">
          {items.map((item) => {
            const color = CONTENT_TYPE_COLOR[item.content_type] || "#065f46";
            const label = CONTENT_TYPE_LABEL[item.content_type] || "";
            const title = getItemTitle(item);
            const href = getItemHref(item);
            return (
              <Link
                key={`${item.id}::${item.content_type}`}
                href={href}
                onClick={() => trackEvent({ event_type: "view", content_id: item.id, content_type: item.content_type })}
                className="flex items-center gap-3 p-3 bg-[var(--majalis-panel)] rounded-lg border border-[var(--majalis-line)] hover:border-[var(--majalis-emerald)] hover:shadow-sm transition-all group"
                style={{ "--rw-color": color } as React.CSSProperties}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 rw-color-bg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--majalis-ink)] truncate group-hover:text-[var(--majalis-emerald)]">
                    {title}
                  </p>
                </div>
                <span className="text-xs text-white px-1.5 py-0.5 rounded flex-shrink-0 rw-color-bg">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RecommendationWidget;
