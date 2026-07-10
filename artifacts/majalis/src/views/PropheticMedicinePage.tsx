import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Apple, BedDouble, Beef, BookOpen, CalendarDays, Droplets, FlaskConical, Grape, Leaf, Moon, PersonStanding, Salad, ScrollText, ShowerHead, Sprout, Stethoscope, Sunrise, TreePalm, Utensils, Waves, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { Chip } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import {
  PROPHETIC_MEDICINE_ITEMS,
  PM_CATEGORIES,
  type PropheticMedicineCategory,
} from "@/lib/prophetic-medicine-seed";

const PM_ICON_MAP: Record<string, LucideIcon> = {
  Leaf, Moon, BookOpen, CalendarDays, Utensils, Sunrise, FlaskConical, Stethoscope,
  Salad, TreePalm, Droplets, Sprout, ShowerHead, Apple, PersonStanding, Waves,
  Wheat, Beef, BedDouble, Grape,
};
function PMIcon({ name }: { name: string }) {
  const I = PM_ICON_MAP[name] ?? Leaf;
  return <I size={20} strokeWidth={1.5} />;
}

const DISCLAIMER =
  "تنبيه: المعلومات الواردة هنا تعليمية تُعرض ما ثبت في السنة النبوية الصحيحة، ولا تُغني عن استشارة الطبيب. الإسلام يُوجب التداوي عند الحاجة.";

const PM_CAT_MOD: Record<string, string> = {
  "العلاج والدواء":    "pmp-cat--ilaj",
  "الغذاء والتغذية":  "pmp-cat--ghidha",
  "العبادة والصحة":   "pmp-cat--ibada",
  "النظافة والوقاية": "pmp-cat--nathafa",
};

export default function PropheticMedicinePage() {
  const [category, setCategory] = useState<PropheticMedicineCategory>("الكل");

  useEffect(() => {
    applyPageSeo({
      path: "/prophetic-medicine",
      title: "الطب النبوي | المجلس العلمي",
      description: "موسوعة الطب النبوي، هدي النبي ﷺ في الصحة والتداوي بالأغذية والأعشاب والرقية الشرعية.",
      keywords: ["طب نبوي", "هدي النبي", "تداوي", "أعشاب إسلامية", "رقية شرعية"],
    });
  }, []);
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
          ما ثبت عن النبي ﷺ في التداوي والوقاية، موثَّقاً بالأحاديث الصحيحة
        </p>
      </div>

      {/* تنبيه */}
      <div className="pmp-disclaimer"><AlertTriangle size={13} className="inline ml-1" />{DISCLAIMER}</div>

      {/* شريط الفلتر */}
      <div className="ds-section__head">
        <p className="ds-section__title pmp-count">{items.length} موضوع</p>
        <FilterToggle onClick={() => setFiltersOpen(true)} label="تصفية" />
      </div>

      {/* الفلاتر، سطح المكتب */}
      <div className="ds-filters-panel--desktop pmp-desktop-filters">{filterPanel}</div>

      {/* الشبكة */}
      <div className="ds-grid">
        {items.map((item) => {
          const isOpen = expanded === item.id;

          return (
            <article
              key={item.id}
              className={`pmp-card ${PM_CAT_MOD[item.category] ?? "pmp-cat--ilaj"}`}
            >
              {/* رأس البطاقة */}
              <div className="pmp-card__head">
                <span className="pmp-card__icon"><PMIcon name={item.icon} /></span>
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
                <p className="pmp-hadith-source"><ScrollText size={13} strokeWidth={1.8} aria-hidden="true" /> {item.hadithSource}</p>

                <div className="pmp-benefits">
                  {item.benefits.map((b) => (
                    <span key={b} className="pmp-benefit-badge">{b}</span>
                  ))}
                </div>

                {isOpen && (
                  <>
                    <p className="pmp-body-text">{item.body}</p>
                    {item.disclaimer && (
                      <p className="pmp-item-disclaimer"><AlertTriangle size={13} className="inline ml-1" />{item.disclaimer}</p>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="pmp-toggle-btn"
                >
                  {isOpen ? "▲ إخفاء الوصفة" : "▼ عرض الوصفة والاستخدامات"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="twh-share">
        <ShareButtons title="الطب النبوي — المجلس العلمي" url="https://majlisilm.com/prophetic-medicine" />
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
