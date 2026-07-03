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

const CATEGORY_ICONS: Record<string, string> = {
  "علم الأحياء": "🧬",
  "علم الفلك": "🌌",
  "علم الأرض": "🌍",
  "الطب": "⚕️",
  "الفيزياء": "⚛️",
  "علم البحار": "🌊",
  "علم الأجنة": "🔬",
  "الرياضيات": "📐",
  "التاريخ": "📜",
  "الإعجاز اللغوي": "📖",
};

const SOURCE_COLORS: Record<string, string> = {
  "قرآن": "#1a5c35",
  "سنة":  "#78350f",
};

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
          {items.map((item: any) => {
            const icon = CATEGORY_ICONS[item.category] ?? "✨";
            const borderColor = SOURCE_COLORS[item.source_type] ?? "#c9a84c";
            const isExpanded = expanded === item.id;
            const bodyText: string = item.body ?? "";
            const preview = bodyText.slice(0, 220);
            return (
              <article
                key={item.id}
                className="miracle-item"
                style={{ borderRight: `4px solid ${borderColor}`, position: "relative" }}
              >
                <div className="miracle-item__head" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.8rem", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <p className="miracle-item__title">{item.title}</p>
                    <div className="miracle-item__tags">
                      {item.category && (
                        <span className="ds-badge" style={{ background: `${borderColor}18`, color: borderColor, border: `1px solid ${borderColor}40` }}>
                          {item.category}
                        </span>
                      )}
                      {item.source_type && <span className="ds-badge">{item.source_type}</span>}
                    </div>
                  </div>
                </div>
                {item.reference && (
                  <p className="miracle-item__ref" style={{ fontFamily: "serif", fontSize: "1rem", color: "#1a5c35", marginTop: "0.5rem" }}>
                    ﴾ {item.reference} ﴿
                  </p>
                )}
                {bodyText && (
                  <>
                    <p className="miracle-item__body">
                      {isExpanded ? bodyText : `${preview}${bodyText.length > 220 ? "..." : ""}`}
                    </p>
                    {bodyText.length > 220 && (
                      <button
                        type="button"
                        className="miracle-item__toggle"
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                      >
                        {isExpanded ? "▲ عرض أقل" : "▼ اقرأ المزيد"}
                      </button>
                    )}
                  </>
                )}
                {item.scholarly_source && (
                  <p className="miracle-item__source" style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#78716c" }}>
                    📚 {item.scholarly_source}
                  </p>
                )}
              </article>
            );
          })}
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
