import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { SearchSkeleton } from "@/components/ui-common";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl, resolveLessonSheikhImage } from "@/lib/sheikh-image";

const EMPTY: SearchResults = {
  lessons: [],
  library: [],
  miracles: [],
  sheikhs: [],
  qa: [],
  fawaid: [],
  adhkar: [],
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
          <SheikhAvatar src={avatarSrc} name={avatarName} size={48} className="search-result-avatar" />
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

    try {
      const r = await searchEverything(query);
      setResults(r);
    } catch {
      const demo = searchDemoContent(query);
      setResults({ ...demo, usingDemo: true, error: null, adhkar: demo.adhkar || [] });
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

  const total =
    results.lessons.length +
    results.miracles.length +
    results.sheikhs.length +
    results.qa.length +
    results.fawaid.length +
    results.adhkar.length;

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
          placeholder="ابحث في الدروس والمشايخ والفوائد والأسئلة والأذكار..."
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
                    meta={l.speaker_name || l.sheikhs?.name || l.category}
                    avatarSrc={resolveLessonSheikhImage(l)}
                    avatarName={l.speaker_name || l.sheikhs?.name || "شيخ"}
                  />
                )}
              />
              <Group
                title="المشايخ"
                items={results.sheikhs}
                render={(s) => (
                  <ResultRow
                    key={s.id}
                    href={`/sheikhs/${s.id}`}
                    title={s.name}
                    avatarSrc={resolveSheikhImageUrl(s)}
                    avatarName={s.name}
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
