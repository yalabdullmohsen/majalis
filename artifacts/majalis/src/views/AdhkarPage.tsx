import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ADHKAR_CATEGORIES } from "@/lib/adhkar-seed";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import { getReadingProgress, restoreScrollForSection } from "@/lib/reading-progress";
import { PageHeader, Empty } from "@/components/ui-common";
import { AdhkarCard } from "@/components/adhkar/AdhkarCard";

const FEATURED_CATEGORY_SLUGS = new Set([
  "morning", "evening", "sleep", "wakeup", "home-in", "home-out",
  "mosque", "wudu", "salah", "after-salah", "travel", "food",
  "rain", "wind", "distress", "istikharah", "istighfar", "misc",
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
  const { data: publishedItems = [], isLoading, isError } = usePublishedAdhkarItems();
  const lastRead = getReadingProgress("adhkar");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) {
      const match = ADHKAR_CATEGORIES.find((c) => c.slug === cat || c.id === cat);
      if (match) setCategory(match.id);
    }
    restoreScrollForSection("adhkar");
  }, [location]);

  const items = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = publishedItems;
    if (category !== "all") {
      list = list.filter((i) => i.categoryId === category);
    }
    if (!q) return list;
    return list.filter(
      (a) =>
        a.text.includes(q) ||
        a.keywords.some((k: string) => k.includes(q)) ||
        a.source?.includes(q) ||
        a.reference?.includes(q),
    );
  }, [debouncedSearch, category, publishedItems]);

  const activeCategory = ADHKAR_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="page-shell narrow content-hub-page adhkar-page adhkar-page--v2">
      <PageHeader
        eyebrow="العبادة اليومية"
        title="الأذكار"
        subtitle="أذكار وأدعية من القرآن والسنة — قراءة هادئة، عداد تسبيح، ومشاركة سهلة."
      />

      <div className="adhkar-hero ui-card">
        <div className="adhkar-hero__stats">
          <div><strong>{publishedItems.length}</strong><span>ذكر</span></div>
          <div><strong>{FEATURED_CATEGORIES.length}</strong><span>قسم</span></div>
          <Link href="/tasbih" className="adhkar-hero__tasbih-link">عداد التسبيح ←</Link>
        </div>
        {lastRead && (
          <a href={`#content-${lastRead.id}`} className="adhkar-hero__continue">
            متابعة آخر ذكر: {lastRead.title || "ذكر سابق"}
          </a>
        )}
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

      {isLoading ? (
        <p className="adhkar-loading-hint">جاري تحميل الأذكار…</p>
      ) : isError ? (
        <Empty text="تعذّر تحميل الأذكار من قاعدة البيانات." />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أذكار مطابقة." />
      ) : (
        <div className="adhkar-grid adhkar-grid--relaxed">
          {items.map((item) => (
            <AdhkarCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
