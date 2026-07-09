import { useEffect, useState } from "react";
import {
  Bone, BookOpen, Bug, Clock, Cloud, Cog, Dna,
  Droplets, Globe, Globe2, Leaf, Lightbulb, Microscope,
  Mountain, ScrollText, Sparkles, Star, Stethoscope,
  Telescope, Waves, Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

// مُعدِّلات CSS لرأس البطاقة حسب الفئة
const MK_CAT_MOD: Record<string, string> = {
  "الكون":    "mk-cat--alkawn",
  "الفلك":    "mk-cat--alfalak",
  "الجبال":   "mk-cat--aljibaal",
  "البحار":   "mk-cat--albihaar",
  "الأجنة":   "mk-cat--alajinna",
  "النبات":   "mk-cat--alnabaat",
  "الحيوان":  "mk-cat--alhayawan",
  "الطب":     "mk-cat--altib",
  "المياه":   "mk-cat--almiyaah",
  "الحديد":   "mk-cat--alhadeed",
  "الرياح":   "mk-cat--alriyaah",
  "السحاب":   "mk-cat--alsahaab",
  "الحشرات":  "mk-cat--alhasharat",
  "الأرض":    "mk-cat--alarth",
  "الزمن":    "mk-cat--alzaman",
  "الضوء":    "mk-cat--althaw",
  "الجلد":    "mk-cat--aljild",
  "العظام":   "mk-cat--alithaam",
  "النجوم":   "mk-cat--alnujoom",
  "الدم":     "mk-cat--aldam",
};

// لون accent لمكوّن GeometricPattern (prop وليس inline style)
const MK_CAT_ACCENT: Record<string, string> = {
  "الكون":    "#BEC7C3",
  "الفلك":    "#BEC7C3",
  "الجبال":   "#97A59F",
  "البحار":   "#BEC7C3",
  "الأجنة":   "#97A59F",
  "النبات":   "#97A59F",
  "الحيوان":  "#97A59F",
  "الطب":     "#BEC7C3",
  "المياه":   "#BEC7C3",
  "الحديد":   "#97A59F",
  "الرياح":   "#BEC7C3",
  "السحاب":   "#BEC7C3",
  "الحشرات":  "#97A59F",
  "الأرض":    "#97A59F",
  "الزمن":    "#BEC7C3",
  "الضوء":    "#d4e8a0",
  "الجلد":    "#BEC7C3",
  "العظام":   "#d4c8a0",
  "النجوم":   "#c8d4e8",
  "الدم":     "#e8a0a0",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "الكون":    Globe,
  "الفلك":    Telescope,
  "الجبال":   Mountain,
  "البحار":   Waves,
  "الأجنة":   Microscope,
  "النبات":   Leaf,
  "الحيوان":  Bug,
  "الطب":     Stethoscope,
  "المياه":   Droplets,
  "الحديد":   Cog,
  "الرياح":   Wind,
  "السحاب":   Cloud,
  "الحشرات":  Bug,
  "الأرض":    Globe2,
  "الزمن":    Clock,
  "الضوء":    Lightbulb,
  "الجلد":    Dna,
  "العظام":   Bone,
  "النجوم":   Star,
  "الدم":     Droplets,
};

const MK_SRC_MOD: Record<string, string> = {
  "قرآن": "mk-src--quran",
  "سنة":  "mk-src--sunna",
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
            const ItemIcon: LucideIcon = CATEGORY_ICONS[item.category] ?? Sparkles;
            const catMod    = MK_CAT_MOD[item.category]    ?? "mk-cat--alkawn";
            const catAccent = MK_CAT_ACCENT[item.category] ?? "#86efac";
            const srcMod    = MK_SRC_MOD[item.source_type] ?? "mk-src--quran";
            const pattern   = CATEGORY_PATTERN[item.category] ?? "stars";
            const isExpanded  = expanded === item.id;
            const bodyText: string = item.body ?? "";
            const preview = bodyText.slice(0, 220);
            return (
              <article
                key={item.id}
                className={`miracle-item ${catMod} ${srcMod}`}
              >
                {/* رأس ملوّن بنمط موضوعي */}
                <div className="miracle-item__head">
                  <GeometricPattern pattern={pattern} color={catAccent} opacity={0.15} />
                  <div className="miracle-item__head-row">
                    <span className="miracle-item__icon" aria-hidden="true"><ItemIcon size={22} strokeWidth={1.5} /></span>
                    <div className="miracle-item__head-info">
                      <p className="miracle-item__title">{item.title}</p>
                      <div className="miracle-item__badges">
                        {item.category && (
                          <span className="miracle-item__cat-badge">{item.category}</span>
                        )}
                        {item.source_type && (
                          <span className="miracle-item__src-badge">
                            {item.source_type === "قرآن"
                              ? <><BookOpen size={11} strokeWidth={2} aria-hidden="true" /> قرآن</>
                              : <><ScrollText size={11} strokeWidth={2} aria-hidden="true" /> سنة</>}
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
                    <p className="miracle-item__source"><ScrollText size={13} strokeWidth={1.8} aria-hidden="true" /> {item.scholarly_source}</p>
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
