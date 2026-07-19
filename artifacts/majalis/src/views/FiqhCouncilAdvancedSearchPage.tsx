import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ShareButtons } from "@/components/ContentActions";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { advancedSearchFiqhCouncil } from "@/lib/fiqh-council-service";
import { FIQH_CATEGORY_TREE } from "@/lib/fiqh-council-categories";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhCouncilItem,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function FiqhCouncilAdvancedSearchPage() {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("الكل");
  const [category, setCategory] = useState("الكل");
  const [subcategory, setSubcategory] = useState("الكل");
  const [source, setSource] = useState("");
  const [year, setYear] = useState("الكل");
  const [decisionNumber, setDecisionNumber] = useState("");
  const [results, setResults] = useState<FiqhCouncilItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const debouncedSource = useDebouncedValue(source);
  const urlSearch = useSearch();

  const subcategories = category !== "الكل"
    ? FIQH_CATEGORY_TREE.find((c) => c.name === category)?.children?.map((c) => c.name) || []
    : [];

  // رابط وارد بـ`?category=...` (من بطاقات التصنيف في FiqhCouncilPage) كان
  // يُتجاهَل كليًا: الحالة تُهيَّأ دائماً بـ"الكل" بلا قراءة أي شيء من
  // الرابط الفعلي عند الوصول — نفس عائلة عطل TYPE_HREF.scholar الصامت.
  // اكتُشف بالفحص المباشر 2026-07-20.
  useEffect(() => {
    const cat = new URLSearchParams(urlSearch).get("category");
    if (cat) setCategory(cat);
  }, [urlSearch]);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/advanced-search",
      title: "البحث المتقدم في المجمع الفقهي | المجلس العلمي",
      description: "بحث متقدم في قرارات وفتاوى وبحوث المجمع الفقهي، تصفية حسب النوع والتصنيف والسنة والمصدر.",
      keywords: ["بحث متقدم فقهي", "بحث في الفتاوى", "مجمع فقهي", "تصفية فقهية", "محرك بحث إسلامي"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "البحث المتقدم في المجمع الفقهي", url: "https://www.majlisilm.com/fiqh-council/advanced-search", about: { "@type": "Thing", name: "محرك البحث الفقهي المتقدم" } }],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    advancedSearchFiqhCouncil({
      query: debouncedQuery,
      type: type as FiqhItemType | "الكل",
      category: category !== "الكل" ? category : undefined,
      subcategory: subcategory !== "الكل" ? subcategory : undefined,
      source: debouncedSource,
      year: year === "الكل" ? "الكل" : Number(year),
      decisionNumber: decisionNumber || undefined,
      limit: 40,
    })
      .then(({ data }) => setResults(data))
      .finally(() => setLoading(false));
  }, [debouncedQuery, type, category, subcategory, debouncedSource, year, decisionNumber]);

  const years = ["الكل", ...Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i))];

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page fiqh-search-page">
      <PageHeader
        eyebrow="البحث الفقهي"
        title="البحث المتقدم"
        subtitle="ابحث في العناوين والنصوص والأدلة والمصادر والتصنيفات، مع فلاتر دقيقة."
      />

      <FiqhCouncilSubnav />

      <div className="fiqh-advanced-search-form ui-card">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في القرارات والفتاوى..."
          className="page-search-input full content-hub-search"
          aria-label="بحث متقدم"
        />

        <div className="fiqh-council-filter-row">
          <label className="fiqh-council-select-label">
            النوع
            <select value={type} onChange={(e) => setType(e.target.value)} className="fiqh-council-select">
              <option value="الكل">الكل</option>
              {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
            </select>
          </label>
          <label className="fiqh-council-select-label">
            التصنيف
            <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory("الكل"); }} className="fiqh-council-select">
              <option value="الكل">الكل</option>
              {FIQH_COUNCIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {subcategories.length > 0 && (
            <label className="fiqh-council-select-label">
              التصنيف الفرعي
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="fiqh-council-select">
                <option value="الكل">الكل</option>
                {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          <label className="fiqh-council-select-label">
            السنة
            <select value={year} onChange={(e) => setYear(e.target.value)} className="fiqh-council-select">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>

        <div className="fiqh-council-filter-row">
          <label className="fiqh-council-select-label">
            المصدر
            <input value={source} onChange={(e) => setSource(e.target.value)} className="fiqh-council-source-input" aria-label="اسم المصدر" placeholder="اسم المصدر" />
          </label>
          <label className="fiqh-council-select-label">
            رقم القرار
            <input value={decisionNumber} onChange={(e) => setDecisionNumber(e.target.value)} className="fiqh-council-source-input" aria-label="رقم القرار أو الجلسة" placeholder="رقم القرار أو الجلسة" />
          </label>
        </div>
      </div>

      <div className="page-stats-row">
        {isAdmin && <span>{loading ? "..." : `${results.length} نتيجة`}</span>}
        <Link href="/fiqh-council/compare" className="fiqh-council-section-link">مقارنة القرارات</Link>
      </div>

      {loading ? (
        <SkeletonCardGrid />
      ) : results.length === 0 ? (
        <Empty text="لا توجد نتائج مطابقة." />
      ) : (
        <div className="page-card-grid">
          {results.map((item) => (
            <PlatformContentCard
              key={item.slug}
              href={fiqhItemHref(item.slug)}
              title={item.title}
              tag={FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]}
              meta={formatFiqhItemMeta(item)}
              summary={item.summary}
            />
          ))}
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="البحث المتقدم في المجمع الفقهي — المجلس العلمي" url="https://www.majlisilm.com/fiqh-council/search" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
      </div>
    </div>
  );
}
