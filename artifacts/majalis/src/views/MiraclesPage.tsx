import { useEffect, useMemo, useState } from "react";
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
import { Chip } from "@/components/ui-common";
import { AsyncDataView } from "@/components/AsyncDataView";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { MIRACLE_CATEGORIES } from "@/lib/miracles-seed";
import { safeLoadEffect } from "@/lib/safe-load";
import { GeometricPattern } from "@/components/design/GeometricPattern";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { ShareButtons } from "@/components/ContentActions";

const CATEGORIES = MIRACLE_CATEGORIES;
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];

type PatternType = "honeycomb" | "stars" | "waves" | "mountains" | "orbits" | "vines" | "metallic" | "circles";

const CATEGORY_PATTERN: Record<string, PatternType> = {
  "الكون": "orbits", "الفلك": "orbits", "الجبال": "mountains",
  "البحار": "waves", "الأجنة": "circles", "النبات": "honeycomb",
  "الحيوان": "vines", "الطب": "circles", "المياه": "waves",
  "الحديد": "metallic", "الرياح": "waves", "السحاب": "orbits",
  "الحشرات": "honeycomb", "الأرض": "mountains", "الزمن": "stars",
  "الضوء": "metallic", "الجلد": "circles", "العظام": "metallic",
  "النجوم": "stars", "الدم": "circles",
};

const MK_CAT_MOD: Record<string, string> = {
  "الكون": "mk-cat--alkawn", "الفلك": "mk-cat--alfalak",
  "الجبال": "mk-cat--aljibaal", "البحار": "mk-cat--albihaar",
  "الأجنة": "mk-cat--alajinna", "النبات": "mk-cat--alnabaat",
  "الحيوان": "mk-cat--alhayawan", "الطب": "mk-cat--altib",
  "المياه": "mk-cat--almiyaah", "الحديد": "mk-cat--alhadeed",
  "الرياح": "mk-cat--alriyaah", "السحاب": "mk-cat--alsahaab",
  "الحشرات": "mk-cat--alhasharat", "الأرض": "mk-cat--alarth",
  "الزمن": "mk-cat--alzaman", "الضوء": "mk-cat--althaw",
  "الجلد": "mk-cat--aljild", "العظام": "mk-cat--alithaam",
  "النجوم": "mk-cat--alnujoom", "الدم": "mk-cat--aldam",
};

const MK_CAT_ACCENT: Record<string, string> = {
  "الكون": "#BEC7C3", "الفلك": "#BEC7C3", "الجبال": "#97A59F",
  "البحار": "#BEC7C3", "الأجنة": "#97A59F", "النبات": "#97A59F",
  "الحيوان": "#97A59F", "الطب": "#BEC7C3", "المياه": "#BEC7C3",
  "الحديد": "#97A59F", "الرياح": "#BEC7C3", "السحاب": "#BEC7C3",
  "الحشرات": "#97A59F", "الأرض": "#97A59F", "الزمن": "#BEC7C3",
  "الضوء": "#d4e8a0", "الجلد": "#BEC7C3", "العظام": "#d4c8a0",
  "النجوم": "#c8d4e8", "الدم": "#e8a0a0",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "الكون": Globe, "الفلك": Telescope, "الجبال": Mountain,
  "البحار": Waves, "الأجنة": Microscope, "النبات": Leaf,
  "الحيوان": Bug, "الطب": Stethoscope, "المياه": Droplets,
  "الحديد": Cog, "الرياح": Wind, "السحاب": Cloud,
  "الحشرات": Bug, "الأرض": Globe2, "الزمن": Clock,
  "الضوء": Lightbulb, "الجلد": Dna, "العظام": Bone,
  "النجوم": Star, "الدم": Droplets,
};

const CAT_EMOJIS: Record<string, string> = {
  "الكون": "🌌", "الفلك": "🔭", "الجبال": "⛰️", "البحار": "🌊",
  "الأجنة": "🔬", "النبات": "🌿", "الحيوان": "🦋", "الطب": "🩺",
  "المياه": "💧", "الحديد": "⚙️", "الرياح": "🌬️", "السحاب": "☁️",
  "الحشرات": "🐝", "الأرض": "🌍", "الزمن": "⏳", "الضوء": "💡",
  "الجلد": "🧬", "العظام": "🦴", "النجوم": "⭐", "الدم": "🩸",
};

const MK_SRC_MOD: Record<string, string> = {
  "قرآن": "mk-src--quran",
  "سنة":  "mk-src--sunna",
};

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
  const [search, setSearch] = useState("");

  // رابط `?cat=...` في JSON-LD أسفل هذه الصفحة نفسها كان يُتجاهَل كليًا:
  // `category` تُهيَّأ دائماً بـ"الكل" بلا قراءة أي شيء من الرابط الفعلي —
  // عطل صامت من نفس عائلة TYPE_HREF.scholar، اكتُشف بالفحص المباشر
  // 2026-07-18.
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("cat");
    if (cat) setCategory(cat);
  }, []);

  const displayed = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((i) => arabicMatchAny([i.title ?? "", i.body ?? "", i.category ?? "", i.scholarly_source ?? ""], search));
  }, [items, search]);

  useEffect(() => {
    applyPageSeo({
      path: "/miracles",
      title: "الإعجاز العلمي في القرآن والسنة | المجلس العلمي",
      description: "موضوعات الإعجاز العلمي في القرآن الكريم والسنة النبوية، إعجاز طبي وكوني وعددي وبيولوجي موثّق بالأدلة العلمية.",
      keywords: ["إعجاز علمي", "إعجاز قرآني", "معجزات", "علم وإسلام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام الإعجاز العلمي",
          description: "أقسام ومجالات الإعجاز العلمي في القرآن الكريم والسنة النبوية",
          itemListElement: CATEGORIES.filter(c => c !== "الكل").map((cat, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cat,
            url: `https://www.majlisilm.com/miracles?cat=${encodeURIComponent(cat)}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (initialItems && category === "الكل" && sourceType === "الكل" && reloadKey === 0) return;
    setError(null);
    return safeLoadEffect(
      setLoading,
      () => getMiracles({ category: category === "الكل" ? undefined : category, sourceType: sourceType === "الكل" ? undefined : sourceType }),
      ({ data }) => setItems(data ?? []),
      (msg) => { setError(msg); setItems([]); },
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
    <div className="page-shell ds-page mk-page">

      {/* ══ Hero ══ */}
      <header className="mk-hero">
        <div className="mk-hero__inner">
          <p className="mk-hero__eyebrow">علم وإيمان</p>
          <h1 className="mk-hero__title">الإعجاز العلمي</h1>
          <p className="mk-hero__sub">
            مقالات موثّقة تربط الاكتشافات العلمية بالآيات القرآنية والأحاديث النبوية
          </p>
          <p className="mk-hero__note">
            ⚠️ الملاحظات العلمية قد تتطور مع البحث، نعرضها للتفكر لا كحكم نهائي
          </p>
        </div>
      </header>

      {/* ══ فئات سريعة ══ */}
      <section className="mk-cats-bar" aria-label="تصفية حسب الفئة">
        <div className="mk-cats-bar__grid">
          <button
            type="button"
            onClick={() => setCategory("الكل")}
            className={`mk-cat-pill${category === "الكل" ? " mk-cat-pill--active" : ""}`}
          >
            <span>🔍</span>
            <span>الكل</span>
          </button>
          {(CATEGORIES as readonly string[]).filter(c => c !== "الكل").map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`mk-cat-pill${category === c ? " mk-cat-pill--active" : ""}`}
            >
              <span>{CAT_EMOJIS[c] ?? "🔬"}</span>
              <span>{c}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══ مصدر + عدد ══ */}
      <div className="mk-toolbar">
        <div className="mk-src-tabs">
          {SOURCE_TYPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSourceType(s)}
              className={`mk-src-tab${sourceType === s ? " mk-src-tab--active" : ""}`}
            >
              {s === "قرآن" ? "📖 قرآن" : s === "سنة" ? "📜 سنة" : "الجميع"}
            </button>
          ))}
        </div>
        <div className="mk-toolbar__right">
          {!loading && status === "success" && (
            <span className="mk-count">{displayed.length} موضوع</span>
          )}
          <FilterToggle onClick={() => setFiltersOpen(true)} label="فلاتر" />
        </div>
      </div>

      {status === "success" && (
        <div className="prefix-search-wrap">
          <input
            type="search"
            className="ds-input prefix-search-input"
            placeholder="ابحث في موضوعات الإعجاز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="بحث في الإعجاز العلمي"
          />
        </div>
      )}

      {/* ══ شبكة المحتوى ══ */}
      <AsyncDataView
        status={status}
        error={error}
        onRetry={() => setReloadKey((k) => k + 1)}
        emptyText="لا توجد بيانات حالياً"
      >
        <div className="mk-grid">
          {displayed.map((item: any) => {
            const ItemIcon: LucideIcon = CATEGORY_ICONS[item.category] ?? Sparkles;
            const catMod    = MK_CAT_MOD[item.category]    ?? "mk-cat--alkawn";
            const catAccent = MK_CAT_ACCENT[item.category] ?? "#86efac";
            const srcMod    = MK_SRC_MOD[item.source_type] ?? "mk-src--quran";
            const pattern   = CATEGORY_PATTERN[item.category] ?? "stars";
            const isExpanded  = expanded === item.id;
            const bodyText: string = item.body ?? "";
            const preview = bodyText.slice(0, 240);
            return (
              <article key={item.id} className={`miracle-item mk-card ${catMod} ${srcMod}`}>
                {/* رأس */}
                <div className="miracle-item__head mk-card__head">
                  <GeometricPattern pattern={pattern} color={catAccent} opacity={0.13} />
                  <div className="miracle-item__head-row">
                    <span className="miracle-item__icon" aria-hidden="true">
                      <ItemIcon size={20} strokeWidth={1.5} />
                    </span>
                    <div className="miracle-item__head-info">
                      <p className="miracle-item__title mk-card__title">{item.title}</p>
                      <div className="miracle-item__badges">
                        {item.category && (
                          <span className="miracle-item__cat-badge mk-badge">
                            {CAT_EMOJIS[item.category] ?? "🔬"} {item.category}
                          </span>
                        )}
                        {item.source_type && (
                          <span className="miracle-item__src-badge mk-src-badge">
                            {item.source_type === "قرآن"
                              ? <><BookOpen size={10} strokeWidth={2} aria-hidden="true" /> قرآن</>
                              : <><ScrollText size={10} strokeWidth={2} aria-hidden="true" /> سنة</>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* محتوى */}
                <div className="miracle-item__body-wrap mk-card__body">
                  {item.reference && (
                    <p className="miracle-item__ref mk-card__ref">﴿ {item.reference} ﴾</p>
                  )}
                  {bodyText && (
                    <>
                      <p className="miracle-item__body mk-card__text">
                        {isExpanded ? bodyText : `${preview}${bodyText.length > 240 ? "…" : ""}`}
                      </p>
                      {bodyText.length > 240 && (
                        <button
                          type="button"
                          className="mk-expand-btn"
                          onClick={() => setExpanded(isExpanded ? null : item.id)}
                        >
                          {isExpanded ? "▲ طوِّ التفاصيل" : "▼ تفاصيل المعجزة"}
                        </button>
                      )}
                    </>
                  )}
                  {item.scholarly_source && (
                    <p className="miracle-item__source mk-card__source">
                      <ScrollText size={12} strokeWidth={1.8} aria-hidden="true" /> {item.scholarly_source}
                    </p>
                  )}
                </div>
                <div className="mk-card__actions">
                  <ShareButtons
                    title={item.title}
                    url={`https://www.majlisilm.com/miracles`}
                  />
                </div>
                {isAdmin && <AdminQuickEdit section="miracles" searchTerm={item.title} />}
              </article>
            );
          })}
        </div>
      </AsyncDataView>

      <aside className="ds-filters-panel ds-filters-panel--desktop">
        <div className="ds-filters-panel__head"><h2>تصفية المقالات</h2></div>
        {filterPanel}
      </aside>

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="تصفية المقالات">
        {filterPanel}
      </FilterBottomSheet>
      {isAdmin && <AdminQuickEdit section="miracles" />}
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="aqeeda" title="اختبر معلوماتك في العقيدة والإعجاز" count={4} />
      </div>
    </div>
  );
}
