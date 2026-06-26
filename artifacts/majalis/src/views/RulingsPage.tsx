import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getShariaRulings } from "@/lib/platform-content-service";
import { RULING_CATEGORIES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function RulingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("rulings", null);

  useEffect(() => {
    setLoading(true);
    getShariaRulings({ category, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [category, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="مكتبة الفقه"
        title="الأحكام الشرعية"
        subtitle="مكتبة شاملة للأحكام في العبادات والمعاملات والأسرة — مرتبطة بالأدلة والمراجع."
      />

      <div className="page-stats-row">
        <span>{items.length} حكم</span>
        <span>{RULING_CATEGORIES.length} قسم</span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأحكام..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الأحكام الشرعية"
      />

      <div className="content-hub-chips">
        {["الكل", ...RULING_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أحكام مطابقة." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/rulings/${item.id}`}
              title={item.title}
              tag={item.category}
              summary={item.summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
