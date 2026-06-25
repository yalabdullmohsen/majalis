import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ADHKAR_CATEGORIES,
  ADHKAR_ITEMS,
  filterAdhkar,
  getAdhkarByCategory,
} from "@/lib/adhkar-seed";
import { PageHeader, Empty } from "@/components/ui-common";
import { AdhkarCard } from "@/components/adhkar/AdhkarCard";

/** Categories required for phase 3 — mapped to seed slugs */
const FEATURED_CATEGORY_SLUGS = new Set([
  "morning",
  "evening",
  "sleep",
  "wakeup",
  "home-in",
  "home-out",
  "mosque",
  "wudu",
  "salah",
  "after-salah",
  "travel",
  "food",
  "rain",
  "wind",
  "distress",
  "istikharah",
  "istighfar",
  "misc",
]);

const FEATURED_CATEGORIES = ADHKAR_CATEGORIES.filter((c) =>
  FEATURED_CATEGORY_SLUGS.has(c.slug),
);

function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AdhkarPage() {
  const [location] = useLocation();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) {
      const match = ADHKAR_CATEGORIES.find((c) => c.slug === cat || c.id === cat);
      if (match) setCategory(match.id);
    }
  }, [location]);

  const items = useMemo(() => {
    if (debouncedSearch.trim()) {
      return filterAdhkar(debouncedSearch, category === "all" ? undefined : category);
    }
    if (category === "all") return ADHKAR_ITEMS;
    return getAdhkarByCategory(category);
  }, [debouncedSearch, category]);

  const activeCategory = ADHKAR_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="page-shell narrow content-hub-page adhkar-page">
      <PageHeader
        eyebrow="العبادة اليومية"
        title="الأذكار"
        subtitle="أذكار وأدعية من القرآن والسنة الصحيحة — مع المصدر والتخريج وعداد التسبيح."
      />

      <div className="adhkar-stats-row page-stats-row">
        <span>{ADHKAR_ITEMS.length} ذكر</span>
        <span>{FEATURED_CATEGORIES.length} قسم</span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأذكار..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الأذكار"
      />

      <div className="content-hub-chips adhkar-chips">
        <button
          type="button"
          className={`content-hub-chip${category === "all" ? " content-hub-chip--active" : ""}`}
          onClick={() => setCategory("all")}
        >
          الكل
        </button>
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`content-hub-chip${category === cat.id ? " content-hub-chip--active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeCategory && category !== "all" && (
        <p className="adhkar-category-desc">{activeCategory.description}</p>
      )}

      {items.length === 0 ? (
        <Empty text="لا توجد أذكار مطابقة." />
      ) : (
        <div className="adhkar-grid">
          {items.map((item) => (
            <AdhkarCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
