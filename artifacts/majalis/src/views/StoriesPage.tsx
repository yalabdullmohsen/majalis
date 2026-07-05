import { useEffect, useMemo, useState } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useAuth } from "@/components/AuthProvider";
import { getAkpStories } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { arabicMatchAny } from "@/lib/arabic-search";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function StoriesPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setLoading(true);
    RequestManager.run("stories:list", () => getAkpStories())
      .then(({ data }) => setItems(data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => { if (s.category) set.add(s.category); });
    return ["الكل", ...Array.from(set).sort()];
  }, [items]);

  const displayItems = useMemo(() => {
    let list = items;
    if (category !== "الكل") list = list.filter((s) => s.category === category);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim();
      list = list.filter((s) => arabicMatchAny([s.title, s.body, s.summary, s.topic, s.source_name], q));
    }
    return list;
  }, [items, category, debouncedSearch]);

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في القصص..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في القصص"
      />
      <div className="content-hub-chips">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={category === c ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {c}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="page-shell narrow content-hub-page ds-page">
      <PageHeader
        eyebrow="القصص والسير"
        title="القصص الإسلامية"
        subtitle="قصص من السيرة النبوية وأخبار الصحابة والأنبياء."
      />

      <div className="ds-section__head">
        {isAdmin && (
          <div className="page-stats-row" style={{ marginBottom: 0 }}>
            <span>{displayItems.length} قصة</span>
            {categories.length > 1 && <span>{categories.length - 1} تصنيف</span>}
          </div>
        )}
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {loading ? (
        <Loading />
      ) : displayItems.length === 0 ? (
        <Empty text={debouncedSearch.trim() ? `لا توجد قصص مطابقة لـ «${debouncedSearch.trim()}».` : "لا توجد قصص متاحة حاليًا."} />
      ) : (
        <div className="stories-grid">
          {displayItems.map((s) => (
            <article key={s.id} className="ui-card story-card">
              <h3 className="story-card__title">{s.title}</h3>
              {s.topic && <p className="story-card__topic">{s.topic}</p>}
              {s.summary ? (
                <p className="story-card__summary">{s.summary}</p>
              ) : s.body ? (
                <p className="story-card__body">{s.body.slice(0, 300)}{s.body.length > 300 ? "…" : ""}</p>
              ) : null}
              <div className="story-card__meta">
                {s.category && <span className="story-card__category">{s.category}</span>}
                {s.source_name && <span><strong>المصدر:</strong> {s.source_name}</span>}
              </div>
            </article>
          ))}
        </div>
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
      <AdminQuickEdit section="islamic-stories" />
    </div>
  );
}
