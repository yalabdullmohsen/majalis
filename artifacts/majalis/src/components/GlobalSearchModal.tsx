import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle, Bell, BookMarked, BookOpen, Clock, FileText, Flame,
  GraduationCap, HelpCircle, Layers, Lightbulb,
  Newspaper, RotateCw, Scale, Scroll, Search, Star, Tag, User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  intelligentSearch,
  trackSearchClick,
  type IntelligentSearchResult,
} from "@/lib/scholarly-intelligence-service";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  getTopSearchQueries,
} from "@/lib/search-history";
import { normalizeArabic } from "@/shared/arabic-normalize";

// ── ثوابت ───────────────────────────────────────────────────────────────────

const POPULAR_QUERIES = [
  "الصلاة", "الزكاة", "الصيام", "الحج", "الطهارة",
  "الإخلاص", "التوبة", "الدعاء", "فضل العلم", "صلة الرحم",
  "التوحيد", "البر والتقوى", "الصبر", "التوكل", "الذكر",
];

const KIND_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  lesson:        { label: "درس",       Icon: GraduationCap, color: "var(--majalis-emerald, #1F4D3A)" },
  hadith:        { label: "حديث",      Icon: Scroll,        color: "#1E40AF" },
  library:       { label: "كتاب",      Icon: BookOpen,      color: "var(--majalis-emerald, #1F4D3A)" },
  fatwa:         { label: "فتوى",      Icon: Scale,         color: "#5B21B6" },
  fiqh:          { label: "فقه",       Icon: Scale,         color: "var(--majalis-emerald, #1F4D3A)" },
  fiqh_decision: { label: "قرار فقهي", Icon: Scale,         color: "var(--majalis-emerald, #1F4D3A)" },
  ruling:        { label: "حكم",       Icon: FileText,      color: "#1E40AF" },
  fawaid:        { label: "فائدة",     Icon: Lightbulb,     color: "var(--majalis-emerald, #1F4D3A)" },
  qa:            { label: "سؤال",      Icon: HelpCircle,    color: "#5B21B6" },
  quran:         { label: "قرآن",      Icon: BookMarked,    color: "var(--majalis-emerald, #1F4D3A)" },
  course:        { label: "دورة",      Icon: GraduationCap, color: "#1E40AF" },
  miracle:       { label: "إعجاز",     Icon: Star,          color: "var(--majalis-emerald, #1F4D3A)" },
  article:       { label: "مقال",      Icon: Newspaper,     color: "#5B21B6" },
  update:        { label: "مستجد",     Icon: Bell,          color: "var(--majalis-emerald, #1F4D3A)" },
  topic:         { label: "موضوع",     Icon: Tag,           color: "#1E40AF" },
  knowledge:     { label: "معرفة",     Icon: Layers,        color: "var(--majalis-emerald, #1F4D3A)" },
  sheikh:        { label: "شيخ",       Icon: User,          color: "#5B21B6" },
  adhkar:        { label: "ذكر",       Icon: RotateCw,      color: "var(--majalis-emerald, #1F4D3A)" },
};

const FILTER_CHIPS: { key: string; label: string }[] = [
  { key: "all",     label: "الكل" },
  { key: "lesson",  label: "دروس" },
  { key: "library", label: "كتب" },
  { key: "fatwa",   label: "فتاوى" },
  { key: "hadith",  label: "أحاديث" },
  { key: "qa",      label: "أسئلة" },
  { key: "fawaid",  label: "فوائد" },
  { key: "miracle", label: "إعجاز" },
  { key: "course",  label: "دورات" },
];

const DEBOUNCE_MS = 300;

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
  const nText  = normalizeArabic(text);
  const nQuery = normalizeArabic(query.trim());
  if (!nQuery || nQuery.length < 2) return <>{text}</>;

  // إيجاد جميع المطابقات وإبرازها
  const segments: React.ReactNode[] = [];
  let pos = 0;
  let searchFrom = 0;
  while (searchFrom < nText.length) {
    const idx = nText.indexOf(nQuery, searchFrom);
    if (idx === -1) {
      segments.push(text.slice(pos));
      break;
    }
    if (idx > pos) segments.push(text.slice(pos, idx));
    segments.push(
      <mark key={idx} className="gsm-highlight">{text.slice(idx, idx + nQuery.length)}</mark>
    );
    pos = idx + nQuery.length;
    searchFrom = pos;
  }
  return <>{segments}</>;
}

// ── بطاقة نتيجة واحدة ───────────────────────────────────────────────────────

function ResultCard({
  result,
  query,
  onSelect,
}: {
  result: IntelligentSearchResult;
  query: string;
  onSelect: (r: IntelligentSearchResult) => void;
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
  const [results, setResults]       = useState<IntelligentSearchResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(false);
  const [history, setHistory]       = useState<string[]>(() => getSearchHistory());
  const [, navigate]                = useLocation();
  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const isMobile  = useIsMobile();

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

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

  const doSearch = useCallback(
    async (q: string, filter: string) => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        setError(false);
        return;
      }
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(false);
      try {
        const opts = filter !== "all" ? { type: filter, limit: 20 } : { limit: 24 };
        const res  = await intelligentSearch(q.trim(), opts);
        setResults(res.results ?? []);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    },
    [],
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
    (result: IntelligentSearchResult) => {
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
    <div
      className={`gsm-overlay${isMobile ? " gsm-overlay--mobile" : ""}`}
      onClick={isMobile ? undefined : onClose}
    >
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
            {isMobile ? "←" : "✕"}
          </button>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") handleSubmitSearch();
            }}
            placeholder="ابحث في الدروس والكتب والفتاوى والأحاديث..."
            dir="rtl"
            aria-label="بحث شامل"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
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
        <div className="gsm-filters">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                className={`gsm-chip${active ? " gsm-chip--active" : ""}`}
                aria-pressed={active}
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
                        <Clock size={12} className="inline ml-1" />{q}
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
                        <Flame size={12} className="inline ml-1" />{q}
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
                    { href: "/quran",         label: "القرآن",       Icon: BookMarked },
                    { href: "/adhkar",         label: "الأذكار",      Icon: RotateCw },
                    { href: "/lessons",        label: "الدروس",       Icon: GraduationCap },
                    { href: "/fatwa",          label: "الفتاوى",      Icon: Scale },
                    { href: "/library",        label: "المكتبة",      Icon: BookOpen },
                    { href: "/qa",             label: "الأسئلة",      Icon: HelpCircle },
                    { href: "/hadith",         label: "الأحاديث",     Icon: Scroll },
                    { href: "/mind-map",       label: "الخرائط",      Icon: Layers },
                    { href: "/fawaid",         label: "الفوائد",      Icon: Lightbulb },
                    { href: "/topics",         label: "الموضوعات",    Icon: Tag },
                    { href: "/seerah",         label: "السيرة",       Icon: Star },
                    { href: "/occasions",      label: "المناسبات",    Icon: Bell },
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
            <div className="gsm-error-state">
              <p className="gsm-state-icon"><AlertTriangle size={32} strokeWidth={1.5} aria-hidden="true" /></p>
              <p className="gsm-state-title">تعذر الاتصال</p>
              <p className="gsm-state-hint">تحقق من الاتصال بالإنترنت وأعد المحاولة.</p>
              <button type="button" onClick={() => doSearch(query, activeFilter)} className="gsm-retry-btn">
                أعد المحاولة
              </button>
            </div>
          )}

          {!isEmpty && !loading && !error && !hasResults && (
            <div className="gsm-empty-state">
              <p className="gsm-state-icon"><Search size={32} strokeWidth={1.5} aria-hidden="true" /></p>
              <p className="gsm-state-title">لا نتائج لـ «{query}»</p>
              <p className="gsm-state-hint">جرب تبسيط الكلمة أو إزالة التشكيل.</p>
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
            <ul className="gsm-result-list">
              {results.map((r, i) => (
                <li key={r.id ?? i}>
                  <ResultCard result={r} query={query} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── ذيل ─────────────────────────────────────────────────────── */}
        <div className="gsm-footer">
          {!isMobile
            ? <span className="gsm-footer__hint">⌘K للفتح · Esc للإغلاق · Enter للبحث الكامل</span>
            : <span />
          }
          {query.trim() && (
            <button type="button" onClick={handleSubmitSearch} className="gsm-footer__all-btn">
              عرض كل النتائج ←
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
