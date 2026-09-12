import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  Clock3,
  Compass,
  Flame,
  GraduationCap,
  Heart,
  Landmark,
  LayoutGrid,
  Lightbulb,
  Scale,
  Scroll,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { VirtualList } from "@/components/VirtualList";
import { CompactSectionHeader } from "@/components/ui/CompactSectionHeader";
import { SearchSkeleton } from "@/components/ui-common";
import { SEARCH_INPUT_ATTRS, handleSearchEnterKey } from "@/lib/search-input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  getTopSearchQueries,
} from "@/lib/search-history";
import {
  highlightOriginalParts,
  SEARCH_SCOPE_DEFS,
  SEARCH_SCOPE_LABELS,
  isSearchScopeId,
  type AppSearchResult,
  type SearchScopeId,
} from "@/features/search";
import {
  compareSearchResultsByMatch,
  resolveSearchMatchReason,
} from "@/features/search/search-match-reason";
import { trackSearchUx } from "@/features/search/search-ux-analytics";
import {
  SearchResultCard,
  isBlockedSearchHref,
} from "@/components/search/SearchResultCards";
import {
  isKnowledgePlatformP0Enabled,
  runKnowledgeSearch,
} from "@/lib/knowledge-platform";
import "@/styles/pages/search.css";
import "@/styles/pages/search-legacy.css";
import { ACTION, EMPTY, SEARCH } from "@/lib/ui-copy";
import { ListScreen } from "@/components/design-system/screens";

const PAGE_SIZE = 40;
const POPULAR_FALLBACK = ["التوحيد", "صحيح البخاري", "السيرة", "الوضوء", "الفاتحة", "الأذكار"];
const SECTION_CHIPS = [
  { href: "/mushaf", label: "القرآن" },
  { href: "/hadith", label: "الحديث" },
  { href: "/lessons", label: "الدروس" },
  { href: "/tarikh-islami", label: "التاريخ" },
  { href: "/seerah", label: "السيرة" },
  { href: "/scholars", label: "العلماء" },
  { href: "/universities", label: "الجامعات" },
  { href: "/mosques", label: "المساجد" },
] as const;


const VERIFIED_SOURCE_LABEL = "موثّق بمصدر";

function highlightText(text: string, query: string): ReactNode {
  if (!text || !query.trim()) return text;
  const parts = highlightOriginalParts(text, query.trim());
  if (parts.length === 1 && !parts[0]!.hit) return text;
  return parts.map((p, i) =>
    p.hit ? (
      <mark key={i} className="srch-hl">
        {p.text}
      </mark>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}

const SCOPE_ICONS = {
  quran: BookOpen,
  tafsir: BookMarked,
  seerah: Sparkles,
  history: Landmark,
  prophet: Users,
  fiqh: Scale,
  hadith: Scroll,
  adhkar: Heart,
  lesson: GraduationCap,
  fawaid: Lightbulb,
} as const;

function resultHref(item: AppSearchResult): string {
  if (item.href) return item.href;
  if (item.kind === "qa") return `/quiz?qa=${encodeURIComponent(item.id)}`;
  if (item.kind === "fawaid") return `/fawaid#${encodeURIComponent(item.id)}`;
  return "/search";
}

/** إخفاء نتائج admin/auth من واجهة البحث العامة. */
function isBlockedOrAdminHref(href?: string | null): boolean {
  if (!href) return false;
  return /^\/(admin|dashboard|internal|login|register|auth)(\/|$)/i.test(href);
}

type SearchResultExtras = AppSearchResult & {
  partial?: boolean;
  verification_status?: string | null;
  source_name?: string | null;
};

const ResultCard = memo(function ResultCard({
  item,
  query,
}: {
  item: SearchResultExtras;
  query: string;
}) {
  const href = resultHref(item);
  if (isBlockedOrAdminHref(href) || isBlockedSearchHref(href)) {
    return (
      <div className="srch-result-card soft-card soft-card--on-light srch-result-card--blocked">
        <span className="srch-result-card__kind">غير متاح</span>
        <h3 className="srch-result-card__title">{highlightText(item.title, query)}</h3>
        <p className="srch-result-card__reason">المحتوى غير متاح حاليًا في التطبيق</p>
        <span className="srch-result-card__status sr-only">{VERIFIED_SOURCE_LABEL}</span>
        <div className="srch-result-card__actions">
          <Link href="/search" className="srch-result-card__action">بحث آخر</Link>
          <Link href="/" className="srch-result-card__action srch-result-card__action--ghost">الرئيسية</Link>
        </div>
      </div>
    );
  }
  const reason = resolveSearchMatchReason(item, query);
  return (
    <SearchResultCard
      item={item}
      query={query}
      matchReason={reason}
      onOpen={() => trackSearchUx("result_open", { kind: item.kind, href })}
    />
  );
});

const ScopeCard = memo(function ScopeCard({
  id,
  title,
  desc,
  active,
  onSelect,
}: {
  id: Exclude<SearchScopeId, "all">;
  title: string;
  desc: string;
  active: boolean;
  onSelect: (id: Exclude<SearchScopeId, "all">) => void;
}) {
  const Icon = SCOPE_ICONS[id];
  return (
    <button
      type="button"
      className={`srch-scope-card${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={() => onSelect(id)}
    >
      <span className="srch-scope-card__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="srch-scope-card__text">
        <strong>{title}</strong>
        <span>{desc}</span>
      </span>
    </button>
  );
});

export default function SearchPage() {
  const search = useSearch();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlQ = queryParams.get("q") || "";
  const urlScopeRaw = queryParams.get("scope") || "all";
  const urlScope: SearchScopeId = isSearchScopeId(urlScopeRaw) ? urlScopeRaw : "all";

  const [term, setTerm] = useState(urlQ);
  const [scope, setScope] = useState<SearchScopeId>(urlScope);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AppSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [popular] = useState<string[]>(() => {
    const top = getTopSearchQueries(6).map((x) => x.query);
    return top.length > 0 ? top : POPULAR_FALLBACK;
  });
  const debouncedTerm = useDebouncedValue(term, 280);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsLenRef = useRef(0);
  resultsLenRef.current = results.length;

  const primaryScopes = SEARCH_SCOPE_DEFS.slice(0, 6);
  const extraScopes = SEARCH_SCOPE_DEFS.slice(6);
  const visibleScopes = moreOpen ? SEARCH_SCOPE_DEFS : primaryScopes;

  useEffect(() => {
    applyPageSeo({
      path: "/search",
      title: "البحث | سُنّة",
      description: "ابحث في القرآن، التفسير، الدروس، الفقه، السيرة والمحتوى العلمي.",
      keywords: ["بحث إسلامي", "بحث شرعي", "تفسير", "سيرة", "سُنّة"],
      robots: "noindex, follow",
    });
    setRecent(getSearchHistory().slice(0, 6));
  }, []);

  useEffect(() => {
    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      setTerm(p.get("q") || "");
      const s = p.get("scope") || "all";
      setScope(isSearchScopeId(s) ? s : "all");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const replaceUrl = useCallback((nextTerm: string, nextScope: SearchScopeId) => {
    const params = new URLSearchParams();
    const q = nextTerm.trim();
    if (q) params.set("q", q);
    if (nextScope !== "all") params.set("scope", nextScope);
    const qs = params.toString();
    const href = qs ? `/search?${qs}` : "/search";
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.replaceState(null, "", href);
    }
  }, []);

  const run = useCallback(async (raw: string, nextScope: SearchScopeId) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const seq = ++requestSeqRef.current;
    const q = raw.replace(/\s+/g, " ").trim();
    if (!q && nextScope === "all") {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      setError(null);
      setPage(1);
      return;
    }
    // Keep previous results — لا تُفرَّغ الشاشة إلى Loading كامل
    if (resultsLenRef.current === 0) setLoading(true);
    setError(null);
    const started = performance.now();
    try {
      // P0: مسار المعرفة الموحّد (Resolver + نشاط محلي) — مع kill switch
      const res = isKnowledgePlatformP0Enabled()
        ? await runKnowledgeSearch(q, { scope: nextScope, limit: 240, signal: ctrl.signal })
        : await (
            await import("@/features/search/app-search")
          ).runAppSearch(q, { scope: nextScope, limit: 240, signal: ctrl.signal });
      if (ctrl.signal.aborted || seq !== requestSeqRef.current) return;
      const filtered = res.results.filter((item) => !isBlockedOrAdminHref(resultHref(item)));
      const ranked = [...filtered].sort((a, b) => compareSearchResultsByMatch(a, b, q));
      setResults(ranked);
      setSuggestions(res.suggestions ?? []);
      setPage(1);
      trackSearchUx("search_completed", {
        latencyMs: Math.round(performance.now() - started),
        resultCount: ranked.length,
        empty: ranked.length === 0,
        scope: nextScope,
        query: q,
      });
      if (ranked.length === 0 && q) {
        trackSearchUx("search_empty", { query: q, scope: nextScope });
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      if ((err as Error)?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "تعذّر إكمال البحث";
      setError(msg);
      trackSearchUx("search_failed", { query: q, scope: nextScope, message: msg });
    } finally {
      if (!ctrl.signal.aborted && seq === requestSeqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    replaceUrl(debouncedTerm, scope);
    void run(debouncedTerm, scope);
    return () => abortRef.current?.abort();
  }, [debouncedTerm, scope, run, replaceUrl]);

  const submit = useCallback(
    (value: string) => {
      const t = value.trim();
      setTerm(t);
      if (t) {
        addSearchHistory(t);
        setRecent(getSearchHistory().slice(0, 8));
        trackSearchUx("suggestion_used", { value: t });
      }
      replaceUrl(t, scope);
      void run(t, scope);
    },
    [replaceUrl, run, scope],
  );

  const onScope = useCallback((id: SearchScopeId) => {
    setScope((prev) => (prev === id ? "all" : id));
  }, []);

  const showHome = !term.trim() && scope === "all" && results.length === 0 && !loading && !error;
  const showEmpty =
    !loading && !showHome && !error && results.length === 0 && Boolean(term.trim() || scope !== "all");

  const resultItems = useMemo(() => results.slice(0, page * PAGE_SIZE), [results, page]);
  const hasMore = resultItems.length < results.length;
  const queryForHighlight = debouncedTerm.trim() || term.trim();

  return (
    <ListScreen compose="mark">
    <div className="page-shell narrow search-page search-home srch-page--v2 ds-page" dir="rtl">
      <CompactSectionHeader
        title="البحث"
        description="ابحث في القرآن، التفسير، الدروس، الفقه، السيرة والمحتوى العلمي."
        titleId="search-home-title"
      />

      <form
        className="srch-home-form"
        role="search"
        aria-label="البحث في المحتوى"
        onSubmit={(e) => {
          e.preventDefault();
          submit(term);
        }}
      >
        <label className="srch-home-field">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <input
            ref={inputRef}
            {...SEARCH_INPUT_ATTRS}
            value={term}
            placeholder={SEARCH.placeholder}
            aria-label={SEARCH.placeholder}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => handleSearchEnterKey(e, { onSearch: () => submit(term) })}
          />
          {term ? (
            <button
              type="button"
              className="srch-home-clear"
              aria-label="مسح البحث"
              onClick={() => {
                setTerm("");
                setScope("all");
                replaceUrl("", "all");
                void run("", "all");
                inputRef.current?.focus();
              }}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </label>
        <button type="submit" className="srch-home-submit">
          بحث
        </button>
      </form>

      <div className="srch-scope-wrap">
        <div className="srch-scope-grid">
          {visibleScopes.map((item) => (
            <ScopeCard
              key={item.id}
              id={item.id}
              title={item.title}
              desc={item.desc}
              active={scope === item.id}
              onSelect={onScope}
            />
          ))}
        </div>
        {extraScopes.length > 0 ? (
          <button
            type="button"
            className="srch-scope-more"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreOpen ? "أقل" : "المزيد"}
          </button>
        ) : null}
      </div>

      {scope !== "all" ? (
        <div className="srch-scope-bar" role="status">
          <span>النطاق: {SEARCH_SCOPE_LABELS[scope]}</span>
          <button type="button" onClick={() => setScope("all")}>
            ابحث في الكل
          </button>
        </div>
      ) : null}

      {showHome ? (
        <div className="srch-home-idle srch-idle">
          {recent.length > 0 ? (
            <section className="srch-idle__block" aria-labelledby="srch-hist">
              <div className="srch-idle__head">
                <h2 id="srch-hist" className="srch-idle__title">
                  <Clock3 size={14} aria-hidden /> آخر عمليات البحث
                </h2>
                <button
                  type="button"
                  className="srch-idle__clear"
                  onClick={() => {
                    clearSearchHistory();
                    setRecent([]);
                  }}
                >
                  {ACTION.clearSearchHistory}
                </button>
              </div>
              <div className="srch-idle__chips">
                {recent.map((s) => (
                  <button key={s} type="button" className="srch-chip" onClick={() => submit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <p className="srch-home-idle__hint">ابدأ بالكتابة أو اختر قسمًا لاستعراض محتواه.</p>
          )}

          <section className="srch-idle__block" aria-labelledby="srch-pop">
            <h2 id="srch-pop" className="srch-idle__title">
              <Flame size={14} aria-hidden /> الشائع
            </h2>
            <div className="srch-idle__chips">
              {popular.map((s) => (
                <button key={s} type="button" className="srch-chip" onClick={() => submit(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="srch-idle__block" aria-labelledby="srch-suggest">
            <h2 id="srch-suggest" className="srch-idle__title">
              <Compass size={14} aria-hidden /> مقترحات
            </h2>
            <div className="srch-idle__chips">
              {["أركان الإسلام", "صحيح مسلم", "غزوة بدر", "ابن تيمية"].map((s) => (
                <button key={s} type="button" className="srch-chip" onClick={() => submit(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="srch-idle__block" aria-labelledby="srch-secs">
            <h2 id="srch-secs" className="srch-idle__title">
              <LayoutGrid size={14} aria-hidden /> الأقسام الشائعة
            </h2>
            <div className="srch-idle__chips">
              {SECTION_CHIPS.map((s) => (
                <Link key={s.href} href={s.href} className="srch-chip srch-chip--link">
                  {s.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {error ? (
        <div className="srch-error-inline" role="alert">
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <div className="srch-error-inline__body">
            <p className="srch-error-inline__title">تعذّر إكمال البحث</p>
            <p className="srch-error-inline__reason">{error}</p>
            <div className="srch-error-inline__actions">
              <button type="button" className="srch-error-inline__retry" onClick={() => void run(term, scope)}>
                {ACTION.retry}
              </button>
              <Link href="/mushaf" className="srch-error-inline__alt">المصحف</Link>
              <Link href="/hadith" className="srch-error-inline__alt">الحديث</Link>
            </div>
          </div>
        </div>
      ) : null}

      {!showHome && loading && results.length === 0 && !error ? (
        <div className="srch-home-status" role="status" aria-busy="true" aria-label="تحديث النتائج">
          <SearchSkeleton />
        </div>
      ) : showEmpty ? (
        <div className="search-no-results ss-state-card" role="status">
          <p className="search-no-results__msg ss-state-card__title">
            {scope !== "all"
              ? "لا توجد نتائج في هذا القسم."
              : EMPTY.search /* لم نجد نتيجة مطابقة — جرّب */}
          </p>
          {scope !== "all" ? (
            <button type="button" className="srch-home-submit ss-action-btn ss-action-btn--primary mj-pressable" onClick={() => setScope("all")}>
              ابحث في الكل
            </button>
          ) : (
            <button
              type="button"
              className="srch-home-submit ss-action-btn ss-action-btn--secondary mj-pressable"
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
              }}
            >
              {ACTION.clearSearch}
            </button>
          )}
          {suggestions.length > 0 ? (
            <p className="search-no-results__hint">
              هل تقصد{" "}
              {suggestions.map((s, i) => (
                <span key={s}>
                  {i > 0 ? " · " : ""}
                  <button type="button" className="search-suggestion-chip mj-pressable" onClick={() => submit(s)}>
                    {s}
                  </button>
                </span>
              ))}
              ؟
            </p>
          ) : null}
          <div className="srch-empty-v2__sections">
            {SECTION_CHIPS.slice(0, 4).map((s) => (
              <Link key={s.href} href={s.href} className="srch-chip srch-chip--link">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="srch-results" aria-live="polite" aria-busy={loading || undefined}>
          <p className="search-page-summary" role="status">
            <strong>{results.length.toLocaleString("ar-EG")}</strong>
            {term.trim() ? ` نتيجة لـ «${term.trim()}»` : " موضوعًا في هذا القسم"}
            {loading ? " · جارٍ التحديث…" : null}
          </p>
          <VirtualList
            className="srch-results-list"
            items={resultItems}
            estimateSize={96}
            virtualizeAbove={24}
            getItemKey={(item, index) => item.id || item.href || index}
            renderItem={(item) => (
              <ResultCard
                item={item}
                query={queryForHighlight}
              />
            )}
          />
          {hasMore ? (
            <div className="srch-more">
              <button type="button" className="srch-more__btn" onClick={() => setPage((p) => p + 1)}>
                عرض المزيد
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
    </ListScreen>
  );
}
