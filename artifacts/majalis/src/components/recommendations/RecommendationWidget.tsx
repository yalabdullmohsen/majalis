import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  type RecContentType,
  type RecContext,
  type RecommendedItem,
  CONTENT_TYPE_LABEL,
  fetchRecommendations,
  fetchRelated,
  getItemHref,
  getItemTitle,
  trackEvent,
} from "@/lib/recommendation-service";

function rwTypeMod(ct: RecContentType | string): string {
  return `rw-type--${String(ct).replace(/_/g, "-")}`;
}

// ── مكوّن بطاقة توصية مفردة ────────────────────────────────────────────────

function RecCard({ item }: { item: RecommendedItem }) {
  const label = CONTENT_TYPE_LABEL[item.content_type] || item.content_type;
  const title = getItemTitle(item);
  const href = getItemHref(item);

  const handleClick = () => {
    trackEvent({ event_type: "view", content_id: item.id, content_type: item.content_type });
  };

  return (
    <Link href={href} onClick={handleClick} className={`block group ${rwTypeMod(item.content_type)}`}>
      <div className="rw-card">
        {/* شريط ملوَّن */}
        <div className="absolute top-0 right-0 h-full w-1 rounded-r-xl rw-color-bg" />

        <div className="pr-2">
          {/* الوسم */}
          <div className="flex items-center justify-between mb-2">
            <span className="px-1.5 py-0.5 rounded text-xs text-white font-medium rw-color-bg">
              {label}
            </span>
            {item.category && (
              <span className="rw-card__category">{item.category}</span>
            )}
          </div>

          {/* العنوان */}
          <p className="rw-card__title line-clamp-2">{title}</p>

          {/* معلومات إضافية */}
          {(item.author || item.collection) && (
            <p className="rw-card__meta">{item.author || item.collection}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── الواجهة الرئيسية ─────────────────────────────────────────────────────────

interface RecommendationWidgetProps {
  context?: RecContext;
  contentId?: string;
  contentType?: RecContentType;
  depth?: number;
  limit?: number;
  title?: string;
  layout?: "grid" | "row" | "list";
  className?: string;
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
    <section dir="rtl" className={className}>
      <div className="rw-section-head">
        <h2 className="rw-section-title">
          <span className="rw-section-title__icon">✦</span>
          {sectionTitle}
        </h2>
        <span className="rw-section-count">{items.length} محتوى</span>
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
            const label = CONTENT_TYPE_LABEL[item.content_type] || "";
            const itemTitle = getItemTitle(item);
            const href = getItemHref(item);
            return (
              <Link
                key={`${item.id}::${item.content_type}`}
                href={href}
                onClick={() => trackEvent({ event_type: "view", content_id: item.id, content_type: item.content_type })}
                className={`rw-list-item ${rwTypeMod(item.content_type)}`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 rw-color-bg" />
                <p className="rw-list-item__title">{itemTitle}</p>
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
