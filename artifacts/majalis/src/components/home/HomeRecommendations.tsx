import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  type RecommendedItem,
  CONTENT_TYPE_COLOR,
  CONTENT_TYPE_LABEL,
  fetchRecommendations,
  getItemHref,
  getItemTitle,
  trackEvent,
} from "@/lib/recommendation-service";
import { useAuth } from "@/components/AuthProvider";

function RecMiniCard({ item }: { item: RecommendedItem }) {
  const color = CONTENT_TYPE_COLOR[item.content_type] || "var(--majalis-emerald, #0E6E52)";
  const label = CONTENT_TYPE_LABEL[item.content_type] || "";
  const title = getItemTitle(item);
  const href = getItemHref(item);

  return (
    <Link
      href={href}
      onClick={() => trackEvent({ event_type: "view", content_id: item.id, content_type: item.content_type })}
      className="rec-mini-card group"
    >
      <div className="flex items-center justify-between">
        <span
          className="rec-mini-card__badge"
          style={{ "--rec-badge-bg": color } as React.CSSProperties}
        >
          {label}
        </span>
        <span className="rec-mini-card__arrow">←</span>
      </div>
      <p className="text-sm font-medium leading-snug line-clamp-3 rec-mini-card__title">
        {title}
      </p>
      {item.category && (
        <p className="rec-mini-card__cat">{item.category}</p>
      )}
    </Link>
  );
}

export function HomeRecommendations() {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // ننتظر قليلاً لمعرفة حالة المصادقة
    const timer = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);

    fetchRecommendations({ context: "home", limit: 6 })
      .then((r) => {
        if (r.ok && r.recommendations?.length >= 3) {
          setItems(r.recommendations.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  // لا نعرض القسم للمستخدمين غير المسجلين أو إذا لم تكن هناك توصيات
  if (!isLoggedIn || (!loading && items.length < 3)) return null;

  if (loading) {
    return (
      <section dir="rtl" className="home-section" aria-label="توصيات مخصصة">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">مخصص لك</p>
            <h2>يُقترح لك اليوم</h2>
          </div>
        </div>
        <div className="sk-card-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ds-skeleton ds-skeleton--card" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section dir="rtl" className="home-section" aria-labelledby="rec-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">مخصص لك</p>
          <h2 id="rec-heading">يُقترح لك اليوم</h2>
        </div>
        <Link href="/profile" className="home-section-link">ملف اهتماماتك</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <RecMiniCard key={`${item.id}::${item.content_type}`} item={item} />
        ))}
      </div>
    </section>
  );
}

export default HomeRecommendations;
