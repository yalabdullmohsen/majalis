import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { FiqhCouncilSearchBox } from "@/components/fiqh-council/FiqhCouncilSearchBox";
import { getFiqhCouncilItems, getFiqhCouncilCategoryCounts, getMostViewedFiqhCouncilItems, getAllNawazilItems, getPublicFiqhSources } from "@/lib/fiqh-council-service";
import { getFiqhIssues } from "@/lib/fiqh-council-issues-service";
import { getFiqhLiveData, unavailableLabel } from "@/lib/fiqh-council-sessions-service";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_COUNCIL_INTRO,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  FIQH_SESSION_STATUS_LABELS,
  fiqhItemHref,
  fiqhIssueHref,
  fiqhSessionHref,
  formatFiqhItemMeta,
  type FiqhCouncilCategory,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";

const SUBNAV_LINKS = [
  { href: "/fiqh-council", label: "الرئيسية" },
  { href: "/fiqh-council/live", label: "البيانات الحية" },
  { href: "/fiqh-council/issues", label: "المسائل" },
  { href: "/fiqh-council/index", label: "الفهرس" },
  { href: "/fiqh-council/stats", label: "الإحصائيات" },
  { href: "/fiqh-council/resolutions", label: "القرارات" },
  { href: "/fiqh-council/fatwas", label: "الفتاوى" },
  { href: "/fiqh-council/recommendations", label: "التوصيات" },
  { href: "/fiqh-council/nawazil", label: "فقه النوازل" },
  { href: "/fiqh-council/research", label: "البحوث" },
  { href: "/fiqh-council/categories", label: "التصنيفات" },
  { href: "/fiqh-council/search", label: "البحث" },
  { href: "/fiqh-council/research-assistant", label: "مساعد الباحث" },
  { href: "/fiqh-council/compare", label: "المقارنة" },
  { href: "/fiqh-council/archive", label: "الأرشيف" },
] as const;

export function FiqhCouncilSubnav() {
  const [location] = useLocation();
  return (
    <nav className="fiqh-council-subnav" aria-label="أقسام المجمع الفقهي">
      {SUBNAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={location === href || location.startsWith(`${href}?`)
            ? "fiqh-council-subnav-link fiqh-council-subnav-link--active"
            : "fiqh-council-subnav-link"}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type FilterProps = {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  type: string;
  onType: (v: string) => void;
  year: string;
  onYear: (v: string) => void;
  source: string;
  onSource: (v: string) => void;
  showType?: boolean;
};

export function FiqhCouncilFilters({
  search,
  onSearch,
  category,
  onCategory,
  type,
  onType,
  year,
  onYear,
  source,
  onSource,
  showType = true,
}: FilterProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return ["الكل", ...Array.from({ length: 8 }, (_, i) => String(current - i))];
  }, []);

  return (
    <div className="fiqh-council-filters">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="ابحث في القرارات والفتاوى والبحوث..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في المجمع الفقهي"
      />

      <button
        type="button"
        className="fiqh-filter-toggle"
        onClick={() => setFiltersOpen((open) => !open)}
        aria-expanded={filtersOpen}
      >
        {filtersOpen ? "إخفاء الفلاتر" : "تصفية النتائج"}
        <span>{category !== "الكل" ? category : type !== "الكل" ? FIQH_ITEM_TYPE_LABELS[type as FiqhItemType] : "الكل"}</span>
      </button>

      <div className={`fiqh-filter-panel${filtersOpen ? " is-open" : ""}`}>
        {showType && (
          <div className="content-hub-chips fiqh-chip-strip">
            <span className="fiqh-council-filter-label">النوع</span>
            {["الكل", ...FIQH_ITEM_TYPES].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onType(t)}
                className={type === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
              >
                {t === "الكل" ? "الكل" : FIQH_ITEM_TYPE_LABELS[t as FiqhItemType]}
              </button>
            ))}
          </div>
        )}

        <div className="content-hub-chips fiqh-chip-strip">
          <span className="fiqh-council-filter-label">التصنيف</span>
          {["الكل", ...FIQH_COUNCIL_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategory(cat)}
              className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="fiqh-council-filter-row">
          <label className="fiqh-council-select-label">
            السنة
            <select value={year} onChange={(e) => onYear(e.target.value)} className="fiqh-council-select">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="fiqh-council-select-label">
            المصدر
            <input
              value={source}
              onChange={(e) => onSource(e.target.value)}
              placeholder="اسم المصدر"
              className="fiqh-council-source-input"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

type ListProps = {
  typeFilter?: FiqhItemType;
  title: string;
  subtitle: string;
  eyebrow?: string;
  showTypeFilter?: boolean;
  extra?: ReactNode;
};

export function FiqhCouncilListPage({
  typeFilter,
  title,
  subtitle,
  eyebrow = "الفقه المعاصر",
  showTypeFilter = true,
  extra,
}: ListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [type, setType] = useState(typeFilter || "الكل");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("الكل");
  const [source, setSource] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const debouncedSource = useDebouncedValue(source);

  useEffect(() => {
    setLoading(true);
    getFiqhCouncilItems({
      type: (typeFilter || type) as FiqhItemType | "الكل",
      category: category as FiqhCouncilCategory | "الكل",
      search: debouncedSearch,
      year: year === "الكل" ? "الكل" : Number(year),
      source: debouncedSource,
    })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [typeFilter, type, category, debouncedSearch, year, debouncedSource]);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <FiqhCouncilSubnav />

      {extra}

      <div className="page-stats-row">
        <span>{items.length} عنصر</span>
        <span>{FIQH_COUNCIL_CATEGORIES.length} تصنيف</span>
      </div>

      <FiqhCouncilFilters
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        type={type}
        onType={setType}
        year={year}
        onYear={setYear}
        source={source}
        onSource={setSource}
        showType={showTypeFilter && !typeFilter}
      />

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد عناصر مطابقة." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
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
    </div>
  );
}

export function FiqhCouncilHubPage() {
  const [latest, setLatest] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [fatwas, setFatwas] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [nawazil, setNawazil] = useState<any[]>([]);
  const [mostViewed, setMostViewed] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [topIssues, setTopIssues] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getFiqhCouncilItems({ limit: 6 }),
      getFiqhCouncilItems({ type: "resolution", limit: 4 }),
      getFiqhCouncilItems({ type: "fatwa", limit: 4 }),
      getFiqhCouncilItems({ type: "recommendation", limit: 4 }),
      getAllNawazilItems(4),
      getMostViewedFiqhCouncilItems(4),
      getFiqhCouncilCategoryCounts(),
      getPublicFiqhSources(),
      getFiqhIssues({ limit: 4 }),
      getFiqhLiveData(),
    ]).then((results) => {
      if (cancelled) return;
      const value = <T,>(index: number, fallback: T): T =>
        results[index]?.status === "fulfilled" ? (results[index] as PromiseFulfilledResult<T>).value : fallback;

      setLatest(value(0, { data: [] }).data);
      setResolutions(value(1, { data: [] }).data);
      setFatwas(value(2, { data: [] }).data);
      setRecommendations(value(3, { data: [] }).data);
      setNawazil(value(4, { data: [] }).data);
      setMostViewed(value(5, []));
      setCategoryCounts(value(6, {}));
      setSources(value(7, { data: [] }).data);
      setTopIssues(value(8, { data: [] }).data);
      setLiveData(value(9, { data: null }).data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page fiqh-council-hub">
      <PageHeader
        eyebrow="الفقه المعاصر"
        title="المجمع الفقهي الإسلامي"
        subtitle={FIQH_COUNCIL_INTRO}
      />

      <FiqhCouncilSubnav />

      <FiqhCouncilSearchBox placeholder="ابحث في قرارات وفتاوى وتوصيات المجمع..." />

      <div className="fiqh-hub-quick-links">
        <Link href="/fiqh-council/live" className="fiqh-hub-quick-link fiqh-hub-quick-link--primary">عرض البيانات الحية</Link>
        <Link href="/fiqh-council/search" className="fiqh-hub-quick-link">البحث في قرارات المجمع</Link>
        <Link href="/fiqh-council/issues" className="fiqh-hub-quick-link">المسائل الفقهية</Link>
        <Link href="/fiqh-council/index" className="fiqh-hub-quick-link">الفهرس الموضوعي</Link>
        <Link href="/fiqh-council/stats" className="fiqh-hub-quick-link">الإحصائيات</Link>
        <Link href="/fiqh-council/nawazil" className="fiqh-hub-quick-link">فقه النوازل</Link>
        <Link href="/fiqh-council/research-assistant" className="fiqh-hub-quick-link">مساعد الباحث</Link>
      </div>

      <section className="fiqh-mobile-category-deck" aria-label="تصنيفات المجمع الفقهي">
        {FIQH_COUNCIL_CATEGORIES.map((cat) => (
          <Link key={cat} href={`/fiqh-council/search?category=${encodeURIComponent(cat)}`} className="fiqh-mobile-category-card">
            <strong>{cat}</strong>
            <span>{categoryCounts[cat] ?? 0} مادة</span>
          </Link>
        ))}
      </section>

      {!loading && liveData && (
        <section className="fiqh-hub-live-banner ui-card">
          <div className="fiqh-hub-live-col">
            <h2 className="fiqh-council-section-title">آخر جلسة</h2>
            {liveData.last_session ? (
              <>
                <p><strong>{liveData.last_session.session_title}</strong></p>
                <p className="fiqh-hub-live-meta">
                  {FIQH_SESSION_STATUS_LABELS[liveData.last_session.status as keyof typeof FIQH_SESSION_STATUS_LABELS] ??
                    liveData.last_session.status}
                  {liveData.last_session.start_date && ` · ${liveData.last_session.start_date}`}
                </p>
                <Link href={fiqhSessionHref(liveData.last_session.slug)} className="fiqh-council-section-link">تفاصيل الجلسة</Link>
              </>
            ) : (
              <p className="fiqh-live-unavailable">لم تُنشر بيانات موثقة بعد.</p>
            )}
          </div>
          <div className="fiqh-hub-live-col">
            <h2 className="fiqh-council-section-title">الجلسة القادمة</h2>
            {liveData.upcoming_session ? (
              <>
                <p><strong>{liveData.upcoming_session.session_title}</strong></p>
                <p className="fiqh-hub-live-meta">{unavailableLabel(liveData.upcoming_session.start_date)}</p>
              </>
            ) : (
              <p className="fiqh-live-unavailable">لم تُنشر بيانات موثقة بعد.</p>
            )}
          </div>
        </section>
      )}

      {loading ? <Loading /> : (
        <>
          {topIssues.length > 0 && <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">أهم المسائل الفقهية</h2>
              <Link href="/fiqh-council/issues" className="fiqh-council-section-link">عرض الكل</Link>
            </div>
            <div className="page-card-grid">
              {topIssues.map((issue) => (
                <PlatformContentCard
                  key={issue.slug}
                  href={fiqhIssueHref(issue.slug)}
                  title={issue.title}
                  tag="مسألة فقهية"
                  meta={issue.category}
                  summary={issue.ruling_summary || issue.summary}
                />
              ))}
            </div>
          </section>}

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">أحدث القرارات</h2>
              <Link href="/fiqh-council/resolutions" className="fiqh-council-section-link">عرض الكل</Link>
            </div>
            <div className="page-card-grid">
              {resolutions.map((item) => (
                <PlatformContentCard
                  key={item.slug}
                  href={fiqhItemHref(item.slug)}
                  title={item.title}
                  tag={FIQH_ITEM_TYPE_LABELS.resolution}
                  meta={formatFiqhItemMeta(item)}
                  summary={item.summary}
                />
              ))}
            </div>
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">أحدث الفتاوى الجماعية</h2>
              <Link href="/fiqh-council/fatwas" className="fiqh-council-section-link">عرض الكل</Link>
            </div>
            <div className="page-card-grid">
              {fatwas.map((item) => (
                <PlatformContentCard
                  key={item.slug}
                  href={fiqhItemHref(item.slug)}
                  title={item.title}
                  tag={FIQH_ITEM_TYPE_LABELS.fatwa}
                  meta={formatFiqhItemMeta(item)}
                  summary={item.summary}
                />
              ))}
            </div>
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">أحدث التوصيات</h2>
              <Link href="/fiqh-council/recommendations" className="fiqh-council-section-link">عرض الكل</Link>
            </div>
            <div className="page-card-grid">
              {recommendations.map((item) => (
                <PlatformContentCard
                  key={item.slug}
                  href={fiqhItemHref(item.slug)}
                  title={item.title}
                  tag={FIQH_ITEM_TYPE_LABELS.recommendation}
                  meta={formatFiqhItemMeta(item)}
                  summary={item.summary}
                />
              ))}
            </div>
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">فقه النوازل</h2>
              <Link href="/fiqh-council/nawazil" className="fiqh-council-section-link">عرض الكل</Link>
            </div>
            <div className="page-card-grid">
              {nawazil.map((item) => (
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
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">الأكثر قراءة</h2>
            </div>
            <div className="page-card-grid">
              {mostViewed.map((item) => (
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
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">التصنيفات الفقهية</h2>
              <Link href="/fiqh-council/categories" className="fiqh-council-section-link">جميع التصنيفات</Link>
            </div>
            <div className="fiqh-council-category-grid">
              {FIQH_COUNCIL_CATEGORIES.map((cat) => (
                <Link key={cat} href={`/fiqh-council/categories?cat=${encodeURIComponent(cat)}`} className="fiqh-council-category-card">
                  <span className="fiqh-council-category-name">{cat}</span>
                  <span className="fiqh-council-category-count">{categoryCounts[cat] || 0} عنصر</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">المصادر الرسمية</h2>
            </div>
            <div className="fiqh-sources-grid">
              {sources.map((src) => (
                <div key={src.id || src.slug} className="fiqh-source-card">
                  <strong>{src.name}</strong>
                  <span>{src.organization}</span>
                  {src.official_url && (
                    <a href={src.official_url} target="_blank" rel="noopener noreferrer" className="fiqh-council-section-link">
                      الموقع الرسمي
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="fiqh-council-section">
            <div className="fiqh-council-section-header">
              <h2 className="fiqh-council-section-title">آخر المحتوى</h2>
              <Link href="/fiqh-council/archive" className="fiqh-council-section-link">الأرشيف</Link>
            </div>
            <div className="page-card-grid">
              {latest.map((item) => (
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
          </section>
        </>
      )}
    </div>
  );
}

export default FiqhCouncilHubPage;
