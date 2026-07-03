import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { C } from "@/lib/theme";
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
import { normalizeArabic } from "@/lib/arabic-search";

// ── ثوابت ───────────────────────────────────────────────────────────────────

const POPULAR_QUERIES = [
  "الصلاة", "الزكاة", "الصيام", "الحج", "الطهارة",
  "الإخلاص", "التوبة", "الدعاء", "فضل العلم", "صلة الرحم",
];

const KIND_META: Record<string, { label: string; icon: string; color: string }> = {
  lesson:        { label: "درس",      icon: "📚", color: "#065F46" },
  hadith:        { label: "حديث",     icon: "📿", color: "#1E40AF" },
  library:       { label: "كتاب",     icon: "📖", color: "#92400E" },
  fatwa:         { label: "فتوى",     icon: "🕌", color: "#5B21B6" },
  fiqh:          { label: "فقه",      icon: "⚖️", color: "#065F46" },
  fiqh_decision: { label: "قرار فقهي", icon: "⚖️", color: "#065F46" },
  ruling:        { label: "حكم",      icon: "📋", color: "#1E40AF" },
  fawaid:        { label: "فائدة",    icon: "💡", color: "#92400E" },
  qa:            { label: "سؤال",     icon: "❓", color: "#5B21B6" },
  quran:         { label: "قرآن",     icon: "📗", color: "#065F46" },
  course:        { label: "دورة",     icon: "🎓", color: "#1E40AF" },
  miracle:       { label: "إعجاز",    icon: "✨", color: "#92400E" },
  article:       { label: "مقال",     icon: "📰", color: "#5B21B6" },
  update:        { label: "مستجد",    icon: "🔔", color: "#92400E" },
  topic:         { label: "موضوع",    icon: "🏷️", color: "#1E40AF" },
  knowledge:     { label: "معرفة",    icon: "🧠", color: "#065F46" },
  sheikh:        { label: "شيخ",      icon: "👤", color: "#5B21B6" },
  adhkar:        { label: "ذكر",      icon: "📿", color: "#065F46" },
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

/** تمييز الكلمة المطابقة داخل النص */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const nText = normalizeArabic(text);
  const nQuery = normalizeArabic(query.trim());
  if (!nQuery) return <>{text}</>;

  // نبحث عن موضع أول تطابق في النص الأصلي بناءً على موضعه في النص المُعيَّر
  const idx = nText.indexOf(nQuery);
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + nQuery.length);
  const after = text.slice(idx + nQuery.length);
  return (
    <>
      {before}
      <mark style={{ background: "#FEF3C7", color: "#92400E", borderRadius: "2px", padding: "0 2px" }}>
        {match}
      </mark>
      {after}
    </>
  );
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
  const meta = KIND_META[result.kind] ?? { label: result.kind, icon: "📄", color: "#5B21B6" };
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        width: "100%",
        padding: "0.75rem 1rem",
        background: "none",
        border: "none",
        borderBottom: `1px solid ${C.line}`,
        cursor: "pointer",
        textAlign: "right",
        direction: "rtl",
        minHeight: "44px",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--majalis-sage)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
    >
      <span style={{ fontSize: "1.2rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>
        {meta.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 0.15rem",
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--majalis-ink)",
          lineHeight: 1.4,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          <Highlight text={result.title} query={query} />
        </p>
        {result.summary && (
          <p style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "var(--majalis-ink-soft)",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            <Highlight text={result.summary.slice(0, 180)} query={query} />
          </p>
        )}
      </div>
      <span style={{
        flexShrink: 0,
        padding: "0.15rem 0.5rem",
        borderRadius: "0.3rem",
        fontSize: "0.68rem",
        fontWeight: 600,
        color: meta.color,
        background: `${meta.color}18`,
        whiteSpace: "nowrap",
        marginTop: "0.1rem",
      }}>
        {meta.label}
      </span>
    </button>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonResults() {
  return (
    <div style={{ padding: "0.5rem 0" }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "4px", background: "var(--majalis-sage)", flexShrink: 0, marginTop: "0.1rem" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "0.875rem", background: "var(--majalis-sage)", borderRadius: "4px", marginBottom: "0.4rem", width: `${60 + i * 8}%` }} />
            <div style={{ height: "0.75rem", background: "var(--majalis-parchment-deep)", borderRadius: "4px", width: `${40 + i * 5}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── المكوّن الرئيسي ──────────────────────────────────────────────────────────

type Props = { onClose: () => void };

export function GlobalSearchModal({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMobile = useIsMobile();

  // Focus input on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Close via popstate (Android back / Capacitor)
  useEffect(() => {
    const onPop = () => onClose();
    window.history.pushState({ searchOverlay: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  // Prevent body scroll while open
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
      // إلغاء الطلب السابق
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(false);
      try {
        const opts = filter !== "all" ? { type: filter, limit: 20 } : { limit: 24 };
        const res = await intelligentSearch(q.trim(), opts);
        setResults(res.results ?? []);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced search on query/filter change
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
    (q: string) => {
      setQuery(q);
      addSearchHistory(q);
    },
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

  const topLocal = getTopSearchQueries(6).map((e) => e.query);

  // ── تخطيط الحاوية: full-screen على الجوال، modal على سطح المكتب ──────────
  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        background: "var(--majalis-parchment)",
        direction: "rtl",
        // دعم safe area على iOS
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }
    : {
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "clamp(3rem, 10vh, 6rem)",
        background: "rgba(0,0,0,0.55)",
        direction: "rtl",
      };

  const cardStyle: React.CSSProperties = isMobile
    ? {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }
    : {
        width: "min(96vw, 44rem)",
        background: "var(--majalis-parchment)",
        borderRadius: "1rem",
        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
        overflow: "hidden",
        maxHeight: "82vh",
        display: "flex",
        flexDirection: "column",
      };

  const isEmpty = !query.trim();
  const hasResults = results.length > 0;

  return (
    <div style={containerStyle} onClick={isMobile ? undefined : onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>

        {/* ── شريط البحث ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: isMobile ? "0.75rem 1rem" : "0.75rem 1rem",
          borderBottom: `1px solid ${C.line}`,
          gap: "0.5rem",
          background: "var(--majalis-parchment)",
          flexShrink: 0,
        }}>
          {/* زر الإغلاق/رجوع */}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق البحث"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "44px",
              minHeight: "44px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "var(--majalis-ink-soft)",
              flexShrink: 0,
            }}
          >
            {isMobile ? "←" : "✕"}
          </button>

          {/* حقل الإدخال */}
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
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "1rem",
              background: "transparent",
              color: "var(--majalis-ink)",
              direction: "rtl",
              minHeight: "44px",
              fontFamily: "inherit",
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح النص"
              style={{
                minWidth: "32px",
                minHeight: "32px",
                border: "none",
                background: "var(--majalis-parchment-deep)",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--majalis-ink-soft)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          )}

          {loading && (
            <span style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)", flexShrink: 0 }}>
              ○
            </span>
          )}
        </div>

        {/* ── فلاتر النوع ────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          gap: "0.35rem",
          padding: "0.5rem 1rem",
          overflowX: "auto",
          flexShrink: 0,
          borderBottom: `1px solid ${C.line}`,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}>
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                style={{
                  flexShrink: 0,
                  padding: "0.3rem 0.8rem",
                  borderRadius: "2rem",
                  border: `1px solid ${active ? C.emerald : C.line}`,
                  background: active ? C.sage : "transparent",
                  color: active ? C.emeraldDeep : "var(--majalis-ink-soft)",
                  fontWeight: active ? 700 : 400,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  minHeight: "36px",
                  whiteSpace: "nowrap",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ── منطقة النتائج ─────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

          {/* حالة فارغة: قبل الكتابة */}
          {isEmpty && (
            <div style={{ padding: "1rem" }}>

              {/* سجل البحث المحلي */}
              {history.length > 0 && (
                <section style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <p style={{ margin: 0, fontSize: "0.73rem", fontWeight: 700, color: "var(--majalis-ink-soft)", letterSpacing: "0.04em" }}>
                      بحثت سابقاً
                    </p>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      style={{ fontSize: "0.72rem", color: C.emeraldDeep, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      مسح
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {history.slice(0, 8).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickQuery(q)}
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "2rem",
                          background: "var(--majalis-parchment-deep)",
                          border: `1px solid ${C.line}`,
                          fontSize: "0.82rem",
                          color: "var(--majalis-ink)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          minHeight: "36px",
                        }}
                      >
                        🕐 {q}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* بحث شائع من السجل المحلي */}
              {topLocal.length > 0 && (
                <section style={{ marginBottom: "1.25rem" }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.73rem", fontWeight: 700, color: "var(--majalis-ink-soft)", letterSpacing: "0.04em" }}>
                    الأكثر بحثاً لديك
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {topLocal.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickQuery(q)}
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "2rem",
                          background: "var(--majalis-sage)",
                          border: `1px solid ${C.emerald}`,
                          fontSize: "0.82rem",
                          color: C.emeraldDeep,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          minHeight: "36px",
                        }}
                      >
                        🔥 {q}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* مواضيع شائعة */}
              <section>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.73rem", fontWeight: 700, color: "var(--majalis-ink-soft)", letterSpacing: "0.04em" }}>
                  مواضيع شائعة
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {POPULAR_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickQuery(q)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "2rem",
                        background: "var(--majalis-parchment-deep)",
                        border: `1px solid ${C.line}`,
                        fontSize: "0.82rem",
                        color: "var(--majalis-ink)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        minHeight: "36px",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </section>

              {/* روابط سريعة */}
              <section style={{ marginTop: "1.25rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.73rem", fontWeight: 700, color: "var(--majalis-ink-soft)", letterSpacing: "0.04em" }}>
                  تصفح
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {[
                    { href: "/quran",   label: "القرآن",  icon: "📗" },
                    { href: "/adhkar",  label: "الأذكار", icon: "📿" },
                    { href: "/lessons", label: "الدروس",  icon: "📚" },
                    { href: "/fatwa",   label: "الفتاوى", icon: "🕌" },
                    { href: "/library", label: "المكتبة", icon: "📖" },
                    { href: "/qa",      label: "الأسئلة", icon: "❓" },
                  ].map((l) => (
                    <button
                      key={l.href}
                      type="button"
                      onClick={() => { onClose(); navigate(l.href); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.35rem 0.8rem",
                        borderRadius: "2rem",
                        background: "var(--majalis-panel)",
                        border: `1px solid ${C.line}`,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        color: "var(--majalis-ink)",
                        fontFamily: "inherit",
                        minHeight: "36px",
                      }}
                    >
                      {l.icon} {l.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* تحميل */}
          {!isEmpty && loading && !hasResults && <SkeletonResults />}

          {/* خطأ */}
          {!isEmpty && error && !loading && (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--majalis-ink-soft)" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>⚠️</p>
              <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>تعذر الاتصال</p>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>تحقق من الاتصال بالإنترنت وأعد المحاولة.</p>
              <button
                type="button"
                onClick={() => doSearch(query, activeFilter)}
                style={{
                  padding: "0.5rem 1.25rem",
                  background: C.emerald,
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  minHeight: "44px",
                }}
              >
                أعد المحاولة
              </button>
            </div>
          )}

          {/* لا نتائج */}
          {!isEmpty && !loading && !error && !hasResults && (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--majalis-ink-soft)" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>🔍</p>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>لا نتائج لـ «{query}»</p>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
                جرب تبسيط الكلمة أو إزالة التشكيل.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                {POPULAR_QUERIES.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickQuery(q)}
                    style={{
                      padding: "0.35rem 0.8rem",
                      borderRadius: "2rem",
                      background: "var(--majalis-parchment-deep)",
                      border: `1px solid ${C.line}`,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      minHeight: "36px",
                      color: "var(--majalis-ink)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* النتائج */}
          {hasResults && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {results.map((r, i) => (
                <li key={r.id ?? i}>
                  <ResultCard result={r} query={query} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          )}

        </div>

        {/* ── ذيل ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "0.5rem 1rem",
          borderTop: `1px solid ${C.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          background: "var(--majalis-parchment)",
        }}>
          {!isMobile && (
            <span style={{ fontSize: "0.7rem", color: "var(--majalis-ink-soft)" }}>
              ⌘K للفتح · Esc للإغلاق · Enter للبحث الكامل
            </span>
          )}
          {isMobile && <span />}
          {query.trim() && (
            <button
              type="button"
              onClick={handleSubmitSearch}
              style={{
                fontSize: "0.82rem",
                color: C.emeraldDeep,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "inherit",
                minHeight: "44px",
                padding: "0 0.5rem",
              }}
            >
              عرض كل النتائج ←
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
