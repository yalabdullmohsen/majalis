import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getFiqhCouncilItems, getFiqhCouncilCategoryCounts } from "@/lib/fiqh-council-service";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_COUNCIL_INTRO,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhCouncilCategory,
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

      {showType && (
        <div className="content-hub-chips">
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

      <div className="content-hub-chips">
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

      <nav className="fiqh-council-subnav" aria-label="أقسام المجمع الفقهي">
        <Link href="/fiqh-council" className="fiqh-council-subnav-link">الرئيسية</Link>
        <Link href="/fiqh-council/resolutions" className="fiqh-council-subnav-link">القرارات</Link>
        <Link href="/fiqh-council/fatwas" className="fiqh-council-subnav-link">الفتاوى الجماعية</Link>
        <Link href="/fiqh-council/research" className="fiqh-council-subnav-link">البحوث</Link>
        <Link href="/fiqh-council/categories" className="fiqh-council-subnav-link">التصنيفات</Link>
      </nav>

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
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    Promise.all([
      getFiqhCouncilItems({ limit: 6 }),
      getFiqhCouncilItems({ type: "resolution", limit: 4 }),
      getFiqhCouncilItems({ type: "fatwa", limit: 4 }),
      getFiqhCouncilCategoryCounts(),
    ]).then(([all, res, fat, counts]) => {
      setLatest(all.data);
      setResolutions(res.data);
      setFatwas(fat.data);
      setCategoryCounts(counts);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    getFiqhCouncilItems({ search: debouncedSearch, limit: 8 })
      .then(({ data }) => setSearchResults(data));
  }, [debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page fiqh-council-hub">
      <PageHeader
        eyebrow="الفقه المعاصر"
        title="المجمع الفقهي الإسلامي"
        subtitle={FIQH_COUNCIL_INTRO}
      />

      <nav className="fiqh-council-subnav" aria-label="أقسام المجمع الفقهي">
        <Link href="/fiqh-council/resolutions" className="fiqh-council-subnav-link">القرارات</Link>
        <Link href="/fiqh-council/fatwas" className="fiqh-council-subnav-link">الفتاوى الجماعية</Link>
        <Link href="/fiqh-council/research" className="fiqh-council-subnav-link">البحوث</Link>
        <Link href="/fiqh-council/categories" className="fiqh-council-subnav-link">التصنيفات</Link>
      </nav>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في قرارات وفتاوى المجمع..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في المجمع الفقهي"
      />

      {debouncedSearch.trim() && searchResults.length > 0 && (
        <section className="fiqh-council-section">
          <h2 className="fiqh-council-section-title">نتائج البحث</h2>
          <div className="page-card-grid">
            {searchResults.map((item) => (
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
      )}

      {loading ? <Loading /> : (
        <>
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
              <h2 className="fiqh-council-section-title">آخر المحتوى</h2>
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
