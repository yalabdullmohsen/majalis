import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getQuranCircles } from "@/lib/quran-circles-mutoon-service";
import { QURAN_CIRCLE_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function QuranCirclesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [circleType, setCircleType] = useState("الكل");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("quran-circles", null);

  useEffect(() => {
    setLoading(true);
    getQuranCircles({ type: circleType, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [circleType, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="حلقات القرآن"
        title="حلقات القرآن الكريم"
        subtitle="حلقات التجويد والحفظ والتفسير — مع الجداول والمشايخ والتسجيل."
      />

      <div className="page-stats-row">
        <span>{items.length} حلقة</span>
        <Link href="/quran" className="page-link-inline">المصحف</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الحلقات..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في حلقات القرآن"
      />

      <div className="content-hub-chips">
        {["الكل", ...QURAN_CIRCLE_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setCircleType(t)}
            className={circleType === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد حلقات مطابقة." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/quran-circles/${item.slug || item.id}`}
              title={item.title}
              tag={item.circle_type}
              meta={[item.sheikh_name, item.city, item.day_of_week, item.registration_open ? "التسجيل مفتوح" : "التسجيل مغلق"].filter(Boolean).join(" · ")}
              summary={item.summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
