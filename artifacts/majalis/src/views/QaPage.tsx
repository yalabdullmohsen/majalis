import { useCallback, useEffect, useMemo, useState } from "react";
import { getQaCategories, getQaQuestions } from "@/lib/supabase";
import { QA_DISCLAIMER } from "@/lib/theme";
import { PageHeader, Empty, QaSkeleton } from "@/components/ui-common";
import { DEMO_QA, DEMO_QA_CATEGORIES } from "@/lib/demo-content";
import { QaCard } from "@/components/qa/QaCard";
import { QA_CANONICAL_CATEGORIES } from "@/lib/qa-categories";
import {
  countByCategorySlug,
  markQaSeen,
  normalizeQaItems,
  pickRandomQaItem,
  QA_SORT_LABELS,
  sortQaItems,
  type QaSortMode,
} from "@/lib/qa-utils";

function Disclaimer() {
  return (
    <div className="qa-disclaimer">
      <p>{QA_DISCLAIMER}</p>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function QaPage({
  initialCategories,
  initialQuestions,
}: {
  initialCategories?: any[];
  initialQuestions?: any[];
} = {}) {
  const [rawItems, setRawItems] = useState<any[]>(initialQuestions ?? []);
  const [categories, setCategories] = useState<any[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialQuestions);
  const [categoriesLoading, setCategoriesLoading] = useState(!initialCategories);
  const [categorySlug, setCategorySlug] = useState("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<QaSortMode>("default");
  const [randomId, setRandomId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const items = useMemo(() => normalizeQaItems(rawItems), [rawItems]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await getQaCategories();
      setCategories(data?.length ? data : DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"));
    } catch {
      setCategories(DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"));
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getQaQuestions({
        categoryId: categorySlug === "all" ? undefined : categorySlug,
        search: debouncedSearch,
      });
      setRawItems(data.length > 0 ? data : DEMO_QA);
    } catch {
      setRawItems(DEMO_QA);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, debouncedSearch]);

  useEffect(() => {
    if (initialCategories) return;
    loadCategories();
  }, [loadCategories, initialCategories]);

  useEffect(() => {
    if (initialQuestions && categorySlug === "all" && !debouncedSearch.trim()) return;
    loadQuestions();
  }, [loadQuestions, initialQuestions, categorySlug, debouncedSearch]);

  const categoryCounts = useMemo(() => countByCategorySlug(items), [items]);

  const categoryGrid = useMemo(() => {
    const dbBySlug = new Map(
      categories.map((c) => [c.slug || c.id?.replace("seed-cat-", ""), c]),
    );
    return QA_CANONICAL_CATEGORIES.filter((c) => {
      const count = categoryCounts[c.slug] || 0;
      return count > 0 || dbBySlug.has(c.slug);
    }).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: categoryCounts[c.slug] || 0,
      id: dbBySlug.get(c.slug)?.id || c.slug,
    }));
  }, [categories, categoryCounts]);

  const filteredItems = useMemo(() => {
    if (categorySlug === "all") return items;
    return items.filter((q) => {
      const slug = q.qa_categories?.slug || q.category_slug;
      const cat = categories.find((c) => c.id === categorySlug);
      return slug === categorySlug || slug === cat?.slug || q.category_id === categorySlug;
    });
  }, [items, categorySlug, categories]);

  const sortedItems = useMemo(
    () => sortQaItems(filteredItems, sortMode === "random" ? "default" : sortMode),
    [filteredItems, sortMode],
  );

  const randomItem = useMemo(() => {
    if (!randomId) return null;
    return items.find((q) => q.id === randomId) || null;
  }, [items, randomId]);

  const handleRandom = () => {
    const picked = pickRandomQaItem(filteredItems);
    if (picked) setRandomId(picked.id);
  };

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim()) {
      return `لا توجد أسئلة مطابقة لـ «${debouncedSearch.trim()}».`;
    }
    if (categorySlug !== "all") {
      return "لا توجد أسئلة في هذا التصنيف.";
    }
    return "لا توجد أسئلة منشورة.";
  }, [categorySlug, debouncedSearch]);

  const correctionsCount = useMemo(
    () => items.filter((q) => q._categoryCorrected).length,
    [items],
  );

  return (
    <div className="page-shell narrow content-hub-page qa-page qa-page-v2">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الأسئلة والأجوبة الدينية"
        subtitle="تصنيفات واضحة — بحث محسّن — أحدث الأسئلة والأكثر مشاهدة."
      />

      <Disclaimer />

      <div className="page-stats-row">
        <span>{items.length} سؤال</span>
        <span>{categoryGrid.length} تصنيف</span>
        {correctionsCount > 0 && (
          <span className="qa-corrections-badge">تم تصحيح {correctionsCount} تصنيف</span>
        )}
      </div>

      <div className="qa-v2-search-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في الأسئلة والأجوبة..."
          className="page-search-input full content-hub-search qa-v2-search"
          aria-label="بحث في الأسئلة والأجوبة"
        />
      </div>

      <div className="qa-sort-row qa-v2-sort-row">
        {(Object.keys(QA_SORT_LABELS) as QaSortMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`content-hub-chip${sortMode === mode ? " content-hub-chip--active" : ""}`}
            onClick={() => {
              setSortMode(mode);
              if (mode === "random") handleRandom();
            }}
          >
            {QA_SORT_LABELS[mode]}
          </button>
        ))}
      </div>

      <section className="qa-v2-categories" aria-labelledby="qa-categories-heading">
        <h2 id="qa-categories-heading" className="qa-v2-section-title">التصنيفات</h2>
        {categoriesLoading ? (
          <QaSkeleton count={4} />
        ) : (
          <div className="qa-v2-category-grid">
            <button
              type="button"
              className={`qa-v2-category-card${categorySlug === "all" ? " is-active" : ""}`}
              onClick={() => setCategorySlug("all")}
            >
              <span className="qa-v2-category-card__name">الكل</span>
              <span className="qa-v2-category-card__count">{items.length}</span>
            </button>
            {categoryGrid.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                className={`qa-v2-category-card${categorySlug === cat.slug || categorySlug === cat.id ? " is-active" : ""}`}
                onClick={() => setCategorySlug(cat.slug)}
              >
                <span className="qa-v2-category-card__name">{cat.name}</span>
                <span className="qa-v2-category-card__count">{cat.count}</span>
                <span className="qa-v2-category-card__desc">{cat.description}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {randomItem && (
        <section className="qa-random-highlight">
          <h2 className="qa-random-title">سؤال عشوائي</h2>
          <QaCard item={randomItem} defaultOpen />
          <button type="button" className="qa-random-refresh" onClick={handleRandom}>
            سؤال آخر
          </button>
        </section>
      )}

      {loading ? (
        <QaSkeleton count={6} />
      ) : sortedItems.length === 0 ? (
        <Empty text={emptyMessage} />
      ) : (
        <div className="qa-grid">
          {sortedItems.map((q) => (
            <div key={q.id} onMouseEnter={() => markQaSeen(q.id)}>
              <QaCard item={q} defaultOpen={q.id === randomId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
