import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getMiracles } from "@/lib/supabase";
import { PageHeader, Chip } from "@/components/ui-common";
import { AsyncDataView } from "@/components/AsyncDataView";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { MIRACLE_CATEGORIES } from "@/lib/miracles-seed";
import { safeLoadEffect } from "@/lib/safe-load";

const CATEGORIES = MIRACLE_CATEGORIES;
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];
const DISCLAIMER =
  "تنبيه: الملاحظات العلمية قد تتطور مع البحث، والقرآن لا يُبنى على نظريات غير مستقرة؛ نعرض ما يُستدل به للتفكر لا كحكم علمي نهائي.";

export default function MiraclesPage({
  initialItems,
}: {
  initialItems?: any[];
} = {}) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("الكل");
  const [sourceType, setSourceType] = useState("الكل");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (initialItems && category === "الكل" && sourceType === "الكل" && reloadKey === 0) return;

    setError(null);
    return safeLoadEffect(
      setLoading,
      () =>
        getMiracles({
          category: category === "الكل" ? undefined : category,
          sourceType: sourceType === "الكل" ? undefined : sourceType,
        }),
      ({ data }) => setItems(data ?? []),
      (msg) => {
        setError(msg);
        setItems([]);
      },
      { label: `miracles:${category}:${sourceType}:${reloadKey}` },
    );
  }, [category, sourceType, initialItems, reloadKey]);

  const status = loading ? "loading" : error ? "error" : items.length === 0 ? "empty" : "success";

  const filterPanel = (
    <>
      <div className="miracles-filters">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div className="miracles-filters">
        {SOURCE_TYPES.map((s) => (
          <Chip key={s} active={sourceType === s} onClick={() => setSourceType(s)}>{s}</Chip>
        ))}
      </div>
    </>
  );

  return (
    <div className="page-shell ds-page">
      <PageHeader
        eyebrow="علم وإيمان"
        title="الإعجاز العلمي"
        subtitle="مقالات موثّقة تربط الاكتشافات العلمية بالآيات القرآنية والأحاديث النبوية."
      />

      <p className="miracles-disclaimer">{DISCLAIMER}</p>

      <div className="ds-section__head">
        {isAdmin && <p className="ds-section__title" style={{ margin: 0 }}>{items.length} مقالة</p>}
        <FilterToggle onClick={() => setFiltersOpen(true)} label="تصفية" />
      </div>

      <AsyncDataView
        status={status}
        error={error}
        onRetry={() => setReloadKey((k) => k + 1)}
        emptyText="لا توجد بيانات حالياً"
      >
        <div className="ds-grid">
          {items.map((item: any) => (
            <article key={item.id} className="miracle-item">
              <div className="miracle-item__head">
                <p className="miracle-item__title">{item.title}</p>
                <div className="miracle-item__tags">
                  {item.category && <span className="ds-badge">{item.category}</span>}
                  {item.source_type && <span className="ds-badge">{item.source_type}</span>}
                </div>
              </div>
              {item.reference && <p className="miracle-item__ref">{item.reference}</p>}
              {item.body && (
                <>
                  <p className="miracle-item__body">
                    {expanded === item.id ? item.body : `${item.body.slice(0, 200)}${item.body.length > 200 ? "..." : ""}`}
                  </p>
                  {item.body.length > 200 && (
                    <button
                      type="button"
                      className="miracle-item__toggle"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      {expanded === item.id ? "عرض أقل" : "اقرأ المزيد"}
                    </button>
                  )}
                </>
              )}
              {item.scholarly_source && (
                <p className="miracle-item__source">المرجع: {item.scholarly_source}</p>
              )}
            </article>
          ))}
        </div>
      </AsyncDataView>

      <aside className="ds-filters-panel ds-filters-panel--desktop">
        <div className="ds-filters-panel__head">
          <h2>تصفية المقالات</h2>
        </div>
        {filterPanel}
      </aside>

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="تصفية المقالات">
        {filterPanel}
      </FilterBottomSheet>
    </div>
  );
}
