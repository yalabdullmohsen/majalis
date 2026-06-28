import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getMutoonTexts } from "@/lib/quran-circles-mutoon-service";
import { MUTOON_CATEGORIES, MUTOON_LEVELS } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function MutoonPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [level, setLevel] = useState("الكل");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("mutoon", null);

  useEffect(() => {
    setLoading(true);
    getMutoonTexts({ category, level, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [category, level, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="المتون العلمية"
        title="المتون"
        subtitle="متون العلوم الشرعية واللغوية — مع تتبع التقدم والدروس."
      />

      <div className="page-stats-row">
        <span>{items.length} متن</span>
        <Link href="/annual-courses?type=متن" className="page-link-inline">دورات المتون</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في المتون..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في المتون"
      />

      <div className="content-hub-chips">
        {["الكل", ...MUTOON_CATEGORIES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setCategory(t)}
            className={category === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="content-hub-chips">
        {["الكل", ...MUTOON_LEVELS].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setLevel(t)}
            className={level === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد متون مطابقة." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/mutoon/${item.slug || item.id}`}
              title={item.title}
              tag={item.category}
              meta={[item.author, item.level, item.total_lessons ? `${item.total_lessons} درس` : null].filter(Boolean).join(" · ")}
              summary={item.summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
