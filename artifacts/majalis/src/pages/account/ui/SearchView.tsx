import { withFocusQuery } from "@/lib/focus-arrival";
import { BookMarked, BookOpen, Clock, FlaskConical, GraduationCap, Heart, Scale, Scroll } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { hrefAdhkar } from "@/lib/content-href";
import { Link, useParams, useLocation, useSearch } from "wouter";
import { searchEverything, type SearchResults } from "@/lib/supabase";
import { searchDemoContent } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { SearchSkeleton, PageHeader } from "@/components/ui-common";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { canonicalizeLessonPublicId } from "@/lib/lesson-id-aliases";
import { findSeedLessonById, loadLessonsSeed } from "@/lib/lessons-seed";
import { VirtualList } from "@/components/VirtualList";
import "@/styles/pages/search.css";
import "@/styles/pages/search-legacy.css";
import "@/styles/components/surface-polish.css";

/* ── تمييز على النص الأصلي عبر محرك التسامح الموحّد ── */
function highlightText(text: string, query: string): React.ReactNode {
  if (!text || !query.trim()) return text;
  const parts = highlightOriginalParts(text, query.trim());
  if (parts.length === 1 && !parts[0]!.hit) return text;
  return parts.map((p, i) =>
    p.hit ? (
      <mark key={i} className="srch-hl">{p.text}</mark>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { searchLocalExtensions } from "@/lib/local-search-ext";
import { lessonRecordToSearchRow, searchUnifiedLessons } from "@/lib/lessons-service";
import { addSearchHistory, getSearchHistory, clearSearchHistory } from "@/lib/search-history";
import { trackSearchQuery } from "@/lib/content-analytics";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  loadUnifiedSearchIndex,
  searchUnifiedIndex,
  runAppSearch,
  highlightOriginalParts,
  type UnifiedSearchHit,
  type AppSearchResult,
} from "@/features/search";
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
  rulings: [],
  courses: [],
  updates: [],
  hadith: [],
  stories: [],
};

const KIND_LABELS: Record<string, string> = {
  lesson: "درس",       lessons: "درس",
  fatwa: "حكم شرعي",       fatwas: "حكم شرعي",
  ruling: "حكم",       rulings: "حكم",
  qa: "سؤال",
  fawaid: "فائدة",
  adhkar: "ذكر",
  library: "كتاب",
  miracle: "إشارة كونية",    miracles: "إشارة كونية",
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
  fatwa: "الفقه والأحكام",        fatwas: "الفقه والأحكام",
  ruling: "الأحكام الشرعية", rulings: "الأحكام الشرعية",
  qa: "الأسئلة والفتاوى",
  fawaid: "الفوائد",
  adhkar: "الأذكار",
  book: "كتب ومراجع",
  library: "كتب ومراجع",
  miracle: "إشارات كونية", miracles: "إشارات كونية",
  course: "الدورات العلمية", courses: "الدورات العلمية",
  update: "إعلانات",  updates: "إعلانات",
  fiqh: "الفقه",
  fiqh_decision: "المجمع الفقهي", fiqh_council: "المجمع الفقهي",
  knowledge: "محرك المعرفة",
  surah: "سور القرآن",
  quran: "القرآن",
  tafsir: "التفسير",
  hadith: "الأحاديث الصحيحة",
  story: "القصص الإسلامية", stories: "القصص الإسلامية",
  scholar: "العلماء",
  sheikh: "المشايخ",
  seerah: "السيرة",
  nation: "الأمم السابقة",
  prophet: "قصص الأنبياء",
  person: "الذين ذكروا في القرآن",
  "tafsir-audio": "تفسير صوتي",
  dua: "الأدعية",
  tajweed: "التجويد",
  ulum: "علوم القرآن",
  hifz: "الحفظ",
  settings: "الإعدادات",
  app: "صفحات التطبيق",
};

function KindBadge({ kind }: { kind: string }) {
  const label = KIND_LABELS[kind];
  if (!label) return null;
  return <span className={`search-kind-badge search-kind-badge--${kind.replace("_", "-")}`}>{label}</span>;
}

function StatusBadge({ status, partial }: { status?: string | null; partial?: boolean }) {
  if (partial || status === "partial" || status === "draft") {
    return <span className="search-status-badge search-status-badge--partial">قيد الإكمال</span>;
  }
  if (status === "pending_review" || status === "pending" || status === "needs_review") {
    return <span className="search-status-badge search-status-badge--review">قيد المراجعة</span>;
  }
  return null;
}

function isBlockedOrAdminHref(href?: string | null): boolean {
  if (!href) return false;
  return /^\/(admin|dashboard|internal|login|register|auth)(\/|$)/i.test(href);
}

function statusMetaLabel(status?: string | null, hasSource?: boolean): string | null {
  if (status === "verified" && hasSource) return "موثّق بمصدر";
  return null;
}

function Group({ title, items, render, id }: { title: string; items: any[]; render: (i: any) => React.ReactNode; id?: string }) {
  if (items.length === 0) return null;
  return (
    <div id={id} className="search-results-group">
      <div className="search-results-group-head">
        <h2 className="search-results-group-title">{title}</h2>
        <span className="search-results-count">{items.length}</span>
      </div>
      <VirtualList
        className="search-results-list"
        items={items}
        estimateSize={76}
        virtualizeAbove={18}
        getItemKey={(item, index) => item?.id ?? item?.href ?? index}
        renderItem={(item) => render(item)}
      />
    </div>
  );
}

function IntelligentResultRow({ item, query }: { item: IntelligentSearchResult; query: string }) {
  if (isBlockedOrAdminHref(item.href)) return null;
  const title = displayText(item.title);
  const status = item.verification_status;
  const metaLabel = statusMetaLabel(status, Boolean(item.source_name));
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
            <StatusBadge status={status} partial={(item as { partial?: boolean }).partial} />
          </div>
          <span className="search-result-meta">
            {[item.source_name, metaLabel].filter(Boolean).join(" · ")}
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
    <Link href={withFocusQuery(href, query ?? "")} className="search-result-link">
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
  const [, navigate] = useLocation();
  // useLocation() من wouter تُرجع المسار (pathname) فقط بلا query string، ولا
  // تُعيد تصيير المكوّن عند تغيّر الاستعلام فقط (نفس المسار /search) — لذا
  // البحث عبر ?q=... كان لا يعمل إطلاقًا مهما ضغط المستخدم زر البحث.
  // useSearch() هي الأداة الصحيحة من wouter نفسها لقراءة search المتفاعل.
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
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
  const [filters, setFilters] = usePersistedState("filters:/search:filters", { type: "", author: "", status: "", language: "" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [localExtra, setLocalExtra] = useState({
    occasions: [] as { id: string; title: string; meta?: string; href: string }[],
    nawawi: [] as { id: string; title: string; meta?: string; href: string }[],
    quran: [] as { id: string; title: string; meta?: string; href: string }[],
    adhkar: [] as { id: string; title: string; meta?: string; href: string }[],
    surahStories: [] as { id: string; title: string; meta?: string; href: string }[],
    islamicStories: [] as { id: string; title: string; meta?: string; href: string }[],
    nations: [] as { id: string; title: string; meta?: string; href: string }[],
  });
  const [unifiedHits, setUnifiedHits] = useState<Record<string, UnifiedSearchHit[]>>({});
  const [appResults, setAppResults] = useState<AppSearchResult[]>([]);
  const [appGroups, setAppGroups] = useState<Record<string, AppSearchResult[]>>({});
  const [appSuggestion, setAppSuggestion] = useState<string | null>(null);
  const [appSuggestions, setAppSuggestions] = useState<string[]>([]);
  const [sectionFilter, setSectionFilter] = useState("all");
  const searchAbortRef = useRef<AbortController | null>(null);

  /* تحميل السجل عند الفتح وبعد كل بحث */
  const refreshHistory = () => setRecentSearches(getSearchHistory().slice(0, 6));
  useEffect(refreshHistory, []);
  useEffect(() => {
    void loadLessonsSeed();
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!q.trim()) {
      setLocalExtra({
        occasions: [],
        nawawi: [],
        quran: [],
        adhkar: [],
        surahStories: [],
        islamicStories: [],
        nations: [],
      });
      setUnifiedHits({});
      return;
    }
    void searchLocalExtensions(q).then((extra) => {
      if (!cancelled) setLocalExtra(extra);
    });
    void loadUnifiedSearchIndex()
      .then((idx) => {
        if (!cancelled) setUnifiedHits(searchUnifiedIndex(idx.docs, q));
      })
      .catch(() => {
        if (!cancelled) setUnifiedHits({});
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const runSearch = async (rawQuery: string) => {
    if (!rawQuery.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
      setAppResults([]);
      setAppGroups({});
      setAppSuggestion(null);
      setAppSuggestions([]);
      return;
    }

    // لا انتقال تلقائي للمصحف/الحديث — الاختصار يظهر ضمن نتائج runAppSearch ليختاره المستخدم.
    const query = normalizeArabic(rawQuery) || rawQuery.trim();

    searchAbortRef.current?.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;

    setLoading(true);
    addSearchHistory(rawQuery);
    refreshHistory();
    void trackSearchQuery(rawQuery);

    try {
      // المحرك الموحّد أولًا (فهرس مطبّع + تطبيع واحد)
      const local = await runAppSearch(rawQuery, {
        limit: 60,
        kind: sectionFilter !== "all" ? sectionFilter : filters.type || undefined,
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      setAppResults(local.results);
      setAppGroups(local.groups);
      setAppSuggestion(local.suggestion ?? null);
      setAppSuggestions(local.suggestions ?? (local.suggestion ? [local.suggestion] : []));
      setResponseMs(Math.round(local.responseMs));

      if (local.results.length > 0) {
        setIntelligentResults([]);
        setIntelligentGroups({});
        setResults(EMPTY);
        setFiqhResults([]);
        setLoading(false);
        return;
      }

      const intel = await intelligentSearch(query, {
        limit: 50,
        type: filters.type || undefined,
        author: filters.author || undefined,
        status: filters.status || undefined,
        language: filters.language || undefined,
      });
      if (ctrl.signal.aborted) return;

      setIntelligentResults(intel.results || []);
      setIntelligentGroups(intel.groups || {});
      setMatchedTopics(intel.topics || []);
      if (intel.response_ms != null) setResponseMs(intel.response_ms);

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
      if (ctrl.signal.aborted) return;

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
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError" || (err as DOMException)?.name === "AbortError") return;
      setFiqhResults([]);
      setFiqhQuery(false);
      setIntelligentResults([]);
      const unifiedMatches = await searchUnifiedLessons(query);
      if (unifiedMatches.length > 0) {
        setResults({ ...EMPTY, lessons: unifiedMatches.map(lessonRecordToSearchRow), usingDemo: false, error: null });
        return;
      }
      const demo = await searchDemoContent(query);
      setResults({ ...demo, usingDemo: true, error: null, adhkar: demo.adhkar || [] });
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    applyPageSeo({
      path: "/search",
      title: "بحث شامل في المحتوى الشرعي | المجلس العلمي",
      description: "ابحث في الدروس والأحاديث والأحكام والقرآن والمحتوى العلمي الإسلامي.",
      keywords: ["بحث إسلامي", "بحث شرعي", "بحث قرآني", "بحث أحاديث", "المجلس العلمي"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    setTerm(q);
    void runSearch(q);
  }, [q, filters.type, filters.author, filters.status, filters.language, sectionFilter]);

  const submitSearch = (value: string) => {
    const t = value.trim();
    if (t) navigate(`/search?q=${encodeURIComponent(t)}`);
  };

  const handleTermChange = (value: string) => {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => runSearch(value), 200);
    } else if (!value.trim()) {
      setResults(EMPTY);
      setIntelligentResults([]);
    }
  };

  const hasActiveFilter = Object.values(filters).some(Boolean);

  const appTotal = appResults.length;
  const intelligentTotal = intelligentResults.length;
  const legacyTotal =
    fiqhResults.length +
    results.lessons.length + results.library.length + results.miracles.length +
    results.qa.length + results.fawaid.length + results.adhkar.length +
    (results.rulings?.length || 0) +
    (results.courses?.length || 0) + (results.updates?.length || 0) +
    (results.hadith?.length || 0) + (results.stories?.length || 0) +
    localExtra.occasions.length + localExtra.nawawi.length + localExtra.quran.length +
    localExtra.adhkar.length + localExtra.surahStories.length + localExtra.islamicStories.length +
    localExtra.nations.length +
    Object.values(unifiedHits).reduce((n, arr) => n + arr.length, 0);

  const total = appTotal > 0 ? appTotal : intelligentTotal > 0 ? intelligentTotal : legacyTotal;

  const SECTION_CHIPS: { key: string; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "surah", label: "قرآن" },
    { key: "tafsir", label: "تفسير" },
    { key: "book", label: "مكتبة" },
    { key: "hadith", label: "أحاديث" },
    { key: "qa", label: "فتاوى" },
    { key: "fiqh", label: "فقه" },
    { key: "lesson", label: "دروس" },
    { key: "scholar", label: "علماء" },
    { key: "adhkar", label: "أذكار" },
    { key: "story", label: "قصص" },
    { key: "person", label: "أشخاص" },
    { key: "settings", label: "إعدادات" },
  ];

  return (
    <div className="page-shell narrow search-page ds-page">
      <PageHeader
        eyebrow=""
        title="البحث"
        subtitle="في الآيات والأحاديث والفتاوى والدروس"
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
          placeholder="ابحث في المحتوى…"
        />
        <button type="submit" className="search-page-submit ds-btn ds-btn--primary" aria-label="تنفيذ البحث">بحث</button>
      </form>

      {/* شرائح تصفية الأقسام */}
      {q.trim() && (
        <div className="search-section-chips" role="tablist" aria-label="تصفية حسب القسم">
          {SECTION_CHIPS.map((chip) => {
            const count =
              chip.key === "all"
                ? appTotal
                : (appGroups[chip.key]?.length ?? 0);
            return (
              <button
                key={chip.key}
                type="button"
                role="tab"
                aria-selected={sectionFilter === chip.key}
                className={`search-suggestion-chip${sectionFilter === chip.key ? " is-active" : ""}`}
                onClick={() => setSectionFilter(chip.key)}
              >
                {chip.label}
                {count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      )}

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
        <Link href="/sections" className="search-toolbar-link">الأقسام ←</Link>
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
                { href: "/mushaf", Icon: BookOpen, label: "القرآن" },
                { href: "/quran-knowledge", Icon: BookMarked, label: "القرآن وعلومه" },
                { href: "/hadith", Icon: Scroll, label: "الحديث وعلومه" },
                { href: "/fiqh", Icon: Scale, label: "الفقه والأحكام" },
                { href: "/memorization", Icon: GraduationCap, label: "الحفظ والمراجعة" },
                { href: "/occasions-lessons", Icon: Clock, label: "المناسبات والدروس" },
                { href: "/islamic-directory", Icon: FlaskConical, label: "الدليل الإسلامي" },
                { href: "/prayer-times", Icon: Clock, label: "الصلاة" },
                { href: "/my-learning", Icon: Heart, label: "حسابي" },
                { href: "/adhkar", Icon: Heart, label: "الأذكار" },
                { href: "/lessons", Icon: GraduationCap, label: "الدروس" },
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
              <p className="search-no-results__msg">لا نتائج لـ «{q}».</p>
              <p className="search-no-results__hint">
                جرّب كلمة أخرى، أو اختصر العبارة، أو تحقق من الإملاء (الهمزات والتشكيل لا تمنع المطابقة).
              </p>
              <button
                type="button"
                className="ds-btn ds-btn--secondary"
                onClick={() => { setTerm(""); navigate("/search"); }}
              >
                مسح البحث
              </button>
              {appSuggestions.length > 0 && (
                <p className="search-no-results__hint">
                  هل تقصد{" "}
                  {appSuggestions.map((s, i) => (
                    <span key={s}>
                      {i > 0 ? " · " : ""}
                      <button type="button" className="search-suggestion-chip" onClick={() => submitSearch(s)}>
                        {s}
                      </button>
                    </span>
                  ))}
                  ؟
                </p>
              )}
              {!appSuggestions.length && appSuggestion && (
                <p className="search-no-results__hint">
                  هل تقصد{" "}
                  <button type="button" className="search-suggestion-chip" onClick={() => submitSearch(appSuggestion)}>
                    {appSuggestion}
                  </button>
                  ؟
                </p>
              )}
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
                    <Link key={t.slug} href="/sections" className="search-topic-chip">
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}

              {appTotal > 0 ? (
                Object.entries(appGroups).map(([kind, items]) => (
                  <Group
                    key={kind}
                    title={KIND_GROUP_LABELS[kind] || KIND_LABELS[kind] || kind}
                    items={items}
                    render={(item: AppSearchResult) => (
                      <ResultRow
                        key={item.id}
                        href={item.href}
                        kind={item.kind}
                        query={q}
                        title={item.title}
                        meta={item.summary}
                      />
                    )}
                  />
                ))
              ) : intelligentTotal > 0 ? (
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
                  <Group title="الدروس" items={results.lessons.filter((l) => {
                    const id = canonicalizeLessonPublicId(l.external_key || l.id) || l.id;
                    return Boolean(id && (findSeedLessonById(id) || l.status === "approved"));
                  })} render={(l) => {
                    const id = canonicalizeLessonPublicId(l.external_key || l.id) || l.id;
                    return (
                    <ResultRow key={l.id} href={`/lessons/${id}`} kind="lesson" query={q}
                      title={displayText(l.title)}
                      meta={l.searchMeta || l.speaker_name || l.sheikhs?.name || l.category}
                      avatarSrc={resolveLessonSheikhImage(l)}
                      avatarName={l.speaker_name || l.sheikhs?.name || "شيخ"}
                    />
                    );
                  }} />
                  <Group title="الفوائد" items={results.fawaid} render={(f) => (
                    <ResultRow key={f.id} href={`/fawaid#${encodeURIComponent(f.id)}`} kind="fawaid" query={q} title={displayText(f.text)} meta={f.author_name} />
                  )} />
                  <Group title="كتب ومراجع" items={results.library} render={(book) => (
                    <ResultRow key={book.id} href={`/library/${book.id}`} kind="library" query={q}
                      title={displayText(book.title)}
                      meta={[book.author || book.author_name, book.category].filter(Boolean).join(" · ")}
                    />
                  )} />
                  <Group title="الأسئلة والأجوبة" items={results.qa} render={(x) => (
                    <ResultRow key={x.id} href={`/quiz?qa=${encodeURIComponent(x.id)}`} kind="qa" query={q} title={displayText(x.question)} meta={x.qa_categories?.name} />
                  )} />
                  <Group title="الأذكار" id="adhkar" items={results.adhkar} render={(a) => (
                    <ResultRow
                      key={a.id}
                      href={a.category ? hrefAdhkar(a.category) : "/adhkar"}
                      kind="adhkar"
                      query={q}
                      title={displayText(a.text)}
                      meta={a.category || a.source}
                    />
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
                  <Group title="العلماء (فهرس موحّد)" items={unifiedHits.scholar ?? []} render={(s) => (
                    <ResultRow key={s.id} href={s.href} kind="scholar" query={q} title={s.titleAr} meta={s.meta} />
                  )} />
                  <Group title="الكتب (فهرس موحّد)" items={unifiedHits.book ?? []} render={(b) => (
                    <ResultRow key={b.id} href={b.href} kind="book" query={q} title={b.titleAr} meta={b.meta} />
                  )} />
                  <Group title="السور (فهرس موحّد)" items={unifiedHits.surah ?? []} render={(s) => (
                    <QuranAyahResultRow key={s.id} href={s.href} title={s.titleAr} meta={s.meta} />
                  )} />
                  {results.stories?.length === 0 && localExtra.islamicStories.length > 0 && (
                    <Group title="القصص الإسلامية" items={localExtra.islamicStories} render={(s) => (
                      <ResultRow key={s.id} href={s.href} kind="story" query={q} title={s.title} meta={s.meta} />
                    )} />
                  )}
                  <Group title="الأمم السابقة" items={localExtra.nations} render={(s) => (
                    <ResultRow key={s.id} href={s.href} kind="story" query={q} title={s.title} meta={s.meta} />
                  )} />
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
                  <Group title="الدورات العلمية" items={results.courses || []} render={(c) => (
                    <ResultRow key={c.id} href={`/annual-courses/${c.id}`} kind="course" query={q}
                      title={displayText(c.title)} meta={c.searchMeta || c.course_type}
                    />
                  )} />
                  <Group title="إعلانات" items={results.updates || []} render={(u) => (
                    <ResultRow key={u.id} href={u.source_url || (u.slug ? `/updates/auto/${u.slug}` : "/")} kind="update" query={q}
                      title={displayText(u.title)} meta={u.searchMeta || u.update_type}
                    />
                  )} />
                  <Group title="الأحاديث الصحيحة" items={results.hadith || []} render={(h) => (
                    <ResultRow key={h.id} href={`/hadith#${encodeURIComponent(h.id)}`} kind="hadith" query={q}
                      title={displayText(h.title || h.text)} meta={h.narrator || h.collection}
                    />
                  )} />
                  <Group title="القصص الإسلامية" items={results.stories || []} render={(s) => (
                    <ResultRow
                      key={s.id}
                      href={s.slug ? `/stories?slug=${encodeURIComponent(s.slug)}` : "/stories"}
                      kind="story"
                      query={q}
                      title={displayText(s.title)}
                      meta={s.category || s.topic}
                    />
                  )} />
                  <Group title="إشارات كونية" items={results.miracles} render={(m) => (
                    <ResultRow key={m.id} href={`/miracles#${encodeURIComponent(m.id)}`} kind="miracle" query={q}
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
