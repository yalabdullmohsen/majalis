import { useCallback, useEffect, useMemo, useState } from "react";
import { getQaCategories, getQaQuestions } from "@/lib/supabase";
import { QA_DISCLAIMER } from "@/lib/theme";
import { PageHeader, Empty, QaSkeleton } from "@/components/ui-common";
import { DEMO_QA, DEMO_QA_CATEGORIES } from "@/lib/demo-content";
import { QaCard } from "@/components/qa/QaCard";
import { T } from "@/lib/terminology";
import {
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
  const [items, setItems] = useState<any[]>(initialQuestions ?? []);
  const [categories, setCategories] = useState<any[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialQuestions);
  const [categoriesLoading, setCategoriesLoading] = useState(!initialCategories);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<QaSortMode>("default");
  const [randomId, setRandomId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

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
        categoryId,
        search: debouncedSearch,
      });
      setItems(data.length > 0 ? data : DEMO_QA);
    } catch {
      setItems(DEMO_QA);
    } finally {
      setLoading(false);
    }
  }, [categoryId, debouncedSearch]);

  useEffect(() => {
    if (initialCategories) return;
    loadCategories();
  }, [loadCategories, initialCategories]);

  useEffect(() => {
    if (initialQuestions && categoryId === "all" && !debouncedSearch.trim()) return;
    loadQuestions();
  }, [loadQuestions, initialQuestions, categoryId, debouncedSearch]);

  const chips = useMemo(
    () => [{ id: "all", name: "الكل" }, ...categories],
    [categories],
  );

  const sortedItems = useMemo(
    () => sortQaItems(items, sortMode === "random" ? "default" : sortMode),
    [items, sortMode],
  );

  const randomItem = useMemo(() => {
    if (!randomId) return null;
    return items.find((q) => q.id === randomId) || null;
  }, [items, randomId]);

  const handleRandom = () => {
    const picked = pickRandomQaItem(items);
    if (picked) setRandomId(picked.id);
  };

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim()) {
      return `لا توجد أسئلة مطابقة لـ «${debouncedSearch.trim()}».`;
    }
    if (categoryId !== "all") {
      return "لا توجد أسئلة في هذا التصنيف.";
    }
    return "لا توجد أسئلة منشورة.";
  }, [categoryId, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page qa-page">
      <PageHeader
        eyebrow="المجلس العلمي"
        title={T.qaPageTitle}
        subtitle={T.qaPageSubtitle}
      />

      <Disclaimer />

      <div className="page-stats-row">
        <span>{sortedItems.length} سؤال</span>
        <span>{categories.length} تصنيف</span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={T.qaSearchPlaceholder}
        className="page-search-input full content-hub-search"
        aria-label={T.qaSearchPlaceholder}
      />

      <div className="content-hub-chips">
        {categoriesLoading ? (
          <QaSkeleton count={3} />
        ) : (
          chips.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={active ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      <div className="qa-sort-row">
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
            <QaCard key={q.id} item={q} defaultOpen={q.id === randomId} />
          ))}
        </div>
      )}
    </div>
  );
}
