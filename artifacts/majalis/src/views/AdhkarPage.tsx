import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Sparkles } from "lucide-react";
import { ADHKAR_CATEGORIES } from "@/lib/adhkar-seed";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import { getReadingProgress, restoreScrollForSection } from "@/lib/reading-progress";
import { Empty } from "@/components/ui-common";
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
  const completedCount = publishedItems.length;

  return (
    <div className="page-shell narrow adhkar-page adhkar-page--v3">
      <header className="adhkar-v3-header">
        <div className="adhkar-v3-header__icon" aria-hidden="true">
          <Sparkles size={22} strokeWidth={2} />
        </div>
        <div className="adhkar-v3-header__copy">
          <p className="adhkar-v3-header__eyebrow">العبادة اليومية</p>
          <h1 className="adhkar-v3-header__title">الأذكار</h1>
          <p className="adhkar-v3-header__subtitle">
            أذكار وأدعية من القرآن والسنة — قراءة هادئة وعداد تسبيح مدمج.
          </p>
        </div>
      </header>

      <div className="adhkar-v3-toolbar ui-card">
        <div className="adhkar-v3-stats">
          <div className="adhkar-v3-stat">
            <strong>{completedCount}</strong>
            <span>ذكر</span>
          </div>
          <div className="adhkar-v3-stat">
            <strong>{FEATURED_CATEGORIES.length}</strong>
            <span>قسم</span>
          </div>
          <Link href="/tasbih" className="adhkar-v3-tasbih-link">
            عداد التسبيح ←
          </Link>
        </div>
        {lastRead && (
          <a href={`#content-${lastRead.id}`} className="adhkar-v3-continue">
            متابعة: {lastRead.title || "آخر ذكر"}
          </a>
        )}
      </div>

      <div className="adhkar-v3-search-wrap">
        <Search className="adhkar-v3-search-icon" size={18} aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في الأذكار..."
          className="adhkar-v3-search"
          aria-label="بحث في الأذكار"
        />
      </div>

      <div className="adhkar-v3-chips" role="tablist" aria-label="تصنيفات الأذكار">
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          className={`adhkar-v3-chip${category === "all" ? " adhkar-v3-chip--active" : ""}`}
          onClick={() => setCategory("all")}
        >
          الكل
        </button>
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={`adhkar-v3-chip${category === cat.id ? " adhkar-v3-chip--active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeCategory && category !== "all" && (
        <p className="adhkar-v3-category-desc">{activeCategory.description}</p>
      )}

      {isLoading ? (
        <div className="adhkar-v3-loading">
          <div className="adhkar-v3-loading__dots" aria-hidden="true" />
          <p>جاري تحميل الأذكار…</p>
        </div>
      ) : isError ? (
        <Empty text="تعذّر تحميل الأذكار من قاعدة البيانات." />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أذكار مطابقة." />
      ) : (
        <div className="adhkar-v3-grid">
          {items.map((item) => (
            <AdhkarCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
