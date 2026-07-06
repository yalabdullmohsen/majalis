import { useState, useMemo } from "react";
import { PageHeader, Chip } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import {
  PROPHETIC_MEDICINE_ITEMS,
  PM_CATEGORIES,
  type PropheticMedicineCategory,
} from "@/lib/prophetic-medicine-seed";

const DISCLAIMER =
  "تنبيه: المعلومات الواردة هنا تعليمية تُعرض ما ثبت في السنة النبوية الصحيحة، ولا تُغني عن استشارة الطبيب. الإسلام يُوجب التداوي عند الحاجة.";

const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  "العلاج والدواء":    { bg: "#18362A", accent: "#BEC7C3" },
  "الغذاء والتغذية":  { bg: "#153025", accent: "#97A59F" },
  "العبادة والصحة":   { bg: "#12281F", accent: "#BEC7C3" },
  "النظافة والوقاية": { bg: "#0E2019", accent: "#97A59F" },
};

export default function PropheticMedicinePage() {
  const [category, setCategory] = useState<PropheticMedicineCategory>("الكل");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const items = useMemo(
    () =>
      category === "الكل"
        ? PROPHETIC_MEDICINE_ITEMS
        : PROPHETIC_MEDICINE_ITEMS.filter((i) => i.category === category),
    [category],
  );

  const filterPanel = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {PM_CATEGORIES.map((c) => (
        <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );

  return (
    <div className="page-shell ds-page">
      {/* رأس الصفحة */}
      <div
        className="majalis-star-hero"
        style={{ borderRadius: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}
      >
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#97A59F",
            marginBottom: "0.5rem",
            textTransform: "uppercase",
          }}
        >
          صحة وإيمان
        </p>
        <h1
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
            fontWeight: 800,
            color: "#FAF8F2",
            margin: "0 0 0.6rem",
          }}
        >
          الطب النبوي
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "#BEC7C3",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          ما ثبت عن النبي ﷺ في التداوي والوقاية — موثَّقاً بالأحاديث الصحيحة
        </p>
      </div>

      {/* تنبيه */}
      <div
        style={{
          background: "rgba(24,54,42,0.07)",
          border: "1px solid rgba(24,54,42,0.25)",
          borderRadius: "0.875rem",
          padding: "0.75rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "0.82rem",
          color: "var(--msk-text-2)",
          lineHeight: 1.65,
          direction: "rtl",
        }}
      >
        ⚠️ {DISCLAIMER}
      </div>

      {/* شريط الفلتر */}
      <div className="ds-section__head">
        <p className="ds-section__title" style={{ margin: 0 }}>
          {items.length} موضوع
        </p>
        <FilterToggle onClick={() => setFiltersOpen(true)} label="تصفية" />
      </div>

      {/* الفلاتر — سطح المكتب */}
      <div
        className="ds-filters-panel--desktop"
        style={{ marginBottom: "1rem" }}
      >
        {filterPanel}
      </div>

      {/* الشبكة */}
      <div className="ds-grid">
        {items.map((item) => {
          const palette = CATEGORY_COLORS[item.category] ?? { bg: "#18362A", accent: "#BEC7C3" };
          const isOpen = expanded === item.id;

          return (
            <article
              key={item.id}
              style={{
                border: "1px solid var(--msk-border)",
                borderRadius: "1rem",
                overflow: "hidden",
                background: "var(--msk-canvas-1, var(--msk-canvas))",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* رأس البطاقة */}
              <div
                style={{
                  background: palette.bg,
                  backgroundImage: 'url("/star-pattern.svg")',
                  backgroundSize: "100px 100px",
                  padding: "1rem 1rem 0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.75rem",
                    lineHeight: 1,
                    flexShrink: 0,
                    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))",
                  }}
                >
                  {item.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#FAF8F2",
                      margin: "0 0 0.2rem",
                    }}
                  >
                    {item.name}
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "0.15rem 0.6rem",
                        borderRadius: "1rem",
                        fontSize: "0.7rem",
                        background: `${palette.accent}22`,
                        color: palette.accent,
                        fontWeight: 600,
                        border: `1px solid ${palette.accent}44`,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* محتوى البطاقة */}
              <div
                style={{
                  padding: "0.875rem 1rem",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                  direction: "rtl",
                }}
              >
                {/* الحديث */}
                <blockquote
                  style={{
                    borderRight: "3px solid var(--msk-gold)",
                    paddingRight: "0.65rem",
                    margin: 0,
                    fontSize: "0.9rem",
                    lineHeight: 1.8,
                    color: "var(--msk-text)",
                    fontWeight: 600,
                  }}
                >
                  {item.hadith}
                </blockquote>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--msk-text-2)",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  📚 {item.hadithSource}
                </p>

                {/* الفوائد */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {item.benefits.map((b) => (
                    <span
                      key={b}
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "1rem",
                        fontSize: "0.7rem",
                        background: "rgba(24,54,42,0.08)",
                        color: "var(--msk-gold)",
                        fontWeight: 600,
                        border: "1px solid rgba(24,54,42,0.18)",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {/* الشرح */}
                {isOpen && (
                  <>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        lineHeight: 1.75,
                        color: "var(--msk-text)",
                        margin: 0,
                      }}
                    >
                      {item.body}
                    </p>
                    {item.disclaimer && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--msk-text-2)",
                          margin: 0,
                          fontStyle: "italic",
                          borderTop: "1px solid var(--msk-border)",
                          paddingTop: "0.5rem",
                        }}
                      >
                        ⚠️ {item.disclaimer}
                      </p>
                    )}
                  </>
                )}

                {/* زر المزيد */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  style={{
                    color: "var(--msk-gold)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    padding: "0.2rem 0",
                    alignSelf: "flex-start",
                    fontFamily: "inherit",
                  }}
                >
                  {isOpen ? "▲ أقل" : "▼ اقرأ المزيد"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* فلاتر الجوال */}
      <FilterBottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="تصفية المواضيع"
      >
        {filterPanel}
      </FilterBottomSheet>
    </div>
  );
}
