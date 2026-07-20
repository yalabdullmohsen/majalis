import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { getDawahCategories, getQuestionsByCategory, getQuestionsByReligion, searchDawahQuestions, RELIGIONS, type DawahCategory, type DawahQuestion, type ReligionCode } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

function useDebounced<T>(value: T, ms = 350): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setD(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return d;
}

export default function DiscoverIslamQuestionsPage() {
  const [categories, setCategories] = useState<DawahCategory[]>([]);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || undefined;
  });
  const [religion, setReligion] = useState<ReligionCode | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("religion") as ReligionCode) || undefined;
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [items, setItems] = useState<DawahQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/questions",
      title: "أسئلة وأجوبة عن الإسلام | التعريف بالإسلام",
      description: "إجابات موثّقة عن أهم الأسئلة حول الإسلام: الله، النبوة، القرآن، العبادات، وأكثر.",
    });
    getDawahCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const task = debouncedSearch.trim()
      ? searchDawahQuestions(debouncedSearch)
      : religion
        ? getQuestionsByReligion(religion)
        : getQuestionsByCategory(categorySlug);
    task.then(setItems).finally(() => setLoading(false));
  }, [categorySlug, religion, debouncedSearch]);

  const selectReligion = (code: ReligionCode | undefined) => {
    setReligion(code);
    if (code) setCategorySlug(undefined);
  };
  const selectCategory = (slug: string | undefined) => {
    setCategorySlug(slug);
    if (slug !== undefined || religion) setReligion(undefined);
  };

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader eyebrow="التعريف بالإسلام" title="أسئلة وأجوبة" subtitle="إجابات موثّقة، مختصرة ومفصّلة، عن أهم الأسئلة حول الإسلام." />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث عن سؤال..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الأسئلة"
      />

      <div className="content-hub-chips" role="tablist" aria-label="تصفية حسب التصنيف">
        <button type="button" onClick={() => selectCategory(undefined)} className={!categorySlug && !religion ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>الكل</button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => selectCategory(c.slug)} className={categorySlug === c.slug ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>
            {c.name_ar}
          </button>
        ))}
      </div>

      <div className="dii-lang-row">
        <span className="dii-lang-label">أسئلة موجَّهة حسب ديانتك السابقة:</span>
        <div className="content-hub-chips" role="tablist" aria-label="تصفية حسب الديانة">
          {RELIGIONS.map((r) => (
            <button key={r.code} type="button" onClick={() => selectReligion(religion === r.code ? undefined : r.code)} className={religion === r.code ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonCardGrid />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أسئلة مطابقة بعد." />
      ) : (
        <div className="page-card-grid">
          {items.map((q) => (
            <Link key={q.id} href={`/discover-islam/questions/${q.slug}`} className="platform-card-link">
              <article className="page-card platform-content-card">
                <div className="page-card-header"><p>{q.title}</p></div>
                <p className="page-desc">{q.short_answer}</p>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
