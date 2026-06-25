import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { C } from "@/lib/theme";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { demoNoticeText, searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { DemoNotice, SearchSkeleton } from "@/components/ui-common";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl, resolveLessonSheikhImage } from "@/lib/sheikh-image";

const EMPTY: SearchResults = {
  lessons: [],
  library: [],
  miracles: [],
  sheikhs: [],
  qa: [],
  fawaid: [],
};

function Group({ title, items, render }: { title: string; items: any[]; render: (i: any) => React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, margin: "0 0 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {title}
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.brassDeep, background: C.parchmentDeep, padding: "0.1rem 0.5rem", borderRadius: "999px" }}>{items.length}</span>
      </h2>
      <div style={{ display: "grid", gap: "0.625rem" }}>{items.map(render)}</div>
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
  const [usingDemo, setUsingDemo] = useState(false);

  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setResults(EMPTY);
      setUsingDemo(false);
      return;
    }

    setLoading(true);
    setUsingDemo(false);

    try {
      const r = await searchEverything(query);
      setResults(r);
      setUsingDemo(!!r.usingDemo);
    } catch {
      const demo = searchDemoContent(query);
      setResults({ ...demo, usingDemo: true, error: null });
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTerm(q);
    runSearch(q);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = term.trim();
    if (t) navigate(`/search/${encodeURIComponent(t)}`);
  };

  const total =
    results.lessons.length +
    results.miracles.length +
    results.sheikhs.length +
    results.qa.length +
    results.fawaid.length;

  return (
    <div className="page-shell narrow search-page">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: C.emeraldDeep, margin: "0 0 1.25rem" }}>
        البحث
      </h1>

      <form onSubmit={submit} className="page-search-form">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث في الدروس والمشايخ والفوائد والأسئلة..."
          autoFocus
          aria-label="كلمة البحث"
        />
        <button type="submit">بحث</button>
      </form>

      {!q.trim() ? (
        <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem 0" }}>
          اكتب كلمة للبحث في محتوى المنصة (عنوان المجلس، اسم الشيخ، الوصف، الكلمات المفتاحية).
        </p>
      ) : loading ? (
        <SearchSkeleton />
      ) : (
        <>
          {usingDemo && <DemoNotice text={demoNoticeText("البحث")} />}
          {total === 0 ? (
            <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem 0" }}>
              لا توجد نتائج مطابقة لـ «{q}».
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 1.5rem" }}>
                {total} نتيجة لـ «<span style={{ fontWeight: 700, color: C.ink }}>{q}</span>»
              </p>
              <Group
                title="الدروس"
                items={results.lessons}
                render={(l) => (
                  <ResultRow
                    key={l.id}
                    href="/lessons"
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
                title="الإعجاز العلمي"
                items={results.miracles}
                render={(m) => <ResultRow key={m.id} href="/miracles" title={displayText(m.title)} meta={m.category} />}
              />
              <Group
                title="الأسئلة والأجوبة"
                items={results.qa}
                render={(x) => <ResultRow key={x.id} href="/qa" title={displayText(x.question)} meta={x.qa_categories?.name} />}
              />
              <Group
                title="الفوائد"
                items={results.fawaid}
                render={(f) => <ResultRow key={f.id} href="/fawaid" title={displayText(f.text)} meta={f.author_name} />}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
