import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { C } from "@/lib/theme";
import { getSupabaseErrorMessage, searchEverything } from "@/lib/supabase";
import { Loading, ErrorMessage } from "@/components/ui-common";

type Results = { lessons: any[]; library: any[]; miracles: any[]; sheikhs: any[]; qa: any[]; fawaid: any[] };
const EMPTY: Results = { lessons: [], library: [], miracles: [], sheikhs: [], qa: [], fawaid: [] };

function Group({ title, items, render }: { title: string; items: any[]; render: (i: any) => React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: "0 0 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {title}
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.brassDeep, background: C.parchmentDeep, padding: "0.1rem 0.5rem", borderRadius: "999px" }}>{items.length}</span>
      </h2>
      <div style={{ display: "grid", gap: "0.625rem" }}>{items.map(render)}</div>
    </section>
  );
}

function ResultRow({ href, title, meta, type }: { href: string; title: string; meta?: string; type: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", padding: "0.95rem 1.125rem", borderRadius: "0.65rem", border: `1px solid ${C.line}`, background: C.panel, boxShadow: "0 10px 24px rgba(36,31,24,0.04)" }}>
        <span>
          <span style={{ display: "block", fontWeight: 700, color: C.ink, fontSize: "0.95rem" }}>{title}</span>
          {meta && <span style={{ fontSize: "0.75rem", color: C.brassDeep }}>{meta}</span>}
        </span>
        <span style={{ fontSize: "0.72rem", color: C.emeraldDeep, background: C.sage, borderRadius: "999px", padding: "0.15rem 0.55rem", whiteSpace: "nowrap" }}>{type}</span>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const q = params.q ? decodeURIComponent(params.q) : "";
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveQuery, setLiveQuery] = useState(q);

  useEffect(() => {
    setTerm(q);
    if (!q.trim()) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    setError("");
    searchEverything(q).then((r) => {
      setResults(r);
      setLiveQuery(q);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تنفيذ البحث."));
      setResults(EMPTY);
      setLoading(false);
    });
  }, [q]);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2 || trimmed === q) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      searchEverything(trimmed).then((r) => {
        setResults(r);
        setLiveQuery(trimmed);
        setLoading(false);
      }).catch((err) => {
        setError(getSupabaseErrorMessage(err, "تعذّر تنفيذ البحث."));
        setLoading(false);
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [term, q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = term.trim();
    if (t) navigate(`/search/${encodeURIComponent(t)}`);
  };

  const total = results.lessons.length + results.library.length + results.miracles.length + results.sheikhs.length + results.qa.length + results.fawaid.length;
  const suggestions = [
    ...results.lessons.slice(0, 2).map((x) => ({ label: x.title, href: `/lessons/${x.id}`, type: "درس" })),
    ...results.sheikhs.slice(0, 2).map((x) => ({ label: x.name, href: `/sheikhs/${x.id}`, type: "شيخ" })),
    ...results.library.slice(0, 2).map((x) => ({ label: x.title, href: `/library/${x.id}`, type: "كتاب" })),
  ];

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: "0 0 0.5rem" }}>البحث في المجلس العلمي</h1>
      <p style={{ margin: "0 0 1.25rem", color: C.inkSoft, lineHeight: 1.8 }}>نتائج فورية تشمل المشايخ، الدروس، الكتب، الأسئلة والأجوبة، والفوائد.</p>

      <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث في الدروس والمشايخ والمكتبة والإعجاز العلمي..."
          autoFocus
          style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, fontSize: "0.95rem", fontFamily: "inherit", outline: "none", background: C.panel, color: C.ink }}
        />
        <button type="submit" style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: "0.95rem" }}>
          بحث
        </button>
      </form>

      {suggestions.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "-1rem 0 1.5rem" }}>
          {suggestions.map((suggestion) => (
            <Link key={`${suggestion.type}-${suggestion.href}`} href={suggestion.href} style={{ padding: "0.35rem 0.75rem", borderRadius: "999px", border: `1px solid ${C.line}`, background: C.parchmentDeep, color: C.ink, fontSize: "0.8rem" }}>
              {suggestion.type}: {suggestion.label}
            </Link>
          ))}
        </div>
      )}

      {!q.trim() && !term.trim() ? (
        <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem 0" }}>اكتب كلمة للبحث في محتوى المنصة.</p>
      ) : loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage text={error} />
      ) : total === 0 ? (
        <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem 0" }}>
          لا توجد نتائج مطابقة لـ «{q}».
        </p>
      ) : (
        <>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 1.5rem" }}>
            {total} نتيجة لـ «<span style={{ fontWeight: 700, color: C.ink }}>{liveQuery || q || term}</span>»
          </p>
          <Group title="الدروس" items={results.lessons} render={(l) => (
            <ResultRow key={l.id} href={`/lessons/${l.id}`} title={l.title} meta={l.category} type="درس" />
          )} />
          <Group title="المشايخ" items={results.sheikhs} render={(s) => (
            <ResultRow key={s.id} href={`/sheikhs/${s.id}`} title={s.name} meta={s.specialty || s.country} type="شيخ" />
          )} />
          <Group title="المكتبة" items={results.library} render={(it) => (
            <ResultRow key={it.id} href={`/library/${it.id}`} title={it.title} meta={it.author_name || it.type} type="كتاب" />
          )} />
          <Group title="الإعجاز العلمي" items={results.miracles} render={(m) => (
            <ResultRow key={m.id} href={`/miracles/${m.id}`} title={m.title} meta={m.category} type="إعجاز" />
          )} />
          <Group title="الأسئلة والأجوبة" items={results.qa} render={(x) => (
            <ResultRow key={x.id} href={`/qa/${x.id}`} title={x.question} meta={x.qa_categories?.name} type="سؤال" />
          )} />
          <Group title="الفوائد" items={results.fawaid} render={(f) => (
            <ResultRow key={f.id} href={`/fawaid#fawaid-${f.id}`} title={f.text} meta={f.author_name} type="فائدة" />
          )} />
        </>
      )}
    </div>
  );
}
