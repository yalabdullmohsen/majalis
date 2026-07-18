import { useCallback, useEffect, useMemo, useState } from "react";
import { Scale } from "lucide-react";
import { Link, useSearch } from "wouter";
import { getQaCategories, getQaQuestions } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

const FIQH_HUB_TABS = [
  { key: "rulings", label: "الأحكام الشرعية", href: "/rulings" },
  { key: "qa",      label: "الأسئلة الشرعية", href: "/qa" },
  { key: "council", label: "المجمع الفقهي",   href: "/fiqh-council" },
] as const;
type FiqhTab = (typeof FIQH_HUB_TABS)[number]["key"];

function FiqhHubStrip({ current }: { current: FiqhTab }) {
  return (
    <nav className="fiqh-hub-strip" dir="rtl" aria-label="الأقسام الشرعية">
      <Link href="/fiqh" className="fiqh-hub-strip__brand"><Scale size={14} className="inline ml-1" />الفقه الإسلامي</Link>
      <span className="fiqh-hub-strip__sep" aria-hidden="true">·</span>
      {FIQH_HUB_TABS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`fiqh-hub-strip__tab${item.key === current ? " fiqh-hub-strip__tab--active" : ""}`}
          aria-current={item.key === current ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
import { RequestManager } from "@/lib/request-manager";
import { QA_DISCLAIMER } from "@/lib/theme";
import { PageHeader, QaSkeleton } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { usePersistedState } from "@/hooks/usePersistedState";
import { DEMO_QA, DEMO_QA_CATEGORIES } from "@/lib/demo-content";
import { QaCard } from "@/components/qa/QaCard";
import { useAuth } from "@/components/AuthProvider";
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
  const { isAdmin } = useAuth();
  const [rawItems, setRawItems] = useState<any[]>(initialQuestions ?? []);
  const [categories, setCategories] = useState<any[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialQuestions);
  const [categoriesLoading, setCategoriesLoading] = useState(!initialCategories);
  const [categorySlug, setCategorySlug] = usePersistedState("filters:/qa:categorySlug", "all");
  const [search, setSearch] = usePersistedState("filters:/qa:search", "");
  const [sortMode, setSortMode] = usePersistedState<QaSortMode>("filters:/qa:sortMode", "default");
  const [randomId, setRandomId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const urlSearch = useSearch();

  const items = useMemo(() => normalizeQaItems(rawItems), [rawItems]);

  // رابط وارد بـ`?cat=...` (من FiqhPage) كان يُتجاهَل كليًا: الحالة تُقرأ
  // فقط من usePersistedState بلا مزامنة مع URL الفعلي عند الوصول — نفس
  // عائلة عطل TYPE_HREF.scholar الصامت. اكتُشف بالفحص المباشر 2026-07-18.
  useEffect(() => {
    const cat = new URLSearchParams(urlSearch).get("cat");
    if (cat) setCategorySlug(cat);
  }, [urlSearch]);

  useEffect(() => {
    const topQa = DEMO_QA.filter((q: any) => q.answer).slice(0, 8);
    const faqSchema = topQa.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: topQa.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: { "@type": "Answer", text: q.answer },
          })),
        }
      : undefined;
    applyPageSeo({
      path: "/qa",
      title: "الأسئلة والأجوبة الشرعية | المجلس العلمي",
      description: "أسئلة وأجوبة شرعية في الفقه والعقيدة والعبادات والمعاملات، موثقة من العلماء والمراجع الموثوقة.",
      keywords: ["أسئلة شرعية", "أجوبة شرعية", "فتاوى", "فقه إسلامي", "سؤال وجواب"],
      ...(faqSchema ? { jsonLd: [faqSchema] } : {}),
    });
  }, []);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await RequestManager.run("qa:categories", () => getQaCategories());
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
      const { data } = await RequestManager.run("qa:questions", () =>
        getQaQuestions({
          categoryId: categorySlug === "all" ? undefined : categorySlug,
          search: debouncedSearch,
        }),
      );
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

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأسئلة والأجوبة..."
        className="page-search-input full content-hub-search qa-v2-search"
        aria-label="بحث في الأسئلة والأجوبة"
      />
      <div className="qa-sort-row qa-v2-sort-row" role="tablist" aria-label="ترتيب الأسئلة">
        {(Object.keys(QA_SORT_LABELS) as QaSortMode[]).map((mode) => (
          <button
            key={mode}
            role="tab"
            type="button"
            className={`content-hub-chip${sortMode === mode ? " content-hub-chip--active" : ""}`}
            onClick={() => {
              setSortMode(mode);
              if (mode === "random") handleRandom();
            }}
            aria-selected={sortMode === mode}
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
              {isAdmin && <span className="qa-v2-category-card__count">{items.length}</span>}
            </button>
            {categoryGrid.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                className={`qa-v2-category-card${categorySlug === cat.slug || categorySlug === cat.id ? " is-active" : ""}`}
                onClick={() => setCategorySlug(cat.slug)}
              >
                <span className="qa-v2-category-card__name">{cat.name}</span>
                {isAdmin && <span className="qa-v2-category-card__count">{cat.count}</span>}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="page-shell narrow content-hub-page qa-page qa-page-v2 ds-page">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الأسئلة والأجوبة"
        subtitle="أحدث الأسئلة والأجوبة الشرعية الموثقة."
      />

      <FiqhHubStrip current="qa" />

      <Disclaimer />

      <div className="ds-section__head">
        {isAdmin && (
          <div className="page-stats-row page-stats-row--flush">
            <span>{sortedItems.length} سؤال</span>
            <span>{categoryGrid.length} تصنيف</span>
            {correctionsCount > 0 && (
              <span className="qa-corrections-badge">تم تصحيح {correctionsCount} تصنيف</span>
            )}
          </div>
        )}
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {randomItem && (
        <section className="qa-random-highlight">
          <h2 className="qa-random-title">سؤال عشوائي</h2>
          <QaCard item={randomItem} defaultOpen />
          <button type="button" className="qa-random-refresh ds-btn ds-btn--ghost ds-btn--sm" onClick={handleRandom}>
            سؤال آخر
          </button>
        </section>
      )}

      <PageLoadingGuard
        loading={loading}
        empty={!loading && sortedItems.length === 0}
        emptyText={emptyMessage}
        onRetry={loadQuestions}
      >
        <div className="qa-grid">
          {sortedItems.map((q) => (
            <div key={q.id} onMouseEnter={() => markQaSeen(q.id)}>
              <QaCard item={q} defaultOpen={q.id === randomId} />
            </div>
          ))}
        </div>
      </PageLoadingGuard>

      <aside className="ds-filters-panel ds-filters-panel--desktop">
        <div className="ds-filters-panel__head">
          <h2>بحث وتصفية</h2>
        </div>
        {filtersPanel}
      </aside>

      <div className="twh-share">
        <ShareButtons title="الأسئلة والأجوبة الشرعية — المجلس العلمي" url="https://www.majlisilm.com/qa" />
      </div>

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="بحث وتصفية">
        {filtersPanel}
      </FilterBottomSheet>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه والأسئلة الشرعية" count={4} />
      </div>
    </div>
  );
}
