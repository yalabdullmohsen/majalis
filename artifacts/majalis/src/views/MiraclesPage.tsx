import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bone, BookOpen, Bug, Clock, Cloud, Cog, Dna,
  Droplets, Globe, Globe2, Leaf, Lightbulb, Microscope,
  Mountain, ScrollText, Search, SlidersHorizontal, Sparkles, Star, Stethoscope,
  Telescope, Waves, Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useAuth } from "@/components/AuthProvider";
import { getMiracles } from "@/lib/supabase";
import { Chip } from "@/components/ui-common";
import { AsyncDataView } from "@/components/AsyncDataView";
import { MIRACLE_CATEGORIES } from "@/lib/miracles-seed";
import { safeLoadEffect } from "@/lib/safe-load";
import { GeometricPattern } from "@/components/design/GeometricPattern";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { ShareFaida } from "@/components/ShareFaida";
import "@/styles/pages/miracles.css";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { TopicPage } from "@/components/topic/TopicPage";

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
  "الكون": "#D6D5CE", "الفلك": "#D6D5CE", "الجبال": "#5C5C56",
  "البحار": "#D6D5CE", "الأجنة": "#5C5C56", "النبات": "#5C5C56",
  "الحيوان": "#5C5C56", "الطب": "#D6D5CE", "المياه": "#D6D5CE",
  "الحديد": "#5C5C56", "الرياح": "#D6D5CE", "السحاب": "#D6D5CE",
  "الحشرات": "#5C5C56", "الأرض": "#5C5C56", "الزمن": "#D6D5CE",
  "الضوء": "#d4e8a0", "الجلد": "#D6D5CE", "العظام": "#d4c8a0",
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
      title: "الإعجاز العلمي | المجلس العلمي",
      description: "الإعجاز العلمي وإشارات كونية في الوحي بحذر منهجي؛ المعتمد: الإعجاز البياني والغيبي والتشريعي، لا ربط بنظريات قابلة للنقض.",
      keywords: ["إعجاز علمي", "إشارات كونية", "تفكر في الخلق", "إعجاز بياني", "علوم القرآن"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "الإعجاز العلمي",
          description: "موضوعات للتأمل في آيات الخلق مع تنبيه منهجي على حدود الاستدلال؛ محتوى معتمد في منهج المجلس العلمي",
          itemListElement: CATEGORIES.filter(c => c !== "الكل").map((cat, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cat,
            url: `https://majlisilm.com/miracles?cat=${encodeURIComponent(cat)}`,
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

  // روابط عميقة عبر #id من البحث/التوصيات
  useEffect(() => {
    if (loading) return;
    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hashId) return;
    setExpanded(hashId);
    const timer = window.setTimeout(() => {
      document.getElementById(hashId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [loading, items]);

  const status = loading ? "loading" : error ? "error" : items.length === 0 ? "empty" : "success";

  const filterPanel = (
    <>
      <div className="miracles-filters miracles-filters--sheet">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div className="miracles-filters miracles-filters--sheet">
        {SOURCE_TYPES.map((s) => (
          <Chip key={s} active={sourceType === s} onClick={() => setSourceType(s)}>{s}</Chip>
        ))}
      </div>
    </>
  );

  return (
    <TopicPage
      themeId="quran"
      sectionRoute="/miracles"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الأقسام", href: "/sections" },
        { label: "الإعجاز العلمي" },
      ]}
      eyebrow="بحذر منهجي"
      title="الإعجاز العلمي"
      subtitle="إشارات كونية في الوحي عند ثبوت المعنى — بلا إعجاز عددي ولا ربط بنظريات قابلة للنقض."
      quote={{
        text: "﴿سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ﴾",
        ref: "فصّلت: ٥٣",
        type: "ayah",
      }}
    >
    <div className="mk-page mk-page--embedded" dir="rtl">

      <p className="mk-hero__note" style={{ marginBottom: "1rem" }}>
        <AlertTriangle size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>
          للتقرير المنهجي راجع{" "}
          <Link href="/ulum-quran" className="mk-hero__link">علوم القرآن</Link>
          ؛ ولا تُبنى عقيدة أو حكم على دعاوى علمية معاصرة. الموضوعات غير المحرَّرة محجوبة عن العرض.
        </span>
      </p>

      {/* ══ بحث + تصفية قابلة للطي (بدون تكدس أوسام دائم) ══ */}
      {status === "success" && (
        <div className="mk-search-bar">
          <div className="mk-search-bar__row">
            <div className="mk-search-bar__input-wrap">
              <Search size={16} strokeWidth={2} aria-hidden="true" className="mk-search-bar__icon" />
              <input
                type="search"
                className="mk-search-bar__input"
                placeholder="ابحث في الإشارات الكونية..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="بحث في الإشارات الكونية"
              />
            </div>
            <button
              type="button"
              className="mk-search-bar__filter-btn"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal size={15} strokeWidth={2} aria-hidden="true" />
              <span>تصفية</span>
            </button>
          </div>
          {!loading && (
            <span className="mk-search-bar__count">{displayed.length} موضوع</span>
          )}
          {filtersOpen && (
            <div className="mk-search-bar__filters" role="region" aria-label="تصفية الإشارات">
              {filterPanel}
            </div>
          )}
        </div>
      )}

      {/* ══ شبكة المحتوى ══ */}
      <AsyncDataView
        status={status}
        error={error}
        onRetry={() => setReloadKey((k) => k + 1)}
        emptyText="لا توجد مواد مطابقة في هذا التصنيف. جرّب تصنيفاً آخر أو أعد ضبط البحث."
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
              <article id={item.id} key={item.id} className={`miracle-item mk-card ${catMod} ${srcMod}`}>
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
                            <ItemIcon size={11} strokeWidth={2} aria-hidden="true" /> {item.category}
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

                {/* محتوى: آية ← شرح موجز ← تفصيل علمي */}
                <div className="miracle-item__body-wrap mk-card__body">
                  {(item.verse || item.reference) && (
                    <figure className="miracle-ayah">
                      {item.verse ? (
                        <blockquote className="miracle-ayah__text" lang="ar" dir="rtl">
                          ﴿ {item.verse} ﴾
                        </blockquote>
                      ) : null}
                      {item.reference ? (
                        <figcaption className="miracle-ayah__ref">
                          <BookOpen size={12} strokeWidth={2} aria-hidden="true" />
                          <span>{item.reference}</span>
                        </figcaption>
                      ) : null}
                    </figure>
                  )}

                  {item.tafsir_summary ? (
                    <section className="miracle-explain" aria-label="شرح موجز للآية">
                      <header className="miracle-explain__head">
                        <span className="miracle-explain__mark" aria-hidden="true" />
                        <h3 className="miracle-explain__label">شرح موجز</h3>
                      </header>
                      <p className="miracle-explain__text">{item.tafsir_summary}</p>
                    </section>
                  ) : null}

                  {bodyText && (!item.tafsir_summary || isExpanded) ? (
                    <section
                      className={`miracle-detail${item.tafsir_summary ? " is-open" : " miracle-detail--solo"}`}
                      aria-label="التفصيل العلمي"
                    >
                      {item.tafsir_summary ? (
                        <>
                          <header className="miracle-detail__head">
                            <h3 className="miracle-detail__label">التفصيل العلمي</h3>
                          </header>
                          <p className="miracle-detail__text">{bodyText}</p>
                        </>
                      ) : (
                        <p className="miracle-detail__text">
                          {isExpanded || bodyText.length <= 240
                            ? bodyText
                            : `${preview}…`}
                        </p>
                      )}
                    </section>
                  ) : null}

                  {item.scholarly_source && (
                    <p className="miracle-item__source mk-card__source">
                      <ScrollText size={12} strokeWidth={1.8} aria-hidden="true" /> {item.scholarly_source}
                    </p>
                  )}
                  <div className="mk-card__footer">
                    {bodyText && (item.tafsir_summary || bodyText.length > 240) ? (
                      <button
                        type="button"
                        className="mk-expand-btn"
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                      >
                        <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
                        {isExpanded
                          ? "إخفاء التفصيل"
                          : item.tafsir_summary
                            ? "اقرأ التفصيل العلمي"
                            : "تفاصيل الموضوع"}
                      </button>
                    ) : (
                      <span />
                    )}
                    <ShareFaida
                      variant="icons"
                      title={item.title}
                      url={`https://majlisilm.com/miracles#${encodeURIComponent(item.id)}`}
                    />
                  </div>
                </div>
                {isAdmin && <AdminQuickEdit section="miracles" searchTerm={item.title} />}
              </article>
            );
          })}
        </div>
      </AsyncDataView>

      {isAdmin && <AdminQuickEdit section="miracles" />}
      <RelatedKnowledge kind="book" query="علوم القرآن إعجاز بياني" title="مواد ذات صلة بعلوم القرآن" limit={6} />
      <ExploreAlsoNav
        title="استكشف أيضًا"
        links={[
          { href: "/ulum-quran", label: "علوم القرآن" },
          { href: "/quran-hub", label: "مركز القرآن" },
          { href: "/tawhid", label: "التوحيد" },
          { href: "/quran/surah-stories", label: "قصص السور" },
        ]}
      />
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="aqidah" title="اختبر معلوماتك في العقيدة والإعجاز" count={4} />
      </div>
    </div>
    </TopicPage>
  );
}
