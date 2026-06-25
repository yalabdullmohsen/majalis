import { useEffect, useMemo, useState } from "react";
import { ADHKAR_CATEGORIES, ADHKAR_ITEMS, filterAdhkar } from "@/lib/adhkar-seed";
import { PageHeader } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";

function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AdhkarPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const items = useMemo(
    () => filterAdhkar(debouncedSearch, category),
    [debouncedSearch, category],
  );

  const activeCategory = ADHKAR_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="page-shell narrow content-hub-page adhkar-page">
      <PageHeader
        eyebrow="العبادة اليومية"
        title="الأذكار"
        subtitle="أذكار وأدعية من القرآن والسنة الصحيحة، مع المصدر والتخريج."
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأذكار..."
        className="page-search-input full content-hub-search"
      />

      <div className="content-hub-chips">
        <button
          type="button"
          className={`content-hub-chip${category === "all" ? " is-active" : ""}`}
          onClick={() => setCategory("all")}
        >
          الكل
        </button>
        {ADHKAR_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`content-hub-chip${category === cat.id ? " is-active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeCategory && category !== "all" && (
        <p className="adhkar-category-desc">{activeCategory.description}</p>
      )}

      <div className="adhkar-list">
        {items.length === 0 ? (
          <p className="content-hub-empty">لا توجد أذكار مطابقة.</p>
        ) : (
          items.map((item) => {
            const open = expandedId === item.id;
            const cat = ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId);
            return (
              <article key={item.id} className="ui-card adhkar-item">
                <button
                  type="button"
                  className="adhkar-item-toggle"
                  onClick={() => setExpandedId(open ? null : item.id)}
                  aria-expanded={open}
                >
                  <span className="home-tag">{cat?.name}</span>
                  <p className="adhkar-text">{item.text}</p>
                  <span className="adhkar-count">× {item.count}</span>
                </button>
                {open && (
                  <div className="adhkar-meta">
                    {item.narrator && <p><strong>الراوي:</strong> {item.narrator}</p>}
                    {item.source && <p><strong>المصدر:</strong> {item.source}</p>}
                    {item.grade && <p><strong>الدرجة:</strong> {item.grade}</p>}
                    {item.reference && <p><strong>المرجع:</strong> {item.reference}</p>}
                    <ContentActions text={item.text} title={cat?.name || "ذكر"} />
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
