/**
 * فهرس الأبحاث الشرعية — سطح حي على /academic-research.
 * PR-4: بحث + FilterSheet + CTA «اقترح بحثًا» + تنبيه عدم اعتماد جميع النتائج.
 */
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { EMPTY } from "@/lib/ui-copy";
import { ShareButtons } from "@/components/ContentActions";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { FilterSheet, FilterToggle } from "@/components/filters";
import { StatusNotice } from "@/components/design-system";
import {
  RESEARCH_ACCESS_LABELS,
  RESEARCH_CATEGORIES,
  RESEARCH_KIND_LABELS,
  RIGHTS_DISCLAIMER,
  ANTI_CHEATING_NOTICE,
  categoryLabel,
  computeResearchStats,
  extractPublishedResearchFacets,
  listPublishedResearches,
  queryPublished,
  pushSearchHistory,
  suggestQueryCompletions,
  type AccessType,
  type ResearchFilters,
  type ResearchKind,
  type ResearchRecord,
  type ResearchSort,
} from "@/lib/researches";
import {
  SCHOLARLY_RESEARCH_DISCLAIMER,
  SCHOLARLY_SUGGEST_CTA,
  countPublishedScholarlyResearch,
  searchPublishedScholarlyResearch,
} from "@/lib/scholarly-research";
import { BookOpen, GraduationCap, Plus, Search, Sparkles, Shield } from "lucide-react";
import "@/styles/pages/researches.css";
import { UtilityScreen } from "@/components/design-system/screens";

const CATEGORY_PREVIEW = 8;

function useQueryParams(): URLSearchParams {
  const [loc] = useLocation();
  const qs = loc.includes("?")
    ? loc.slice(loc.indexOf("?") + 1)
    : typeof window !== "undefined"
      ? window.location.search.slice(1)
      : "";
  return useMemo(() => new URLSearchParams(qs), [loc, qs]);
}

export default function AcademicResearchPage() {
  const params = useQueryParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [categoryId, setCategoryId] = useState(params.get("cat") || "");
  const [kind, setKind] = useState<ResearchKind | "">(
    (params.get("kind") as ResearchKind) || "",
  );
  const [sort, setSort] = useState<ResearchSort>(
    (params.get("sort") as ResearchSort) || "relevance",
  );
  const [yearFrom, setYearFrom] = useState(params.get("yearFrom") || "");
  const [yearTo, setYearTo] = useState(params.get("yearTo") || "");
  const [university, setUniversity] = useState(params.get("uni") || "");
  const [country, setCountry] = useState(params.get("country") || "");
  const [language, setLanguage] = useState(params.get("lang") || "");
  const [accessType, setAccessType] = useState<AccessType | "">(
    (params.get("access") as AccessType) || "",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/academic-research",
      title: "البحوث الشرعية | سُنّة",
      description:
        "فهرس معرفي لرسائل الماجستير والدكتوراه والبحوث الأكاديمية، يعرض البيانات والملخص والرابط إلى المصدر الأصلي.",
      keywords: [
        "بحوث شرعية",
        "رسائل ماجستير",
        "دكتوراه",
        "فقه",
        "حديث",
        "تفسير",
        "فهرس أكاديمي",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "البحوث الشرعية",
          url: "https://www.ssunnah.com/academic-research",
          description:
            "فهرس معرفي للبحوث الشرعية — ليست سُنّة ناشرًا للملف الأصلي",
        },
      ],
    });
  }, []);

  const facets = useMemo(() => extractPublishedResearchFacets(), []);

  const filters: ResearchFilters = useMemo(
    () => ({
      q: q.trim() || undefined,
      categoryId: categoryId || undefined,
      kind: kind || undefined,
      sort,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
      yearTo: yearTo ? Number(yearTo) : undefined,
      university: university || undefined,
      country: country || undefined,
      language: language || undefined,
      accessType: accessType || undefined,
    }),
    [
      q,
      categoryId,
      kind,
      sort,
      yearFrom,
      yearTo,
      university,
      country,
      language,
      accessType,
    ],
  );

  const results = useMemo(
    () => queryPublished(filters).filter((r) => !r.isDemo),
    [filters],
  );
  const stats = useMemo(() => computeResearchStats(), []);
  const latest = useMemo(
    () =>
      queryPublished({ sort: "newest" })
        .filter((r) => !r.isDemo)
        .slice(0, 6),
    [],
  );
  const masters = useMemo(
    () =>
      queryPublished({ kind: "masters_thesis", sort: "newest" })
        .filter((r) => !r.isDemo)
        .slice(0, 6),
    [],
  );
  const doctorates = useMemo(
    () =>
      queryPublished({ kind: "phd_dissertation", sort: "newest" })
        .filter((r) => !r.isDemo)
        .slice(0, 6),
    [],
  );
  const topUniversities = useMemo(
    () => facets.universities.slice(0, 8),
    [facets],
  );
  const scholarlyIndexed = countPublishedScholarlyResearch();
  const scholarlyHits = useMemo(
    () => searchPublishedScholarlyResearch({ q: q.trim() || undefined }),
    [q],
  );

  const activeFilterCount = [
    categoryId,
    kind,
    yearFrom,
    yearTo,
    university,
    country,
    language,
    accessType,
  ].filter(Boolean).length;

  const onSearch = (value: string) => {
    setQ(value);
    startTransition(() => {
      setSuggestions(
        suggestQueryCompletions(listPublishedResearches(), value),
      );
    });
  };

  const runSearch = () => {
    pushSearchHistory(q);
    startTransition(() => undefined);
  };

  const resetFilters = () => {
    setCategoryId("");
    setKind("");
    setYearFrom("");
    setYearTo("");
    setUniversity("");
    setCountry("");
    setLanguage("");
    setAccessType("");
    setSort("relevance");
  };

  const visibleCats = showAllCats
    ? RESEARCH_CATEGORIES
    : RESEARCH_CATEGORIES.slice(0, CATEGORY_PREVIEW);

  return (
    <SectionTemplatePage
      route="/academic-research"
      title="البحوث الشرعية"
      subtitle="فهرس معرفي لرسائل الماجستير والدكتوراه والبحوث الأكاديمية، مع الرابط إلى المصدر الأصلي."
      groupTitle="تصفح البحوث"
    >
      <div className="sr-page">
        <div className="sr-hero__actions">
          <input
            className="sr-search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="ابحث بالعنوان أو الباحث أو الجامعة أو الكلمات المفتاحية…"
            aria-label="بحث في البحوث الشرعية"
            list="sr-suggest"
          />
          <datalist id="sr-suggest">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="button"
            className="sr-btn sr-btn--primary"
            onClick={runSearch}
          >
            <Search size={16} aria-hidden /> بحث
          </button>
          <FilterToggle
            expanded={filtersOpen}
            onClick={() => setFiltersOpen(true)}
            label={
              activeFilterCount > 0
                ? `فلاتر (${activeFilterCount})`
                : "فلاتر"
            }
          />
          <Link href="/academic-research/submit" className="sr-btn sr-btn--ghost">
            <Plus size={16} aria-hidden /> {SCHOLARLY_SUGGEST_CTA}
          </Link>
          <Link
            href="/academic-research/assistant"
            className="sr-btn sr-btn--ghost"
          >
            <Sparkles size={16} aria-hidden /> مساعدة الباحث
          </Link>
        </div>

        <StatusNotice tone="neutral" title="تنبيه فهرسة">
          {SCHOLARLY_RESEARCH_DISCLAIMER}
        </StatusNotice>

        <p className="sr-notice" role="note">
          <Shield
            size={14}
            aria-hidden
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          {RIGHTS_DISCLAIMER} {ANTI_CHEATING_NOTICE}
        </p>

        <div className="sr-stats" aria-label="إحصاءات من الفهرس الفعلي فقط">
          <div className="sr-stat">
            <strong>{stats.published}</strong>
            <span>منشور</span>
          </div>
          <div className="sr-stat">
            <strong>{stats.theses}</strong>
            <span>رسائل</span>
          </div>
          <div className="sr-stat">
            <strong>{stats.peerReviewed}</strong>
            <span>محكّم</span>
          </div>
          <div className="sr-stat">
            <strong>{stats.universities}</strong>
            <span>جامعات</span>
          </div>
          {scholarlyIndexed > 0 ? (
            <div className="sr-stat">
              <strong>{scholarlyIndexed}</strong>
              <span>بعد المراجعة الرباعية</span>
            </div>
          ) : null}
        </div>

        <section className="sr-section" aria-labelledby="sr-cats">
          <div className="sr-section__head">
            <h2 id="sr-cats" className="sr-section__title">
              التخصصات
            </h2>
            {RESEARCH_CATEGORIES.length > CATEGORY_PREVIEW ? (
              <button
                type="button"
                className="sr-section__link"
                onClick={() => setShowAllCats((v) => !v)}
              >
                {showAllCats ? "أقل" : "المزيد"}
              </button>
            ) : null}
          </div>
          <div className="sr-cat-grid">
            {visibleCats.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`sr-cat${categoryId === c.id ? " is-active" : ""}`}
                onClick={() =>
                  setCategoryId(categoryId === c.id ? "" : c.id)
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {topUniversities.length > 0 ? (
          <section className="sr-section" aria-labelledby="sr-unis">
            <div className="sr-section__head">
              <h2 id="sr-unis" className="sr-section__title">
                الجامعات والجهات
              </h2>
            </div>
            <div className="sr-cat-grid">
              {topUniversities.map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`sr-cat${university === u ? " is-active" : ""}`}
                  onClick={() => setUniversity(university === u ? "" : u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sr-section" aria-labelledby="sr-results">
          <div className="sr-section__head">
            <h2 id="sr-results" className="sr-section__title">
              {q || activeFilterCount ? "نتائج البحث" : "أحدث المواد المعتمدة"}
            </h2>
            <span
              style={{
                fontSize: "var(--ss-type-caption)",
                color: "var(--color-text-muted)",
              }}
            >
              {pending ? "تحديث النتائج…" : `${results.length} نتيجة`}
            </span>
          </div>
          <div className="sr-filters">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ResearchSort)}
              aria-label="الترتيب"
            >
              <option value="relevance">الأكثر صلة</option>
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="most_viewed">الأكثر قراءة</option>
              <option value="theses">الرسائل الجامعية</option>
            </select>
          </div>

          {pending && (
            <div className="sr-loading" aria-live="polite">
              <div className="sr-skel" />
            </div>
          )}
          {!pending && results.length === 0 && (
            <div className="sr-empty">
              <p>
                <strong>{EMPTY.data}</strong>
              </p>
              <p>
                الفهرس يعتمد على أبحاث موثّقة فقط. لا تُعرض أرقام أو أسماء وهمية
                في الإنتاج.
              </p>
              <Link
                href="/academic-research/submit"
                className="sr-btn sr-btn--outline"
              >
                {SCHOLARLY_SUGGEST_CTA}
              </Link>
            </div>
          )}
          <div className="sr-list">
            {results.map((r) => (
              <ResearchCard key={r.id} record={r} />
            ))}
          </div>
          {scholarlyHits.length > 0 ? (
            <p className="sr-notice" role="status">
              نتائج إضافية بعد المراجعة الرباعية: {scholarlyHits.length}
            </p>
          ) : null}
        </section>

        <Rail
          title="الماجستير"
          icon={<GraduationCap size={16} />}
          items={masters}
        />
        <Rail
          title="الدكتوراه"
          icon={<GraduationCap size={16} />}
          items={doctorates}
        />
        <Rail
          title="أحدث المواد المعتمدة"
          icon={<BookOpen size={16} />}
          items={latest}
        />

        <ShareButtons
          title="البحوث الشرعية — سُنّة"
          url="https://www.ssunnah.com/academic-research"
        />
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="تصفية البحوث"
      >
        <div className="flex flex-col gap-3 p-1 text-sm" dir="rtl">
          <label className="flex flex-col gap-1">
            التخصص
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">الكل</option>
              {RESEARCH_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            نوع الدرجة / البحث
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ResearchKind | "")}
            >
              <option value="">الكل</option>
              {Object.entries(RESEARCH_KIND_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {facets.universities.length > 0 ? (
            <label className="flex flex-col gap-1">
              الجامعة
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              >
                <option value="">الكل</option>
                {facets.universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {facets.countries.length > 0 ? (
            <label className="flex flex-col gap-1">
              الدولة
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">الكل</option>
                {facets.countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {facets.languages.length > 0 ? (
            <label className="flex flex-col gap-1">
              اللغة
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">الكل</option>
                {facets.languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1">
              من سنة
              <input
                type="number"
                inputMode="numeric"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              إلى سنة
              <input
                type="number"
                inputMode="numeric"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
              />
            </label>
          </div>
          {facets.accessTypes.length > 0 ? (
            <label className="flex flex-col gap-1">
              الوصول للنص الكامل
              <select
                value={accessType}
                onChange={(e) =>
                  setAccessType(e.target.value as AccessType | "")
                }
              >
                <option value="">الكل</option>
                {facets.accessTypes.map((a) => (
                  <option key={a} value={a}>
                    {RESEARCH_ACCESS_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="sr-btn sr-btn--primary"
              onClick={() => setFiltersOpen(false)}
            >
              تطبيق
            </button>
            <button
              type="button"
              className="sr-btn sr-btn--ghost"
              onClick={resetFilters}
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </FilterSheet>
    </SectionTemplatePage>
  );
}

function ResearchCard({ record: r }: { record: ResearchRecord }) {
  return (
    <Link href={`/academic-research/${r.slug}`} className="sr-card">
      <h3 className="sr-card__title">{r.title}</h3>
      <p className="sr-card__meta">
        <span className="sr-badge">{RESEARCH_KIND_LABELS[r.kind]}</span>
        <span>{r.authors.map((a) => a.name).join("، ")}</span>
        {r.university && <span>{r.university}</span>}
        {r.year && <span>{r.year}</span>}
        {r.categoryIds[0] && <span>{categoryLabel(r.categoryIds[0])}</span>}
        <span>{RESEARCH_ACCESS_LABELS[r.accessType]}</span>
        {r.sourceUrl ? <span>مصدر أصلي</span> : null}
      </p>
      <p className="sr-card__abs">{r.abstract}</p>
      <span className="sr-card__cta">عرض التفاصيل</span>
    </Link>
  );
}

function Rail({
  title,
  items,
  icon,
}: {
  title: string;
  items: ResearchRecord[];
  icon?: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <UtilityScreen compose="mark">
      <section className="sr-section">
        <div className="sr-section__head">
          <h2 className="sr-section__title">
            {icon} {title}
          </h2>
        </div>
        <div className="sr-list">
          {items.map((r) => (
            <ResearchCard key={r.id} record={r} />
          ))}
        </div>
      </section>
    </UtilityScreen>
  );
}
