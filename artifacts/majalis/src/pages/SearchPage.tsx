import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { SearchSkeleton } from "@/components/ui-common";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { searchLocalExtensions } from "@/lib/local-search-ext";
import { lessonRecordToSearchRow, searchUnifiedLessons } from "@/lib/lessons-service";
import { addSearchHistory } from "@/lib/search-history";
import { trackSearchQuery } from "@/lib/content-analytics";

const EMPTY: SearchResults = {
  lessons: [],
  library: [],
  miracles: [],
  sheikhs: [],
  qa: [],
  fawaid: [],
  adhkar: [],
  fiqh_decisions: [],
  fatwas: [],
  rulings: [],
  courses: [],
  updates: [],
};

function Group({ title, items, render, id }: { title: string; items: any[]; render: (i: any) => React.ReactNode; id?: string }) {
  if (items.length === 0) return null;
  return (
    <div id={id} className="search-results-group" style={{ marginBottom: "2rem" }}>
      <h2 className="search-results-group-title">
        {title}
        <span className="search-results-count">{items.length}</span>
      </h2>
      <div className="search-results-list">{items.map(render)}</div>
    </div>
  );
}

function ResultRow({
  href,
  title,
  meta,
  avatarSrc,
  avatarName,
}: {
  href: string;
  title: string;
  meta?: string;
  avatarSrc?: string;
  avatarName?: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className="search-result-row">
        {avatarName && (
          <SheikhAvatar src={avatarSrc} name={avatarName} size={56} className="search-result-avatar" />
        )}
        <div className="search-result-copy">
          <span>{title}</span>
          {meta && <span className="search-result-meta">{meta}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const q = params.q ? decodeURIComponent(params.q) : "";
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setResults(EMPTY);
      return;
    }

    setLoading(true);
    addSearchHistory(query);
    void trackSearchQuery(query);

    try {
      const [r, unifiedMatches] = await Promise.all([
        searchEverything(query),
        searchUnifiedLessons(query),
      ]);

      const unifiedRows = unifiedMatches.map(lessonRecordToSearchRow);
      const seen = new Set((r.lessons || []).map((l: { id: string }) => l.id));
      const mergedLessons = [
        ...(r.lessons || []).map((row: any) => ({
          ...row,
          searchMeta: [row.speaker_name || row.sheikhs?.name, row.mosque, row.region || row.city, row.category]
            .filter(Boolean)
            .join(" · "),
        })),
        ...unifiedRows.filter((row) => !seen.has(row.id)),
      ];

      setResults({ ...r, lessons: mergedLessons, sheikhs: [] });
    } catch {
      const unifiedMatches = await searchUnifiedLessons(query);
      if (unifiedMatches.length > 0) {
        setResults({
          ...EMPTY,
          lessons: unifiedMatches.map(lessonRecordToSearchRow),
          usingDemo: false,
          error: null,
        });
        return;
      }
      const demo = searchDemoContent(query);
      setResults({ ...demo, usingDemo: true, error: null, adhkar: demo.adhkar || [], sheikhs: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTerm(q);
    runSearch(q);
  }, [q]);

  const submitSearch = (value: string) => {
    const t = value.trim();
    if (t) navigate(`/search/${encodeURIComponent(t)}`);
  };

  const localExtra = q.trim() ? searchLocalExtensions(q) : { occasions: [], nawawi: [], quran: [] };

  const total =
    results.lessons.length +
    results.miracles.length +
    results.qa.length +
    results.fawaid.length +
    results.adhkar.length +
    (results.fiqh_decisions?.length || 0) +
    (results.fatwas?.length || 0) +
    (results.rulings?.length || 0) +
    (results.courses?.length || 0) +
    (results.updates?.length || 0) +
    localExtra.occasions.length +
    localExtra.nawawi.length +
    localExtra.quran.length;

  return (
    <div className="page-shell narrow search-page">
      <h1 className="search-page-title">البحث</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(term);
        }}
        className="page-search-form search-page-form"
      >
        <SearchSuggestions
          value={term}
          onChange={setTerm}
          onSubmit={submitSearch}
          placeholder="ابحث في الدروس والفتاوى والقرارات والدورات..."
        />
        <button type="submit">بحث</button>
      </form>

      {!q.trim() ? (
        <p className="search-page-hint">
          اكتب كلمة للبحث في محتوى المنصة (عنوان المجلس، اسم الشيخ، الوصف، الكلمات المفتاحية).
        </p>
      ) : loading ? (
        <SearchSkeleton />
      ) : (
        <>
          {total === 0 ? (
            <p className="search-page-hint">
              لا توجد نتائج مطابقة لـ «{q}».
            </p>
          ) : (
            <>
              <p className="search-page-summary">
                {total} نتيجة لـ «<span>{q}</span>»
              </p>
              <Group
                title="الدروس"
                items={results.lessons}
                render={(l) => (
                  <ResultRow
                    key={l.id}
                    href={`/lessons/${l.id}`}
                    title={displayText(l.title)}
                    meta={l.searchMeta || l.speaker_name || l.sheikhs?.name || l.category}
                    avatarSrc={resolveLessonSheikhImage(l)}
                    avatarName={l.speaker_name || l.sheikhs?.name || "شيخ"}
                  />
                )}
              />
              <Group
                title="الفوائد"
                items={results.fawaid}
                render={(f) => (
                  <ResultRow
                    key={f.id}
                    href="/fawaid"
                    title={displayText(f.text)}
                    meta={f.author_name}
                  />
                )}
              />
              <Group
                title="الأسئلة والأجوبة"
                items={results.qa}
                render={(x) => (
                  <ResultRow
                    key={x.id}
                    href="/qa"
                    title={displayText(x.question)}
                    meta={x.qa_categories?.name}
                  />
                )}
              />
              <Group
                title="الأذكار"
                id="adhkar"
                items={results.adhkar}
                render={(a) => (
                  <ResultRow
                    key={a.id}
                    href="/adhkar"
                    title={displayText(a.text)}
                    meta={a.category || a.source}
                  />
                )}
              />
              <Group
                title="المناسبات"
                items={localExtra.occasions}
                render={(o) => (
                  <ResultRow key={o.id} href={o.href} title={o.title} meta={o.meta} />
                )}
              />
              <Group
                title="الأربعون النووية"
                items={localExtra.nawawi}
                render={(h) => (
                  <ResultRow key={h.id} href={h.href} title={h.title} meta={h.meta} />
                )}
              />
              <Group
                title="القرآن"
                items={localExtra.quran}
                render={(s) => (
                  <ResultRow key={s.id} href={s.href} title={s.title} meta={s.meta} />
                )}
              />
              <Group
                title="المجمع الفقهي"
                items={results.fiqh_decisions || []}
                render={(d) => (
                  <ResultRow key={d.id} href={`/fiqh-council/${d.slug || d.id}`} title={displayText(d.title)} meta={d.searchMeta || d.category} />
                )}
              />
              <Group
                title="الفتاوى"
                items={results.fatwas || []}
                render={(f) => (
                  <ResultRow key={f.id} href={`/fatwa/${f.id}`} title={displayText(f.question)} meta={f.searchMeta || f.category} />
                )}
              />
              <Group
                title="الأحكام الشرعية"
                items={results.rulings || []}
                render={(r) => (
                  <ResultRow key={r.id} href={`/rulings/${r.id}`} title={displayText(r.title)} meta={r.searchMeta || r.category} />
                )}
              />
              <Group
                title="الدورات العلمية"
                items={results.courses || []}
                render={(c) => (
                  <ResultRow key={c.id} href={`/annual-courses/${c.id}`} title={displayText(c.title)} meta={c.searchMeta || c.course_type} />
                )}
              />
              <Group
                title="آخر المستجدات"
                items={results.updates || []}
                render={(u) => (
                  <ResultRow key={u.id} href="/updates" title={displayText(u.title)} meta={u.searchMeta || u.update_type} />
                )}
              />
              <Group
                title="الإعجاز العلمي"
                items={results.miracles}
                render={(m) => (
                  <ResultRow key={m.id} href="/miracles" title={displayText(m.title)} meta={m.category} />
                )}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
