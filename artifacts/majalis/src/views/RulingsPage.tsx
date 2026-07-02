import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { RulingCard } from "@/components/rulings/RulingCard";
import { RulingCategoryGrid } from "@/components/rulings/RulingCategoryGrid";
import { RulingFilters } from "@/components/rulings/RulingFilters";
import {
  getRulingsEncyclopedia,
  getRulingCategoryStats,
  getRulingsEncyclopediaTotal,
} from "@/lib/rulings-service";
import type { CategoryStat, RulingSortMode, ShariaRulingExtended } from "@/lib/rulings-types";
import { usePageView } from "@/hooks/usePageView";
import { RequestManager } from "@/lib/request-manager";
import { RULINGS_CATEGORY_TREE } from "@/lib/rulings-categories";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const PAGE_SIZE = 24;

export default function RulingsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<ShariaRulingExtended[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbState, setDbState] = useState<{ needsSeed?: boolean; dbError?: string }>({});
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [encyclopediaTotal, setEncyclopediaTotal] = useState(0);
  const [category, setCategory] = useState("الكل");
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<RulingSortMode>("importance");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  usePageView("rulings", null);

  const loadStats = useCallback(async () => {
    const [catStats, totalCount] = await Promise.all([
      getRulingCategoryStats(),
      isAdmin ? getRulingsEncyclopediaTotal() : Promise.resolve(0),
    ]);
    setStats(catStats);
    setEncyclopediaTotal(totalCount);
  }, [isAdmin]);

  const loadRulings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await RequestManager.run("rulings:encyclopedia", () =>
        getRulingsEncyclopedia({
          category,
          subcategory,
          search: debouncedSearch,
          sort,
          page,
          limit: PAGE_SIZE,
        }),
      );
      setItems(result.data);
      setTotal(result.total);
      setDbState({ needsSeed: result.needsSeed, dbError: result.dbError });
    } catch (err) {
      setItems([]);
      setTotal(0);
      setDbState({ dbError: String((err as Error)?.message || err) });
    } finally {
      setLoading(false);
    }
  }, [category, subcategory, debouncedSearch, sort, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setPage(1);
  }, [category, subcategory, debouncedSearch, sort]);

  useEffect(() => {
    loadRulings();
  }, [loadRulings]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const mainCategories = RULINGS_CATEGORY_TREE.length;

  const handleCategorySelect = (cat: string, sub?: string) => {
    setCategory(cat);
    setSubcategory(sub);
  };

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في العنوان، الدليل، الآيات..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في موسوعة الأحكام الشرعية"
      />
      <RulingFilters
        sort={sort}
        onSortChange={setSort}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((v) => !v)}
      />
      {showAdvanced ? (
        <RulingCategoryGrid
          stats={stats}
          activeCategory={category}
          activeSubcategory={subcategory}
          onSelect={handleCategorySelect}
        />
      ) : (
        <div className="content-hub-chips ruling-quick-chips">
          <button
            type="button"
            className={category === "الكل" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            onClick={() => handleCategorySelect("الكل")}
          >
            {isAdmin ? `الكل (${encyclopediaTotal || total})` : "الكل"}
          </button>
          {RULINGS_CATEGORY_TREE.slice(0, 8).map((cat) => {
            const count = stats.filter((s) => s.category === cat.name).reduce((n, s) => n + s.count, 0);
            if (!count) return null;
            return (
              <button
                key={cat.slug}
                type="button"
                className={
                  category === cat.name ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"
                }
                onClick={() => handleCategorySelect(cat.name)}
              >
                {cat.icon} {cat.name}{isAdmin ? ` (${count})` : ""}
              </button>
            );
          })}
          <button type="button" className="content-hub-chip" onClick={() => setShowAdvanced(true)}>
            المزيد...
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="page-shell narrow content-hub-page rulings-encyclopedia-page ds-page">
      <PageHeader
        eyebrow="موسوعة الفقه"
        title="الأحكام الشرعية"
        subtitle="مكتبة علمية شاملة للأحكام — موثقة بالأدلة والمراجع."
      />

      <div className="ds-section__head">
        {isAdmin && (
          <div className="page-stats-row ruling-stats-bar" style={{ marginBottom: 0 }}>
            <span>{encyclopediaTotal || total} حكم</span>
            <span>{mainCategories} قسم</span>
            <span>{stats.length} تصنيف</span>
          </div>
        )}
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty
          text={
            dbState.needsSeed
              ? "قاعدة البيانات جاهزة لكن لم تُستورد الأحكام بعد. شغّل Production Activation من لوحة الإدارة."
              : dbState.dbError === "table_missing"
                ? "جدول sharia_rulings غير موجود — طبّق migrations التفعيل أولاً."
                : dbState.dbError
                  ? `تعذّر تحميل الأحكام: ${dbState.dbError}`
                  : "لا توجد أحكام مطابقة."
          }
        />
      ) : (
        <>
          <div className="ruling-card-grid">
            {items.map((item) => (
              <RulingCard key={item.id} ruling={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="ruling-pagination" aria-label="ترقيم الصفحات">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </button>
              <span>
                صفحة {page} من {totalPages}{isAdmin ? ` (${total} حكم)` : ""}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
              </button>
            </nav>
          )}
        </>
      )}

      <aside className="ds-filters-panel ds-filters-panel--desktop">
        <div className="ds-filters-panel__head">
          <h2>بحث وتصفية</h2>
        </div>
        {filtersPanel}
      </aside>

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="بحث وتصفية">
        {filtersPanel}
      </FilterBottomSheet>
    </div>
  );
}
