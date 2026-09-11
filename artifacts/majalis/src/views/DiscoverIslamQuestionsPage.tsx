import { useEffect, useState } from "react";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { HubCard } from "@/components/ui/HubCard";
import { DiscoverIslamShell } from "@/components/discover-islam/DiscoverIslamShell";
import { applyPageSeo } from "@/lib/seo";
import { getDawahCategories, getQuestionsByCategory, getQuestionsByReligion, searchDawahQuestions, RELIGIONS, type DawahCategory, type DawahQuestion, type ReligionCode } from "@/lib/dawah-service";
import { STATIC_DAWAH_QUESTIONS } from "@/lib/dawah-static-fallback";
import { UtilityScreen } from "@/components/design-system/screens";

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
  const [items, setItems] = useState<DawahQuestion[]>(() => STATIC_DAWAH_QUESTIONS.slice(0, 50));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/questions",
      title: "أسئلة وأجوبة عن الإسلام | التعريف بالإسلام",
      description: "إجابات موثّقة عن أهم الأسئلة حول الإسلام: الله، النبوة، القرآن، العبادات، وأكثر. محتوى معتمد في منهج سُنّة",
    });
    getDawahCategories().then(setCategories);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const task = debouncedSearch.trim()
      ? searchDawahQuestions(debouncedSearch)
      : religion
        ? getQuestionsByReligion(religion)
        : getQuestionsByCategory(categorySlug);
    task
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
    <UtilityScreen compose="mark">
    <DiscoverIslamShell>
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

      {loading && items.length === 0 ? (
        <SkeletonCardGrid />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أسئلة مطابقة بعد." />
      ) : (
        <div className="hub-card-grid dii-list-grid dii-section" aria-busy={loading}>
          {items.map((q) => (
            <HubCard
              key={q.id}
              href={`/discover-islam/questions/${q.slug}`}
              title={q.title}
              description={q.short_answer}
              badge="سؤال"
              className="dii-hub-card dii-list-card"
            />
          ))}
        </div>
      )}
    </DiscoverIslamShell>
  
    </UtilityScreen>
  );
}
