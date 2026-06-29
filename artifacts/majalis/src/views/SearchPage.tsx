import { useEffect, useState } from "react";
import { Link, useParams, useLocation, useRoute } from "wouter";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { SearchSkeleton } from "@/components/ui-common";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { searchLocalExtensions } from "@/lib/local-search-ext";
import { searchScientificResearchSync } from "@/lib/scientific-research/service";
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
import { searchQuranScientificCircles } from "@/lib/quran-scientific-circles-service";

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
  tafsir: "التفسير",
  hadith: "الحديث",
  mutoon: "المتون",
  circle: "الحلقات القرآنية",
  circles: "الحلقات القرآنية",
  mosque: "المساجد",
  mosques: "المساجد",
  research: "الأبحاث العلمية",
  learning_path: "المسارات التعليمية",
  sin_jeem: "سؤال وجواب",
  sheikh: "المشايخ",
  topic: "الموضوعات",
  permanent_committee_fatwa: "اللجنة الدائمة",
  permanent_committee: "اللجنة الدائمة",
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
  const [, searchMatch] = useRoute("/search/:q");
  const [, scholarMatch] = useRoute("/scholar-search/:q");
  const [, navigate] = useLocation();
  const rawQ = searchMatch?.q || scholarMatch?.q || params.q || "";
  const q = rawQ ? decodeURIComponent(rawQ) : "";
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [intelligentResults, setIntelligentResults] = useState<IntelligentSearchResult[]>([]);
  const [intelligentGroups, setIntelligentGroups] = useState<Record<string, IntelligentSearchResult[]>>({});
  const [matchedTopics, setMatchedTopics] = useState<Array<{ slug: string; title: string }>>([]);
  const [fiqhResults, setFiqhResults] = useState<FiqhGlobalSearchRow[]>([]);
  const [fiqhQuery, setFiqhQuery] = useState(false);
  const [circlesResults, setCirclesResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseMs, setResponseMs] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: "", author: "", status: "", language: "" });

  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
      setCirclesResults([]);
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

      const [r, unifiedMatches, fiqhBoost, circles] = await Promise.all([
        searchEverything(query),
        searchUnifiedLessons(query),
        searchFiqhCouncilForGlobal(query, 12),
        searchQuranScientificCircles(query),
      ]);

      const mergedFiqh = mergeFiqhSearchResults(r.fiqh_decisions || [], fiqhBoost.rows);
      setFiqhResults(mergedFiqh);
      setFiqhQuery(fiqhBoost.isFiqhQuery);
      setCirclesResults(circles);

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

      const researchHits = searchScientificResearchSync(query, 12).map((item) => ({
        id: item.id,
        kind: "research",
        kind_label: "بحث علمي",
        title: item.title,
        href: item.href,
        source_name: item.meta,
        keywords: [],
      }));

      const circleHits = circles.map((c: { id: string; title: string; searchMeta?: string }) => ({
        id: c.id,
        kind: "circle",
        kind_label: "حلقة",
        title: c.title,
        href: `/quran-scientific-circles/${c.id}`,
        source_name: c.searchMeta,
        keywords: [],
      }));

      const mergedIntel = [...(intel.results || [])];
      const intelIds = new Set(mergedIntel.map((x) => `${x.kind}:${x.id}`));
      for (const item of [...researchHits, ...circleHits]) {
        const key = `${item.kind}:${item.id}`;
        if (!intelIds.has(key)) {
          mergedIntel.push(item as IntelligentSearchResult);
          intelIds.add(key);
        }
      }

      const groups = { ...(intel.groups || {}) };
      if (researchHits.length) {
        groups.research = [...(groups.research || []), ...researchHits.filter((x) => !(intel.groups?.research || []).some((r: IntelligentSearchResult) => r.id === x.id))];
      }
      if (circleHits.length) {
        groups.circle = [...(groups.circle || []), ...circleHits.filter((x) => !(intel.groups?.circle || []).some((r: IntelligentSearchResult) => r.id === x.id))];
      }

      setIntelligentResults(mergedIntel);
      setIntelligentGroups(groups);
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

  const localExtra = q.trim()
    ? searchLocalExtensions(q)
    : { occasions: [], nawawi: [], quran: [], permanentCommittee: [] };
  const researchResults = q.trim() ? searchScientificResearchSync(q, 12) : [];

  const intelligentTotal = intelligentResults.length;
  const legacyOnlyTotal =
    fiqhResults.length +
    results.lessons.length +
    results.library.length +
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
    localExtra.quran.length +
    localExtra.permanentCommittee.length;

  const total = intelligentTotal > 0 ? intelligentTotal : legacyOnlyTotal + circlesResults.length + researchResults.length;

  return (
    <div className="page-shell narrow search-page ds-page">
      <h1 className="search-page-title">الباحث العلمي الإسلامي</h1>
      <p className="search-page-subtitle" style={{ margin: "0 0 1rem", color: "var(--ink-soft)", fontSize: "0.9375rem" }}>
        بحث موحّد في القرآن والتفسير والحديث والفقه والدروس والحلقات والأبحاث والعلماء
      </p>

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
          placeholder="ابحث في القرآن والحديث والفتاوى والدروس والحلقات والأبحاث..."
        />
        <button type="submit" className="ds-btn ds-btn--primary">بحث</button>
      </form>

      <div className="search-toolbar">
        <button type="button" className="ds-filter-toggle" style={{ display: "inline-flex" }} onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "إخفاء الفلاتر" : "بحث متقدم"}
        </button>
        <Link href="/topics" className="ds-section__link">الموضوعات العلمية</Link>
        {responseMs !== null && (
          <span className="search-result-meta">{responseMs} ms</span>
        )}
      </div>

      {showFilters && (
        <div className="search-filters-grid">
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">كل الأنواع</option>
            <option value="quran">القرآن</option>
            <option value="tafsir">التفسير</option>
            <option value="hadith">الحديث</option>
            <option value="lesson">دروس</option>
            <option value="circle">حلقات</option>
            <option value="fatwa">فتاوى</option>
            <option value="permanent_committee_fatwa">اللجنة الدائمة</option>
            <option value="research">أبحاث</option>
            <option value="library">كتب</option>
            <option value="sheikh">علماء</option>
            <option value="mosque">مساجد</option>
            <option value="mutoon">متون</option>
            <option value="qa">أسئلة</option>
            <option value="fawaid">فوائد</option>
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
                <div className="search-topic-chips">
                  <span className="search-result-meta" style={{ fontWeight: 700 }}>موضوعات ذات صلة:</span>
                  {matchedTopics.map((t) => (
                    <Link key={t.slug} href={`/topics/${t.slug}`} className="search-topic-chip">
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}

              {intelligentTotal > 0 ? (
                Object.entries(intelligentGroups)
                  .sort(([a], [b]) => (KIND_GROUP_LABELS[a] ? 0 : 1) - (KIND_GROUP_LABELS[b] ? 0 : 1))
                  .map(([kind, items]) => (
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
                  <Group title="المكتبة" items={results.library} render={(book) => (
                    <ResultRow
                      key={book.id}
                      href={`/library/${book.id}`}
                      title={displayText(book.title)}
                      meta={[book.author || book.author_name, book.category].filter(Boolean).join(" · ")}
                    />
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
                  <Group title="اللجنة الدائمة" id="permanent-committee" items={localExtra.permanentCommittee} render={(f) => (
                    <ResultRow key={f.id} href={f.href} title={f.title} meta={f.meta} />
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
                  <Group title="الحلقات القرآنية والعلمية" items={circlesResults} render={(c) => (
                    <ResultRow key={c.id} href={`/quran-scientific-circles/${c.id}`} title={displayText(c.title)} meta={c.searchMeta} />
                  )} />
                  <Group title="آخر المستجدات" items={results.updates || []} render={(u) => (
                    <ResultRow key={u.id} href="/updates" title={displayText(u.title)} meta={u.searchMeta || u.update_type} />
                  )} />
                  <Group title="الأبحاث العلمية" items={researchResults} render={(r) => (
                    <ResultRow key={r.id} href={r.href} title={displayText(r.title)} meta={r.meta} />
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
