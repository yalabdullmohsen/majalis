import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import {
  RESEARCH_CATEGORIES,
  RESEARCH_KIND_LABELS,
  RIGHTS_DISCLAIMER,
  ANTI_CHEATING_NOTICE,
  categoryLabel,
  computeResearchStats,
  queryPublished,
  pushSearchHistory,
  suggestQueryCompletions,
  type ResearchFilters,
  type ResearchKind,
  type ResearchSort,
} from "@/lib/researches";
import { BookOpen, GraduationCap, Plus, Search, Sparkles, Shield } from "lucide-react";
import "@/styles/pages/researches.css";

function useQueryParams(): URLSearchParams {
  const [loc] = useLocation();
  const qs = loc.includes("?") ? loc.slice(loc.indexOf("?") + 1) : (typeof window !== "undefined" ? window.location.search.slice(1) : "");
  return useMemo(() => new URLSearchParams(qs), [loc, qs]);
}

export default function AcademicResearchPage() {
  const params = useQueryParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [categoryId, setCategoryId] = useState(params.get("cat") || "");
  const [kind, setKind] = useState<ResearchKind | "">(params.get("kind") as ResearchKind || "");
  const [sort, setSort] = useState<ResearchSort>((params.get("sort") as ResearchSort) || "relevance");
  const [yearFrom, setYearFrom] = useState(params.get("yearFrom") || "");
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/academic-research",
      title: "الأبحاث الشرعية | المجلس العلمي",
      description:
        "مكتبة أكاديمية متخصصة في جمع وتنظيم الأبحاث والدراسات الشرعية الموثقة، مع حفظ حقوق الباحثين والجهات العلمية.",
      keywords: ["أبحاث شرعية", "رسائل ماجستير", "دكتوراه", "فقه", "حديث", "تفسير", "مكتبة أكاديمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "الأبحاث الشرعية",
          url: "https://www.majlisilm.com/academic-research",
          description: "مكتبة أكاديمية متخصصة في الأبحاث الشرعية الموثقة",
        },
      ],
    });
  }, []);

  const filters: ResearchFilters = useMemo(
    () => ({
      q: q.trim() || undefined,
      categoryId: categoryId || undefined,
      kind: kind || undefined,
      sort,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
    }),
    [q, categoryId, kind, sort, yearFrom],
  );

  const results = useMemo(() => queryPublished(filters), [filters]);
  const stats = useMemo(() => computeResearchStats(), []);
  const latest = useMemo(() => queryPublished({ sort: "newest" }).slice(0, 6), []);
  const mostViewed = useMemo(() => queryPublished({ sort: "most_viewed" }).slice(0, 6), []);
  const featured = useMemo(() => queryPublished({}).filter((r) => r.featured).slice(0, 6), []);
  const theses = useMemo(() => queryPublished({ thesesOnly: true, sort: "newest" }).slice(0, 6), []);
  const peerReviewed = useMemo(() => queryPublished({ peerReviewed: true, sort: "newest" }).slice(0, 6), []);

  const onSearch = (value: string) => {
    setQ(value);
    startTransition(() => {
      setSuggestions(suggestQueryCompletions(queryPublished({}), value));
    });
  };

  const runSearch = () => {
    pushSearchHistory(q);
    startTransition(() => undefined);
  };

  return (
    <div className="sr-page">
      <header className="sr-hero">
        <h1 className="sr-hero__title">الأبحاث الشرعية</h1>
        <p className="sr-hero__sub">
          مكتبة أكاديمية متخصصة في جمع وتنظيم الأبحاث والدراسات الشرعية الموثقة، مع حفظ حقوق الباحثين والجهات العلمية.
        </p>
        <div className="sr-hero__actions">
          <input
            className="sr-search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="بحث متقدم: عنوان، باحث، موضوع، جامعة، كلمات مفتاحية…"
            aria-label="بحث في الأبحاث الشرعية"
            list="sr-suggest"
          />
          <datalist id="sr-suggest">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button type="button" className="sr-btn sr-btn--primary" onClick={runSearch}>
            <Search size={16} aria-hidden /> بحث
          </button>
          <Link href="/academic-research/submit" className="sr-btn sr-btn--ghost">
            <Plus size={16} aria-hidden /> أضف بحثًا
          </Link>
          <Link href="/academic-research/assistant" className="sr-btn sr-btn--ghost">
            <Sparkles size={16} aria-hidden /> مساعدة الباحث
          </Link>
        </div>
      </header>

      <p className="sr-notice" role="note">
        <Shield size={14} aria-hidden style={{ display: "inline", verticalAlign: "middle" }} /> {RIGHTS_DISCLAIMER}{" "}
        {ANTI_CHEATING_NOTICE}
      </p>

      <div className="sr-stats" aria-label="إحصاءات من الفهرس الفعلي فقط">
        <div className="sr-stat"><strong>{stats.published}</strong><span>منشور</span></div>
        <div className="sr-stat"><strong>{stats.theses}</strong><span>رسائل</span></div>
        <div className="sr-stat"><strong>{stats.peerReviewed}</strong><span>محكّم</span></div>
        <div className="sr-stat"><strong>{stats.categoriesUsed}</strong><span>تخصصات</span></div>
        <div className="sr-stat"><strong>{stats.universities}</strong><span>جامعات</span></div>
        <div className="sr-stat"><strong>{stats.countries}</strong><span>دول</span></div>
      </div>

      <section className="sr-section" aria-labelledby="sr-cats">
        <div className="sr-section__head">
          <h2 id="sr-cats" className="sr-section__title">تصنيفات الأبحاث</h2>
        </div>
        <div className="sr-cat-grid">
          {RESEARCH_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`sr-cat${categoryId === c.id ? " is-active" : ""}`}
              onClick={() => setCategoryId(categoryId === c.id ? "" : c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="sr-section" aria-labelledby="sr-results">
        <div className="sr-section__head">
          <h2 id="sr-results" className="sr-section__title">
            {q || categoryId || kind ? "نتائج البحث" : "تصفح الأبحاث"}
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {pending ? "جارٍ البحث…" : `${results.length} نتيجة`}
          </span>
        </div>
        <div className="sr-filters">
          <select value={kind} onChange={(e) => setKind(e.target.value as ResearchKind | "")} aria-label="نوع البحث">
            <option value="">كل الأنواع</option>
            {Object.entries(RESEARCH_KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as ResearchSort)} aria-label="الترتيب">
            <option value="relevance">الأكثر صلة</option>
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="most_viewed">الأكثر قراءة</option>
            <option value="most_cited">الأكثر توثيقًا</option>
            <option value="reliability">الأعلى موثوقية</option>
            <option value="peer_reviewed">المحكّمة</option>
            <option value="theses">الرسائل الجامعية</option>
          </select>
          <input
            type="number"
            inputMode="numeric"
            placeholder="من سنة"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            aria-label="سنة النشر من"
            style={{ width: "6.5rem" }}
          />
        </div>

        {pending && (
          <div className="sr-loading" aria-live="polite">
            <div className="sr-skel" />
          </div>
        )}
        {!pending && results.length === 0 && (
          <div className="sr-empty">
            <p><strong>لا توجد نتائج منشورة بعد</strong></p>
            <p>الفهرس يعتمد على أبحاث موثّقة فقط. لا تُعرض أرقام أو أسماء وهمية في الإنتاج.</p>
            <Link href="/academic-research/submit" className="sr-btn sr-btn--outline">أضف بحثًا للمراجعة</Link>
          </div>
        )}
        <div className="sr-list">
          {results.map((r) => (
            <Link key={r.id} href={`/academic-research/${r.slug}`} className="sr-card">
              <h3 className="sr-card__title">{r.title}</h3>
              <p className="sr-card__meta">
                <span className="sr-badge">{RESEARCH_KIND_LABELS[r.kind]}</span>
                <span>{r.authors.map((a) => a.name).join("، ")}</span>
                {r.university && <span>{r.university}</span>}
                {r.year && <span>{r.year}</span>}
                {r.categoryIds[0] && <span>{categoryLabel(r.categoryIds[0])}</span>}
                {r.isDemo && <span className="sr-badge">تجريبي</span>}
              </p>
              <p className="sr-card__abs">{r.abstract}</p>
            </Link>
          ))}
        </div>
      </section>

      <Rail title="أحدث الأبحاث" icon={<BookOpen size={16} />} items={latest} />
      <Rail title="الأكثر قراءة" items={mostViewed} />
      <Rail title="الأبحاث المميزة" items={featured} />
      <Rail title="رسائل الماجستير والدكتوراه" icon={<GraduationCap size={16} />} items={theses} />
      <Rail title="أبحاث خضعت للمراجعة" items={peerReviewed} />

      <section className="sr-section">
        <div className="sr-section__head">
          <h2 className="sr-section__title">مقترحات حسب اهتمامك</h2>
          <Link href="/academic-research/assistant" className="sr-section__link">أدوات المساعدة</Link>
        </div>
        <p className="sr-notice">
          اختر تصنيفًا أو ابحث بكلمة مفتاحية لعرض نتائج أقرب لاهتمامك. لا تُولَّد اهتمامات وهمية.
        </p>
      </section>

      <ShareButtons title="الأبحاث الشرعية — المجلس العلمي" url="https://www.majlisilm.com/academic-research" />
    </div>
  );
}

function Rail({
  title,
  items,
  icon,
}: {
  title: string;
  items: ReturnType<typeof queryPublished>;
  icon?: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="sr-section">
      <div className="sr-section__head">
        <h2 className="sr-section__title">{icon} {title}</h2>
      </div>
      <div className="sr-list">
        {items.map((r) => (
          <Link key={r.id} href={`/academic-research/${r.slug}`} className="sr-card">
            <h3 className="sr-card__title">{r.title}</h3>
            <p className="sr-card__meta">
              <span>{r.authors.map((a) => a.name).join("، ")}</span>
              {r.year && <span>{r.year}</span>}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
