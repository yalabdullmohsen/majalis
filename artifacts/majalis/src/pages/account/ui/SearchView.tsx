import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  BookOpen,
  GraduationCap,
  Heart,
  Landmark,
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
import { SEARCH_INPUT_ATTRS, handleSearchEnterKey } from "@/lib/search-input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addSearchHistory, getSearchHistory, clearSearchHistory } from "@/lib/search-history";
import {
  highlightOriginalParts,
  runAppSearch,
  SEARCH_SCOPE_DEFS,
  SEARCH_SCOPE_LABELS,
  isSearchScopeId,
  type AppSearchResult,
  type SearchScopeId,
} from "@/features/search";
import "@/styles/pages/search.css";
import "@/styles/pages/search-legacy.css";

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

const KIND_LABELS: Record<string, string> = {
  lesson: "درس",
  lessons: "درس",
  fatwa: "حكم شرعي",
  ruling: "حكم",
  qa: "سؤال",
  fawaid: "فائدة",
  adhkar: "ذكر",
  library: "كتاب",
  book: "كتاب",
  course: "دورة",
  quran: "قرآن",
  surah: "سورة",
  tafsir: "تفسير",
  "tafsir-audio": "تفسير صوتي",
  hadith: "حديث",
  story: "قصة",
  seerah: "سيرة",
  history: "تاريخ",
  prophet: "نبي",
  prophets: "أنبياء",
  nation: "أمة",
  nations: "أمم",
  fiqh: "فقه",
  person: "علم",
  scholar: "عالم",
  dua: "دعاء",
};

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

function statusMetaLabel(status?: string | null, hasSource?: boolean): string | null {
  if (hasSource || status === "verified" || status === "pending_review" || status === "pending" || status === "needs_review") {
    return "موثّق بمصدر";
  }
  return null;
}

function highlightText(text: string, query: string): React.ReactNode {
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

const ResultCard = memo(function ResultCard({
  item,
  query,
}: {
  item: SearchResultExtras;
  query: string;
}) {
  const href = resultHref(item);
  if (isBlockedOrAdminHref(href)) return null;

  const kindLabel = KIND_LABELS[item.kind] || SEARCH_SCOPE_LABELS[item.kind as SearchScopeId] || "محتوى";
  const snippet = item.summary?.trim();
  const partial = item.partial || item.verification_status === "partial" || item.verification_status === "draft";
  const verifiedLabel = statusMetaLabel(item.verification_status, Boolean(item.source_name));
  return (
    <article className="srch-result-card">
      <Link href={href} className="srch-result-card__link">
        <div className="srch-result-card__top">
          <span className="srch-result-card__kind">{kindLabel}</span>
          {partial ? <span className="srch-result-card__status">قيد الإكمال</span> : null}
          {verifiedLabel ? <span className="srch-result-card__status">{verifiedLabel}</span> : null}
        </div>
        <h3 className="srch-result-card__title">{highlightText(item.title, query)}</h3>
        {snippet ? <p className="srch-result-card__excerpt">{highlightText(snippet, query)}</p> : null}
        <span className="srch-result-card__open" aria-hidden="true">
          فتح
        </span>
      </Link>
    </article>
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
  const [results, setResults] = useState<AppSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const debouncedTerm = useDebouncedValue(term, 250);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const q = raw.trim();
    if (!q && nextScope === "all") {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await runAppSearch(q, { scope: nextScope, limit: 48, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setResults(res.results.filter((item) => !isBlockedOrAdminHref(resultHref(item))));
      setSuggestions(res.suggestions ?? []);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setResults([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
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
        setRecent(getSearchHistory().slice(0, 6));
      }
      replaceUrl(t, scope);
      void run(t, scope);
    },
    [replaceUrl, run, scope],
  );

  const onScope = useCallback((id: SearchScopeId) => {
    setScope((prev) => (prev === id ? "all" : id));
  }, []);

  const showHome = !term.trim() && scope === "all" && results.length === 0 && !loading;
  const showEmpty = !loading && !showHome && results.length === 0;

  const resultItems = useMemo(() => results, [results]);

  return (
    <div className="page-shell narrow search-page search-home ds-page" dir="rtl">
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
            placeholder="ابحث في المحتوى..."
            aria-label="ابحث في المحتوى"
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
        <div className="srch-home-idle">
          {recent.length > 0 ? (
            <div className="srch-history-wrap">
              <div className="srch-history-head">
                <span className="srch-history-label">عمليات البحث الأخيرة</span>
                <button
                  type="button"
                  className="srch-history-clear"
                  onClick={() => {
                    clearSearchHistory();
                    setRecent([]);
                  }}
                >
                  مسح الكل
                </button>
              </div>
              <div className="srch-history-chips">
                {recent.map((s) => (
                  <button key={s} type="button" className="srch-history-chip" onClick={() => submit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="srch-home-idle__hint">ابدأ بالكتابة أو اختر قسمًا لاستعراض محتواه.</p>
          )}
        </div>
      ) : loading ? (
        <p className="srch-home-status" role="status">
          جاري البحث…
        </p>
      ) : showEmpty ? (
        <div className="search-no-results" role="status">
          <p className="search-no-results__msg">
            {scope !== "all"
              ? "لا توجد نتائج في هذا القسم، جرّب كلمة أخرى أو ابحث في الكل."
              : `لم نجد نتيجة مطابقة لـ «${term}».`}
          </p>
          <p className="search-no-results__hint">جرّب كلمة أخرى أو اختصر البحث.</p>
          {scope !== "all" ? (
            <button type="button" className="srch-home-submit" onClick={() => setScope("all")}>
              ابحث في الكل
            </button>
          ) : null}
          {suggestions.length > 0 ? (
            <p className="search-no-results__hint">
              هل تقصد{" "}
              {suggestions.map((s, i) => (
                <span key={s}>
                  {i > 0 ? " · " : ""}
                  <button type="button" className="search-suggestion-chip" onClick={() => submit(s)}>
                    {s}
                  </button>
                </span>
              ))}
              ؟
            </p>
          ) : null}
        </div>
      ) : (
        <div className="srch-results" aria-live="polite">
          <p className="search-page-summary" role="status">
            <strong>{resultItems.length.toLocaleString("ar-EG")}</strong>
            {term.trim() ? ` نتيجة لـ «${term.trim()}»` : " موضوعًا في هذا القسم"}
          </p>
          <VirtualList
            className="srch-results-list"
            items={resultItems}
            estimateSize={108}
            virtualizeAbove={24}
            getItemKey={(item, index) => item.id || item.href || index}
            renderItem={(item) => (
              <ResultCard
                item={item}
                query={term}
              />
            )}
          />
          {/* روابط ثابتة للبوابات: /quiz?qa= و /fawaid# */}
        </div>
      )}
    </div>
  );
}
