import { useEffect, useState } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useAuth } from "@/components/AuthProvider";
import { getMiracles } from "@/lib/supabase";
import { PageHeader, Chip } from "@/components/ui-common";
import { AsyncDataView } from "@/components/AsyncDataView";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { MIRACLE_CATEGORIES } from "@/lib/miracles-seed";
import { safeLoadEffect } from "@/lib/safe-load";
import { GeometricPattern } from "@/components/design/GeometricPattern";

const CATEGORIES = MIRACLE_CATEGORIES;
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];

type PatternType = "honeycomb" | "stars" | "waves" | "mountains" | "orbits" | "vines" | "metallic" | "circles";

// نمط بصري مستوحى من موضوع كل فئة
const CATEGORY_PATTERN: Record<string, PatternType> = {
  "علم الأحياء":   "honeycomb",   // خلية النحل
  "علم الفلك":     "orbits",      // مسارات كوكبية
  "علم الأرض":     "mountains",   // طبقات صخرية
  "الطب":          "circles",     // حلقات نمو
  "الفيزياء":      "metallic",    // بنية بلورية
  "علم البحار":    "waves",       // أمواج
  "علم الأجنة":    "circles",     // أطوار متداخلة
  "الرياضيات":     "stars",       // هندسة
  "التاريخ":       "stars",       // نجوم إسلامية
  "الإعجاز اللغوي": "vines",     // تشعبات لغوية
};

// ألوان رأس البطاقة حسب الفئة — سُلَّم Emerald
const CATEGORY_PALETTE: Record<string, { bg: string; accent: string }> = {
  "علم الأحياء":   { bg: "#18362A", accent: "#97A59F" },
  "علم الفلك":     { bg: "#12281F", accent: "#BEC7C3" },
  "علم الأرض":     { bg: "#153025", accent: "#97A59F" },
  "الطب":          { bg: "#0E2019", accent: "#BEC7C3" },
  "الفيزياء":      { bg: "#18362A", accent: "#97A59F" },
  "علم البحار":    { bg: "#153025", accent: "#BEC7C3" },
  "علم الأجنة":    { bg: "#12281F", accent: "#97A59F" },
  "الرياضيات":     { bg: "#0E2019", accent: "#BEC7C3" },
  "التاريخ":       { bg: "#18362A", accent: "#97A59F" },
  "الإعجاز اللغوي": { bg: "#18362A", accent: "#BEC7C3" },
};

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
  "سنة":  "#153025",
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
            const icon        = CATEGORY_ICONS[item.category] ?? "✨";
            const borderColor = SOURCE_COLORS[item.source_type] ?? "#c9a84c";
            const palette     = CATEGORY_PALETTE[item.category] ?? { bg: "#1a5c35", accent: "#86efac" };
            const pattern     = CATEGORY_PATTERN[item.category] ?? "stars";
            const isExpanded  = expanded === item.id;
            const bodyText: string = item.body ?? "";
            const preview = bodyText.slice(0, 220);
            return (
              <article
                key={item.id}
                className="miracle-item"
                style={{ border: "1px solid var(--majalis-line)", borderRadius: "1rem", overflow: "hidden", background: "var(--majalis-panel)", display: "flex", flexDirection: "column" }}
              >
                {/* رأس ملوّن بنمط موضوعي */}
                <div style={{ background: palette.bg, padding: "1rem", position: "relative", overflow: "hidden" }}>
                  <GeometricPattern pattern={pattern} color={palette.accent} opacity={0.15} />
                  <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.8rem", lineHeight: 1, flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <p className="miracle-item__title" style={{ color: "#fff", marginBottom: "0.25rem" }}>{item.title}</p>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {item.category && (
                          <span style={{ padding: "0.15rem 0.6rem", borderRadius: "1rem", fontSize: "0.7rem", background: `${palette.accent}25`, color: palette.accent, fontWeight: 600, border: `1px solid ${palette.accent}40` }}>
                            {item.category}
                          </span>
                        )}
                        {item.source_type && (
                          <span style={{ padding: "0.15rem 0.6rem", borderRadius: "1rem", fontSize: "0.7rem", background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600 }}>
                            {item.source_type === "قرآن" ? "📖 قرآن" : "📚 سنة"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* المحتوى */}
                <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {item.reference && (
                    <p className="miracle-item__ref" style={{ fontFamily: "var(--font-quran)", fontSize: "1rem", color: borderColor, borderRight: `3px solid ${borderColor}`, paddingRight: "0.5rem", lineHeight: 1.8 }}>
                      ﴾ {item.reference} ﴿
                    </p>
                  )}
                  {bodyText && (
                    <>
                      <p className="miracle-item__body" style={{ fontSize: "0.875rem", lineHeight: 1.75, flex: 1 }}>
                        {isExpanded ? bodyText : `${preview}${bodyText.length > 220 ? "..." : ""}`}
                      </p>
                      {bodyText.length > 220 && (
                        <button
                          type="button"
                          className="miracle-item__toggle"
                          onClick={() => setExpanded(isExpanded ? null : item.id)}
                          style={{ color: "var(--majalis-emerald)", background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, padding: "0.25rem 0", alignSelf: "flex-start" }}
                        >
                          {isExpanded ? "▲ عرض أقل" : "▼ اقرأ المزيد"}
                        </button>
                      )}
                    </>
                  )}
                  {item.scholarly_source && (
                    <p className="miracle-item__source" style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--majalis-line)" }}>
                      📚 {item.scholarly_source}
                    </p>
                  )}
                </div>
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
      <AdminQuickEdit section="miracles" />
    </div>
  );
}
