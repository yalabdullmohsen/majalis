import { useEffect, useMemo, useState } from "react";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getFiqhDecisions } from "@/lib/platform-content-service";
import { FIQH_CATEGORIES, FIQH_DECISION_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function FiqhCouncilPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [decisionType, setDecisionType] = useState("الكل");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("fiqh-council", null);

  useEffect(() => {
    setLoading(true);
    getFiqhDecisions({ category, type: decisionType, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [category, decisionType, debouncedSearch]);

  const displayCategories = useMemo(() => ["الكل", ...FIQH_CATEGORIES], []);
  const displayTypes = useMemo(() => ["الكل", ...FIQH_DECISION_TYPES], []);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="الفقه المعاصر"
        title="المجمع الفقهي الإسلامي"
        subtitle="قرارات وبحوث وتوصيات وبيانات وفتاوى جماعية — مع تصنيف وبحث ومراجع أصلية."
      />

      <div className="page-stats-row">
        <span>{items.length} عنصر</span>
        <span>{FIQH_CATEGORIES.length} تصنيف</span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في قرارات المجمع..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في قرارات المجمع الفقهي"
      />

      <div className="content-hub-chips">
        {displayCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="content-hub-chips" style={{ marginTop: "0.5rem" }}>
        {displayTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setDecisionType(t)}
            className={decisionType === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد قرارات مطابقة." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/fiqh-council/${item.id}`}
              title={item.title}
              tag={item.decision_type}
              meta={[item.category, item.decision_date, item.session_number ? `الجلسة ${item.session_number}` : ""].filter(Boolean).join(" · ")}
              summary={item.summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
