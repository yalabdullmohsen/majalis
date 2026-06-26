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
import {
  searchFiqhCouncilForGlobal,
  mergeFiqhSearchResults,
  type FiqhGlobalSearchRow,
} from "@/lib/fiqh-global-search";
import {
  intelligentSearch,
  trackSearchClick,
  type IntelligentSearchResult,
} from "@/lib/scholarly-intelligence-service";

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

const KIND_GROUP_LABELS: Record<string, string> = {
  lesson: "الدروس",
  lessons: "الدروس",
  fatwa: "الفتاوى",
  fatwas: "الفتاوى",
  ruling: "الأحكام الشرعية",
  rulings: "الأحكام الشرعية",
  qa: "الأسئلة والأجوبة",
  fawaid: "الفوائد",
  adhkar: "الأذكار",
  library: "المكتبة",
  miracle: "الإعجاز العلمي",
  miracles: "الإعجاز العلمي",
  course: "الدورات العلمية",
  courses: "الدورات العلمية",
  update: "آخر المستجدات",
  updates: "آخر المستجدات",
  fiqh_decision: "المجمع الفقهي",
  fiqh_council: "المجمع الفقهي",
  knowledge: "محرك المعرفة",
  quran: "القرآن",
  hadith: "الحديث",
  sheikh: "المشايخ",
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

function IntelligentResultRow({ item, query }: { item: IntelligentSearchResult; query: string }) {
  return (
    <Link
      href={item.href}
      style={{ textDecoration: "none" }}
      onClick={() => void trackSearchClick({ query, resultId: item.id, kind: item.kind })}
    >
      <div className="search-result-row">
        <div className="search-result-copy">
          <span>{displayText(item.title)}</span>
          <span className="search-result-meta">
            {[item.kind_label, item.source_name, item.verification_status === "verified" ? "موثق" : null, item.updated_at ? new Date(item.updated_at).toLocaleDateString("ar-KW") : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {item.keywords && item.keywords.length > 0 && (
            <span className="search-result-meta" style={{ fontSize: "0.7rem", opacity: 0.8 }}>
              {item.keywords.slice(0, 4).join(" · ")}
            </span>
          )}
        </div>
      </div>
    </Link>
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

function FiqhResultRow({ row }: { row: FiqhGlobalSearchRow }) {
  return (
    <Link href={row.href} style={{ textDecoration: "none" }}>
      <div className="search-result-row search-result-row--fiqh">
        <div className="search-result-copy">
          <span>{displayText(row.title)}</span>
          <span className="search-result-meta">
            {row.searchMeta || row.kindLabel}
            {row.verified && <span className="fiqh-search-verified-badge">موثق</span>}
          </span>
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
  const [intelligentResults, setIntelligentResults] = useState<IntelligentSearchResult[]>([]);
  const [intelligentGroups, setIntelligentGroups] = useState<Record<string, IntelligentSearchResult[]>>({});
  const [matchedTopics, setMatchedTopics] = useState<Array<{ slug: string; title: string }>>([]);
  const [fiqhResults, setFiqhResults] = useState<FiqhGlobalSearchRow[]>([]);
  const [fiqhQuery, setFiqhQuery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseMs, setResponseMs] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: "", author: "", status: "", language: "" });

  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
      return;
    }

    setLoading(true);
    addSearchHistory(query);
    void trackSearchQuery(query);

    try {
      const intel = await intelligentSearch(query, {
        limit: 50,
        type: filters.type || undefined,
        author: filters.author || undefined,
        status: filters.status || undefined,
        language: filters.language || undefined,
      });

      setIntelligentResults(intel.results || []);
      setIntelligentGroups(intel.groups || {});
      setMatchedTopics(intel.topics || []);
      setResponseMs(intel.response_ms ?? null);

      if ((intel.results?.length || 0) > 0) {
        setResults(EMPTY);
        setFiqhResults([]);
        setLoading(false);
        return;
      }

      const [r, unifiedMatches, fiqhBoost] = await Promise.all([
        searchEverything(query),
        searchUnifiedLessons(query),
        searchFiqhCouncilForGlobal(query, 12),
      ]);

      const mergedFiqh = mergeFiqhSearchResults(r.fiqh_decisions || [], fiqhBoost.rows);
      setFiqhResults(mergedFiqh);
      setFiqhQuery(fiqhBoost.isFiqhQuery);
      setIntelligentResults([]);
      setIntelligentGroups({});

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

      setResults({ ...r, lessons: mergedLessons });
    } catch {
      setFiqhResults([]);
      setFiqhQuery(false);
      setIntelligentResults([]);
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
      setResults({ ...demo, usingDemo: true, error: null, adhkar: demo.adhkar || [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTerm(q);
    runSearch(q);
  }, [q, filters.type, filters.author, filters.status, filters.language]);

  const submitSearch = (value: string) => {
    const t = value.trim();
    if (t) navigate(`/search/${encodeURIComponent(t)}`);
  };

  const localExtra = q.trim() ? searchLocalExtensions(q) : { occasions: [], nawawi: [], quran: [] };

  const intelligentTotal = intelligentResults.length;
  const legacyTotal =
    fiqhResults.length +
    results.lessons.length +
    results.miracles.length +
    results.qa.length +
    results.fawaid.length +
    results.adhkar.length +
    (results.fatwas?.length || 0) +
    (results.rulings?.length || 0) +
    (results.courses?.length || 0) +
    (results.updates?.length || 0) +
    localExtra.occasions.length +
    localExtra.nawawi.length +
    localExtra.quran.length;

  const total = intelligentTotal > 0 ? intelligentTotal : legacyTotal;

  return (
    <div className="page-shell narrow search-page">
      <h1 className="search-page-title">البحث العلمي</h1>

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
          placeholder="ابحث في القرآن والحديث والفتاوى والدروس والكتب..."
        />
        <button type="submit">بحث</button>
      </form>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => setShowFilters(!showFilters)} style={{ fontSize: "0.875rem" }}>
          {showFilters ? "إخفاء الفلاتر" : "بحث متقدم"}
        </button>
        <Link href="/topics" style={{ fontSize: "0.875rem" }}>الموضوعات العلمية</Link>
        {responseMs !== null && (
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            {responseMs} ms
          </span>
        )}
      </div>

      {showFilters && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">كل الأنواع</option>
            <option value="lesson">دروس</option>
            <option value="fatwa">فتاوى</option>
            <option value="qa">أسئلة</option>
            <option value="fawaid">فوائد</option>
            <option value="library">كتب</option>
            <option value="knowledge">محرك المعرفة</option>
          </select>
          <input
            type="text"
            placeholder="العالم / المؤلف"
            value={filters.author}
            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
          />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">كل حالات التوثيق</option>
            <option value="verified">موثق</option>
            <option value="needs_review">يحتاج مراجعة</option>
          </select>
          <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}>
            <option value="">كل اللغات</option>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
      )}

      {!q.trim() ? (
        <p className="search-page-hint">
          اكتب سؤالك أو موضوعك — المحرك يفهم المعنى ويربط الآيات والأحاديث والفتاوى والدروس.
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

              {matchedTopics.length > 0 && (
                <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>موضوعات ذات صلة:</span>
                  {matchedTopics.map((t) => (
                    <Link key={t.slug} href={`/topics/${t.slug}`} style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem", borderRadius: "999px", background: "var(--panel-soft, #f3f4f6)" }}>
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}

              {intelligentTotal > 0 ? (
                Object.entries(intelligentGroups).map(([kind, items]) => (
                  <Group
                    key={kind}
                    title={KIND_GROUP_LABELS[kind] || kind}
                    items={items}
                    render={(item: IntelligentSearchResult) => (
                      <IntelligentResultRow key={`${item.kind}-${item.id || item.title}`} item={item} query={q} />
                    )}
                  />
                ))
              ) : (
                <>
                  {fiqhResults.length > 0 && (
                    <Group
                      title={fiqhQuery ? "من المجمع الفقهي الإسلامي" : "نتائج المجمع الفقهي"}
                      id="fiqh-council"
                      items={fiqhResults}
                      render={(row: FiqhGlobalSearchRow) => (
                        <FiqhResultRow key={row.id} row={row} />
                      )}
                    />
                  )}
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
                  <Group title="الفوائد" items={results.fawaid} render={(f) => (
                    <ResultRow key={f.id} href="/fawaid" title={displayText(f.text)} meta={f.author_name} />
                  )} />
                  <Group title="الأسئلة والأجوبة" items={results.qa} render={(x) => (
                    <ResultRow key={x.id} href="/qa" title={displayText(x.question)} meta={x.qa_categories?.name} />
                  )} />
                  <Group title="الأذكار" id="adhkar" items={results.adhkar} render={(a) => (
                    <ResultRow key={a.id} href="/adhkar" title={displayText(a.text)} meta={a.category || a.source} />
                  )} />
                  <Group title="المناسبات" items={localExtra.occasions} render={(o) => (
                    <ResultRow key={o.id} href={o.href} title={o.title} meta={o.meta} />
                  )} />
                  <Group title="الأربعون النووية" items={localExtra.nawawi} render={(h) => (
                    <ResultRow key={h.id} href={h.href} title={h.title} meta={h.meta} />
                  )} />
                  <Group title="القرآن" items={localExtra.quran} render={(s) => (
                    <ResultRow key={s.id} href={s.href} title={s.title} meta={s.meta} />
                  )} />
                  {fiqhResults.length === 0 && (
                    <Group title="المجمع الفقهي" items={results.fiqh_decisions || []} render={(d) => (
                      <ResultRow key={d.id} href={`/fiqh-council/${d.slug || d.id}`} title={displayText(d.title)} meta={d.searchMeta || d.category} />
                    )} />
                  )}
                  <Group title="الفتاوى" items={results.fatwas || []} render={(f) => (
                    <ResultRow key={f.id} href={`/fatwa/${f.id}`} title={displayText(f.question)} meta={f.searchMeta || f.category} />
                  )} />
                  <Group title="الأحكام الشرعية" items={results.rulings || []} render={(r) => (
                    <ResultRow key={r.id} href={`/rulings/${r.id}`} title={displayText(r.title)} meta={r.searchMeta || r.category} />
                  )} />
                  <Group title="الدورات العلمية" items={results.courses || []} render={(c) => (
                    <ResultRow key={c.id} href={`/annual-courses/${c.id}`} title={displayText(c.title)} meta={c.searchMeta || c.course_type} />
                  )} />
                  <Group title="آخر المستجدات" items={results.updates || []} render={(u) => (
                    <ResultRow key={u.id} href="/updates" title={displayText(u.title)} meta={u.searchMeta || u.update_type} />
                  )} />
                  <Group title="الإعجاز العلمي" items={results.miracles} render={(m) => (
                    <ResultRow key={m.id} href="/miracles" title={displayText(m.title)} meta={m.category} />
                  )} />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
