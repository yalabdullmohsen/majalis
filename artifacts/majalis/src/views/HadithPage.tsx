import { useEffect, useMemo, useState } from "react";
import { getVerifiedHadith } from "@/lib/supabase";
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

export default function HadithPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("الكل");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setLoading(true);
    RequestManager.run("hadith:list", () => getVerifiedHadith())
      .then(({ data }) => setItems(data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const collections = useMemo(() => {
    const set = new Set<string>();
    items.forEach((h) => { if (h.collection) set.add(h.collection); });
    return ["الكل", ...Array.from(set).sort()];
  }, [items]);

  const displayItems = useMemo(() => {
    let list = items;
    if (collection !== "الكل") list = list.filter((h) => h.collection === collection);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim();
      list = list.filter((h) => arabicMatchAny([h.text, h.title, h.narrator, h.source_name, h.explanation], q));
    }
    return list;
  }, [items, collection, debouncedSearch]);

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأحاديث..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الأحاديث"
      />
      <div className="content-hub-chips">
        {collections.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCollection(c)}
            className={collection === c ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
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
        eyebrow="السنة النبوية"
        title="الأحاديث الموثقة"
        subtitle="أحاديث نبوية مختارة من مصادر موثوقة ومحققة."
      />

      <div className="ds-section__head">
        <div className="page-stats-row" style={{ marginBottom: 0 }}>
          <span>{displayItems.length} حديث</span>
          {collections.length > 1 && <span>{collections.length - 1} مجموعة</span>}
        </div>
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {loading ? (
        <Loading />
      ) : displayItems.length === 0 ? (
        <Empty text={debouncedSearch.trim() ? `لا توجد أحاديث مطابقة لـ «${debouncedSearch.trim()}».` : "لا توجد أحاديث متاحة حاليًا."} />
      ) : (
        <div className="hadith-grid">
          {displayItems.map((h) => (
            <article key={h.id} className="ui-card hadith-card">
              {h.title && h.title !== "حديث" && (
                <h3 className="hadith-card__title">{h.title}</h3>
              )}
              <blockquote className="hadith-card__text">{h.text}</blockquote>
              <div className="hadith-card__meta">
                {h.narrator && <span><strong>الراوي:</strong> {h.narrator}</span>}
                {h.source_name && <span><strong>المصدر:</strong> {h.source_name}</span>}
                {h.grade && <span className="hadith-card__grade">{h.grade}</span>}
              </div>
              {h.explanation && (
                <p className="hadith-card__explanation">{h.explanation}</p>
              )}
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
    </div>
  );
}
