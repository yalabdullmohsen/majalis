import { BookMarked, BookOpen, Clock, FlaskConical, GraduationCap, Heart, Scale, Scroll } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { Link, useParams, useLocation } from "wouter";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { SearchSkeleton, PageHeader } from "@/components/ui-common";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";

/* ── تمييز مصطلح البحث في النصوص ── */
const ARABIC_DIACRITICS_RE = /[ؐ-ًؚ-ٰٟٓ-ٕ]/;

function buildHighlightPattern(query: string): RegExp | null {
  const words = query.trim().split(/\s+/).filter(w => w.length >= 2);
  if (!words.length) return null;
  const alts = words.map(w => {
    const n = normalizeArabic(w)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/ه/g, "[هة]")
      .replace(/ي/g, "[يى]")
      .replace(/ا/g, "[اأإآٱ]")
      .replace(/و/g, "[وؤ]");
    return `(${n})`;
  });
  try { return new RegExp(alts.join("|"), "g"); }
  catch { return null; }
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!text || !query.trim() || ARABIC_DIACRITICS_RE.test(text)) return text;
  const pat = buildHighlightPattern(query);
  if (!pat) return text;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pat.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<mark key={m.index} className="srch-hl">{m[0]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
}
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { searchLocalExtensions } from "@/lib/local-search-ext";
import { lessonRecordToSearchRow, searchUnifiedLessons } from "@/lib/lessons-service";
import { addSearchHistory, getSearchHistory, clearSearchHistory } from "@/lib/search-history";
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
import { normalizeArabic } from "@/shared/arabic-normalize";

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
  const title = displayText(item.title);
  return (
    <Link
      href={item.href}
      className="search-result-link"
      onClick={() => void trackSearchClick({ query, resultId: item.id, kind: item.kind })}
    >
      <div className="search-result-row">
        <div className="search-result-copy">
          <div className="search-result-title-row">
            <span className="search-result-title">{highlightText(title, query)}</span>
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
  query,
}: {
  href: string;
  title: string;
  meta?: string;
  kind?: string;
  avatarSrc?: string;
  avatarName?: string;
  query?: string;
}) {
  return (
    <Link href={href} className="search-result-link">
      <div className="search-result-row">
        {avatarName && (
          <SheikhAvatar src={avatarSrc} name={avatarName} size={40} className="search-result-avatar" />
        )}
        <div className="search-result-copy">
          <div className="search-result-title-row">
            <span className="search-result-title">{query ? highlightText(title, query) : title}</span>
            {kind && <KindBadge kind={kind} />}
          </div>
          {meta && <span className="search-result-meta">{query ? highlightText(meta, query) : meta}</span>}
        </div>
      </div>
    </Link>
  );
}

/** عرض نتيجة آية قرآنية — النص بخط Amiri Quran حرفياً + مرجع + زر للمصحف */
function QuranAyahResultRow({ title, meta, href }: { title: string; meta?: string; href: string }) {
  return (
    <Link href={href} className="search-result-link">
      <div className="search-result-row search-result-row--quran">
        <div className="search-result-copy">
          <div className="search-result-title-row">
            {/* النص القرآني يُعرض حرفياً بخط Amiri Quran بدون أي تعديل */}
            <span className="search-result-title quran-text" dir="rtl" lang="ar">{title}</span>
            <KindBadge kind="quran" />
          </div>
          {meta && <span className="search-result-meta">{meta}</span>}
          <span className="search-result-quran-link">◀ اقرأ في المصحف</span>
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
  const [location, navigate] = useLocation();
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const q = params.q ? decodeURIComponent(params.q) : (queryParams.get("q") || "");
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  /* تحميل السجل عند الفتح وبعد كل بحث */
  const refreshHistory = () => setRecentSearches(getSearchHistory().slice(0, 6));
  useEffect(refreshHistory, []);

  const runSearch = async (rawQuery: string) => {
    if (!rawQuery.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
      return;
    }

    const query = normalizeArabic(rawQuery) || rawQuery.trim();

    setLoading(true);
    addSearchHistory(rawQuery);
    refreshHistory();
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
    applyPageSeo({
      path: "/search",
      title: "بحث شامل في المحتوى الشرعي | المجلس العلمي",
      description: "ابحث في الدروس والأحاديث والفتاوى والمكتبة الشرعية والقرآن، بحث شامل في المحتوى العلمي الإسلامي.",
      keywords: ["بحث إسلامي", "بحث شرعي", "بحث قرآني", "بحث أحاديث", "المجلس العلمي"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    setTerm(q);
    runSearch(q);
  }, [q, filters.type, filters.author, filters.status, filters.language]);

  const submitSearch = (value: string) => {
    const t = value.trim();
    if (t) navigate(`/search?q=${encodeURIComponent(t)}`);
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

  const localExtra = q.trim()
    ? searchLocalExtensions(q)
    : { occasions: [], nawawi: [], quran: [], adhkar: [], surahStories: [], islamicStories: [] };
  const hasActiveFilter = Object.values(filters).some(Boolean);

  const intelligentTotal = intelligentResults.length;
  const legacyTotal =
    fiqhResults.length +
    results.lessons.length + results.library.length + results.miracles.length +
    results.qa.length + results.fawaid.length + results.adhkar.length +
    (results.fatwas?.length || 0) + (results.rulings?.length || 0) +
    (results.courses?.length || 0) + (results.updates?.length || 0) +
    (results.hadith?.length || 0) + (results.stories?.length || 0) +
    localExtra.occasions.length + localExtra.nawawi.length + localExtra.quran.length +
    localExtra.adhkar.length + localExtra.surahStories.length + localExtra.islamicStories.length;

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
        aria-label="نموذج البحث الشامل"
        role="search"
      >
        <SearchSuggestions
          value={term}
          onChange={handleTermChange}
          onSubmit={submitSearch}
          placeholder="ابحث في القرآن والحديث والفتاوى والدروس والكتب..."
        />
        <button type="submit" className="search-page-submit ds-btn ds-btn--primary" aria-label="تنفيذ البحث">بحث</button>
      </form>

      {/* شريط الأدوات */}
      <div className="search-toolbar">
        <button
          type="button"
          className={`search-adv-toggle${showFilters ? " is-active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="search-filters-panel"
        >
          {showFilters ? "إخفاء الفلاتر" : "بحث متقدم"}
          {hasActiveFilter && <span className="search-adv-dot" aria-hidden="true" />}
        </button>
        <Link href="/topics" className="search-toolbar-link">الموضوعات العلمية ←</Link>
        {responseMs !== null && q.trim() && (
          <span className="search-response-ms">{responseMs} ms</span>
        )}
      </div>

      {/* الفلاتر المتقدمة */}
      {showFilters && (
        <div id="search-filters-panel" className="search-filters-panel ui-card" role="region" aria-label="الفلاتر المتقدمة">
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
                aria-label="اسم العالم" placeholder="اسم العالم..."
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
                <option value="en">الإنجليزية</option>
              </select>
            </label>
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              className="search-filters-clear"
              onClick={() => setFilters({ type: "", author: "", status: "", language: "" })}
              aria-label="مسح جميع الفلاتر"
            >
              مسح الفلاتر <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      )}

      {/* الحالات */}
      {!q.trim() ? (
        <div className="search-empty-state">
          <p className="search-empty-hint">
            ابحث في القرآن والحديث والفتاوى والدروس والكتب — المحرك يفهم المعنى ويربط المصادر.
          </p>

          {/* ── عمليات البحث الأخيرة ── */}
          {recentSearches.length > 0 && (
            <div className="srch-history-wrap">
              <div className="srch-history-head">
                <span className="srch-history-label">
                  <Clock size={13} aria-hidden="true" /> عمليات البحث الأخيرة
                </span>
                <button
                  type="button"
                  className="srch-history-clear"
                  onClick={() => { clearSearchHistory(); setRecentSearches([]); }}
                  aria-label="مسح سجل البحث"
                >
                  مسح الكل
                </button>
              </div>
              <div className="srch-history-chips">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="srch-history-chip"
                    onClick={() => submitSearch(s)}
                  >
                    <Clock size={11} aria-hidden="true" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── مقترحات البحث ── */}
          <div className="search-suggestion-chips">
            {[
              "الصلاة", "الزكاة", "الحج", "التوبة", "الصيام",
              "أحكام الطهارة", "فضل الذكر", "صفة الوضوء",
              "القرآن والسنة", "العقيدة",
            ].map((s) => (
              <button key={s} type="button" className="search-suggestion-chip" onClick={() => submitSearch(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* ── وصول سريع للأقسام الرئيسية ── */}
          <div className="srch-quick-sections">
            <p className="srch-quick-sections__title">أقسام يمكنك استكشافها</p>
            <div className="srch-quick-grid">
              {([
                { href: "/quran",        Icon: BookOpen,      label: "القرآن الكريم" },
                { href: "/hadith",       Icon: Scroll,        label: "الأحاديث النبوية" },
                { href: "/adhkar",       Icon: Heart,         label: "الأذكار" },
                { href: "/fatwa",        Icon: Scale,         label: "الفتاوى" },
                { href: "/lessons",      Icon: GraduationCap, label: "الدروس" },
                { href: "/library",      Icon: BookMarked,    label: "المكتبة" },
                { href: "/miracles",     Icon: FlaskConical,  label: "الإعجاز العلمي" },
                { href: "/prayer-times", Icon: Clock,         label: "مواقيت الصلاة" },
              ] as const).map(({ href, Icon, label }) => (
                <Link key={href} href={href} className="srch-quick-card">
                  <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : loading ? (
        <SearchSkeleton />
      ) : (
        <div aria-live="polite" aria-atomic="false">
          {total === 0 ? (
            <div className="search-no-results" role="status">
              <p className="search-no-results__msg">لا توجد نتائج مطابقة لـ «{q}»</p>
              <p className="search-no-results__hint">جرّب كلمات مختلفة أو تحقق من الإملاء.</p>
            </div>
          ) : (
            <>
              <div className="search-summary-row">
                <p className="search-page-summary" role="status" aria-live="polite">
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
                    <ResultRow key={l.id} href={`/lessons/${l.id}`} kind="lesson" query={q}
                      title={displayText(l.title)}
                      meta={l.searchMeta || l.speaker_name || l.sheikhs?.name || l.category}
                      avatarSrc={resolveLessonSheikhImage(l)}
                      avatarName={l.speaker_name || l.sheikhs?.name || "شيخ"}
                    />
                  )} />
                  <Group title="الفوائد" items={results.fawaid} render={(f) => (
                    <ResultRow key={f.id} href="/fawaid" kind="fawaid" query={q} title={displayText(f.text)} meta={f.author_name} />
                  )} />
                  <Group title="المكتبة" items={results.library} render={(book) => (
                    <ResultRow key={book.id} href={`/library/${book.id}`} kind="library" query={q}
                      title={displayText(book.title)}
                      meta={[book.author || book.author_name, book.category].filter(Boolean).join(" · ")}
                    />
                  )} />
                  <Group title="الأسئلة والأجوبة" items={results.qa} render={(x) => (
                    <ResultRow key={x.id} href="/qa" kind="qa" query={q} title={displayText(x.question)} meta={x.qa_categories?.name} />
                  )} />
                  <Group title="الأذكار" id="adhkar" items={results.adhkar} render={(a) => (
                    <ResultRow key={a.id} href="/adhkar" kind="adhkar" query={q} title={displayText(a.text)} meta={a.category || a.source} />
                  )} />
                  {results.adhkar.length === 0 && localExtra.adhkar.length > 0 && (
                    <Group title="الأذكار" items={localExtra.adhkar} render={(a) => (
                      <ResultRow key={a.id} href={a.href} kind="adhkar" query={q} title={a.title} meta={a.meta} />
                    )} />
                  )}
                  <Group title="المناسبات" items={localExtra.occasions} render={(o) => (
                    <ResultRow key={o.id} href={o.href} query={q} title={o.title} meta={o.meta} />
                  )} />
                  <Group title="الأربعون النووية" items={localExtra.nawawi} render={(h) => (
                    <ResultRow key={h.id} href={h.href} kind="hadith" query={q} title={h.title} meta={h.meta} />
                  )} />
                  <Group title="القرآن الكريم" items={localExtra.quran} render={(s) => (
                    <QuranAyahResultRow key={s.id} href={s.href} title={s.title} meta={s.meta} />
                  )} />
                  {results.stories?.length === 0 && localExtra.islamicStories.length > 0 && (
                    <Group title="القصص الإسلامية" items={localExtra.islamicStories} render={(s) => (
                      <ResultRow key={s.id} href={s.href} kind="story" query={q} title={s.title} meta={s.meta} />
                    )} />
                  )}
                  <Group title="قصص السور" items={localExtra.surahStories} render={(s) => (
                    <ResultRow key={s.id} href={s.href} kind="quran" query={q} title={s.title} meta={s.meta} />
                  )} />
                  {fiqhResults.length === 0 && (
                    <Group title="المجمع الفقهي" items={results.fiqh_decisions || []} render={(d) => (
                      <ResultRow key={d.id} href={`/fiqh-council/${d.slug || d.id}`} kind="fiqh_decision" query={q}
                        title={displayText(d.title)} meta={d.searchMeta || d.category}
                      />
                    )} />
                  )}
                  <Group title="الفتاوى" items={results.fatwas || []} render={(f) => (
                    <ResultRow key={f.id} href={`/fatwa/${f.id}`} kind="fatwa" query={q}
                      title={displayText(f.question)} meta={f.searchMeta || f.category}
                    />
                  )} />
                  <Group title="الأحكام الشرعية" items={results.rulings || []} render={(r) => (
                    <ResultRow key={r.id} href={`/rulings/${r.id}`} kind="ruling" query={q}
                      title={displayText(r.title)} meta={r.searchMeta || r.category}
                    />
                  )} />
                  <Group title="الدورات العلمية" items={results.courses || []} render={(c) => (
                    <ResultRow key={c.id} href={`/annual-courses/${c.id}`} kind="course" query={q}
                      title={displayText(c.title)} meta={c.searchMeta || c.course_type}
                    />
                  )} />
                  <Group title="آخر المستجدات" items={results.updates || []} render={(u) => (
                    <ResultRow key={u.id} href="/updates" kind="update" query={q}
                      title={displayText(u.title)} meta={u.searchMeta || u.update_type}
                    />
                  )} />
                  <Group title="الأحاديث الصحيحة" items={results.hadith || []} render={(h) => (
                    <ResultRow key={h.id} href="/hadith" kind="hadith" query={q}
                      title={displayText(h.title || h.text)} meta={h.narrator || h.collection}
                    />
                  )} />
                  <Group title="القصص الإسلامية" items={results.stories || []} render={(s) => (
                    <ResultRow key={s.id} href="/stories" kind="story" query={q}
                      title={displayText(s.title)} meta={s.category || s.topic}
                    />
                  )} />
                  <Group title="الإعجاز العلمي" items={results.miracles} render={(m) => (
                    <ResultRow key={m.id} href="/miracles" kind="miracle" query={q}
                      title={displayText(m.title)} meta={m.category}
                    />
                  )} />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
