import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle, Bell, BookMarked, BookOpen, Clock, CreditCard, FileText, Flame,
  GraduationCap, HelpCircle, Layers, Lightbulb, Mic2,
  Newspaper, RotateCw, Scale, Scroll, Search, Star, Tag, User, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trackSearchClick } from "@/lib/scholarly-intelligence-service";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  getTopSearchQueries,
} from "@/lib/search-history";
import { highlightOriginalParts } from "@/features/search/tolerant-match";
import { runAppSearch, type AppSearchResult } from "@/features/search/app-search";
import { afterNextPaint, yieldToMain } from "@/lib/yield-to-main";
import { TEXT_API_ORIGINS, useResourcePrewarm } from "@/lib/resource-prewarm";
import "@/styles/components/global-search-modal.css";

// ── ثوابت ───────────────────────────────────────────────────────────────────

const POPULAR_QUERIES = [
  "الصلاة", "الزكاة", "الصيام", "الحج", "الطهارة",
  "الإخلاص", "التوبة", "الدعاء", "فضل العلم", "صلة الرحم",
  "التوحيد", "البر والتقوى", "الصبر", "التوكل", "الذكر",
];

const KIND_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  lesson:        { label: "درس",       Icon: GraduationCap, color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  hadith:        { label: "حديث",      Icon: Scroll,        color: "#1E40AF" },
  book:          { label: "كتاب",      Icon: BookOpen,      color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  library:       { label: "كتاب",      Icon: BookOpen,      color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  fatwa:         { label: "فتوى",      Icon: Scale,         color: "#5B21B6" },
  fiqh:          { label: "فقه",       Icon: Scale,         color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  fiqh_decision: { label: "قرار فقهي", Icon: Scale,         color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  ruling:        { label: "حكم",       Icon: FileText,      color: "#1E40AF" },
  fawaid:        { label: "فائدة",     Icon: Lightbulb,     color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  qa:            { label: "سؤال",      Icon: HelpCircle,    color: "#5B21B6" },
  surah:         { label: "سورة",      Icon: BookMarked,    color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  quran:         { label: "قرآن",      Icon: BookMarked,    color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  tafsir:        { label: "تفسير",     Icon: BookOpen,      color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  course:        { label: "دورة",      Icon: GraduationCap, color: "#1E40AF" },
  miracle:       { label: "إعجاز",     Icon: Star,          color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  article:       { label: "مقال",      Icon: Newspaper,     color: "#5B21B6" },
  update:        { label: "مستجد",     Icon: Bell,          color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  topic:         { label: "موضوع",     Icon: Tag,           color: "#1E40AF" },
  knowledge:     { label: "معرفة",     Icon: Layers,        color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  scholar:       { label: "عالم",      Icon: User,          color: "#5B21B6" },
  sheikh:        { label: "شيخ",       Icon: User,          color: "#5B21B6" },
  adhkar:        { label: "ذكر",       Icon: RotateCw,      color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  dua:           { label: "دعاء",      Icon: RotateCw,      color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  seerah:        { label: "سيرة",      Icon: Star,          color: "#1E40AF" },
  story:         { label: "قصة",       Icon: BookOpen,      color: "#5B21B6" },
  nation:        { label: "أمة",       Icon: Layers,        color: "#1E40AF" },
  prophet:       { label: "نبي",       Icon: Star,          color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  tajweed:       { label: "تجويد",     Icon: Mic2,          color: "#1E40AF" },
  ulum:          { label: "علوم",      Icon: BookMarked,    color: "#5B21B6" },
  hifz:          { label: "حفظ",       Icon: Layers,        color: "var(--majalis-emerald, var(--mj-brand-deep))" },
  settings:      { label: "إعدادات",   Icon: Wrench,        color: "#5B21B6" },
  app:           { label: "صفحة",      Icon: Layers,        color: "#1E40AF" },
};

const FILTER_CHIPS: { key: string; label: string }[] = [
  { key: "all",     label: "الكل" },
  { key: "surah",   label: "قرآن" },
  { key: "tafsir",  label: "تفسير" },
  { key: "book",    label: "مكتبة" },
  { key: "hadith",  label: "أحاديث" },
  { key: "qa",      label: "فتاوى" },
  { key: "fiqh",    label: "فقه" },
  { key: "lesson",  label: "دروس" },
  { key: "scholar", label: "علماء" },
  { key: "adhkar",  label: "أذكار" },
  { key: "seerah",  label: "سيرة" },
  { key: "settings", label: "إعدادات" },
];

const DEBOUNCE_MS = 200;

// ── مساعدات ─────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 880 : false,
  );
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 880);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const parts = highlightOriginalParts(text, query.trim());
  if (parts.length === 1 && !parts[0]!.hit) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="gsm-highlight">{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

// ── بطاقة نتيجة واحدة ───────────────────────────────────────────────────────

function ResultCard({
  result,
  query,
  onSelect,
}: {
  result: AppSearchResult;
  query: string;
  onSelect: (r: AppSearchResult) => void;
}) {
  const meta = KIND_META[result.kind] ?? { label: result.kind, Icon: FileText, color: "#5B21B6" };
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className="gsm-result-btn"
    >
      <span className="gsm-result-icon"><meta.Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
      <div className="gsm-result-body">
        <p className="gsm-result-title">
          <Highlight text={result.title} query={query} />
        </p>
        {result.summary && (
          <p className="gsm-result-summary">
            <Highlight text={result.summary.slice(0, 180)} query={query} />
          </p>
        )}
      </div>
      <span
        className="gsm-result-badge"
        style={{
          "--gsm-rb-bg":    `${meta.color}18`,
          "--gsm-rb-color": meta.color,
        } as React.CSSProperties}
      >
        {meta.label}
      </span>
    </button>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonResults() {
  return (
    <div className="gsm-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="gsm-skel-row">
          <div className="gsm-skel-icon" />
          <div className="gsm-skel-body">
            <div className="gsm-skel-line"  style={{ "--gsm-skel-w1": `${60 + i * 8}%` } as React.CSSProperties} />
            <div className="gsm-skel-line2" style={{ "--gsm-skel-w2": `${40 + i * 5}%` } as React.CSSProperties} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── المكوّن الرئيسي ──────────────────────────────────────────────────────────

type Props = { onClose: () => void };

export function GlobalSearchModal({ onClose }: Props) {
  const [query, setQuery]           = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [results, setResults]       = useState<AppSearchResult[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(false);
  const [history, setHistory]       = useState<string[]>(() => getSearchHistory());
  const [, navigate]                = useLocation();
  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const isMobile  = useIsMobile();

  // Preconnect text APIs while the modal is open (DNS/TLS warm for search).
  useResourcePrewarm(TEXT_API_ORIGINS, true);

  /* لا تركيز تلقائي — الكيبورد لا يُفتح إلا بنقر المستخدم على الحقل. */

  useEffect(() => {
    const onPop = () => onClose();
    window.history.pushState({ searchOverlay: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doSearch = useCallback(
    async (q: string, filter: string) => {
      if (!q.trim()) {
        setResults([]);
        setGroupCounts({});
        setSuggestion(null);
        setLoading(false);
        setError(false);
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(false);
      try {
        await afterNextPaint();
        await yieldToMain();
        if (ctrl.signal.aborted) return;
        const res = await runAppSearch(q.trim(), {
          limit: filter !== "all" ? 20 : 28,
          kind: filter !== "all" ? filter : undefined,
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        if (res.quickNavHref) {
          addSearchHistory(q.trim());
          onClose();
          navigate(res.quickNavHref);
          return;
        }
        await yieldToMain();
        if (ctrl.signal.aborted) return;
        setResults(res.results);
        setGroupCounts(res.counts);
        setSuggestion(res.suggestion ?? null);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError" && (err as DOMException)?.name !== "AbortError") {
          setError(true);
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(query, activeFilter), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, activeFilter, doSearch]);

  const handleSelect = useCallback(
    (result: AppSearchResult) => {
      addSearchHistory(query.trim());
      void trackSearchClick({ query: query.trim(), resultId: result.id, kind: result.kind });
      onClose();
      navigate(result.href);
    },
    [query, onClose, navigate],
  );

  const handleQuickQuery = useCallback(
    (q: string) => { setQuery(q); addSearchHistory(q); },
    [],
  );

  const handleSubmitSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    addSearchHistory(q);
    onClose();
    navigate(`/search/${encodeURIComponent(q)}`);
  }, [query, onClose, navigate]);

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const topLocal  = getTopSearchQueries(6).map((e) => e.query);
  const isEmpty   = !query.trim();
  const hasResults = results.length > 0;

  return (
    // نقر الخلفية للإغلاق؛ Escape على document (أعلاه) وزر إغلاق ظاهر.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className={`gsm-overlay${isMobile ? " gsm-overlay--mobile" : ""}`}
      onClick={isMobile ? undefined : onClose}
    >
      {/* onClick هنا لمنع انتشار النقر للخلفية فقط — لا إجراء مستقل يحتاج مكافئ لوحة مفاتيح. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`gsm-card${isMobile ? " gsm-card--mobile" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="البحث الشامل"
      >

        {/* ── شريط البحث ─────────────────────────────────────────────── */}
        <div className={`gsm-topbar${isMobile ? " gsm-topbar--mobile" : ""}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق البحث"
            className="gsm-close-btn"
          >
            {isMobile ? "→" : "✕"}
          </button>

          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmitSearch();
                e.currentTarget.blur();
              }
            }}
            placeholder="ابحث في المحتوى…"
            dir="rtl"
            aria-label="ابحث في المحتوى"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-search-field="1"
            className={`gsm-input${isMobile ? " gsm-input--mobile" : ""}`}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح النص"
              className="gsm-clear-btn"
            >
              ✕
            </button>
          )}

          {loading && <span className="gsm-loading-dot">○</span>}
        </div>

        {/* ── فلاتر النوع ────────────────────────────────────────────── */}
        <div className="gsm-filters" role="tablist" aria-label="تصفية نتائج البحث">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                role="tab"
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                className={`gsm-chip${active ? " gsm-chip--active" : ""}`}
                aria-selected={active}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ── منطقة النتائج ─────────────────────────────────────────── */}
        <div className="gsm-results-area">

          {isEmpty && (
            <div className="gsm-empty-pad">

              {history.length > 0 && (
                <section className="gsm-section">
                  <div className="gsm-section__head">
                    <p className="gsm-section__label">بحثت سابقاً</p>
                    <button type="button" onClick={handleClearHistory} className="gsm-clear-hist-btn">
                      مسح
                    </button>
                  </div>
                  <div className="gsm-pills">
                    {history.slice(0, 8).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickQuery(q)}
                        className="gsm-pill"
                      >
                        <Clock size={12} className="inline ms-1" />{q}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {topLocal.length > 0 && (
                <section className="gsm-section">
                  <p className="gsm-section__label">الأكثر بحثاً لديك</p>
                  <div className="gsm-pills">
                    {topLocal.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickQuery(q)}
                        className="gsm-pill gsm-pill--trend"
                      >
                        <Flame size={12} className="inline ms-1" />{q}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="gsm-section">
                <p className="gsm-section__label">مواضيع شائعة</p>
                <div className="gsm-pills">
                  {POPULAR_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickQuery(q)}
                      className="gsm-pill"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </section>

              <section className="gsm-section">
                <p className="gsm-section__label">تصفح</p>
                <div className="gsm-quicklinks">
                  {[
                    { href: "/my-learning#flashcards", label: "المراجعة", Icon: CreditCard },
                    { href: "/mushaf", label: "القرآن", Icon: BookMarked },
                    { href: "/quran-knowledge", label: "القرآن وعلومه", Icon: BookOpen },
                    { href: "/adhkar", label: "الأذكار", Icon: RotateCw },
                    { href: "/lessons", label: "الدروس", Icon: GraduationCap },
                    { href: "/fiqh", label: "الفقه والأحكام", Icon: Scale },
                    { href: "/qa", label: "الأسئلة", Icon: HelpCircle },
                    { href: "/hadith", label: "الحديث وعلومه", Icon: Scroll },
                    { href: "/memorization", label: "الحفظ", Icon: Layers },
                    { href: "/islamic-directory", label: "الدليل", Icon: Layers },
                    { href: "/fawaid", label: "الفوائد", Icon: Lightbulb },
                    { href: "/seerah", label: "السيرة", Icon: Star },
                    { href: "/occasions-lessons", label: "المناسبات والدروس", Icon: Bell },
                  ].map((l) => (
                    <button
                      key={l.href}
                      type="button"
                      onClick={() => { onClose(); navigate(l.href); }}
                      className="gsm-quicklink-btn"
                    >
                      <l.Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                      {l.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {!isEmpty && loading && !hasResults && <SkeletonResults />}

          {!isEmpty && error && !loading && (
            <div className="gsm-error-state" role="alert" aria-live="assertive">
              <p className="gsm-state-icon"><AlertTriangle size={32} strokeWidth={1.5} aria-hidden="true" /></p>
              <p className="gsm-state-title">تعذر تنفيذ البحث. حاول مرة أخرى.</p>
              <p className="gsm-state-hint">تحقق من الاتصال بالإنترنت ثم أعد المحاولة.</p>
              <button type="button" onClick={() => doSearch(query, activeFilter)} className="gsm-retry-btn">
                أعد المحاولة
              </button>
            </div>
          )}

          {!isEmpty && !loading && !error && !hasResults && (
            <div className="gsm-empty-state">
              <p className="gsm-state-icon"><Search size={32} strokeWidth={1.5} aria-hidden="true" /></p>
              <p className="gsm-state-title">لا نتائج لـ «{query.trim()}».</p>
              <button type="button" className="gsm-retry-btn" onClick={() => setQuery("")}>
                مسح البحث
              </button>
              {suggestion && (
                <p className="gsm-state-hint">
                  هل تقصد{" "}
                  <button type="button" className="gsm-pill" onClick={() => handleQuickQuery(suggestion)}>
                    {suggestion}
                  </button>
                  ؟
                </p>
              )}
              <div className="gsm-pills gsm-pills--center">
                {POPULAR_QUERIES.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickQuery(q)}
                    className="gsm-pill"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasResults && (
            <>
              {Object.keys(groupCounts).length > 1 && (
                <p className="gsm-section__label" style={{ padding: "0 12px 6px" }}>
                  {Object.entries(groupCounts)
                    .map(([k, n]) => `${KIND_META[k]?.label ?? k} (${n})`)
                    .join(" · ")}
                </p>
              )}
              <ul className="gsm-result-list">
                {results.map((r, i) => (
                  <li key={r.id ?? i}>
                    <ResultCard result={r} query={query} onSelect={handleSelect} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ── ذيل ─────────────────────────────────────────────────────── */}
        <div className="gsm-footer">
          {!isMobile
            ? <span className="gsm-footer__hint">⌘K بحث · ⌘⇧R مراجعة · Esc إغلاق · Enter بحث كامل</span>
            : <span />
          }
          {query.trim() && (
            <button type="button" onClick={handleSubmitSearch} className="gsm-footer__all-btn">
              عرض كل النتائج →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
