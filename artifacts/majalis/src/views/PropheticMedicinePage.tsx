import { useState, useMemo } from "react";
import { Chip } from "@/components/ui-common";
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
    <div className="pmp-filter-chips">
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
      <div className="majalis-star-hero pmp-hero">
        <p className="pmp-hero__eyebrow">صحة وإيمان</p>
        <h1 className="pmp-hero__title">الطب النبوي</h1>
        <p className="pmp-hero__subtitle">
          ما ثبت عن النبي ﷺ في التداوي والوقاية — موثَّقاً بالأحاديث الصحيحة
        </p>
      </div>

      {/* تنبيه */}
      <div className="pmp-disclaimer">⚠️ {DISCLAIMER}</div>

      {/* شريط الفلتر */}
      <div className="ds-section__head">
        <p className="ds-section__title pmp-count">{items.length} موضوع</p>
        <FilterToggle onClick={() => setFiltersOpen(true)} label="تصفية" />
      </div>

      {/* الفلاتر — سطح المكتب */}
      <div className="ds-filters-panel--desktop pmp-desktop-filters">{filterPanel}</div>

      {/* الشبكة */}
      <div className="ds-grid">
        {items.map((item) => {
          const palette = CATEGORY_COLORS[item.category] ?? { bg: "#18362A", accent: "#BEC7C3" };
          const isOpen = expanded === item.id;

          return (
            <article
              key={item.id}
              className="pmp-card"
              style={{ "--pm-bg": palette.bg, "--pm-accent": palette.accent } as React.CSSProperties}
            >
              {/* رأس البطاقة */}
              <div className="pmp-card__head">
                <span className="pmp-card__icon">{item.icon}</span>
                <div className="pmp-card__head-info">
                  <p className="pmp-card__name">{item.name}</p>
                  <div className="pmp-card__badges">
                    <span className="pmp-cat-badge">{item.category}</span>
                  </div>
                </div>
              </div>

              {/* محتوى البطاقة */}
              <div className="pmp-card__body">
                <blockquote className="pmp-hadith">{item.hadith}</blockquote>
                <p className="pmp-hadith-source">📚 {item.hadithSource}</p>

                <div className="pmp-benefits">
                  {item.benefits.map((b) => (
                    <span key={b} className="pmp-benefit-badge">{b}</span>
                  ))}
                </div>

                {isOpen && (
                  <>
                    <p className="pmp-body-text">{item.body}</p>
                    {item.disclaimer && (
                      <p className="pmp-item-disclaimer">⚠️ {item.disclaimer}</p>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="pmp-toggle-btn"
                >
                  {isOpen ? "▲ أقل" : "▼ اقرأ المزيد"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

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
