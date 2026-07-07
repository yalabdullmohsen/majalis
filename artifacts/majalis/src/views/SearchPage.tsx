import { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { SearchSkeleton, PageHeader } from "@/components/ui-common";
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
import { normalizeArabic } from "@/lib/arabic-search";

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
  hadith: [],
  stories: [],
};

const KIND_LABELS: Record<string, string> = {
  lesson: "درس",       lessons: "درس",
  fatwa: "فتوى",       fatwas: "فتوى",
  ruling: "حكم",       rulings: "حكم",
  qa: "سؤال",
  fawaid: "فائدة",
  adhkar: "ذكر",
  library: "كتاب",
  miracle: "إعجاز",    miracles: "إعجاز",
  course: "دورة",      courses: "دورة",
  update: "مستجد",     updates: "مستجد",
  fiqh_decision: "مجمع فقهي", fiqh_council: "مجمع فقهي",
  knowledge: "معرفة",
  quran: "قرآن",
  hadith: "حديث",
  story: "قصة",        stories: "قصة",
  sheikh: "شيخ",
};

const KIND_GROUP_LABELS: Record<string, string> = {
  lesson: "الدروس",       lessons: "الدروس",
  fatwa: "الفتاوى",        fatwas: "الفتاوى",
  ruling: "الأحكام الشرعية", rulings: "الأحكام الشرعية",
  qa: "الأسئلة والأجوبة",
  fawaid: "الفوائد",
  adhkar: "الأذكار",
  library: "المكتبة",
  miracle: "الإعجاز العلمي", miracles: "الإعجاز العلمي",
  course: "الدورات العلمية", courses: "الدورات العلمية",
  update: "آخر المستجدات",  updates: "آخر المستجدات",
  fiqh_decision: "المجمع الفقهي", fiqh_council: "المجمع الفقهي",
  knowledge: "محرك المعرفة",
  quran: "القرآن",
  hadith: "الأحاديث الصحيحة",
  story: "القصص الإسلامية", stories: "القصص الإسلامية",
  sheikh: "المشايخ",
};

function KindBadge({ kind }: { kind: string }) {
  const label = KIND_LABELS[kind];
  if (!label) return null;
  return <span className={`search-kind-badge search-kind-badge--${kind.replace("_", "-")}`}>{label}</span>;
}

function Group({ title, items, render, id }: { title: string; items: any[]; render: (i: any) => React.ReactNode; id?: string }) {
  if (items.length === 0) return null;
  return (
    <div id={id} className="search-results-group">
      <div className="search-results-group-head">
        <h2 className="search-results-group-title">{title}</h2>
        <span className="search-results-count">{items.length}</span>
      </div>
      <div className="search-results-list">{items.map(render)}</div>
    </div>
  );
}

function IntelligentResultRow({ item, query }: { item: IntelligentSearchResult; query: string }) {
  return (
    <Link
      href={item.href}
      className="search-result-link"
      onClick={() => void trackSearchClick({ query, resultId: item.id, kind: item.kind })}
    >
      <div className="search-result-row">
        <div className="search-result-copy">
          <div className="search-result-title-row">
            <span className="search-result-title">{displayText(item.title)}</span>
            <KindBadge kind={item.kind} />
          </div>
          <span className="search-result-meta">
            {[item.source_name, item.verification_status === "verified" ? "✓ موثق" : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {item.keywords && item.keywords.length > 0 && (
            <span className="search-result-keywords">
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
  kind,
  avatarSrc,
  avatarName,
}: {
  href: string;
  title: string;
  meta?: string;
  kind?: string;
  avatarSrc?: string;
  avatarName?: string;
}) {
  return (
    <Link href={href} className="search-result-link">
      <div className="search-result-row">
        {avatarName && (
          <SheikhAvatar src={avatarSrc} name={avatarName} size={40} className="search-result-avatar" />
        )}
        <div className="search-result-copy">
          <div className="search-result-title-row">
            <span className="search-result-title">{title}</span>
            {kind && <KindBadge kind={kind} />}
          </div>
          {meta && <span className="search-result-meta">{meta}</span>}
        </div>
      </div>
    </Link>
  );
}

function FiqhResultRow({ row }: { row: FiqhGlobalSearchRow }) {
  return (
    <Link href={row.href} className="search-result-link">
      <div className="search-result-row search-result-row--fiqh">
        <div className="search-result-copy">
          <div className="search-result-title-row">
            <span className="search-result-title">{displayText(row.title)}</span>
            <KindBadge kind="fiqh_council" />
          </div>
          <span className="search-result-meta">
            {row.searchMeta || row.kindLabel}
            {row.verified && <span className="search-verified-dot"> · ✓ موثق</span>}
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = async (rawQuery: string) => {
    if (!rawQuery.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
      return;
    }

    const query = normalizeArabic(rawQuery) || rawQuery.trim();

    setLoading(true);
    addSearchHistory(rawQuery);
    void trackSearchQuery(rawQuery);

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
        setResults({ ...EMPTY, lessons: unifiedMatches.map(lessonRecordToSearchRow), usingDemo: false, error: null });
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

  const handleTermChange = (value: string) => {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => runSearch(value), 280);
    } else if (!value.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
    }
  };

  const localExtra = q.trim() ? searchLocalExtensions(q) : { occasions: [], nawawi: [], quran: [] };
  const hasActiveFilter = Object.values(filters).some(Boolean);

  const intelligentTotal = intelligentResults.length;
  const legacyTotal =
    fiqhResults.length +
    results.lessons.length + results.library.length + results.miracles.length +
    results.qa.length + results.fawaid.length + results.adhkar.length +
    (results.fatwas?.length || 0) + (results.rulings?.length || 0) +
    (results.courses?.length || 0) + (results.updates?.length || 0) +
    (results.hadith?.length || 0) + (results.stories?.length || 0) +
    localExtra.occasions.length + localExtra.nawawi.length + localExtra.quran.length;

  const total = intelligentTotal > 0 ? intelligentTotal : legacyTotal;

  return (
    <div className="page-shell narrow search-page ds-page">
      <PageHeader
        eyebrow="الاستكشاف"
        title="البحث العلمي"
        subtitle="يفهم المعنى ويربط الآيات والأحاديث والفتاوى والدروس."
      />

      <form
        onSubmit={(e) => { e.preventDefault(); submitSearch(term); }}
        className="search-page-form"
      >
        <SearchSuggestions
          value={term}
          onChange={handleTermChange}
          onSubmit={submitSearch}
          placeholder="ابحث في القرآن والحديث والفتاوى والدروس والكتب..."
        />
        <button type="submit" className="search-page-submit ds-btn ds-btn--primary">بحث</button>
      </form>

      {/* شريط الأدوات */}
      <div className="search-toolbar">
        <button
          type="button"
          className={`search-adv-toggle${showFilters ? " is-active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "إخفاء الفلاتر" : "بحث متقدم"}
          {hasActiveFilter && <span className="search-adv-dot" />}
        </button>
        <Link href="/topics" className="search-toolbar-link">الموضوعات العلمية ←</Link>
        {responseMs !== null && q.trim() && (
          <span className="search-response-ms">{responseMs} ms</span>
        )}
      </div>

      {/* الفلاتر المتقدمة */}
      {showFilters && (
        <div className="search-filters-panel ui-card">
          <div className="search-filters-grid">
            <label className="search-filter-field">
              <span>نوع المحتوى</span>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">كل الأنواع</option>
                <option value="lesson">دروس</option>
                <option value="fatwa">فتاوى</option>
                <option value="qa">أسئلة</option>
                <option value="fawaid">فوائد</option>
                <option value="library">كتب</option>
                <option value="knowledge">محرك المعرفة</option>
              </select>
            </label>
            <label className="search-filter-field">
              <span>العالم / المؤلف</span>
              <input
                type="text"
                placeholder="اسم العالم..."
                value={filters.author}
                onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              />
            </label>
            <label className="search-filter-field">
              <span>حالة التوثيق</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">الكل</option>
                <option value="verified">موثق</option>
                <option value="needs_review">يحتاج مراجعة</option>
              </select>
            </label>
            <label className="search-filter-field">
              <span>اللغة</span>
              <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}>
                <option value="">الكل</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              className="search-filters-clear"
              onClick={() => setFilters({ type: "", author: "", status: "", language: "" })}
            >
              مسح الفلاتر ✕
            </button>
          )}
        </div>
      )}

      {/* الحالات */}
      {!q.trim() ? (
        <div className="search-empty-state">
          <p className="search-empty-hint">
            اكتب سؤالك أو موضوعك — المحرك يفهم المعنى ويربط الآيات والأحاديث والفتاوى والدروس.
          </p>
          <div className="search-suggestion-chips">
            {["الصلاة", "الزكاة", "الحج", "التوبة", "القرآن"].map((s) => (
              <button key={s} type="button" className="search-suggestion-chip" onClick={() => submitSearch(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <SearchSkeleton />
      ) : (
        <>
          {total === 0 ? (
            <div className="search-no-results">
              <p className="search-no-results__msg">لا توجد نتائج مطابقة لـ «{q}»</p>
              <p className="search-no-results__hint">جرّب كلمات مختلفة أو تحقق من الإملاء.</p>
            </div>
          ) : (
            <>
              <div className="search-summary-row">
                <p className="search-page-summary">
                  <strong>{total.toLocaleString("ar-EG")}</strong> نتيجة لـ «{q}»
                </p>
                {responseMs !== null && (
                  <span className="search-response-ms">{responseMs} ms</span>
                )}
              </div>

              {matchedTopics.length > 0 && (
                <div className="search-topic-chips">
                  <span className="search-topic-chips__label">موضوعات ذات صلة:</span>
                  {matchedTopics.map((t) => (
                    <Link key={t.slug} href={`/topics/${t.slug}`} className="search-topic-chip">
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
                      render={(row: FiqhGlobalSearchRow) => <FiqhResultRow key={row.id} row={row} />}
                    />
                  )}
                  <Group title="الدروس" items={results.lessons} render={(l) => (
                    <ResultRow key={l.id} href={`/lessons/${l.id}`} kind="lesson"
                      title={displayText(l.title)}
                      meta={l.searchMeta || l.speaker_name || l.sheikhs?.name || l.category}
                      avatarSrc={resolveLessonSheikhImage(l)}
                      avatarName={l.speaker_name || l.sheikhs?.name || "شيخ"}
                    />
                  )} />
                  <Group title="الفوائد" items={results.fawaid} render={(f) => (
                    <ResultRow key={f.id} href="/fawaid" kind="fawaid" title={displayText(f.text)} meta={f.author_name} />
                  )} />
                  <Group title="المكتبة" items={results.library} render={(book) => (
                    <ResultRow key={book.id} href={`/library/${book.id}`} kind="library"
                      title={displayText(book.title)}
                      meta={[book.author || book.author_name, book.category].filter(Boolean).join(" · ")}
                    />
                  )} />
                  <Group title="الأسئلة والأجوبة" items={results.qa} render={(x) => (
                    <ResultRow key={x.id} href="/qa" kind="qa" title={displayText(x.question)} meta={x.qa_categories?.name} />
                  )} />
                  <Group title="الأذكار" id="adhkar" items={results.adhkar} render={(a) => (
                    <ResultRow key={a.id} href="/adhkar" kind="adhkar" title={displayText(a.text)} meta={a.category || a.source} />
                  )} />
                  <Group title="المناسبات" items={localExtra.occasions} render={(o) => (
                    <ResultRow key={o.id} href={o.href} title={o.title} meta={o.meta} />
                  )} />
                  <Group title="الأربعون النووية" items={localExtra.nawawi} render={(h) => (
                    <ResultRow key={h.id} href={h.href} kind="hadith" title={h.title} meta={h.meta} />
                  )} />
                  <Group title="القرآن" items={localExtra.quran} render={(s) => (
                    <ResultRow key={s.id} href={s.href} kind="quran" title={s.title} meta={s.meta} />
                  )} />
                  {fiqhResults.length === 0 && (
                    <Group title="المجمع الفقهي" items={results.fiqh_decisions || []} render={(d) => (
                      <ResultRow key={d.id} href={`/fiqh-council/${d.slug || d.id}`} kind="fiqh_decision"
                        title={displayText(d.title)} meta={d.searchMeta || d.category}
                      />
                    )} />
                  )}
                  <Group title="الفتاوى" items={results.fatwas || []} render={(f) => (
                    <ResultRow key={f.id} href={`/fatwa/${f.id}`} kind="fatwa"
                      title={displayText(f.question)} meta={f.searchMeta || f.category}
                    />
                  )} />
                  <Group title="الأحكام الشرعية" items={results.rulings || []} render={(r) => (
                    <ResultRow key={r.id} href={`/rulings/${r.id}`} kind="ruling"
                      title={displayText(r.title)} meta={r.searchMeta || r.category}
                    />
                  )} />
                  <Group title="الدورات العلمية" items={results.courses || []} render={(c) => (
                    <ResultRow key={c.id} href={`/annual-courses/${c.id}`} kind="course"
                      title={displayText(c.title)} meta={c.searchMeta || c.course_type}
                    />
                  )} />
                  <Group title="آخر المستجدات" items={results.updates || []} render={(u) => (
                    <ResultRow key={u.id} href="/updates" kind="update"
                      title={displayText(u.title)} meta={u.searchMeta || u.update_type}
                    />
                  )} />
                  <Group title="الأحاديث الصحيحة" items={results.hadith || []} render={(h) => (
                    <ResultRow key={h.id} href="/hadith" kind="hadith"
                      title={displayText(h.title || h.text)} meta={h.narrator || h.collection}
                    />
                  )} />
                  <Group title="القصص الإسلامية" items={results.stories || []} render={(s) => (
                    <ResultRow key={s.id} href="/stories" kind="story"
                      title={displayText(s.title)} meta={s.category || s.topic}
                    />
                  )} />
                  <Group title="الإعجاز العلمي" items={results.miracles} render={(m) => (
                    <ResultRow key={m.id} href="/miracles" kind="miracle"
                      title={displayText(m.title)} meta={m.category}
                    />
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
