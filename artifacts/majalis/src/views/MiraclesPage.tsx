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
import { applyPageSeo } from "@/lib/seo";

const CATEGORIES = MIRACLE_CATEGORIES;
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];

type PatternType = "honeycomb" | "stars" | "waves" | "mountains" | "orbits" | "vines" | "metallic" | "circles";

// نمط بصري مستوحى من موضوع كل فئة
const CATEGORY_PATTERN: Record<string, PatternType> = {
  "الكون":    "orbits",
  "الفلك":    "orbits",
  "الجبال":   "mountains",
  "البحار":   "waves",
  "الأجنة":   "circles",
  "النبات":   "honeycomb",
  "الحيوان":  "vines",
  "الطب":     "circles",
  "المياه":   "waves",
  "الحديد":   "metallic",
  "الرياح":   "waves",
  "السحاب":   "orbits",
  "الحشرات":  "honeycomb",
  "الأرض":    "mountains",
  "الزمن":    "stars",
  "الضوء":    "metallic",
  "الجلد":    "circles",
  "العظام":   "metallic",
  "النجوم":   "stars",
  "الدم":     "circles",
};

// ألوان رأس البطاقة حسب الفئة — سُلَّم Emerald
const CATEGORY_PALETTE: Record<string, { bg: string; accent: string }> = {
  "الكون":    { bg: "#12281F", accent: "#BEC7C3" },
  "الفلك":    { bg: "#0E2019", accent: "#BEC7C3" },
  "الجبال":   { bg: "#153025", accent: "#97A59F" },
  "البحار":   { bg: "#153025", accent: "#BEC7C3" },
  "الأجنة":   { bg: "#12281F", accent: "#97A59F" },
  "النبات":   { bg: "#18362A", accent: "#97A59F" },
  "الحيوان":  { bg: "#153025", accent: "#97A59F" },
  "الطب":     { bg: "#0E2019", accent: "#BEC7C3" },
  "المياه":   { bg: "#0E2019", accent: "#BEC7C3" },
  "الحديد":   { bg: "#1a3020", accent: "#97A59F" },
  "الرياح":   { bg: "#12281F", accent: "#BEC7C3" },
  "السحاب":   { bg: "#153025", accent: "#BEC7C3" },
  "الحشرات":  { bg: "#18362A", accent: "#97A59F" },
  "الأرض":    { bg: "#153025", accent: "#97A59F" },
  "الزمن":    { bg: "#12281F", accent: "#BEC7C3" },
  "الضوء":    { bg: "#1a3a1a", accent: "#d4e8a0" },
  "الجلد":    { bg: "#1e2a1e", accent: "#BEC7C3" },
  "العظام":   { bg: "#1a3020", accent: "#d4c8a0" },
  "النجوم":   { bg: "#0a1a30", accent: "#c8d4e8" },
  "الدم":     { bg: "#2a1010", accent: "#e8a0a0" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "الكون":    "🌌",
  "الفلك":    "🔭",
  "الجبال":   "⛰️",
  "البحار":   "🌊",
  "الأجنة":   "🔬",
  "النبات":   "🌿",
  "الحيوان":  "🐝",
  "الطب":     "⚕️",
  "المياه":   "💧",
  "الحديد":   "⚙️",
  "الرياح":   "🌬️",
  "السحاب":   "☁️",
  "الحشرات":  "🐜",
  "الأرض":    "🌍",
  "الزمن":    "⏳",
  "الضوء":    "💡",
  "الجلد":    "🧬",
  "العظام":   "🦴",
  "النجوم":   "⭐",
  "الدم":     "🩸",
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
    applyPageSeo({
      path: "/miracles",
      title: "الإعجاز العلمي في القرآن والسنة | المجلس العلمي",
      description: "موضوعات الإعجاز العلمي في القرآن الكريم والسنة النبوية — إعجاز طبي وكوني وعددي وبيولوجي موثّق بالأدلة العلمية.",
      keywords: ["إعجاز علمي", "إعجاز قرآني", "معجزات", "علم وإسلام", "إعجاز بيولوجي", "إعجاز كوني"],
    });
  }, []);

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
        {isAdmin && <p className="ds-section__title miracles-count">{items.length} مقالة</p>}
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
                style={{ "--mk-bg": palette.bg, "--mk-accent": palette.accent, "--mk-border": borderColor } as React.CSSProperties}
              >
                {/* رأس ملوّن بنمط موضوعي */}
                <div className="miracle-item__head">
                  <GeometricPattern pattern={pattern} color={palette.accent} opacity={0.15} />
                  <div className="miracle-item__head-row">
                    <span className="miracle-item__icon">{icon}</span>
                    <div className="miracle-item__head-info">
                      <p className="miracle-item__title">{item.title}</p>
                      <div className="miracle-item__badges">
                        {item.category && (
                          <span className="miracle-item__cat-badge">{item.category}</span>
                        )}
                        {item.source_type && (
                          <span className="miracle-item__src-badge">
                            {item.source_type === "قرآن" ? "📖 قرآن" : "📚 سنة"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* المحتوى */}
                <div className="miracle-item__body-wrap">
                  {item.reference && (
                    <p className="miracle-item__ref">﴾ {item.reference} ﴿</p>
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
                    <p className="miracle-item__source">📚 {item.scholarly_source}</p>
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
